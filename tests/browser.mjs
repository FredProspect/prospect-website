import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';
import { DatabaseSync } from 'node:sqlite';
const folder = mkdtempSync(join(tmpdir(), 'prospect-browser-'));
const app = createApp({ origin: 'http://127.0.0.1:3198', dbPath: join(folder, 'leads.sqlite'), secret: 'controlled-browser-test-secret-over-32-characters' });
await new Promise(resolve => app.listen(3198, '127.0.0.1', resolve));
mkdirSync('evidence', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
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
      if (theme === 'dark') await context.addInitScript(() => localStorage.setItem('prospect-theme', 'dark'));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:3198/', { waitUntil: 'networkidle' });
      await page.locator('meta[name=waitlist-endpoint]').evaluate(e => e.content = '/api/waitlist');
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.skip').evaluate(e => e === document.activeElement), true, 'keyboard skip link');
      await page.locator('#hero-email').fill('invalid');
      assert.equal(await page.locator('#hero-email').evaluate(e => e.validity.valid), false);
      await page.locator('#hero-email').fill('');
      assert.equal(await page.locator('#hero-form-consent').evaluate(e => e.validity.valueMissing), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: overflow`);
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
      const cta = await page.locator('#hero-form .submit').boundingBox();
      assert.ok(cta.y >= 0 && cta.y + cta.height <= height, `${width}: hero CTA visible`);
      await page.locator('[data-step="2"]').click();
      assert.equal(await page.locator('[data-pane="2"]').evaluate(e => e.classList.contains('current')), true, 'studio step');
      await page.locator('[data-proto=builder]').click();
      await page.waitForFunction(() => document.querySelector('[data-proto=builder]').getAttribute('aria-pressed') === 'true');
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      results.push({ device, width, theme, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), pageErrors: errors });
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
      await page.waitForTimeout(100);
      await page.screenshot({ path: `evidence/${device}-${theme}.png`, fullPage: true });
      assert.equal(errors.length, 0, errors.join('; '));
      await page.locator('.theme').click();
      assert.notEqual(await page.locator('html').getAttribute('data-theme'), theme);
      await page.locator('.theme').click();
      // Join, then complete the questionnaire with keyboard and pointer.
      await page.locator('#hero-email').fill(`${device}-${theme}@example.com`);
      await page.locator('#hero-form-consent').check();
      await page.locator('#hero-form .submit').click();
      await page.waitForSelector('#qf[open]');
      await page.keyboard.press('b');                         // Q1 role: prop-funded (auto-advances)
      await page.waitForSelector('.qf-q h2:text("What do you trade?")');
      if (device === 'desktop') { const qa = await new AxeBuilder({ page }).include('#qf').withTags(['wcag2a', 'wcag2aa']).analyze(); results.push({ device, width, theme, scope: 'questionnaire', violations: qa.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })) }); }
      await page.keyboard.press('a'); await page.keyboard.press('c');
      await page.locator('.qf-next').click();                 // Q2 markets
      await page.locator('.qf-opt').nth(2).click();           // Q3 experience
      await page.locator('.qf-skip').click();                 // Q4 skipped
      await page.locator('.qf-opt').nth(1).click();           // Q5 challenge
      await page.locator('.qf-text').fill('Explain why my strategy changed.');
      await page.locator('.qf-next').click();                 // Q6 note
      await page.locator('.qf-opt').first().click();          // Q7 beta
      await page.waitForFunction(() => document.querySelector('#qf-title')?.textContent.startsWith('Thank you'));
      if (device === 'desktop' && theme === 'light') await page.screenshot({ path: 'evidence/questionnaire-done.png' });
      await page.locator('.qf-done [data-qf-close]').click();
      assert.equal(await page.locator('#qf').evaluate(d => d.open), false);
      const db = new DatabaseSync(join(folder, 'leads.sqlite'), { readOnly: true });
      const saved = JSON.parse(db.prepare('SELECT answers FROM waitlist_profile WHERE email = ?').get(`${device}-${theme}@example.com`).answers);
      db.close();
      assert.deepEqual(saved, { role: 'prop-funded', markets: ['forex', 'stocks'], experience: '3-5', challenge: 'testing', note: 'Explain why my strategy changed.', beta: 'yes' });
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
    await page.locator('#waitlist-form-consent').check();
    await page.locator('#waitlist-form .submit').click();
    await page.waitForFunction(() => document.querySelector('#waitlist-form-status').classList.contains('error'));
    assert.match(await page.locator('#waitlist-form-status').textContent(), /temporarily unavailable/);
    assert.equal(await page.locator('#qf').evaluate(d => d.open), false);
    await page.close();
  } finally { await new Promise(resolve => unavailable.close(resolve)); }
  console.log('8 viewport/theme combinations: no overflow, hero CTA visible, studio, prototype tabs, themes, signup + questionnaire persisted, no page errors; axe passed.');
} finally { await browser.close(); await new Promise(resolve => app.close(resolve)); rmSync(folder, { recursive: true }); }
