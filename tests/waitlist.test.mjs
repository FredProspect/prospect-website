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
    assert.match(html, /<form id="waitlist-form"[^>]*action="\/api\/waitlist"[^>]*>/);
    assert.match(html.match(/<form id="waitlist-form"[^>]*>/)[0], /method="post"/);
  } finally { await app.close(); rmSync(folder, { recursive: true }); }
});
test('cross-origin collector accepts only configured public sites, including preflight', async () => {
  const app = await start({ additionalOrigin: 'https://preview.example.com' });
  try {
    const options = origin => fetch(app.url + '/api/waitlist', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
    const approved = await options('https://preview.example.com');
    assert.equal(approved.status, 204);
    assert.equal(approved.headers.get('access-control-allow-origin'), 'https://preview.example.com');
    assert.equal(approved.headers.get('vary'), 'Origin');
    const denied = await options('https://attacker.example.com');
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
  } finally { await app.close(); }
});
test('referrals: legacy rows migrate, referrers move up, codes are validated, export is protected', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'prospect-referral-'));
  const dbPath = join(folder, 'leads.sqlite');
  // A database written by the previous release, before referral columns existed.
  const legacy = new DatabaseSync(dbPath);
  legacy.exec(`CREATE TABLE waitlist (email TEXT PRIMARY KEY, created_at TEXT NOT NULL, consent_version TEXT NOT NULL, consent_at TEXT NOT NULL, source TEXT);
    INSERT INTO waitlist VALUES ('early@example.com', '2026-11-01T00:00:00.000Z', 'waitlist-2026-11-16', '2026-11-01T00:00:00.000Z', 'homepage');`);
  legacy.close();
  const adminToken = 'admin-token-for-tests-at-least-32-characters';
  const app = await start({ dbPath, secret, adminToken, mailer: null });
  const join_ = async (email, ref) => (await (await app.post({ email, consent: true, ...(ref ? { ref } : {}) })).json()).referral;
  try {
    const status = code => fetch(`${app.url}/api/waitlist/status?code=${code}`);
    const late = await join_('late@example.com');
    assert.match(late.code, /^[A-HJKMNP-Z2-9]{8}$/);
    assert.deepEqual(Object.keys(late).sort(), ['code', 'confirmed', 'referrals', 'tier'], 'no position or list size is exposed');
    assert.equal(late.confirmed, true, 'without email configured everyone counts as confirmed');
    assert.equal(late.tier, 'low');
    const early = new DatabaseSync(dbPath, { readOnly: true }).prepare('SELECT referral_code FROM waitlist WHERE email = ?').get('early@example.com');
    assert.match(early.referral_code, /^[A-HJKMNP-Z2-9]{8}$/, 'legacy row received a code');

    const friend = await join_('friend@example.com', late.code.toLowerCase());
    assert.equal(friend.referrals, 0);
    const moved = (await (await status(late.code)).json()).referral;
    assert.deepEqual([moved.referrals, moved.tier], [1, 'low']);
    for (const n of [2, 3]) await join_(`more${n}@example.com`, late.code);
    assert.equal((await (await status(late.code)).json()).referral.tier, 'medium', 'three referrals reach the middle');
    for (const n of [4, 5]) await join_(`more${n}@example.com`, late.code);
    assert.equal((await (await status(late.code)).json()).referral.tier, 'high', 'five referrals are high up');

    await join_('ghost@example.com', 'ZZZZZZZZ');
    await join_('late@example.com', late.code);
    assert.equal((await (await status(late.code)).json()).referral.referrals, 5, 'unknown codes and repeat signups do not count');
    assert.equal((await status('not-a-code')).status, 404);

    assert.equal((await fetch(`${app.url}/api/waitlist/export`)).status, 401);
    assert.equal((await fetch(`${app.url}/api/waitlist/export`, { headers: { Authorization: 'Bearer wrong' } })).status, 401);
    const csv = await (await fetch(`${app.url}/api/waitlist/export`, { headers: { Authorization: `Bearer ${adminToken}` } })).text();
    const lines = csv.trim().split('\n');
    assert.match(lines[0], /^position,email,confirmed_at,referrals/);
    assert.match(lines[1], /^"1","late@example.com","","5"/, 'admin export keeps exact ranking');
    assert.equal(lines.length, 9);
  } finally { await app.close(); rmSync(folder, { recursive: true }); }
});
test('export endpoint does not exist without an admin token', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'prospect-noadmin-'));
  const app = await start({ dbPath: join(folder, 'leads.sqlite'), secret, adminToken: '' });
  try { assert.equal((await fetch(`${app.url}/api/waitlist/export`, { headers: { Authorization: 'Bearer anything' } })).status, 404); }
  finally { await app.close(); rmSync(folder, { recursive: true }); }
});
test('email confirmation: link confirms once, only confirmed friends count, resends are throttled', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'prospect-confirm-'));
  const sent = [];
  const app = await start({ dbPath: join(folder, 'leads.sqlite'), secret, mailer: async mail => { sent.push(mail); }, collectorOrigin: 'https://collector.example' });
  const linkFor = to => sent.filter(mail => mail.to === to).at(-1).text.match(/https:\/\/collector\.example(\S+)/)[1];
  const status = async code => (await (await fetch(`${app.url}/api/waitlist/status?code=${code}`)).json()).referral;
  try {
    const member = (await (await app.post({ email: 'member@example.com', consent: true })).json()).referral;
    assert.equal(member.confirmed, false);
    assert.equal(sent.length, 1);
    assert.match(sent[0].subject, /Confirm/);
    assert.match(sent[0].html, /Confirm my email/);

    await app.post({ email: 'member@example.com', consent: true });
    assert.equal(sent.length, 1, 'repeat signup within 10 minutes does not resend');
    const resend = await fetch(`${app.url}/api/waitlist/resend`, { method: 'POST', headers: { Origin: 'https://prospectpartnership.co.uk', 'Content-Type': 'application/json' }, body: JSON.stringify({ code: member.code }) });
    assert.equal(resend.status, 200);
    assert.equal(sent.length, 1, 'resend is throttled too');

    const confirm = await fetch(app.url + linkFor('member@example.com'), { redirect: 'manual' });
    assert.equal(confirm.status, 303);
    assert.equal(confirm.headers.get('location'), `https://prospectpartnership.co.uk/?confirmed=1&member=${member.code}`);
    assert.equal((await status(member.code)).confirmed, true);
    const reused = await fetch(app.url + linkFor('member@example.com'), { redirect: 'manual' });
    assert.match(reused.headers.get('location'), /confirmed=invalid/, 'links are single use');
    assert.match((await fetch(`${app.url}/api/waitlist/confirm?token=nope`, { redirect: 'manual' })).headers.get('location'), /confirmed=invalid/);

    await app.post({ email: 'friend@example.com', consent: true, ref: member.code });
    assert.equal((await status(member.code)).referrals, 0, 'unconfirmed friends do not count');
    await fetch(app.url + linkFor('friend@example.com'), { redirect: 'manual' });
    assert.equal((await status(member.code)).referrals, 1, 'confirmed friend counts');
  } finally { await app.close(); rmSync(folder, { recursive: true }); }
});
test('a failing email provider never blocks a signup', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'prospect-mailfail-'));
  const app = await start({ dbPath: join(folder, 'leads.sqlite'), secret, mailer: async () => { throw Error('provider down'); } });
  try {
    const res = await app.post({ email: 'someone@example.com', consent: true });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).referral.confirmed, false);
  } finally { await app.close(); rmSync(folder, { recursive: true }); }
});
test('SEO: unique keyword titles, redirects for retired URLs, structured data, no duplicate host', async () => {
  const app = await start();
  const { readFileSync } = await import('node:fs');
  try {
    const routes = [...readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>https:\/\/prospectpartnership.co.uk([^<]+)<\/loc>/g)].map(m => m[1]);
    const titles = new Set();
    for (const route of routes) {
      const html = await (await fetch(app.url + route)).text();
      const title = html.match(/<title>([^<]+)<\/title>/)[1];
      const description = html.match(/name="description" content="([^"]+)"/)[1];
      assert.ok(title.length <= 65, `${route}: title ${title.length} chars`);
      assert.ok(description.length <= 160, `${route}: description ${description.length} chars`);
      assert.ok(!titles.has(title), `${route}: duplicate title`);
      titles.add(title);
      assert.doesNotMatch(html, /noindex/, `${route} is in the sitemap but noindexed`);
    }
    const home = await (await fetch(app.url + '/')).text();
    for (const type of ['Organization', 'WebSite', 'WebPage', 'FAQPage']) assert.match(home, new RegExp(`"@type":"${type}"`), type);
    const retired = await (await fetch(app.url + '/investors/')).text();
    assert.match(retired, /http-equiv="refresh" content="0; url=\/about\/"/);
    assert.match(retired, /rel="canonical" href="https:\/\/prospectpartnership.co.uk\/about\/"/);
    assert.equal((await fetch(app.url + '/')).headers.get('x-robots-tag'), 'noindex, nofollow', 'non-canonical host is noindexed');
  } finally { await app.close(); }
});
