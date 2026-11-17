import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { createApp } from '../server.mjs';
const app = createApp({ origin: 'http://127.0.0.1:3199' });
await new Promise(resolve => app.listen(3199, '127.0.0.1', resolve));
const results = [];
try {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('http://127.0.0.1:3199/brand/prospect-social-card.svg');
  await page.screenshot({ path: 'brand/prospect-social-card.jpg', type: 'jpeg', quality: 90 });
  await page.goto('http://127.0.0.1:3199/', { waitUntil: 'networkidle' });
  const motion = await page.evaluate(() => new Promise(resolve => {
    const intervals = []; let previous;
    function sample(time) { if (previous) intervals.push(time - previous); previous = time; if (intervals.length < 120) requestAnimationFrame(sample); else { const sorted = [...intervals].sort((a,b) => a-b); resolve({ renderer: document.querySelector('#strategy-field')?.dataset.renderer, samples: intervals.length, medianFrame_ms: sorted[60], p95Frame_ms: sorted[114], framesOver35ms: intervals.filter(t => t > 35).length, note: 'Local Chromium rAF sample during homepage interactions. Software-rendered browsers use composited sculpture artwork; not real-user hardware FPS, battery or INP.' }); } }
    requestAnimationFrame(sample);
  }));
  writeFileSync('evidence/motion.json', JSON.stringify(motion, null, 2));
  await browser.close();
  for (const device of ['mobile', 'desktop']) {
    const chrome = await launch({ chromePath: '/usr/bin/chromium', chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'] });
    try {
      const result = await lighthouse('http://127.0.0.1:3199/', { port: chrome.port, output: 'html', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, device === 'desktop' ? desktopConfig : undefined);
      writeFileSync(`evidence/lighthouse-${device}.html`, result.report);
      const audits = result.lhr.audits;
      results.push({ device, scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])), LCP_ms: audits['largest-contentful-paint'].numericValue, CLS: audits['cumulative-layout-shift'].numericValue, TBT_ms: audits['total-blocking-time'].numericValue, failedAudits: Object.entries(audits).filter(([_key, value]) => value.score !== null && value.score < 1 && value.scoreDisplayMode !== 'informative').map(([key, value]) => ({ id: key, title: value.title, displayValue: value.displayValue })) });
      console.log(JSON.stringify(results.at(-1)));
    } finally { await chrome.kill(); }
  }
  writeFileSync('evidence/performance.json', JSON.stringify(results, null, 2));
} finally { await new Promise(resolve => app.close(resolve)); }
