// CA-05 preparation: authenticated local PG18 only. Credentials arrive from
// audit/CA-04/local-run.mjs allowlist; never read .env and never print secrets.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const BASE = 'http://127.0.0.1:4331';
const OUT = 'audit/CA-05';
mkdirSync(`${OUT}/screens`, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'en-GB',
  timezoneId: 'Asia/Riyadh',
});
const page = await context.newPage();
const out = { base: BASE, node: process.version, checks: [] };

async function login(identity, password) {
  await page.goto(`${BASE}/login`);
  await page.locator('#loginIdentity').fill(identity);
  await page.locator('#password').fill(password);
  await page.locator('#password').press('Enter');
  await page.waitForURL((url) => url.pathname === '/dashboard');
}

try {
  await login('verify-employee', process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  out.login = 'PASS';

  // Existing populated task register; employee scope is OWN, so create one
  // legitimate disposable task through the authorized native form if needed.
  await page.goto(`${BASE}/tasks`, { waitUntil: 'domcontentloaded' });
  let taskRows = await page.locator('tbody tr').count();
  if (!taskRows) {
    await page.goto(`${BASE}/tasks/new`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('form[data-task-create]').count(), 1);
    await page.locator('#taskNo').fill('CA05-TASK-001');
    await page.locator('#title').fill('CA-05 local presentation gate task');
    await page.locator('#description').fill('Disposable local task created through the authorized form for the CA-05 gate.');
    await page.locator('#priority').fill('NORMAL');
    await page.locator('button[data-submit]').click();
    await page.waitForSelector('#main-content');
    out.taskCreateUrl = page.url();
    if (!/\/tasks\/[0-9a-f-]{36}$/.test(new URL(page.url()).pathname)) {
      out.taskCreateResult = 'unconfirmed-200';
      await page.goto(`${BASE}/tasks?q=CA05-TASK-001`, { waitUntil: 'domcontentloaded' });
      const href = await page.locator('tbody th a', { hasText: 'CA05-TASK-001' }).first().getAttribute('href').catch(() => null);
      assert.ok(href, 'created task must be reconcilable in the register');
      out.taskCreateResult = 'created-reconciled';
      out.taskUrl = href;
    } else {
      out.taskCreateResult = 'created-303';
      out.taskUrl = new URL(page.url()).pathname;
    }
    await page.goto(`${BASE}/tasks`, { waitUntil: 'domcontentloaded' });
    taskRows = await page.locator('tbody tr').count();
  }
  out.taskRows = taskRows;
  assert.ok(taskRows > 0, 'populated task register required');

  // Reuse a CA-05 receiving detail if present; otherwise create one through
  // the authorized native form. No direct DB insert and no synthetic record.
  await page.goto(`${BASE}/quarantine/receiving?q=CA05-RCV-001`, { waitUntil: 'domcontentloaded' });
  let receivingHref = await page.locator('tbody th a', { hasText: 'CA05-RCV-001' }).first().getAttribute('href').catch(() => null);
  out.receivingReused = Boolean(receivingHref);

  if (!receivingHref) {
    await page.goto(`${BASE}/quarantine/receiving/new`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('form[data-action="quarantine.createReceiving"]').count(), 1);
    await page.locator('#receivingNo').fill('CA05-RCV-001');
    await page.locator('#supplier').fill('CA05 verification supplier');
    await page.locator('#docNo').fill('CA05-DOC-001');
    await page.locator('#itemCode').fill('CA05-ITEM-001');
    await page.locator('#lot').fill('CA05-LOT-001');
    await page.locator('#description').fill('Local disposable receiving record for CA-05 presentation gate.');
    await page.locator('#qty').fill('10');
    await page.locator('#quantityUnit').selectOption('KG');
    await page.locator('#receivingDate').fill('2026-10-22');
    await page.locator('button[data-submit]').click();
    await page.waitForSelector('#main-content');
    out.createUrl = page.url();
    out.createStatus = await page.evaluate(() => document.body.dataset.status ?? null);
    if (!/\/quarantine\/receiving\/[0-9a-f-]{36}$/.test(new URL(page.url()).pathname)) {
      // The existing shared POST baseline may report "unconfirmed" after a
      // committed write. Reconcile through the authorized register, never retry.
      out.createResult = 'unconfirmed-200';
      await page.goto(`${BASE}/quarantine/receiving?q=CA05-RCV-001`, { waitUntil: 'domcontentloaded' });
      receivingHref = await page.locator('tbody th a', { hasText: 'CA05-RCV-001' }).first().getAttribute('href').catch(() => null);
      assert.ok(receivingHref, 'created receiving record must be reconcilable in the register');
      out.createResult = 'created-reconciled';
    } else {
      receivingHref = new URL(page.url()).pathname;
      out.createResult = 'created-303';
    }
  }

  await page.goto(`${BASE}${receivingHref}`, { waitUntil: 'domcontentloaded' });
  out.receivingUrl = page.url();
  out.receivingHeading = await page.locator('#main-content h1').innerText();
  assert.match(out.receivingHeading, /CA05-RCV-001/);

  // Read current sidebar geometry/content for the permission matrix.
  const sidebar = await page.evaluate(() => {
    const side = document.querySelector('.app-sidebar');
    const links = [...side.querySelectorAll('a')].map((a) => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href'),
      width: Math.round(a.getBoundingClientRect().width * 100) / 100,
      height: Math.round(a.getBoundingClientRect().height * 100) / 100,
    }));
    const rect = side.getBoundingClientRect();
    return {
      background: getComputedStyle(side).backgroundColor,
      color: getComputedStyle(side).color,
      width: Math.round(rect.width * 100) / 100,
      links,
    };
  });
  out.employeeSidebar = sidebar;

  // Same shell, different permissions: least must not receive employee-only links.
  await context.clearCookies();
  await login('verify-least', process.env.QC_VERIFY_LEAST_PASSWORD);
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  const leastSidebar = await page.evaluate(() => ({
    width: Math.round(document.querySelector('.app-sidebar').getBoundingClientRect().width * 100) / 100,
    background: getComputedStyle(document.querySelector('.app-sidebar')).backgroundColor,
    color: getComputedStyle(document.querySelector('.app-sidebar')).color,
    links: [...document.querySelectorAll('.app-sidebar a')].map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
  }));
  out.leastSidebar = leastSidebar;
  out.employeeLinkCount = sidebar.links.length;
  out.leastLinkCount = leastSidebar.links.length;
  assert.ok(out.leastLinkCount <= out.employeeLinkCount);
  assert.equal(leastSidebar.width, sidebar.width);
  assert.equal(leastSidebar.background, sidebar.background);

  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}/prepared.json`, JSON.stringify(out, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ status: out.status, error: out.error, receiving: out.receivingUrl, taskRows: out.taskRows }));
