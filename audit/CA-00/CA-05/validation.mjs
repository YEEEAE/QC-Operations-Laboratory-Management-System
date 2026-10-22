// CA-05 server-side validation failure probe (enhanced JS path + native path).
// Local disposable PG18 only. Writes nothing: every case must be refused.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4331';
const PHASE = process.argv[2] ?? 'after';
const OUT = `audit/CA-05/${PHASE}`;
mkdirSync(`${OUT}/screens`, { recursive: true });
const out = { phase: PHASE, cases: {}, status: 'PARTIAL' };
const browser = await chromium.launch();

const psql = (sql) =>
  execFileSync(
    '/opt/homebrew/opt/postgresql@18/bin/psql',
    [
      `postgresql://qc_owner@localhost:55432/qc_disposable?sslmode=verify-full&sslrootcert=${process.cwd()}/.tmp/pg18/tls/ca.crt`,
      '-tAc',
      sql,
    ],
    { encoding: 'utf8' },
  ).trim();

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL((url) => url.pathname === '/dashboard');

  // 1. Task creation: whitespace title passes the browser constraint and must
  //    be refused by the server-side domain check.
  await page.goto(`${BASE}/tasks/new`, { waitUntil: 'domcontentloaded' });
  await page.locator('#taskNo').fill('CA05-VALID-003');
  await page.locator('#title').fill(' ');
  await page.locator('button[data-submit]').click();
  await page.waitForFunction(() => {
    const region = document.querySelector('[data-result]');
    return region && region.textContent.trim().length > 0;
  }, null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(300);
  out.cases.taskServerValidation = {
    url: page.url(),
    resultText: (await page.locator('[data-result]').innerText().catch(() => '')).trim(),
    invalidFields: await page.locator('[aria-invalid="true"]').count(),
    fieldErrors: await page.locator('.field-error').allTextContents(),
    recordsWithThatNumber: psql("select count(*) from qc.tasks where task_no = 'CA05-VALID-003'"),
  };
  await page.screenshot({ path: `${OUT}/screens/tasks-new-server-validation.png`, fullPage: true });

  // 2. Receiving creation: whitespace receiving number must be refused too.
  await page.goto(`${BASE}/quarantine/receiving/new`, { waitUntil: 'domcontentloaded' });
  await page.locator('#receivingNo').fill(' ');
  await page.locator('#supplier').fill('CA05 validation supplier');
  await page.locator('#docNo').fill('CA05-DOC-VALID');
  await page.locator('#itemCode').fill('CA05-ITEM-VALID');
  await page.locator('#lot').fill('CA05-LOT-VALID');
  await page.locator('#description').fill('CA-05 server-side validation probe.');
  await page.locator('#qty').fill('5');
  await page.locator('#quantityUnit').selectOption('KG');
  await page.locator('#receivingDate').fill('2026-10-22');
  await page.locator('button[data-submit]').click();
  await page.waitForFunction(() => {
    const region = document.querySelector('[data-result]');
    return region && region.textContent.trim().length > 0;
  }, null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(300);
  out.cases.receivingServerValidation = {
    url: page.url(),
    resultText: (await page.locator('[data-result]').innerText().catch(() => '')).trim(),
    invalidFields: await page.locator('[aria-invalid="true"]').count(),
    fieldErrors: await page.locator('.field-error').allTextContents(),
    recordsWithThatNumber: psql("select count(*) from qc.receiving_items where receiving_no = ' '"),
  };
  await page.screenshot({ path: `${OUT}/screens/receiving-new-server-validation.png`, fullPage: true });

  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}/validation.json`, JSON.stringify(out, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ phase: PHASE, status: out.status, error: out.error }));
