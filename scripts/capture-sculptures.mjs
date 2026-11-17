// Rebuild static fallback artwork from the actual parametric WebGL renderer.
// Run after npm run build; requires the existing Playwright dev dependency.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { createApp } from '../server.mjs';
const app = createApp();
await new Promise(resolve => app.listen(3204, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  // A single static draw is safe in software. Bypass the runtime software guard
  // solely in this local asset-generation browser; never enable its animation.
  await page.addInitScript(() => {
    const original = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(parameter) {
      const value = original.call(this, parameter);
      return typeof value === 'string' && /swiftshader|llvmpipe|software/i.test(value) ? 'Static asset capture' : value;
    };
  });
  await page.goto('http://127.0.0.1:3204/', { waitUntil: 'networkidle' });
  await page.locator('.visual-stage').evaluate(e => { e.style.width = '640px'; e.style.height = '520px'; });
  await page.waitForTimeout(150);
  if (await page.locator('#strategy-field').getAttribute('data-renderer') !== 'webgl2') throw new Error('WebGL2 is required to regenerate the artwork.');
  for (let scene = 0; scene < 3; scene++) {
    await page.locator(`[data-visual-step="${scene}"]`).click();
    await page.waitForTimeout(150);
    const base64 = await page.locator('#strategy-field').evaluate(e => e.toDataURL('image/webp', .9).split(',')[1]);
    writeFileSync(`assets/intelligence-sculpture-${scene}.webp`, Buffer.from(base64, 'base64'), { mode: 0o644 });
  }
  console.log('Captured all three full-geometry scenes as transparent WebP artwork.');
} finally { await browser.close(); await new Promise(resolve => app.close(resolve)); }
