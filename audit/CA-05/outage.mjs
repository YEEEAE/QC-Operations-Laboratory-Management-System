// CA-05 read-outage probe: stops the disposable local PostgreSQL while an
// authenticated session is live, records the real page behaviour, then
// restarts the same cluster and records recovery. No production connection.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4331';
const PHASE = process.argv[2] ?? 'before';
const OUT = `audit/CA-05/${PHASE}`;
mkdirSync(`${OUT}/screens`, { recursive: true });
const prepared = JSON.parse(readFileSync('audit/CA-05/prepared.json', 'utf8'));
const PGBIN = '/opt/homebrew/opt/postgresql@18/bin';
const DATA = '.tmp/pg18/data';
const PAGES = [
  { id: 'dashboard', path: '/dashboard' },
  { id: 'tasks', path: '/tasks' },
  { id: 'receiving-detail', path: new URL(prepared.receivingUrl).pathname },
];
const out = { phase: PHASE, pages: {}, status: 'PARTIAL' };
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
const page = await context.newPage();

const pg = (action) =>
  execFileSync(
    `${PGBIN}/pg_ctl`,
    [
      '-D', DATA,
      '-l', '.tmp/pg18/postgres.log',
      action === 'stop' ? '-m' : '-w',
      ...(action === 'stop' ? ['fast', 'stop'] : ['start']),
    ],
    { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C', LANG: 'C' } },
  );

try {
  await page.goto(`${BASE}/login`);
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL((url) => url.pathname === '/dashboard');

  // Baseline with the database up.
  for (const definition of PAGES) {
    const response = await page.goto(`${BASE}${definition.path}`, { waitUntil: 'domcontentloaded' });
    out.pages[definition.id] = { baseline: { status: response?.status() ?? 0, url: page.url() } };
  }

  pg('stop');
  out.databaseStopped = true;
  for (const definition of PAGES) {
    let response = null;
    let body = '';
    let error = null;
    try {
      response = await page.goto(`${BASE}${definition.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      body = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
    } catch (caught) {
      error = caught.message;
    }
    out.pages[definition.id].outage = {
      status: response?.status() ?? 0,
      url: page.url(),
      body: body.replace(/\s+/g, ' ').trim().slice(0, 300),
      error,
    };
    await page.screenshot({ path: `${OUT}/screens/${definition.id}-outage.png`, fullPage: true }).catch(() => {});
  }

  pg('start');
  out.databaseRestarted = true;
  for (const definition of PAGES) {
    const response = await page.goto(`${BASE}${definition.path}`, { waitUntil: 'domcontentloaded' });
    out.pages[definition.id].recovered = { status: response?.status() ?? 0, url: page.url() };
  }
  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  process.exitCode = 1;
} finally {
  try {
    execFileSync(`${PGBIN}/pg_ctl`, ['-D', DATA, 'status'], { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });
  } catch {
    try {
      pg('start');
      out.databaseRestarted = out.databaseRestarted ?? true;
    } catch (restartError) {
      out.restartError = restartError.message;
    }
  }
  writeFileSync(`${OUT}/outage.json`, JSON.stringify(out, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ phase: PHASE, status: out.status, error: out.error }));
