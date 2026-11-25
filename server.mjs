import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync, chmodSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const CONSENT_VERSION = 'waitlist-2026-11-16';
// Unambiguous alphabet (no 0/O, 1/I/L) so codes survive being read aloud or retyped.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_PATTERN = /^[A-HJKMNP-Z2-9]{8}$/;
const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

const newReferralCode = () => [...randomBytes(8)].map(byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
const normaliseCode = value => (typeof value === 'string' ? value.trim().toUpperCase() : '');
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
  const missing = db.prepare('SELECT email FROM waitlist WHERE referral_code IS NULL').all();
  const assign = db.prepare('UPDATE waitlist SET referral_code = ? WHERE email = ?');
  for (const { email } of missing) assign.run(newReferralCode(), email);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS waitlist_referral_code ON waitlist(referral_code);
    CREATE INDEX IF NOT EXISTS waitlist_referred_by ON waitlist(referred_by);`);
  return db;
}

// Rank: more successful referrals first, then earlier signup. Each referral moves a member ahead of everyone with fewer.
const RANKED = `WITH scored AS (
    SELECT w.email, w.created_at, w.referral_code, w.referred_by, w.source, w.consent_version, w.consent_at,
      (SELECT COUNT(*) FROM waitlist r WHERE r.referred_by = w.referral_code) AS referrals
    FROM waitlist w)
  SELECT s.*, (SELECT COUNT(*) FROM scored o WHERE o.referrals > s.referrals OR (o.referrals = s.referrals AND o.created_at < s.created_at)) + 1 AS position
  FROM scored s`;

export function standingFor(db, code) {
  const row = db.prepare(`${RANKED} WHERE s.referral_code = ?`).get(code);
  if (!row) return null;
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM waitlist').get();
  return { code: row.referral_code, position: row.position, total, referrals: row.referrals };
}

export function exportCsv(db) {
  const header = 'position,email,referrals,referral_code,referred_by,created_at,consent_version,consent_at,source';
  const rows = db.prepare(`${RANKED} ORDER BY position`).all()
    .map(row => [row.position, row.email, row.referrals, row.referral_code, row.referred_by, row.created_at, row.consent_version, row.consent_at, row.source].map(csvCell).join(','));
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
    return reply(res, 200, {
      // Same reply for new and existing emails, so the endpoint never reveals who has already joined.
      message: 'You’re on the list.',
      referral: standingFor(db, code)
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
      return res.end(exportCsv(db));
    }
    if (route === '/api/waitlist/status') {
      if (req.method !== 'GET') return reply(res, 405, { error: 'Use GET.' });
      if (!db) return reply(res, 503, { error: 'Status is temporarily unavailable.' });
      if (!withinRateLimit(req, res, 'status', 60)) return;
      const code = normaliseCode(url.searchParams.get('code'));
      const standing = CODE_PATTERN.test(code) ? standingFor(db, code) : null;
      return standing ? reply(res, 200, { referral: standing }) : reply(res, 404, { error: 'Referral code not found.' });
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
