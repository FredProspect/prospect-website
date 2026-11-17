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
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const results = [];
const crossEngine = [];
for (const [name, engine] of [['firefox', firefox], ['webkit', webkit]]) {
  try { const extra = await engine.launch(); await extra.close(); crossEngine.push({ name, status: 'available, not yet tested' }); }
  catch (error) { crossEngine.push({ name, status: 'blocked', reason: error.message.split('\n')[0] }); }
}
writeFileSync('evidence/cross-engine.json', JSON.stringify(crossEngine, null, 2));
try {
  for (const [width, height, device] of [[1440, 1000, 'desktop'], [390, 844, 'mobile'], [768, 1024, 'tablet'], [320, 740, 'small-mobile']]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:3198/', { waitUntil: 'networkidle' });
      await page.locator('meta[name=waitlist-endpoint]').evaluate(e => e.content = '/api/waitlist');
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.skip').evaluate(e => e === document.activeElement), true, 'keyboard skip link');
      await page.locator('#email').fill('invalid');
      assert.equal(await page.locator('#email').evaluate(e => e.validity.valid), false);
      await page.locator('#email').fill('');
      assert.equal(await page.locator('[name=consent]').evaluate(e => e.validity.valueMissing), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: overflow`);
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
      const cta = await page.locator('.hero .primary').boundingBox();
      assert.ok(cta.y >= 0 && cta.y + cta.height <= height, `${width}: hero CTA visible`);
      await page.locator('[data-preview=builder]').click();
      await page.waitForFunction(() => document.querySelector('[data-preview=builder]').getAttribute('aria-pressed') === 'true' && document.querySelector('#product-screen').complete);
      assert.equal(await page.locator('[data-preview=builder]').getAttribute('aria-pressed'), 'true');
      await page.locator('[data-preview=home]').click();
      await page.waitForFunction(() => document.querySelector('[data-preview=home]').getAttribute('aria-pressed') === 'true');
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      results.push({ device, width, theme, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), pageErrors: errors });
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
      await page.waitForTimeout(100);
      await page.screenshot({ path: `evidence/${device}-${theme}.png`, fullPage: true });
      assert.equal(errors.length, 0);
      // Navigation, theme and the actual persisted form.
      await page.locator('.theme').click();
      assert.notEqual(await page.locator('html').getAttribute('data-theme'), theme);
      await page.locator('#email').fill(`${device}-${theme}@example.com`);
      await page.locator('[name=consent]').check();
      await page.locator('.submit').click();
      await page.waitForFunction(() => document.querySelector('#form-status').textContent.startsWith('You’re on the list.'));
      await page.keyboard.press('Tab');
      await context.close();
    }
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
    await page.locator('[name=consent]').check();
    await page.locator('.submit').click();
    await page.waitForFunction(() => document.querySelector('#form-status').classList.contains('error'));
    assert.match(await page.locator('#form-status').textContent(), /temporarily unavailable/);
    await page.close();
  } finally { await new Promise(resolve => unavailable.close(resolve)); }
  console.log('8 viewport/theme combinations: no overflow, hero CTA visible, preview, themes, persisted form, no page errors; axe passed.');
} finally { await browser.close(); await new Promise(resolve => app.close(resolve)); rmSync(folder, { recursive: true }); }
