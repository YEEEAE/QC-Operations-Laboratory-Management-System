// Local disposable acceptance only. No .env loading, production or provider calls.
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
const connectionString = process.env.QC_TEST_DATABASE_URL;
const url = new URL(connectionString ?? 'http://invalid');
if (url.hostname !== 'localhost' || url.port !== '55432' || url.pathname !== '/qc_test')
  throw new Error('Requires the CA-F-01 disposable localhost:55432/qc_test URL');
const base = 'http://localhost:4321';
const pool = new Pool({ connectionString });
const query = (text, values = []) => pool.query(text, values);
const users = [randomUUID(), randomUUID()];
const sessions = [randomUUID(), randomUUID()];
const findings = [randomUUID(), randomUUID()];
const evidence = { executedAt: new Date().toISOString(), checks: [], fixtures: { users, findings }, boundary: 'Synthetic local browser acceptance, not human UAT or scientific acceptance' };
const check = label => { evidence.checks.push(label); console.log(`PASS ${label}`); };
let browser;
try {
  for (let i = 0; i < users.length; i++) {
    await query(`INSERT INTO qc.users(id,login_identity,display_name,password_hash) VALUES($1,$2,'CA-F-01 browser fixture','test-only')`, [users[i], `caf01-${users[i]}`]);
    await query(`INSERT INTO qc.sessions(user_id,session_token_hash,expires_at) VALUES($1,$2,CURRENT_TIMESTAMP+interval '1 hour')`, [users[i], createHash('sha256').update(sessions[i]).digest('hex')]);
    await query(`INSERT INTO qc.findings(id,finding_no,title,description,state,created_by) VALUES($1,$2,'Populated finding','Observed deviation','VOID',$3)`, [findings[i], `CA-F-01-${i}-${findings[i].slice(0,8)}`, users[i]]);
  }
  const role = randomUUID();
  await query(`INSERT INTO qc.roles(id,code,name) VALUES($1,$2,'Synthetic NCR creator')`, [role, `CAF01-${role}`]);
  await query(`INSERT INTO qc.permissions(code,domain,action,risk_level) VALUES('PERM-NCR-CREATE','QUALITY','CREATE','LOW') ON CONFLICT(code) DO NOTHING`);
  await query(`INSERT INTO qc.role_permissions(role_id,permission_id) SELECT $1,id FROM qc.permissions WHERE code='PERM-NCR-CREATE'`, [role]);
  await query(`INSERT INTO qc.user_roles(user_id,role_id,assigned_by) VALUES($1,$2,$1)`, [users[0], role]);
  await query(`INSERT INTO qc.user_scopes(user_id,scope_kind,assigned_by) VALUES($1,'OWN',$1)`, [users[0]]);
  browser = await chromium.launch({ headless: true });
  await mkdir('audit/CA-F-01/screenshots', { recursive: true });
  const contextFor = async (js, index = 0) => {
    const context = await browser.newContext({ javaScriptEnabled: js, viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: '__Host-qc_session', value: sessions[index], domain: 'localhost', path: '/', secure: true, httpOnly: true, sameSite: 'Strict' }]);
    return context;
  };
  for (const js of [true, false]) {
    const context = await contextFor(js);
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/quality/findings/${findings[0]}`);
    await expect(page.getByRole('link', { name: 'Create NCR', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Create NCR', exact: true }).click();
    await expect(page.locator('select[name="findingId"]')).toHaveValue(findings[0]);
    await expect(page.locator(`option[value="${findings[1]}"]`)).toHaveCount(0);
    await expect(page.locator('input[name="ownerId"]')).toHaveCount(0);
    check(`${js ? 'JS' : 'native'} authorized contextual source and hidden out-of-scope source`);
    const intent = await page.locator('[name="intentId"]').inputValue();
    const ncrNo = `Manual ${randomUUID()}`;
    await page.getByLabel('NCR number', { exact: true }).fill(ncrNo);
    await page.getByLabel('Title', { exact: true }).fill('   ');
    await page.getByLabel('Description', { exact: true }).fill('Browser recorded deviation');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByLabel('NCR number', { exact: true })).toHaveValue(ncrNo);
    await expect(page.locator('[name="intentId"]')).toHaveValue(intent);
    check(`${js ? 'JS' : 'native'} shared server validation retains values and intent`);
    await page.screenshot({ path: `audit/CA-F-01/screenshots/${js ? 'js' : 'native'}-error.png`, fullPage: true });
    await page.getByLabel('Title', { exact: true }).fill('Browser NCR draft');
    await page.getByLabel('Affected item code (optional)').fill('User item');
    await page.getByLabel('Affected lot (optional)').fill('User lot');
    if (js) {
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      }
      await page.screenshot({ path: 'audit/CA-F-01/screenshots/js-populated-320.png', fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
      check('Populated JS form axe zero and no overflow at 1440/768/390/320');
    }
    const post = page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes(js ? '/_actions/ncr.create' : '/quality/ncr/new'));
    await page.getByRole('button', { name: 'Save draft' }).click();
    const response = await post;
    expect(response.status()).toBe(js ? 200 : 303);
    await page.waitForURL(/\/quality\/ncr\/[0-9a-f-]{36}$/);
    const row = (await query('SELECT * FROM qc.ncrs WHERE ncr_no=$1', [ncrNo])).rows;
    expect(row).toHaveLength(1);
    expect(row[0]).toMatchObject({ state: 'DRAFT', owner_id: null, finding_id: findings[0], created_by: users[0], affected_item_code: 'User item', affected_lot: 'User lot' });
    expect((await query('SELECT * FROM qc.audit_events WHERE subject_id=$1 AND action=\'CREATE\'', [row[0].id])).rows).toHaveLength(1);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `audit/CA-F-01/screenshots/${js ? 'js' : 'native'}-committed.png`, fullPage: true });
    check(`${js ? 'JS' : 'native 303'} committed draft/relation/audit and detail navigation`);
    // Actual native replay/conflict/tampered owner requests through the same page.
    const command = { intentId: intent, findingId: findings[0], ncrNo, title: 'Browser NCR draft', description: 'Browser recorded deviation', affectedItemCode: 'User item', affectedLot: 'User lot' };
    const replay = await context.request.post(`${base}/quality/ncr/new`, { headers: { origin: base }, form: command, maxRedirects: 0 });
    expect(replay.status()).toBe(303);
    expect(replay.headers().location).toBe(`/quality/ncr/${row[0].id}`);
    for (const changed of [{ ...command, title: 'Conflicting replay' }, { ...command, ownerId: users[0] }, { ...command, findingId: findings[1], intentId: randomUUID() }, { ...command, findingId: randomUUID(), intentId: randomUUID() }]) {
      const denied = await context.request.post(`${base}/quality/ncr/new`, { headers: { origin: base }, form: changed, maxRedirects: 0 });
      expect(denied.status()).toBe(200);
      expect(await denied.text()).toContain('role="alert"');
    }
    expect((await query('SELECT * FROM qc.ncrs WHERE ncr_no=$1', [ncrNo])).rows).toHaveLength(1);
    expect((await query('SELECT * FROM qc.audit_events WHERE subject_id=$1', [row[0].id])).rows).toHaveLength(1);
    check(`${js ? 'JS-session' : 'native-session'} replay same record; conflict/owner/missing/out-of-scope denied without duplicate audit`);
    await context.close();
  }
  const denied = await contextFor(true, 1);
  const page = await denied.newPage();
  await page.goto(`${base}/quality/ncr/new`);
  await expect(page.getByText('You are not authorized to create NCRs.')).toBeVisible();
  await expect(page.locator('[data-ncr-create]')).toHaveCount(0);
  const result = await page.evaluate(async findingId => {
    const response = await fetch('/_actions/ncr.create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intentId: crypto.randomUUID(), findingId, ncrNo: crypto.randomUUID(), title: 'Denied', description: 'Denied fixture' }) });
    return { status: response.status, body: await response.text() };
  }, findings[1]);
  expect(result.status).toBeGreaterThanOrEqual(400);
  expect(result.body).toContain('AUTHZ_PERMISSION_MISSING');
  check('No-permission actor denied UI and direct action on existing accessible Finding');
  await denied.close();
  const guest = await browser.newContext();
  const guestPost = await guest.request.post(`${base}/quality/ncr/new`, { headers: { origin: base }, form: { title: 'Guest' }, maxRedirects: 0 });
  expect(guestPost.status()).toBe(303);
  expect(guestPost.headers().location).toContain('/login');
  check('Guest native POST redirected without write');
  evidence.status = 'PASS';
} catch (error) {
  evidence.status = 'FAIL'; evidence.failure = String(error); throw error;
} finally {
  await writeFile('audit/CA-F-01/browser-evidence.json', JSON.stringify(evidence, null, 2));
  await browser?.close(); await pool.end();
}
