// CA-05 render-timing probe: same actor, same data, warm dev server.
// Reports the distribution only; it is a local development server and never
// a production performance claim.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4331';
const PHASE = process.argv[2] ?? 'after';
const OUT = `audit/CA-05/${PHASE}`;
mkdirSync(OUT, { recursive: true });
const PAGES = [
  { id: 'dashboard', path: '/dashboard' },
  { id: 'tasks', path: '/tasks' },
  { id: 'tasks-new', path: '/tasks/new' },
  { id: 'receiving-detail', path: process.env.CA05_RECEIVING_PATH ?? '/quarantine/receiving' },
  { id: 'capa-new', path: '/quality/capa/new' },
];
const out = { phase: PHASE, pages: {}, status: 'PARTIAL' };
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL((url) => url.pathname === '/dashboard');

  for (const definition of PAGES) {
    await page.goto(`${BASE}${definition.path}`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const samples = [];
    for (let index = 0; index < 5; index += 1) {
      const started = Date.now();
      const response = await page.goto(`${BASE}${definition.path}`, { waitUntil: 'load' });
      const elapsed = Date.now() - started;
      const nav = await page.evaluate(() => {
        const entry = performance.getEntriesByType('navigation')[0];
        return entry ? { responseStart: Math.round(entry.responseStart), domContentLoaded: Math.round(entry.domContentLoadedEventEnd), load: Math.round(entry.loadEventEnd) } : null;
      });
      samples.push({ status: response?.status() ?? 0, elapsedMs: elapsed, ...nav });
      await page.waitForTimeout(200);
    }
    out.pages[definition.id] = {
      status: samples[0].status,
      elapsedMs: samples.map((sample) => sample.elapsedMs),
      medianElapsedMs: median(samples.map((sample) => sample.elapsedMs)),
      minElapsedMs: Math.min(...samples.map((sample) => sample.elapsedMs)),
      maxElapsedMs: Math.max(...samples.map((sample) => sample.elapsedMs)),
      medianResponseStart: median(samples.map((sample) => sample.responseStart ?? 0)),
      medianDomContentLoaded: median(samples.map((sample) => sample.domContentLoaded ?? 0)),
      medianLoad: median(samples.map((sample) => sample.load ?? 0)),
    };
  }
  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}/timing.json`, JSON.stringify(out, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ phase: PHASE, status: out.status, error: out.error }));
