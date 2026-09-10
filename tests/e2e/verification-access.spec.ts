import { expect, test, type Page } from '@playwright/test';

/**
 * Prompt 13 / C-12 authenticated verification (gated).
 *
 * Runs only when every QC_VERIFY_* password env var is present; otherwise the
 * whole suite skips without touching production. Credentials are read from the
 * environment per attempt and never logged, screenshotted, or asserted upon.
 * No business mutation is submitted: negative checks use direct navigation and
 * forged action posts that must be rejected server-side.
 */

const REQUIRED_ENV = [
  'QC_VERIFY_BASE_URL',
  'QC_VERIFY_SYSTEM_OWNER_PASSWORD',
  'QC_VERIFY_SUPERVISOR_PASSWORD',
  'QC_VERIFY_MANAGER_PASSWORD',
  'QC_VERIFY_ADMIN_PASSWORD',
  'QC_VERIFY_EMPLOYEE_PASSWORD',
  'QC_VERIFY_LEAST_PASSWORD',
] as const;

const SUBSTITUTED_UUID = '01900000-0000-7000-0000-0000000000f1';
const hasFixtures = REQUIRED_ENV.every((name) => Boolean(process.env[name]));

async function signIn(page: Page, identity: string, password: string) {
  await page.goto(`${process.env.QC_VERIFY_BASE_URL}/login`);
  await page.getByLabel(/identity|username|email/i).fill(identity);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('C-12 role fixtures: positive access and server-side denial', () => {
  test.skip(!hasFixtures, 'QC_VERIFY_* fixtures are absent; C-12 stays NOT VERIFIED.');

  test('least-privileged fixture reads operational pages but is denied admin/health/audit routes', async ({
    page,
  }) => {
    const base = String(process.env.QC_VERIFY_BASE_URL);
    await signIn(page, 'verify-least', String(process.env.QC_VERIFY_LEAST_PASSWORD));
    for (const path of ['/dashboard', '/tasks', '/change-requests']) {
      await page.goto(`${base}${path}`);
      await expect(page, `${path} must stay readable`).not.toHaveURL(/\/login/);
    }
    for (const path of ['/admin', '/admin/users', '/system/health', '/audit']) {
      await page.goto(`${base}${path}`);
      const body = await page.content();
      expect(body, `${path} must not leak controlled data`).not.toMatch(
        /password_hash|session_token|RELEASED|inspection_result/,
      );
    }
    await page.goto(`${base}/tasks/${SUBSTITUTED_UUID}`);
    expect(await page.content()).not.toMatch(/password_hash|session_token/);
  });

  test('admin-only fixture cannot forge a business approval through the actions endpoint', async ({
    page,
    request,
  }) => {
    const base = String(process.env.QC_VERIFY_BASE_URL);
    await signIn(page, 'verify-admin', String(process.env.QC_VERIFY_ADMIN_PASSWORD));
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
    const response = await request.post(`${base}/_actions/quarantine.approveInspection`, {
      headers: { cookie: cookieHeader, origin: base },
      data: { id: SUBSTITUTED_UUID, expectedVersion: 1, requestId: 'c12-forged-approval' },
    });
    expect(response.status(), 'forged approval must be rejected').toBeGreaterThanOrEqual(400);
    expect(await response.text()).not.toMatch(/password_hash|session_token/);
  });
});
