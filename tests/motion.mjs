import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createApp } from '../server.mjs';
const app = createApp();
await new Promise(resolve => app.listen(3194, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
const url = 'http://127.0.0.1:3194/';
try {
  for (const width of [1440, 390]) {
    const height = width === 1440 ? 1000 : 844;
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await Promise.all([400, 500, 600].map(weight => document.fonts.load(`${weight} 32px Geist`))); });
    const typography = await page.evaluate(() => ({
      family: getComputedStyle(document.body).fontFamily,
      weights: [400, 500, 600].map(weight => document.fonts.check(`${weight} 32px Geist`)),
      body: parseFloat(getComputedStyle(document.querySelector('.step-copy > p:not(.kicker):not(.tag)')).fontSize),
      headline: getComputedStyle(document.querySelector('h1')).fontWeight
    }));
    assert.match(typography.family, /Geist/);
    assert.ok(typography.weights.every(Boolean), 'Geist 400/500/600 load locally');
    assert.ok(typography.body >= 17);
    assert.equal(typography.headline, '600');
    assert.equal((await page.locator('h1').textContent()).replace(/\s+/g, ' ').trim(), 'AI for the trader.');

    // The waitlist leads: the hero form and its submit button are on the first screen once the intro settles.
    await page.waitForTimeout(2600);
    const submit = await page.locator('#waitlist-form .submit').boundingBox();
    assert.ok(submit.height >= 44 && submit.y + submit.height <= height, 'hero signup visible without scrolling');

    // Living UI is wired: smooth scroll, a hero canvas and ScrollTrigger-driven sections.
    const living = await page.evaluate(() => ({ lenis: document.documentElement.classList.contains('lenis'), canvas: !!document.querySelector('.hero-bg canvas'), cards: document.querySelectorAll('.step-card').length }));
    assert.ok(living.lenis, 'Lenis smooth scroll active');
    assert.ok(living.canvas, 'hero background canvas present');
    assert.equal(living.cards, 5);

    // Scroll the whole page: every reveal must finish visible, and nothing may overflow sideways.
    for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += 600) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(1800);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no horizontal overflow');
    const hidden = await page.evaluate(() => [...document.querySelectorAll('.faq details, .closing h2 .line, .wordmark span')].filter(node => parseFloat(getComputedStyle(node).opacity) < 0.99 || /matrix\(1, 0, 0, 1, 0, [1-9]/.test(getComputedStyle(node).transform)).length);
    assert.equal(hidden, 0, 'scroll reveals end in their resting state');

    const smallText = await page.locator('main').evaluate(main => [...main.querySelectorAll('*')].filter(node => !node.closest('svg, .sr-only, .honeypot') && [...node.childNodes].some(child => child.nodeType === 3 && child.textContent.trim())).filter(node => { const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && parseFloat(getComputedStyle(node).fontSize) < 14; }).map(node => node.textContent.trim().slice(0, 50)));
    assert.deepEqual(smallText, [], 'no reading text below 14px');

    await page.locator('[data-preview=builder]').click();
    await page.waitForFunction(() => document.querySelector('#product-screen').src.endsWith('strategy-builder.jpg'));
    await page.locator('[data-preview=home]').click();
    await page.waitForFunction(() => document.querySelector('#product-screen').src.endsWith('workspace.jpg'));
    assert.equal(errors.length, 0, errors.join('\n'));
    results.push({ width, typography, living });
    await page.close();
  }

  // Reduced motion: no smooth-scroll hijack, and content is fully visible immediately.
  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await reduced.evaluate(() => document.documentElement.classList.contains('lenis')), false, 'reduced motion keeps native scroll');
  assert.equal(await reduced.locator('h1').evaluate(h => getComputedStyle(h).opacity), '1');
  await reduced.close();

  // Prerendered HTML: crawlers and no-script visitors get the full page.
  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noScript = await noScriptContext.newPage();
  await noScript.goto(url);
  assert.ok(await noScript.locator('h1').isVisible());
  assert.ok(await noScript.locator('#waitlist-form .submit').isVisible());
  assert.equal(await noScript.locator('.step-card').count(), 5, 'every step is in the markup without scripting');
  assert.equal(await noScript.locator('.faq details').count(), 5);
  await noScriptContext.close();
  writeFileSync('evidence/typography-motion.json', JSON.stringify({ results }, null, 2));
  console.log('Typography, smooth scroll, living hero, scroll reveals, previews, reduced motion and no-script fallbacks pass.');
} finally { await browser.close(); await new Promise(resolve => app.close(resolve)); }
