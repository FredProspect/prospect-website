import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createApp } from '../server.mjs';
const app = createApp();
await new Promise(resolve => app.listen(3194, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
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
      weights: [400, 500, 600].map(weight => document.fonts.check(`${weight} 32px Geist`)),
      body: parseFloat(getComputedStyle(document.querySelector('.step-copy p:not(.kicker):not(.status-chip)')).fontSize),
      headline: getComputedStyle(document.querySelector('h1')).fontWeight
    }));
    assert.match(typography.family, /Geist/);
    assert.ok(typography.weights.every(Boolean), 'Geist 400/500/600 load locally');
    assert.ok(typography.body >= 17);
    assert.equal(typography.headline, '600');
    assert.equal((await page.locator('h1').textContent()).replace(/\s+/g, ' ').trim(), 'AI for the trader.');

    // The waitlist leads: the hero form and its submit button are on the first screen.
    const submit = await page.locator('#waitlist-form .submit').boundingBox();
    assert.ok(submit.height >= 48 && submit.y + submit.height <= (width === 1440 ? 1000 : 844), 'hero signup visible without scrolling');

    // Decision architecture draws once, then rests in its complete state.
    await page.waitForTimeout(2600);
    const architecture = await page.locator('[data-arch] svg').evaluate(svg => ({
      inputs: svg.querySelectorAll('.g-in').length,
      running: svg.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length,
      aiOffset: getComputedStyle(svg.querySelector('.g-ai')).strokeDashoffset,
      portfolio: getComputedStyle(svg.querySelector('.n-port')).opacity
    }));
    assert.ok(architecture.inputs >= 30);
    assert.equal(architecture.running, 0, 'no perpetual loops');
    assert.match(architecture.aiOffset, /^0(px)?$/);
    assert.equal(architecture.portfolio, '1');
    if (width === 1440) {
      const box = await page.locator('[data-arch] svg').boundingBox();
      await page.mouse.move(box.x + 40, box.y + box.height * 0.5);
      await page.waitForTimeout(100);
      assert.ok(await page.locator('.g-in.is-near').count() > 0, 'inputs respond to the pointer');
      await page.mouse.move(5, 5);
      await page.waitForTimeout(100);
      assert.equal(await page.locator('.g-in.is-near').count(), 0);
    }

    // Research journey: one panel at a time, keyboard operable.
    assert.equal(await page.locator('.step-panel:visible').count(), 1);
    await page.locator('#step-tab-3').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#step-tab-3').getAttribute('aria-pressed'), 'true');
    assert.ok(await page.locator('#step-panel-3').isVisible());
    assert.equal(await page.locator('.step-panel:visible').count(), 1);

    const smallText = await page.locator('main').evaluate(main => [...main.querySelectorAll('*')].filter(node => !node.closest('svg') && [...node.childNodes].some(child => child.nodeType === 3 && child.textContent.trim())).filter(node => { const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && parseFloat(getComputedStyle(node).fontSize) < 14; }).map(node => node.textContent.trim().slice(0, 50)));
    assert.deepEqual(smallText, [], 'no reading text below 14px');
    await page.locator('[data-preview=builder]').click();
    await page.waitForFunction(() => document.querySelector('#product-screen').src.endsWith('strategy-builder.jpg'));
    await page.locator('[data-preview=home]').click();
    await page.waitForTimeout(800);
    assert.equal(await page.locator('.preview-outgoing').count(), 0, 'crossfade cleans up');
    assert.equal(errors.length, 0, errors.join('\n'));
    results.push({ width, typography, architecture });
    await page.close();
  }
  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto('http://127.0.0.1:3194/', { waitUntil: 'networkidle' });
  assert.equal(await reduced.locator('[data-arch] svg').evaluate(svg => svg.getAnimations({ subtree: true }).length), 0, 'reduced motion shows the finished diagram');
  await reduced.close();

  const defaultContext = await browser.newContext({ colorScheme: 'dark' });
  const defaultPage = await defaultContext.newPage();
  await defaultPage.goto('http://127.0.0.1:3194/');
  assert.equal(await defaultPage.locator('html').getAttribute('data-theme'), 'light', 'light is the default even with a dark OS setting');
  await defaultPage.locator('.theme').click();
  await defaultPage.reload();
  assert.equal(await defaultPage.locator('html').getAttribute('data-theme'), 'dark', 'explicit dark choice persists');
  await defaultContext.close();

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noScript = await noScriptContext.newPage();
  await noScript.goto('http://127.0.0.1:3194/');
  assert.ok(await noScript.locator('h1').isVisible());
  assert.ok(await noScript.locator('#waitlist-form .submit').isVisible());
  assert.ok(await noScript.locator('.g-ai').isVisible(), 'diagram is complete without scripting');
  assert.equal(await noScript.locator('.step-panel:visible').count(), 5, 'every step is readable without scripting');
  await noScriptContext.close();
  writeFileSync('evidence/typography-motion.json', JSON.stringify({ results }, null, 2));
  console.log('Typography, finite diagram motion, pointer response, steps, previews, reduced motion, theme and no-script fallbacks pass.');
} finally { await browser.close(); await new Promise(resolve => app.close(resolve)); }
