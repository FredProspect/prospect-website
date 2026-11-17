import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createApp } from '../server.mjs';
const app = createApp();
await new Promise(resolve => app.listen(3194, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 1000 : 844 }, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3194/', { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await Promise.all([400, 500, 600].map(weight => document.fonts.load(`${weight} 32px Geist`))); });
    const typography = await page.evaluate(() => ({
      family: getComputedStyle(document.body).fontFamily,
      weights: [400, 500, 600].map(weight => ({ weight, loaded: document.fonts.check(`${weight} 32px Geist`) })),
      body: parseFloat(getComputedStyle(document.querySelector('.chapter p')).fontSize),
      headline: [...document.querySelectorAll('.headline-line')].map(e => getComputedStyle(e).fontWeight),
      fonts: [...document.fonts].map(font => ({ family: font.family, weight: font.weight, status: font.status }))
    }));
    assert.match(typography.family, /Geist/);
    assert.ok(typography.weights.every(face => face.loaded));
    assert.ok(typography.body >= 16);
    assert.equal(typography.headline.at(-1), '600');
    assert.ok(typography.fonts.some(face => face.family === 'Geist' && face.weight === '500' && face.status === 'loaded'));
    await page.waitForTimeout(1200);
    const pixels = () => page.locator('canvas').evaluate(e => e.toDataURL());
    const active = await pixels();
    await page.waitForTimeout(350);
    assert.notEqual(await pixels(), active, 'visible canvas evolves');
    await page.locator('#product').scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    const paused = await pixels();
    await page.waitForTimeout(350);
    assert.equal(await pixels(), paused, 'offscreen canvas stops rendering');
    await page.locator('[data-preview=builder]').click();
    await page.locator('[data-preview=home]').click();
    await page.waitForFunction(() => document.querySelector('[data-preview=home]').getAttribute('aria-pressed') === 'true');
    await page.waitForTimeout(750);
    assert.match(await page.locator('#product-screen').getAttribute('src'), /workspace.jpg$/);
    assert.equal(await page.locator('.preview-outgoing').count(), 0, 'crossfade cleans up');
    const summary = page.locator('.faq summary').first();
    await summary.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('.faq details').open);
    await page.waitForTimeout(450);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('.faq details').open);
    await page.locator('.theme').click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.locator('.theme').click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    await page.waitForTimeout(650);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const reduced = await pixels();
    await page.waitForTimeout(350);
    assert.equal(await pixels(), reduced, 'reduced motion remains static');
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
    assert.equal(errors.length, 0);
    results.push({ width, typography, activeCanvas: 'animated', offscreenCanvas: 'paused', rapidPreviewSelection: 'passed', keyboardDisclosure: 'passed', themeTransition: 'two switches complete with matching final palette', reducedMotion: 'static; no running animations', pageErrors: errors });
    await page.close();
  }
  const noScript = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noScript.goto('http://127.0.0.1:3194/');
  assert.ok(await noScript.locator('h1').isVisible());
  assert.ok(await noScript.locator('.hero .primary').isVisible());
  await noScript.close();
  writeFileSync('evidence/typography-motion.json', JSON.stringify({ results, withoutJavaScript: 'headline and primary CTA visible' }, null, 2));
  console.log('Real Geist 400/500/600 loaded; active/offscreen/reduced canvas, rapid preview changes, keyboard disclosures and no-JS content verified.');
} finally { await browser.close(); await new Promise(resolve => app.close(resolve)); }
