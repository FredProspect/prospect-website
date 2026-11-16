// Opt-in release verification. One clearly labelled example.com record only.
import { chromium } from '@playwright/test';
import { writeFileSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
if (process.env.RUN_LIVE_SMOKE !== '1') throw Error('Set RUN_LIVE_SMOKE=1 explicitly for a release check.');
const api = 'https://prospect-public-website-staging.up.railway.app';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const result = { checkedAt: new Date().toISOString(), phase: process.env.SMOKE_PHASE || 'release', collector: api };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto(api + '/?utm_source=controlled-release-smoke', { waitUntil: 'networkidle' });
  assert.match(await page.locator('h1').textContent(), /A whole new/);
  await page.locator('.portrait-frame img').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.portrait-frame img').complete && document.querySelector('.portrait-frame img').naturalWidth > 0);
  assert.equal(await page.locator('.portrait-frame img').evaluate(e => e.complete && e.naturalWidth > 0), true);
  await page.locator('#email').fill('prospect-release-20261116@example.com');
  await page.locator('[name=consent]').check();
  const saved = page.waitForResponse(r => r.url().endsWith('/api/waitlist') && r.request().method() === 'POST');
  await page.locator('.submit').click();
  assert.equal((await saved).status(), 200);
  await page.waitForFunction(() => document.querySelector('#form-status').textContent.startsWith('You’re on the list.'));
  result.collectorUi = 'passed';
  await page.goto('https://prospectpartnership.co.uk/', { waitUntil: 'networkidle' });
  result.canonicalContentUpdated = /A whole new/.test(await page.locator('h1').textContent());
  const cross = await page.evaluate(async endpoint => {
    const res = await fetch(endpoint + '/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'prospect-release-20261116@example.com', consent: true, source: 'controlled-release-smoke' }) });
    return { status: res.status, message: (await res.json()).message };
  }, api);
  assert.equal(cross.status, 200);
  result.canonicalCors = 'passed';
  const denied = execFileSync('curl', ['-sS', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'OPTIONS', '-H', 'Origin: https://unapproved.example.com', '-H', 'Access-Control-Request-Method: POST', api + '/api/waitlist'], { encoding: 'utf8' });
  assert.equal(denied, '403');
  result.unapprovedOrigin = 'rejected';
  let history = [];
  try { history = JSON.parse(readFileSync('evidence/live-smoke.json', 'utf8')); } catch { /* First release. */ }
  history.push(result);
  writeFileSync('evidence/live-smoke.json', JSON.stringify(history, null, 2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
