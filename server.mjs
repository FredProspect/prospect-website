import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync, chmodSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createResendMailer, confirmationEmail } from './waitlist-mail.mjs';

const CONSENT_VERSION = 'waitlist-2026-11-16';
// Unambiguous alphabet (no 0/O, 1/I/L) so codes survive being read aloud or retyped.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_PATTERN = /^[A-HJKMNP-Z2-9]{8}$/;
const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

const newReferralCode = () => [...randomBytes(8)].map(byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
const normaliseCode = value => (typeof value === 'string' ? value.trim().toUpperCase() : '');
const CONFIRM_TTL_MS = 7 * 24 * 3600 * 1000;
const RESEND_GAP_MS = 10 * 60 * 1000;
const hashToken = token => createHash('sha256').update(token).digest('hex');
const csvCell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';

/** Opens the waitlist database and applies additive, idempotent migrations. Existing rows are never removed. */
export function openWaitlist(dbPath) {
  mkdirSync(dirname(resolve(dbPath)), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(dbPath);
  chmodSync(dbPath, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS waitlist (email TEXT PRIMARY KEY, created_at TEXT NOT NULL, consent_version TEXT NOT NULL, consent_at TEXT NOT NULL, source TEXT);
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL);`);
  const columns = new Set(db.prepare('PRAGMA table_info(waitlist)').all().map(column => column.name));
  if (!columns.has('referral_code')) db.exec('ALTER TABLE waitlist ADD COLUMN referral_code TEXT');
  if (!columns.has('referred_by')) db.exec('ALTER TABLE waitlist ADD COLUMN referred_by TEXT');
  for (const column of ['confirmed_at', 'confirm_token_hash', 'confirm_sent_at']) if (!columns.has(column)) db.exec(`ALTER TABLE waitlist ADD COLUMN ${column} TEXT`);
  const missing = db.prepare('SELECT email FROM waitlist WHERE referral_code IS NULL').all();
  const assign = db.prepare('UPDATE waitlist SET referral_code = ? WHERE email = ?');
  for (const { email } of missing) assign.run(newReferralCode(), email);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS waitlist_referral_code ON waitlist(referral_code);
    CREATE INDEX IF NOT EXISTS waitlist_referred_by ON waitlist(referred_by);
    CREATE INDEX IF NOT EXISTS waitlist_confirm_token ON waitlist(confirm_token_hash);`);
  return db;
}

// With email confirmation on, only confirmed friends count as referrals.
const referralCount = confirmedOnly => `(SELECT COUNT(*) FROM waitlist r WHERE r.referred_by = w.referral_code${confirmedOnly ? ' AND r.confirmed_at IS NOT NULL' : ''})`;

// Rank: more successful referrals first, then earlier signup. Each referral moves a member ahead of everyone with fewer.
const ranked = confirmedOnly => `WITH scored AS (
    SELECT w.email, w.created_at, w.referral_code, w.referred_by, w.source, w.consent_version, w.consent_at, w.confirmed_at,
      ${referralCount(confirmedOnly)} AS referrals
    FROM waitlist w)
  SELECT s.*, (SELECT COUNT(*) FROM scored o WHERE o.referrals > s.referrals OR (o.referrals = s.referrals AND o.created_at < s.created_at)) + 1 AS position
  FROM scored s`;

// Members see a tier, never their exact place or the list size: 0-2 referrals low, 3-4 medium, 5+ high.
export const tierFor = referrals => (referrals >= 5 ? 'high' : referrals >= 3 ? 'medium' : 'low');

export function standingFor(db, code, confirmedOnly = false) {
  const row = db.prepare(`SELECT referral_code, confirmed_at, ${referralCount(confirmedOnly)} AS referrals FROM waitlist w WHERE referral_code = ?`).get(code);
  return row ? { code: row.referral_code, referrals: row.referrals, tier: tierFor(row.referrals), confirmed: !confirmedOnly || Boolean(row.confirmed_at) } : null;
}

export function exportCsv(db, confirmedOnly = false) {
  const header = 'position,email,confirmed_at,referrals,referral_code,referred_by,created_at,consent_version,consent_at,source';
  const rows = db.prepare(`${ranked(confirmedOnly)} ORDER BY position`).all()
    .map(row => [row.position, row.email, row.confirmed_at, row.referrals, row.referral_code, row.referred_by, row.created_at, row.consent_version, row.consent_at, row.source].map(csvCell).join(','));
  return [header, ...rows].join('\n') + '\n';
}

const tokensMatch = (given, expected) => {
  const a = Buffer.from(given || ''), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

export function createApp(config = {}) {
  const root = resolve(config.root || 'dist');
  const origin = config.origin || process.env.PUBLIC_ORIGIN || 'http://localhost:3000';
  const dbPath = config.dbPath || process.env.WAITLIST_DB;
  const secret = config.secret || process.env.WAITLIST_RATE_SECRET;
  const adminToken = config.adminToken ?? process.env.WAITLIST_ADMIN_TOKEN;
  const additionalOrigin = config.additionalOrigin || process.env.ADDITIONAL_PUBLIC_ORIGIN;
  const allowedOrigins = new Set([origin, ...(additionalOrigin ? [additionalOrigin] : [])]);
  const db = dbPath && secret?.length >= 32 ? openWaitlist(dbPath) : null;
  // Email confirmation switches on only when Resend is configured; until then signups behave as before.
  const mailer = config.mailer !== undefined ? config.mailer : createResendMailer({ apiKey: process.env.RESEND_API_KEY, from: process.env.MAIL_FROM, replyTo: process.env.MAIL_REPLY_TO });
  const confirmedOnly = Boolean(mailer);
  // Confirmation links point at this collector service, which then returns people to the public site.
  const collectorOrigin = config.collectorOrigin || process.env.COLLECTOR_ORIGIN || additionalOrigin || origin;

  /** Issues a fresh single-use link, at most once per 10 minutes per address. Delivery failures never fail a signup. */
  const sendConfirmation = async email => {
    if (!mailer) return;
    const row = db.prepare('SELECT confirmed_at, confirm_sent_at FROM waitlist WHERE email = ?').get(email);
    if (!row || row.confirmed_at) return;
    if (row.confirm_sent_at && Date.now() - Date.parse(row.confirm_sent_at) < RESEND_GAP_MS) return;
    const token = randomBytes(32).toString('base64url');
    db.prepare('UPDATE waitlist SET confirm_token_hash = ?, confirm_sent_at = ? WHERE email = ?').run(hashToken(token), new Date().toISOString(), email);
    try {
      await mailer({ to: email, ...confirmationEmail({ link: `${collectorOrigin}/api/waitlist/confirm?token=${token}`, siteOrigin: origin }) });
      if (process.env.LOG_WAITLIST_EVENTS === '1') console.log(JSON.stringify({ event: 'waitlist.confirmation', result: 'sent' }));
    } catch {
      // Allow an immediate retry, and never log the address.
      db.prepare('UPDATE waitlist SET confirm_sent_at = NULL WHERE email = ?').run(email);
      console.log(JSON.stringify({ event: 'waitlist.confirmation', result: 'failed' }));
    }
  };
  const reply = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };

  /** Durable per-network rate limit. Returns false (after replying) when the caller must stop. */
  const withinRateLimit = (req, res, bucket, maxHits) => {
    const ip = process.env.TRUST_PROXY === '1' ? (req.headers['x-real-ip'] || req.socket.remoteAddress) : req.socket.remoteAddress;
    const key = bucket + ':' + createHmac('sha256', secret).update(ip || 'unknown').digest('hex');
    const now = Date.now();
    db.prepare('DELETE FROM rate_limits WHERE expires < ?').run(now);
    const limit = db.prepare('SELECT hits FROM rate_limits WHERE key = ?').get(key);
    if (limit?.hits >= maxHits) { res.setHeader('Retry-After', '900'); reply(res, 429, { error: 'Too many attempts. Please try again in 15 minutes.' }); return false; }
    db.prepare('INSERT INTO rate_limits VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = hits + 1').run(key, now + 900000);
    return true;
  };

  const register = async (req, res) => {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) return reply(res, 415, { error: 'Please submit the website form.' });
    let body = '';
    for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 2048) return reply(res, 413, { error: 'Request too large.' }); }
    const input = JSON.parse(body);
    if (!input || typeof input !== 'object') return reply(res, 400, { error: 'Please check your form.' });
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) return reply(res, 400, { error: 'Enter a valid email address.' });
    if (input.consent !== true) return reply(res, 400, { error: 'Please agree to receive launch and early-access emails to join.' });
    if (input.website) return reply(res, 400, { error: 'Unable to register. Please try again.' });
    const source = typeof input.source === 'string' ? input.source.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 100) : 'homepage';
    const ref = normaliseCode(input.ref);
    const referrer = CODE_PATTERN.test(ref) ? db.prepare('SELECT referral_code FROM waitlist WHERE referral_code = ?').get(ref)?.referral_code : null;
    const at = new Date().toISOString();
    const inserted = db.prepare('INSERT INTO waitlist (email, created_at, consent_version, consent_at, source, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING')
      .run(email, at, CONSENT_VERSION, at, source, newReferralCode(), referrer ?? null);
    if (process.env.LOG_WAITLIST_EVENTS === '1') console.log(JSON.stringify({ event: 'waitlist.persistence', result: inserted.changes ? 'created' : 'duplicate', referred: Boolean(inserted.changes && referrer) }));
    const { referral_code: code } = db.prepare('SELECT referral_code FROM waitlist WHERE email = ?').get(email);
    await sendConfirmation(email);
    return reply(res, 200, {
      // Same reply for new and existing emails, so the endpoint never reveals who has already joined.
      message: 'You’re on the list.',
      referral: standingFor(db, code, confirmedOnly)
    });
  };

  const waitlistApi = async (req, res, url) => {
    if (allowedOrigins.has(req.headers.origin)) { res.setHeader('Access-Control-Allow-Origin', req.headers.origin); res.setHeader('Vary', 'Origin'); }
    if (req.method === 'OPTIONS') {
      if (!allowedOrigins.has(req.headers.origin)) return reply(res, 403, { error: 'Origin not allowed.' });
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
      res.writeHead(204); return res.end();
    }
    const route = url.pathname.replace(/\/+$/, '');
    if (route === '/api/waitlist/export') {
      // Disabled unless a long admin token is configured; never reachable by guessing.
      if (!db || !adminToken || adminToken.length < 32 || req.method !== 'GET') return reply(res, 404, { error: 'Not found.' });
      if (!tokensMatch((req.headers.authorization || '').replace(/^Bearer /, ''), adminToken)) return reply(res, 401, { error: 'Unauthorised.' });
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="prospect-waitlist.csv"', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
      return res.end(exportCsv(db, confirmedOnly));
    }
    if (route === '/api/waitlist/status') {
      if (req.method !== 'GET') return reply(res, 405, { error: 'Use GET.' });
      if (!db) return reply(res, 503, { error: 'Status is temporarily unavailable.' });
      if (!withinRateLimit(req, res, 'status', 60)) return;
      const code = normaliseCode(url.searchParams.get('code'));
      const standing = CODE_PATTERN.test(code) ? standingFor(db, code, confirmedOnly) : null;
      return standing ? reply(res, 200, { referral: standing }) : reply(res, 404, { error: 'Referral code not found.' });
    }
    if (route === '/api/waitlist/confirm') {
      // Reached from the email link: confirm, then send the person back to the site with the outcome.
      // Carry the member's referral code so their card loads in whichever browser opened the email.
      const back = (outcome, code) => { res.writeHead(303, { Location: `${origin}/?confirmed=${outcome}${code ? `&member=${code}` : ''}`, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); res.end(); };
      if (!db || req.method !== 'GET') return back('invalid');
      const token = url.searchParams.get('token') || '';
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return back('invalid');
      const row = db.prepare('SELECT email, referral_code, confirm_sent_at FROM waitlist WHERE confirm_token_hash = ?').get(hashToken(token));
      if (!row || Date.now() - Date.parse(row.confirm_sent_at) > CONFIRM_TTL_MS) return back('invalid');
      db.prepare('UPDATE waitlist SET confirmed_at = ?, confirm_token_hash = NULL WHERE email = ?').run(new Date().toISOString(), row.email);
      return back('1', row.referral_code);
    }
    if (route === '/api/waitlist/resend') {
      if (req.method !== 'POST') return reply(res, 405, { error: 'Use POST.' });
      if (!allowedOrigins.has(req.headers.origin)) return reply(res, 403, { error: 'Please use the Prospect website.' });
      if (!db) return reply(res, 503, { error: 'Temporarily unavailable.' });
      if (!withinRateLimit(req, res, 'resend', 6)) return;
      try {
        let body = '';
        for await (const chunk of req) { body += chunk; if (body.length > 512) return reply(res, 413, { error: 'Request too large.' }); }
        const code = normaliseCode(JSON.parse(body)?.code);
        const row = CODE_PATTERN.test(code) ? db.prepare('SELECT email FROM waitlist WHERE referral_code = ?').get(code) : null;
        if (row) await sendConfirmation(row.email);
      } catch { /* Same reply either way. */ }
      return reply(res, 200, { message: 'If your email still needs confirming, a new link is on its way. Check your spam folder too.' });
    }
    if (route !== '/api/waitlist') return reply(res, 404, { error: 'Not found.' });
    if (req.method !== 'POST') return reply(res, 405, { error: 'Use POST to register.' });
    if (!allowedOrigins.has(req.headers.origin)) return reply(res, 403, { error: 'Please submit the form from the Prospect website.' });
    if (!db) return reply(res, 503, { error: 'Registration is temporarily unavailable. Please try again later or contact the founder.' });
    try { if (!withinRateLimit(req, res, 'signup', 8)) return; }
    catch { return reply(res, 503, { error: 'Registration is temporarily unavailable. Please try again later.' }); }
    try { return await register(req, res); }
    catch (error) {
      if (error instanceof SyntaxError) return reply(res, 400, { error: 'Please check your form and try again.' });
      // Do not log request bodies or email addresses.
      return reply(res, 503, { error: 'We couldn’t save your registration. Please try again later.' });
    }
  };

  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://prospect-public-website-staging.up.railway.app; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const url = new URL(req.url, origin);
    if (url.pathname.startsWith('/api/waitlist')) return waitlistApi(req, res, url);
    if (!['GET', 'HEAD'].includes(req.method)) return reply(res, 405, { error: 'Method not allowed.' });
    let path;
    try { path = decodeURIComponent(url.pathname); } catch { return reply(res, 400, { error: 'Invalid path.' }); }
    let file = resolve(root, '.' + path + (path.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + '/')) return reply(res, 404, { error: 'Not found.' });
    let status = 200;
    try { if (!statSync(file).isFile()) throw Error(); } catch { file = resolve(root, '404.html'); status = 404; }
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
    try {
      res.writeHead(status, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600' });
      res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
    } catch { reply(res, 503, { error: 'Site build unavailable.' }); }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.on('close', () => db?.close());
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  createApp().listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log('Prospect server listening'));
}
