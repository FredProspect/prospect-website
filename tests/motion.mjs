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
    assert.ok(typography.body >= 17);
    assert.equal(typography.headline.at(-1), '600');
    assert.ok(typography.fonts.some(face => face.family === 'Geist' && face.weight === '500' && face.status === 'loaded'));
    await page.waitForTimeout(1000);
    assert.equal((await page.locator('h1').textContent()).replace(/\s+/g, ' ').trim(), 'AI for the trader');
    assert.equal(await page.locator('#strategy-field').count(), 1);
    assert.equal(await page.locator('.visual-emblem,.visual-node,.visual-connections,.visual-stage img[src*=prospect-mark]').count(), 0, 'hero contains no oversized brand badge or decorative pills');
    const renderer = await page.locator('#strategy-field').getAttribute('data-renderer');
    assert.ok(['webgl2', 'compositor'].includes(renderer));
    assert.equal(await page.locator('.instrument-label,.hero-coordinate').count(), 0, 'small decorative labels remain removed');
    const pixels = () => renderer === 'webgl2' ? page.locator('#strategy-field').evaluate(e => e.toDataURL()) : page.locator('.sculpture-fallback').evaluate(e => getComputedStyle(e).transform);
    const moving = await pixels(); await page.waitForTimeout(350);
    assert.ok((await pixels()) !== moving, 'visible research graphic animates');
    await page.locator('[data-visual-step="1"]').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-visual-step="1"]').getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('#workflow-note').textContent(), /clear rules/);
    await page.waitForTimeout(650);
    await page.locator('[data-visual-step="2"]').click();
    assert.match(await page.locator('#workflow-note').textContent(), /share risk/);
    const smallText = await page.locator('main').evaluate(main => [...main.querySelectorAll('*')].filter(node => [...node.childNodes].some(child => child.nodeType === 3 && child.textContent.trim())).filter(node => { const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && parseFloat(getComputedStyle(node).fontSize) < 14; }).map(node => ({ tag: node.tagName, text: node.textContent.trim().slice(0, 50), size: getComputedStyle(node).fontSize })));
    assert.deepEqual(smallText, [], 'homepage text remains at least 14px');
    await page.locator('#product').scrollIntoViewIfNeeded();
    await page.waitForTimeout(450); const paused = await pixels(); await page.waitForTimeout(250);
    assert.ok((await pixels()) === paused, 'offscreen research graphic pauses');
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
    await page.waitForTimeout(200);
    await page.locator('.hero').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
    const still = await pixels(); await page.waitForTimeout(300);
    assert.ok((await pixels()) === still, 'reduced-motion graphic stays static');
    await page.locator('[data-visual-step="0"]').click();
    assert.match(await page.locator('#workflow-note').textContent(), /question about the markets/);
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
    assert.equal(errors.length, 0);
    results.push({ width, typography, headline: 'AI for the trader', minimumHomepageText: '14px', reactiveGraphic: `${renderer}: three sculptural scenes, no hero logo; keyboard/offscreen/reduced motion verified`, rapidPreviewSelection: 'passed', keyboardDisclosure: 'passed', themeTransition: 'two switches complete with matching final palette', reducedMotion: 'static; no running animations', pageErrors: errors });
    await page.close();
  }
  const defaultPage = await browser.newPage({ colorScheme: 'dark' });
  await defaultPage.goto('http://127.0.0.1:3194/');
  assert.equal(await defaultPage.locator('html').getAttribute('data-theme'), 'light', 'light is the default even with a dark OS setting');
  await defaultPage.locator('.theme').click();
  await defaultPage.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await defaultPage.reload();
  assert.equal(await defaultPage.locator('html').getAttribute('data-theme'), 'dark', 'explicit dark choice persists');
  await defaultPage.close();
  const noScript = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noScript.goto('http://127.0.0.1:3194/');
  assert.ok(await noScript.locator('h1').isVisible());
  assert.ok(await noScript.locator('.hero .primary').isVisible());
  assert.ok(await noScript.locator('.sculpture-fallback').evaluate(e => e.complete && e.naturalWidth > 0), 'static sculpture is visible without scripting');
  await noScript.close();
  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
  });
  await fallback.goto('http://127.0.0.1:3194/', { waitUntil: 'networkidle' });
  assert.equal(await fallback.locator('.visual-ready').count(), 0);
  assert.ok(await fallback.locator('.sculpture-fallback').evaluate(e => e.complete && e.naturalWidth > 0));
  await fallback.locator('[data-visual-step="2"]').click();
  await fallback.waitForFunction(() => { const img = document.querySelector('.sculpture-fallback'); return img.src.endsWith('intelligence-sculpture-2.webp') && img.complete && img.naturalWidth > 0; });
  await fallback.close();
  writeFileSync('evidence/typography-motion.json', JSON.stringify({ results, withoutJavaScript: 'headline, primary CTA and static sculpture visible', withoutWebGL: 'static scenes load and controls work' }, null, 2));
  console.log('Real Geist loaded; bold trader headline, minimum 14px homepage text, light-first theme, reactive graphic, preview transitions, keyboard disclosures and reduced-motion/no-JS content verified.');
} finally { await browser.close(); await new Promise(resolve => app.close(resolve)); }
