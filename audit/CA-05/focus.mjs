// CA-05 focus + keyboard probe on the five pilot surfaces (local PG18 only).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4331';
const PHASE = process.argv[2] ?? 'before';
const OUT = `audit/CA-05/${PHASE}`;
mkdirSync(`${OUT}/screens`, { recursive: true });
const prepared = JSON.parse(readFileSync('audit/CA-05/prepared.json', 'utf8'));
const PAGES = [
  { id: 'dashboard', path: '/dashboard' },
  { id: 'tasks', path: '/tasks' },
  { id: 'tasks-new', path: '/tasks/new' },
  { id: 'receiving-detail', path: new URL(prepared.receivingUrl).pathname },
  { id: 'capa-new', path: '/quality/capa/new' },
];
const out = { phase: PHASE, pages: {}, status: 'PARTIAL' };
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
const page = await context.newPage();
try {
  await page.goto(`${BASE}/login`);
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL((url) => url.pathname === '/dashboard');

  for (const definition of PAGES) {
    await page.goto(`${BASE}${definition.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#main-content');
    const stops = [];
    for (let index = 0; index < 14; index += 1) {
      await page.keyboard.press('Tab');
      const stop = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const style = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60) || el.getAttribute('aria-label') || el.id || '',
          id: el.id || null,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
          outlineOffset: style.outlineOffset,
          boxShadow: style.boxShadow === 'none' ? 'none' : 'present',
        };
      });
      stops.push(stop);
    }
    const visibleRing = stops.filter((stop) => stop && stop.outlineStyle !== 'none' && parseFloat(stop.outlineWidth) > 0).length;
    out.pages[definition.id] = { stops, stopsWithVisibleRing: visibleRing, focusableCount: stops.length };
  }
  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}/focus.json`, JSON.stringify(out, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ phase: PHASE, status: out.status, error: out.error }));
