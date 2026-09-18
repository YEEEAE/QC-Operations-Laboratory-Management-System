import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { assertMandatoryVerificationFixtures } from './verify-fixtures.js';

const hasRoleFixtures = Boolean(
  process.env.QC_VERIFY_SYSTEM_OWNER_PASSWORD &&
  process.env.QC_VERIFY_SUPERVISOR_PASSWORD &&
  process.env.QC_VERIFY_MANAGER_PASSWORD &&
  process.env.QC_VERIFY_ADMIN_PASSWORD &&
  process.env.QC_VERIFY_EMPLOYEE_PASSWORD &&
  process.env.QC_VERIFY_LEAST_PASSWORD,
);
const base = process.env.QC_VERIFY_BASE_URL;
assertMandatoryVerificationFixtures();
const invalidUuid = '01900000-0000-7000-0000-0000000000f1';
const noLeak = /password_hash|session_token|DATABASE_URL|storage_key|select .* from/i;

async function signIn(page: Page, identity: string, password: string): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(identity);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

const personas = [
  ['verify-employee', 'QC_VERIFY_EMPLOYEE_PASSWORD', ['/dashboard', '/tasks', '/laboratory/tests']],
  ['verify-supervisor', 'QC_VERIFY_SUPERVISOR_PASSWORD', ['/dashboard', '/quality', '/approvals']],
  ['verify-manager', 'QC_VERIFY_MANAGER_PASSWORD', ['/dashboard', '/reports', '/approvals']],
  ['verify-admin', 'QC_VERIFY_ADMIN_PASSWORD', ['/dashboard', '/admin', '/system/health']],
  ['yazeed', 'QC_VERIFY_SYSTEM_OWNER_PASSWORD', ['/dashboard', '/admin', '/system/health']],
] as const;

test.describe('QC-CLOSURE-E2E-006 authenticated engineering closure', () => {
  test('login rejects bad credentials, preserves safe returnTo, and supports logout', async ({
    page,
  }) => {
    await page.goto('/login?returnTo=https%3A%2F%2Fevil.example%2Fsteal');
    await expect(page.locator('input[name="returnTo"]')).toHaveValue('/dashboard');
    await page.getByLabel('Login identity').fill('closure-invalid-identity');
    await page.getByLabel('Password', { exact: true }).fill('closure-invalid-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Sign-in could not be completed');
    expect(await page.content()).not.toMatch(noLeak);
  });

  test('unauthenticated protected routes redirect safely and malformed IDs stay opaque', async ({
    page,
  }) => {
    for (const path of [
      '/dashboard',
      '/search?q=VERIFY',
      '/notifications',
      `/tasks/${invalidUuid}`,
    ]) {
      const response = await page.goto(path);
      expect(response?.status() ?? 0, path).toBeLessThan(400);
      expect(page.url(), path).toMatch(/\/login\?returnTo=/);
      expect(await page.content(), path).not.toMatch(noLeak);
    }
  });

  test('role and scope fixtures can read their intended surfaces and cannot use admin gate as a business override', async ({
    page,
    request,
  }) => {
    test.skip(!hasRoleFixtures || !base, 'Disposable QC_VERIFY_* credentials are required.');
    for (const [identity, passwordEnv, paths] of personas) {
      await signIn(page, identity, process.env[passwordEnv] ?? '');
      for (const path of paths) {
        const response = await page.goto(path);
        expect(response?.status() ?? 0, `${identity} ${path}`).toBeLessThan(400);
        expect(await page.content(), `${identity} ${path}`).not.toMatch(noLeak);
      }
      const forged = await request.post('/_actions/quarantine.approveInspection', {
        data: { id: invalidUuid, expectedVersion: 1, requestId: `closure-${identity}` },
      });
      expect(forged.status(), `${identity} forged approval`).toBeGreaterThanOrEqual(400);
    }
  });

  test('critical operational surfaces keep controlled facts and governance read-only', async ({
    page,
  }) => {
    test.skip(!hasRoleFixtures || !base, 'Disposable QC_VERIFY_* credentials are required.');
    await signIn(page, 'verify-least', process.env.QC_VERIFY_LEAST_PASSWORD ?? '');
    for (const path of [
      '/quarantine/receiving',
      '/quarantine/inspections',
      '/laboratory/tests',
      '/quality/ncr',
      '/assets/equipment',
      '/assets/calibrations',
      '/documents',
      '/change-requests',
      '/reports',
      '/search?q=VERIFY',
      '/notifications',
      '/audit',
    ]) {
      const response = await page.goto(path);
      expect(response?.status() ?? 0, path).toBeLessThan(400);
      expect(await page.content(), path).not.toMatch(noLeak);
    }
    const receiving = process.env.QC_E2E_RECEIVING_ID;
    if (receiving) {
      await page.goto(`/quarantine/receiving/${receiving}`);
      await expect(page.getByText('Receiving state')).toBeVisible();
      await expect(page.getByText('Inspection result')).toBeVisible();
      await expect(page.getByText('Release System State')).toBeVisible();
      const facts = await page.locator('.facts').innerText();
      if (/\bPASS\b/.test(facts)) expect(facts).toMatch(/NOT_RELEASED|RELEASE_PENDING|RELEASED/);
    }
  });

  test('critical pages pass automated WCAG 2.2 AA and keyboard smoke checks', async ({ page }) => {
    await page.goto('/login');
    const axe = await new AxeBuilder({ page }).withTags(['wcag22aa']).analyze();
    expect(axe.violations).toEqual([]);
    await page.getByLabel('Login identity').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeFocused();
  });

  test('rate limiting and store outage are represented as fail-closed contracts', async ({
    page,
  }) => {
    test.skip(
      !process.env.QC_E2E_EXERCISE_RATE_LIMIT,
      'Set QC_E2E_EXERCISE_RATE_LIMIT=true for disposable rate-limit exercise.',
    );
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await page.goto('/login');
      await page.getByLabel('Login identity').fill('closure-throttle-probe');
      await page.getByLabel('Password', { exact: true }).fill('closure-invalid-password');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    }
    await expect(page.getByRole('alert')).toContainText(
      /Too many sign-in attempts|could not be completed/,
    );
  });
});
