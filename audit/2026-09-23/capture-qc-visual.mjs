import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const browser = await chromium.launch({ headless: true });
const url = pathToFileURL(resolve('audit/2026-09-23/qc-visual-specimen.html')).href;
for (const width of [320, 390, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.screenshot({ path: `audit/2026-09-23/qc-visual-${width}.png`, fullPage: true });
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  if (dimensions.document > dimensions.viewport) { const offenders = await page.evaluate(() => [...document.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(el => ({tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right}))); throw new Error(`Page overflow at ${width}: ${JSON.stringify(dimensions)} ${JSON.stringify(offenders)}`); }
  await page.close();
}
for (const [name, options] of Object.entries({ 'forced-colors': { forcedColors: 'active' }, 'reduced-motion': { reducedMotion: 'reduce' }, print: { colorScheme: 'light' } })) {
  const page = await browser.newPage({ viewport: { width: 768, height: 900 }, ...options });
  if (name === 'print') await page.emulateMedia({ media: 'print' });
  await page.goto(url);
  await page.screenshot({ path: `audit/2026-09-23/qc-visual-${name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
