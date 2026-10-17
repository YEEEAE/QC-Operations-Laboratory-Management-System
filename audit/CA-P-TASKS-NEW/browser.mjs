// Local-only authenticated acceptance probe. Run with CA-04/local-run.mjs.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:4331';
const out = { status: 'PARTIAL', checks: [], errors: [] };
const dir = 'audit/CA-P-TASKS-NEW';
mkdirSync(`${dir}/after`, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Riyadh' });
const page = await context.newPage();
page.on('pageerror', e => out.errors.push(e.message));
async function login(page, identity, password) {
  await page.goto(`${base}/login`);
  await page.locator('#loginIdentity').fill(identity);
  await page.locator('#password').fill(password);
  await page.locator('#password').press('Enter');
  await page.waitForURL(url => url.pathname === '/dashboard');
}
try {
  await login(page, 'verify-employee', process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/tasks/new`, { waitUntil: 'networkidle' });
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      columns: getComputedStyle(document.querySelector('[data-task-create]')).gridTemplateColumns,
      fields: [...document.querySelectorAll('[data-task-create] [name]')].map(e => [e.name, e.value, e.type]),
      sidebar: [...document.querySelectorAll('.app-sidebar a')].map(e => [e.textContent, e.getAttribute('href')]),
      sidebarBackground: getComputedStyle(document.querySelector('.app-sidebar')).backgroundColor,
      targets: [...document.querySelectorAll('[data-task-create] input,[data-task-create] select,[data-task-create] textarea,[data-task-create] button,[data-task-create] a')].map(e => ({ id: e.id || e.textContent, height: e.getBoundingClientRect().height })),
    }));
    assert.equal(metrics.overflow, 0);
    assert.equal(metrics.fields.length, 9);
    assert.ok(metrics.targets.every(t => t.height >= 44));
    await page.screenshot({ path: `${dir}/after/${width}.png`, fullPage: true });
    const axe = await new AxeBuilder({ page }).include('#main-content').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations.map(v => v.id)));
    out.checks.push({ width, ...metrics, axeViolations: 0 });
  }
  await page.locator('#taskNo').focus();
  const order = [];
  for (let i = 0; i < 25; i++) {
    order.push(await page.evaluate(() => ({ id: document.activeElement.id, text: document.activeElement.textContent?.trim(), outline: getComputedStyle(document.activeElement).outlineStyle })));
    await page.keyboard.press('Tab');
  }
  const distinct = order.map(e => e.id).filter((id, i, ids) => i === 0 || id !== ids[i - 1]);
  assert.deepEqual(distinct.slice(0, 9), ['taskNo','title','description','priority','dueAt','recordType','recordId','recurrenceRuleId','occurrenceKey']);
  out.keyboard = order;
  await page.locator('[data-submit]').click();
  out.clientValidation = await page.locator('[data-task-create]').evaluate(form => ({
    invalid: [...form.querySelectorAll('[aria-invalid="true"]')].map(e => e.id),
    focus: document.activeElement?.getAttribute('data-error-summary') !== null,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  assert.ok(out.clientValidation.invalid.includes('taskNo'));
  assert.ok(out.clientValidation.invalid.includes('title'));
  assert.equal(out.clientValidation.overflow, 0);
  for (const media of [{ forcedColors: 'active' }, { forcedColors: 'none', reducedMotion: 'reduce' }]) {
    await page.emulateMedia(media);
    await page.setViewportSize({ width: 320, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    out.checks.push({ media, overflow: 0 });
  }
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
  if (!process.argv.includes('--presentation-only')) {
  const native = await browser.newContext({ javaScriptEnabled: false });
  await native.addCookies(await context.cookies());
  const p = await native.newPage();
  await p.goto(`${base}/tasks/new`);
  const taskNo = `CA-P-TASKS-NEW-${Date.now()}`;
  await p.locator('#taskNo').fill(taskNo);
  await p.locator('#title').fill('Local native form acceptance');
  const response = p.waitForResponse(r => r.request().method() === 'POST');
  await p.locator('[data-submit]').click();
  out.nativePostStatus = (await response).status();
  if (out.nativePostStatus !== 303) {
    out.nativeFailure = await p.locator('#main-content').innerText();
    out.retainedValues = await p.locator('[data-task-create]').evaluate(form => [...new FormData(form)]);
  }
  if (out.nativePostStatus === 303) {
    await p.waitForURL(url => /^\/tasks\/[0-9a-f-]+$/.test(url.pathname));
  } else {
    // Reconcile an unknown outcome; never blindly retry a possibly committed command.
    await p.goto(`${base}/tasks?q=${encodeURIComponent(taskNo)}`);
    await p.locator('tbody th a').first().click();
  }
  assert.match(await p.locator('#main-content').innerText(), new RegExp(taskNo));
  out.createdRecord = { taskNo, href: new URL(p.url()).pathname, nativePost: out.nativePostStatus === 303 ? 'PASS' : 'FAIL redirect; reconciled existing record' };
  await native.close();
  }
  const denied = await browser.newContext();
  const d = await denied.newPage();
  await login(d, 'verify-least', process.env.QC_VERIFY_LEAST_PASSWORD);
  await d.goto(`${base}/tasks/new`);
  assert.equal(await d.locator('[data-task-create]').count(), 0);
  assert.match(await d.locator('#main-content').innerText(), /not authorized to create tasks/);
  out.deniedForm = 'PASS (page projection only; no action denial claimed)';
  await denied.close();
  out.status = out.nativePostStatus === 303 ? 'PASS' : 'PARTIAL';
} catch (e) { out.status = 'FAIL'; out.error = e.message; process.exitCode = 1; }
finally { writeFileSync(`${dir}/${process.argv.includes('--presentation-only') ? 'presentation-evidence' : 'browser-evidence'}.json`, JSON.stringify(out, null, 2)); await browser.close(); }
console.log(JSON.stringify({ status: out.status, error: out.error }));
