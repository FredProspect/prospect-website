import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHmac } from 'node:crypto';
import { mkdirSync, chmodSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

export function createApp(config = {}) {
  const root = resolve(config.root || 'dist');
  const origin = config.origin || process.env.PUBLIC_ORIGIN || 'http://localhost:3000';
  const dbPath = config.dbPath || process.env.WAITLIST_DB;
  const secret = config.secret || process.env.WAITLIST_RATE_SECRET;
  const additionalOrigin = config.additionalOrigin || process.env.ADDITIONAL_PUBLIC_ORIGIN;
  const allowedOrigins = new Set([origin, ...(additionalOrigin ? [additionalOrigin] : [])]);
  let db;
  if (dbPath && secret?.length >= 32) {
    mkdirSync(dirname(resolve(dbPath)), { recursive: true, mode: 0o700 });
    db = new DatabaseSync(dbPath);
    chmodSync(dbPath, 0o600);
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS waitlist (email TEXT PRIMARY KEY, created_at TEXT NOT NULL, consent_version TEXT NOT NULL, consent_at TEXT NOT NULL, source TEXT);
      CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL);`);
  }
  const reply = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://prospect-public-website-staging.up.railway.app; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const url = new URL(req.url, origin);
    if (url.pathname === '/api/waitlist') {
      if (allowedOrigins.has(req.headers.origin)) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        res.setHeader('Vary', 'Origin');
      }
      if (req.method === 'OPTIONS') {
        if (!allowedOrigins.has(req.headers.origin)) return reply(res, 403, { error: 'Origin not allowed.' });
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '600');
        res.writeHead(204); return res.end();
      }
      if (req.method !== 'POST') return reply(res, 405, { error: 'Use POST to register.' });
      if (!allowedOrigins.has(req.headers.origin)) return reply(res, 403, { error: 'Please submit the form from the Prospect website.' });
      if (!db) return reply(res, 503, { error: 'Registration is temporarily unavailable. Please try again later or contact the founder.' });
      const ip = process.env.TRUST_PROXY === '1' ? (req.headers['x-real-ip'] || req.socket.remoteAddress) : req.socket.remoteAddress;
      const key = createHmac('sha256', secret).update(ip || 'unknown').digest('hex');
      const now = Date.now();
      try {
      db.prepare('DELETE FROM rate_limits WHERE expires < ?').run(now);
      const limit = db.prepare('SELECT hits FROM rate_limits WHERE key = ?').get(key);
      if (limit?.hits >= 8) { res.setHeader('Retry-After', '900'); return reply(res, 429, { error: 'Too many attempts. Please try again in 15 minutes.' }); }
      db.prepare('INSERT INTO rate_limits VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = hits + 1').run(key, now + 900000);
      } catch { return reply(res, 503, { error: 'Registration is temporarily unavailable. Please try again later.' }); }
      if (!(req.headers['content-type'] || '').startsWith('application/json')) return reply(res, 415, { error: 'Please submit the website form.' });
      try {
        let body = '';
        for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 2048) { reply(res, 413, { error: 'Request too large.' }); return; } }
        const input = JSON.parse(body);
        if (!input || typeof input !== 'object') return reply(res, 400, { error: 'Please check your form.' });
        const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
        if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)) return reply(res, 400, { error: 'Enter a valid email address.' });
        if (input.consent !== true) return reply(res, 400, { error: 'Please agree to receive launch and early-access emails to join.' });
        if (input.website) return reply(res, 400, { error: 'Unable to register. Please try again.' });
        const source = typeof input.source === 'string' ? input.source.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 100) : 'homepage';
        const at = new Date().toISOString();
        const inserted = db.prepare('INSERT INTO waitlist VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING').run(email, at, 'waitlist-2026-11-16', at, source);
        if (process.env.LOG_WAITLIST_EVENTS === '1') console.log(JSON.stringify({ event: 'waitlist.persistence', result: inserted.changes ? 'created' : 'duplicate' }));
        return reply(res, 200, { message: 'You’re on the list. We’ll email you with Prospect launch and early-access news. If you’ve joined before, your registration is already saved.' });
      } catch (error) {
        if (error instanceof SyntaxError) return reply(res, 400, { error: 'Please check your form and try again.' });
        // Do not log request bodies or email addresses.
        return reply(res, 503, { error: 'We couldn’t save your registration. Please try again later.' });
      }
    }
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
