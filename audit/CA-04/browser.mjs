import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Pool } from 'pg';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:4331';
const url = new URL(process.env.DATABASE_URL ?? '');
assert.equal(url.hostname, 'localhost');
assert.equal(url.port, '55432');
assert.equal(url.pathname, '/qc_disposable');
const pool = new Pool({ connectionString: url.href });
const browser = await chromium.launch({ headless: true });
const output = { task: 'CA-04', evidence: 'actual production route components against disposable PG18; no provider mocks', checks: [], pageErrors: [] };
mkdirSync('audit/CA-04/screenshots', { recursive: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
const page = await context.newPage();
page.on('pageerror', (error) => output.pageErrors.push(error.message));
async function login(target, identity = 'verify-employee', password = process.env.QC_VERIFY_EMPLOYEE_PASSWORD) {
  await target.goto(`${base}/login`);
  await target.locator('#loginIdentity').fill(identity);
  await target.locator('#password').fill(password);
  // Keyboard submission also exercises the native baseline and avoids waiting
  // for the independent animated login background to become pointer-stable.
  await target.locator('#password').press('Enter');
  await target.waitForURL(/\/dashboard/);
}
async function capture(path, label, selector) {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    await page.locator(selector).first().waitFor();
    const metric = await page.evaluate((selector) => {
      const sb = document.querySelector('.app-sidebar');
      const style = sb && getComputedStyle(sb);
      return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        controls: [...document.querySelectorAll(selector)].map((el) => ({ text: el.textContent.trim(), height: el.getBoundingClientRect().height, href: el.getAttribute('href') })),
        sidebar: { background: style?.backgroundColor, links: sb?.querySelectorAll('a').length, color: style?.color },
        heading: document.querySelector('h1')?.textContent,
      };
    }, selector);
    assert.equal(metric.overflow, 0, `${label}@${width} global overflow`);
    for (const control of metric.controls) assert.ok(control.height >= 44, `${label}: target below 44px`);
    const screenshot = `audit/CA-04/screenshots/${label}-${width}.png`;
    if ([320, 1440].includes(width)) await page.screenshot({ path: screenshot, fullPage: true });
    output.checks.push({ label, path, width, ...metric, screenshot: [320, 1440].includes(width) ? screenshot : null });
  }
  const axe = await new AxeBuilder({ page }).include('#main-content').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  output.checks.push({ label, axe: axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })) });
  assert.equal(axe.violations.length, 0, `${label}: axe violations`);
}
try {
  // Fixture-only notification rows; no production accounts or business approvals.
  await pool.query(`INSERT INTO qc.tasks (task_no,title,description,priority,state,created_by,updated_by)
    SELECT 'VERIFY-CA04-TASK','CA04 presentation fixture','Disposable presentation fixture only','NORMAL','DRAFT',id,id
    FROM qc.users WHERE login_identity='verify-employee' ON CONFLICT (task_no) DO NOTHING`);
  await pool.query(`INSERT INTO qc.notifications (recipient_user_id,notification_type,severity,title,message,dedupe_key)
    SELECT u.id,'CA04_TEST','INFO','VERIFY-CA04 notification ' || i,'Presentation fixture only','ca04-' || i
    FROM qc.users u CROSS JOIN generate_series(1,51) i WHERE u.login_identity='verify-employee'
    AND NOT EXISTS (SELECT 1 FROM qc.notifications n WHERE n.dedupe_key='ca04-' || i)`);
  await login(page);
  await capture('/tasks', 'tasks-pagination', '.pagination .page-link');
  await capture('/notifications?unread=1', 'notifications-pagination', '.pagination .page-link');
  const next = page.locator('.pagination a[rel="next"]');
  const href = await next.getAttribute('href');
  assert.equal(new URL(href, base).searchParams.get('unread'), '1');
  await next.click();
  await page.waitForURL(/page=2/);
  assert.match(await page.locator('.bounded-label').innerText(), /51–51 of 51/);
  output.checks.push({ label: 'pagination-native-link-preserves-filter', status: 'PASS' });
  const longSearch = 'LongUnbrokenSearchValue'.repeat(9);
  await capture(`/tasks?q=${longSearch}`, 'tasks-long-filter', '.applied-filters a');
  assert.equal(await page.locator('.applied-filters').count(), 1);
  assert.match(await page.locator('.empty h2').innerText(), /No tasks match/);
  await capture(`/laboratory/tests?q=${longSearch}`, 'laboratory-long-filter', '.applied-filters a');
  assert.equal(await page.locator('.applied-filters').count(), 1);
  assert.match(await page.locator('#main-content').innerText(), /No laboratory tests match/);
  await page.locator('[data-applied-filters] a').first().focus();
  const focus = await page.locator('[data-applied-filters] a').first().evaluate((element) => ({
    active: document.activeElement === element,
    outline: getComputedStyle(element).outlineStyle,
    width: getComputedStyle(element).outlineWidth,
  }));
  assert.equal(focus.active, true);
  assert.notEqual(focus.outline, 'none');
  assert.notEqual(focus.width, '0px');
  output.checks.push({ label: 'chip-keyboard-focus', ...focus, status: 'PASS' });
  for (const media of [{ forcedColors: 'active' }, { reducedMotion: 'reduce' }]) {
    await page.emulateMedia(media);
    await page.setViewportSize({ width: 320, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    output.checks.push({ label: 'long-chip-media', media, status: 'PASS' });
  }
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
  // PostgreSQL fault fixture affects reads only; sessions/users remain available.
  // Always restore the two names in finally, even when a browser assertion fails.
  for (const table of ['tasks', 'lab_tests']) {
    await pool.query(`ALTER TABLE qc.${table} RENAME TO ca04_fault_${table}`);
    try {
      const path = table === 'tasks' ? '/tasks' : '/laboratory/tests';
      await capture(path, `${table}-unavailable`, '.unavailable a');
      assert.equal(await page.locator('.pagination').count(), 0);
      assert.equal(await page.locator('.empty').count(), 0);
      output.checks.push({ label: `${table}-unavailable-not-empty-or-zero`, status: 'PASS' });
    } finally { await pool.query(`ALTER TABLE qc.ca04_fault_${table} RENAME TO ${table}`); }
  }
  // Native GET and pagination remain usable when JavaScript is disabled.
  const native = await browser.newContext({ javaScriptEnabled: false });
  const nativePage = await native.newPage();
  await login(nativePage);
  await nativePage.goto(`${base}/tasks`);
  await nativePage.locator('#q').fill('no-ca04-match');
  await nativePage.locator('form[role="search"] button[type="submit"]').click();
  await nativePage.waitForURL(/q=no-ca04-match/);
  assert.match(await nativePage.locator('.empty h2').innerText(), /No tasks match/);
  await nativePage.locator('.applied-filters .clear-filters').click();
  await nativePage.waitForURL(`${base}/tasks`);
  assert.ok(await nativePage.locator('table a[href^="/tasks/"]').count());
  await nativePage.goto(`${base}/notifications?unread=1`);
  await nativePage.locator('.pagination a[rel="next"]').click();
  await nativePage.waitForURL(/page=2/);
  assert.match(await nativePage.locator('.bounded-label').innerText(), /51–51 of 51/);
  output.checks.push({ label: 'no-JS-login-native-GET-chip-clear-pagination', status: 'PASS' });
  await native.close();
  const least = await browser.newContext();
  const leastPage = await least.newPage();
  await login(leastPage, 'verify-least', process.env.QC_VERIFY_LEAST_PASSWORD);
  await leastPage.goto(`${base}/tasks`);
  assert.equal(await leastPage.locator('a[href="/tasks/new"]').count(), 0);
  const existing = leastPage.getByRole('link', { name: 'VERIFY-AUTHZ-READONLY', exact: true });
  assert.ok(await existing.count());
  await existing.click();
  assert.match(await leastPage.locator('#main-content').innerText(), /VERIFY-AUTHZ-READONLY/);
  const denied = await leastPage.goto(`${base}/system/health`);
  assert.equal(denied.status(), 404);
  output.checks.push({ label: 'least-existing-record-and-owner-route-404', status: 'PASS', note: 'Read/visibility check, not a mutation authorization test.' });
  await least.close();
  assert.equal(output.pageErrors.length, 0);
  output.state = 'PASS';
} catch (error) {
  output.state = 'FAIL'; output.error = error.message;
  process.exitCode = 1;
} finally {
  writeFileSync('audit/CA-04/browser-evidence.json', JSON.stringify(output, null, 2) + '\n');
  await context.close(); await browser.close(); await pool.end();
}
console.log(JSON.stringify({ state: output.state, checks: output.checks.length, pageErrors: output.pageErrors, error: output.error }));
