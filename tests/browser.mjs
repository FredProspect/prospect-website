import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';
const folder = mkdtempSync(join(tmpdir(), 'prospect-browser-'));
const app = createApp({ origin: 'http://127.0.0.1:3198', dbPath: join(folder, 'leads.sqlite'), secret: 'controlled-browser-test-secret-over-32-characters' });
await new Promise(resolve => app.listen(3198, '127.0.0.1', resolve));
mkdirSync('evidence', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const results = [];
const crossEngine = [];
for (const [name, engine] of [['firefox', firefox], ['webkit', webkit]]) {
  try { const extra = await engine.launch(); await extra.close(); crossEngine.push({ name, status: 'available, not yet tested' }); }
  catch (error) { crossEngine.push({ name, status: 'blocked', reason: error.message.split('\n')[0] }); }
}
writeFileSync('evidence/cross-engine.json', JSON.stringify(crossEngine, null, 2));
try {
  for (const [width, height, device] of [[1440, 1000, 'desktop'], [390, 844, 'mobile'], [768, 1024, 'tablet'], [320, 740, 'small-mobile']]) {
    // The landing page has one considered dark appearance, so each viewport runs once with reduced motion.
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    // The page's collector is the production Railway URL; serve those calls from the local test server.
    await context.route('https://prospect-public-website-staging.up.railway.app/**', async route => {
      const response = await route.fetch({ url: route.request().url().replace('https://prospect-public-website-staging.up.railway.app', 'http://127.0.0.1:3198'), headers: { ...route.request().headers(), origin: 'http://127.0.0.1:3198' } });
      await route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': 'http://127.0.0.1:3198' } });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /Content Security Policy|hydrat/i.test(message.text())) errors.push(message.text()); });
    await page.goto('http://127.0.0.1:3198/', { waitUntil: 'networkidle' });
    await page.locator('meta[name=waitlist-endpoint]').evaluate(e => e.content = '/api/waitlist');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.skip').evaluate(e => e === document.activeElement), true, 'keyboard skip link');
    await page.locator('#email').fill('invalid');
    assert.equal(await page.locator('#email').evaluate(e => e.validity.valid), false);
    await page.locator('#email').fill('');
    assert.equal(await page.locator('#consent').evaluate(e => e.validity.valueMissing), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: overflow`);
    await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
    const cta = await page.locator('.hero .submit').boundingBox();
    assert.ok(cta.y >= 0 && cta.y + cta.height <= height, `${width}: hero CTA visible`);
    await page.locator('[data-preview=builder]').click();
    await page.waitForFunction(() => document.querySelector('[data-preview=builder]').getAttribute('aria-pressed') === 'true' && document.querySelector('#product-screen').src.endsWith('strategy-builder.jpg'));
    await page.locator('[data-preview=home]').click();
    await page.waitForFunction(() => document.querySelector('[data-preview=home]').getAttribute('aria-pressed') === 'true');
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    results.push({ device, width, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), pageErrors: errors });
    await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `evidence/${device}.png`, fullPage: true });
    assert.equal(errors.length, 0, errors.join('\n'));
    // The actual persisted form.
    await page.locator('#email').fill(`${device}@example.com`);
    await page.locator('#consent').check();
    await page.locator('#waitlist-form .submit').click();
    await page.waitForSelector('.referral-card');
    const link = await page.locator('.hero .referral-link input').inputValue();
    assert.match(link, /\?ref=[A-HJKMNP-Z2-9]{8}$/, 'referral link shown after joining');
    assert.match(await page.locator('.hero .referral-place').textContent(), /#\d+ of \d+/);
    const referralAxe = await new AxeBuilder({ page }).include('.referral-card').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.equal(referralAxe.violations.length, 0, JSON.stringify(referralAxe.violations.map(v => v.id)));
    // A friend arriving through the link is credited, and the referrer moves up.
    const friend = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const friendPage = await friend.newPage();
    await friendPage.goto(link.replace('https://prospectpartnership.co.uk', 'http://127.0.0.1:3198'), { waitUntil: 'networkidle' });
    await friendPage.locator('meta[name=waitlist-endpoint]').evaluate(e => e.content = '/api/waitlist');
    await friendPage.locator('#email').fill(`friend-${device}@example.com`);
    await friendPage.locator('#consent').check();
    await friendPage.locator('#waitlist-form .submit').click();
    await friendPage.waitForSelector('.referral-card');
    await friend.close();
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('meta[name=waitlist-endpoint]').evaluate(e => e.content = '/api/waitlist');
    await page.waitForSelector('.referral-card');
    assert.match(await page.locator('.hero .referral-copy').textContent(), /referred 1 so far/, 'returning member sees updated standing');
    await context.close();
  }
  writeFileSync('evidence/browser-results.json', JSON.stringify(results, null, 2));
  assert.equal(results.flatMap(r => r.violations).length, 0, 'Accessibility violations; see evidence/browser-results.json');
  const unavailable = createApp({ origin: 'http://127.0.0.1:3197' });
  await new Promise(resolve => unavailable.listen(3197, '127.0.0.1', resolve));
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3197/');
    await page.locator('meta[name=waitlist-endpoint]').evaluate(e => e.content = '/api/waitlist');
    await page.locator('#email').fill('failure@example.com');
    await page.locator('#consent').check();
    await page.locator('#waitlist-form .submit').click();
    await page.waitForFunction(() => document.querySelector('#form-status').classList.contains('error'));
    assert.match(await page.locator('#form-status').textContent(), /temporarily unavailable/);
    await page.close();
  } finally { await new Promise(resolve => unavailable.close(resolve)); }
  console.log('4 viewports: no overflow, hero CTA visible, preview, persisted form, no page or CSP errors; axe passed.');
} finally { await browser.close(); await new Promise(resolve => app.close(resolve)); rmSync(folder, { recursive: true }); }
