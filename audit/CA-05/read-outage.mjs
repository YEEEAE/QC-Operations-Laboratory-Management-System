// CA-05 read-source outage probe.
//
// A second Astro dev process is started against the same disposable database
// with a limited role that can read the session and every register EXCEPT the
// task register. The authenticated employee therefore reaches the page while
// one read source fails, which is the page-level "unavailable" path. The
// limited role is dropped afterwards; the main environment is untouched.
import { chromium } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4331';
const LIMITED_BASE = 'http://127.0.0.1:4332';
const PHASE = process.argv[2] ?? 'after';
const OUT = `audit/CA-05/${PHASE}`;
mkdirSync(`${OUT}/screens`, { recursive: true });
const prepared = JSON.parse(readFileSync('audit/CA-05/prepared.json', 'utf8'));
const PGBIN = '/opt/homebrew/opt/postgresql@18/bin';
const CONN = `postgresql://qc_owner@localhost:55432/qc_disposable?sslmode=verify-full&sslrootcert=${process.cwd()}/.tmp/pg18/tls/ca.crt`;
const LIMITED_CONN = `postgresql://qc_limited@localhost:55432/qc_disposable?sslmode=verify-full&sslrootcert=${process.cwd()}/.tmp/pg18/tls/ca.crt`;
const out = { phase: PHASE, cases: {}, status: 'PARTIAL' };
const psql = (sql, database = CONN) =>
  execFileSync(`${PGBIN}/psql`, [database, '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C', LANG: 'C' } });

let server = null;
try {
  psql(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qc_limited') THEN
      CREATE ROLE qc_limited LOGIN;
    END IF;
  END $$;`);
  psql(`GRANT USAGE ON SCHEMA qc TO qc_limited;`);
  psql(`GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA qc TO qc_limited;`);
  psql(`REVOKE SELECT ON qc.tasks FROM qc_limited;`);
  out.roleReady = true;

  const env = {
    ...process.env,
    DATABASE_URL: LIMITED_CONN,
    HOST: '127.0.0.1',
    PORT: '4332',
    NODE_ENV: 'development',
  };
  server = spawn(process.execPath, ['node_modules/astro/astro.js', 'dev', '--host', '127.0.0.1', '--port', '4332'], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', (chunk) => out.serverStderr = String(chunk).slice(0, 300));
  await new Promise((resolve) => setTimeout(resolve, 12000));

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL((url) => url.pathname === '/dashboard');
  const cookies = await context.cookies();
  await context.clearCookies();
  await context.addCookies(cookies);

  for (const definition of [
    { id: 'tasks', path: '/tasks' },
    { id: 'receiving-detail', path: new URL(prepared.receivingUrl).pathname },
    { id: 'dashboard', path: '/dashboard' },
  ]) {
    const response = await page.goto(`${LIMITED_BASE}${definition.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const body = (await page.locator('#main-content').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    out.cases[definition.id] = {
      status: response?.status() ?? 0,
      url: page.url(),
      unavailable: /temporarily unavailable|not available|could not be loaded|provider/i.test(body),
      showsZeroCount: /Showing 0 of 0|Total unavailable/.test(body),
      body: body.slice(0, 400),
    };
    await page.screenshot({ path: `${OUT}/screens/${definition.id}-read-outage.png`, fullPage: true }).catch(() => {});
  }
  await browser.close();
  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  process.exitCode = 1;
} finally {
  if (server) {
    server.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  try {
    psql(`REVOKE ALL ON ALL TABLES IN SCHEMA qc FROM qc_limited; DROP ROLE IF EXISTS qc_limited;`);
    out.roleDropped = true;
  } catch (error) {
    out.roleDropError = error.message;
  }
  writeFileSync(`${OUT}/read-outage.json`, JSON.stringify(out, null, 2));
}
console.log(JSON.stringify({ phase: PHASE, status: out.status, error: out.error }));
