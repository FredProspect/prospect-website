import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server.mjs';
const secret = 'controlled-test-secret-32-characters-long';
async function start(config = {}) {
  const server = createApp({ origin: 'https://prospectpartnership.co.uk', ...config });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (body, headers = {}) => fetch(url + '/api/waitlist', { method: 'POST', headers: { Origin: 'https://prospectpartnership.co.uk', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { server, url, post, close: () => new Promise(resolve => server.close(resolve)) };
}
test('waitlist validates, records consent, deduplicates, persists after restart and limits abuse', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'prospect-test-'));
  const config = { dbPath: join(folder, 'leads.sqlite'), secret };
  let app = await start(config);
  try {
    assert.equal((await app.post({ email: 'bad', consent: true })).status, 400);
    assert.equal((await app.post({ email: 'test@example.com', consent: false })).status, 400);
    assert.equal((await app.post({ email: 'test@example.com', consent: true }, { Origin: 'https://attacker.example' })).status, 403);
    assert.equal((await app.post({ email: 'test@example.com', consent: true, website: 'spam' })).status, 400);
    const valid = { email: ' TEST@example.com ', consent: true, source: 'newsletter' };
    const first = await app.post(valid);
    assert.equal(first.status, 200);
    const duplicate = await app.post(valid);
    assert.deepEqual(await duplicate.json(), await first.json());
    await app.close();
    app = await start(config);
    const db = new DatabaseSync(config.dbPath, { readOnly: true });
    const rows = db.prepare('SELECT * FROM waitlist').all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].email, 'test@example.com');
    assert.equal(rows[0].consent_version, 'waitlist-2026-11-16');
    assert.equal(rows[0].source, 'newsletter');
    assert.ok(rows[0].consent_at);
    db.close();
    for (let i = 0; i < 3; i++) assert.equal((await app.post(valid)).status, 200);
    assert.equal((await app.post(valid)).status, 429);
  } finally { await app.close(); rmSync(folder, { recursive: true }); }
});
test('fails closed when production persistence is not configured', async () => {
  const app = await start();
  try { const res = await app.post({ email: 'test@example.com', consent: true }); assert.equal(res.status, 503); assert.ok((await res.json()).error); }
  finally { await app.close(); }
});
test('read-only storage failure never returns a successful registration', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'prospect-failure-'));
  const dbPath = join(folder, 'leads.sqlite');
  const app = await start({ dbPath, secret });
  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TRIGGER reject_insert BEFORE INSERT ON waitlist BEGIN SELECT RAISE(FAIL, "controlled persistence failure"); END;');
  try { const res = await app.post({ email: 'test@example.com', consent: true }); assert.equal(res.status, 503); assert.equal(db.prepare('SELECT COUNT(*) AS n FROM waitlist').get().n, 0); }
  finally { db.close(); await app.close(); rmSync(folder, { recursive: true }); }
});
test('built pages have crawlable content, valid local links, sitemap and metadata', async () => {
  const app = await start();
  const { readFileSync } = await import('node:fs');
  try {
    const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
    const routes = [...sitemap.matchAll(/<loc>https:\/\/prospectpartnership.co.uk([^<]+)<\/loc>/g)].map(m => m[1]);
    for (const route of routes) {
      const res = await fetch(app.url + route);
      assert.equal(res.status, 200, route);
      const html = await res.text();
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1, route);
      assert.match(html, /rel="canonical"/);
      assert.match(html, /name="description"/);
      assert.match(html, /application\/ld\+json/);
      for (const link of html.matchAll(/(?:href|src)="(\/[^"#]*)(#[^"]*)?"/g)) {
        assert.equal((await fetch(app.url + link[1])).status, 200, `${route}: ${link[1]}`);
        if (link[2]) { const target = await (await fetch(app.url + link[1])).text(); assert.ok(target.includes(`id="${link[2].slice(1)}"`)); }
      }
    }
    assert.equal((await fetch(app.url + '/missing-page/')).status, 404);
    assert.equal((await fetch(app.url + '/server.mjs')).status, 404);
    assert.equal((await fetch(app.url + '/data/leads.sqlite')).status, 404);
    assert.match(readFileSync('dist/robots.txt', 'utf8'), /Allow: \/\n/);
  } finally { await app.close(); }
});
test('rejects malformed, oversized and non-JSON submissions without leaking form data into a GET URL', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'prospect-input-'));
  const app = await start({ dbPath: join(folder, 'leads.sqlite'), secret });
  const request = (body, type = 'application/json') => fetch(app.url + '/api/waitlist', { method: 'POST', headers: { Origin: 'https://prospectpartnership.co.uk', 'Content-Type': type }, body });
  try {
    assert.equal((await request('{bad')).status, 400);
    assert.equal((await request('null')).status, 400);
    assert.equal((await request(JSON.stringify({ email: 'a'.repeat(2100) }))).status, 413);
    assert.equal((await request('email=private%40example.com', 'application/x-www-form-urlencoded')).status, 415);
    assert.equal((await fetch(app.url + '/api/waitlist')).status, 405);
    const html = await (await fetch(app.url)).text();
    assert.match(html, /<form id="waitlist-form" method="post" action="\/api\/waitlist">/);
  } finally { await app.close(); rmSync(folder, { recursive: true }); }
});
