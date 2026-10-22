// CA-05 regression sweep over the remaining product routes.
//
// Purpose: prove that the shared-primitive fixes (link colour scope in
// capa-a.css and the 44px control floor in FilterBar/DataTable) did not
// change any other screen. The same script is run on the candidate and on a
// clean HEAD checkout, and the two result sets are compared.
//
// Local disposable PG18 only. No .env, no provider, no production access.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4331';
const PHASE = process.argv[2] ?? 'after';
const OUT = `audit/CA-05/${PHASE}`;
mkdirSync(`${OUT}/screens`, { recursive: true });
const register = JSON.parse(readFileSync('audit/CA-01/route-register.json', 'utf8'));
const routes = register.routes
  .filter((entry) => entry.kind === 'screen' && !entry.route.includes('['))
  .map((entry) => entry.route);
const VIEWPORTS = [1440, 390];
const out = { phase: PHASE, routes: {}, status: 'PARTIAL' };
const browser = await chromium.launch();

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL((url) => url.pathname === '/dashboard');

  for (const route of routes) {
    const record = { viewports: [] };
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 1000 });
      let status = 0;
      let overflow = null;
      let violations = [];
      let smallTargets = 0;
      let heading = null;
      try {
        const response = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        status = response?.status() ?? 0;
        await page.waitForTimeout(120);
        const probe = await page.evaluate(() => {
          const main = document.querySelector('#main-content');
          const visible = (el) => el.getClientRects().length > 0;
          const controls = main ? [...main.querySelectorAll('a,button,summary,input,select,textarea')].filter(visible) : [];
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            small: controls.filter((el) => {
              const r = el.getBoundingClientRect();
              return r.height < 44 || r.width < 44;
            }).length,
            heading: main?.querySelector('h1')?.textContent?.trim() ?? null,
          };
        });
        overflow = probe.overflow;
        smallTargets = probe.small;
        heading = probe.heading;
        if (width === 1440) {
          const axe = await new AxeBuilder({ page }).include('#main-content').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
          violations = axe.violations.map((violation) => `${violation.id}:${violation.nodes.length}`);
        }
      } catch (error) {
        record.viewports.push({ width, status, error: error.message.slice(0, 120) });
        continue;
      }
      record.viewports.push({ width, status, overflow, smallTargets, heading, violations });
    }
    out.routes[route] = record;
  }
  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}/sweep.json`, JSON.stringify(out, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ phase: PHASE, status: out.status, routes: routes.length, error: out.error }));
