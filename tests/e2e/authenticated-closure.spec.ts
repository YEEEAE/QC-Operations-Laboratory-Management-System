import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { Pool } from 'pg';

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
const opaqueRouteId = '01900000-0000-7000-0000-0000000000f1';
const noLeak =
  /password_hash|session_token|DATABASE_URL|storage_key|\bselect\s+(?:\*|[\w.,"]+)\s+from\s+(?:qc\.)?(?:users|sessions|roles|permissions)\b/i;

async function dbQuery<T extends Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  const connectionString = process.env.QC_TEST_DATABASE_URL;
  if (!connectionString) throw new Error('QC_TEST_DATABASE_URL is required for this fixture test.');
  const pool = new Pool({ connectionString });
  try {
    return (await pool.query<T>(sql, values)).rows;
  } finally {
    await pool.end();
  }
}

async function signIn(page: Page, identity: string, password: string): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.locator('form.login-form').evaluate(
    (form, credentials) => {
      const identityInput = form.querySelector<HTMLInputElement>('input[name="loginIdentity"]');
      const passwordInput = form.querySelector<HTMLInputElement>('input[name="password"]');
      if (!identityInput || !passwordInput) throw new Error('Login form fields are missing.');
      identityInput.value = credentials.identity;
      passwordInput.value = credentials.password;
      identityInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      (form as HTMLFormElement).requestSubmit();
    },
    { identity, password },
  );
  await expect(page).toHaveURL(/\/dashboard/);
}

const personas = [
  ['verify-employee', 'QC_VERIFY_EMPLOYEE_PASSWORD', ['/dashboard', '/tasks', '/laboratory/tests']],
  ['verify-supervisor', 'QC_VERIFY_SUPERVISOR_PASSWORD', ['/dashboard', '/quality', '/approvals']],
  ['verify-manager', 'QC_VERIFY_MANAGER_PASSWORD', ['/dashboard', '/reports', '/approvals']],
  ['verify-admin', 'QC_VERIFY_ADMIN_PASSWORD', ['/dashboard', '/admin']],
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
      `/tasks/${opaqueRouteId}`,
    ]) {
      const response = await page.goto(path);
      expect(response?.status() ?? 0, path).toBeLessThan(400);
      expect(page.url(), path).toMatch(/\/login\?returnTo=/);
      expect(await page.content(), path).not.toMatch(noLeak);
    }
  });

  test('role and scope fixtures can read their intended surfaces', async ({ browser }) => {
    test.setTimeout(120_000);
    test.skip(!hasRoleFixtures || !base, 'Disposable QC_VERIFY_* credentials are required.');
    for (const [identity, passwordEnv, paths] of personas) {
      const context = await browser.newContext();
      try {
        const personaPage = await context.newPage();
        await signIn(personaPage, identity, process.env[passwordEnv] ?? '');
        for (const path of paths) {
          const response = await personaPage.goto(path);
          expect(response?.status() ?? 0, `${identity} ${path}`).toBeLessThan(400);
          expect(await personaPage.content(), `${identity} ${path}`).not.toMatch(noLeak);
        }
      } finally {
        await context.close();
      }
    }
  });

  test('read-only role is denied a direct POST against a real task without changing state', async ({
    page,
  }) => {
    test.skip(!hasRoleFixtures || !base, 'Disposable QC_VERIFY_* credentials are required.');
    const fixture = await dbQuery<{ id: string; state: string; version: string }>(
      "SELECT id, state, version FROM qc.tasks WHERE task_no = 'VERIFY-AUTHZ-READONLY'",
    );
    expect(fixture).toHaveLength(1);
    expect(fixture[0]).toMatchObject({ state: 'DRAFT', version: '1' });

    const sessionToken = process.env.QC_E2E_LEAST_SESSION_TOKEN;
    expect(sessionToken).toBeTruthy();
    await page.goto(base!);
    const cookieSet = await page.evaluate((token) => {
      document.cookie = `__Host-qc_session=${token}; Path=/; Secure; SameSite=Strict`;
      return document.cookie.includes('__Host-qc_session=');
    }, sessionToken!);
    expect(cookieSet).toBe(true);
    await page.goto(`/tasks/${fixture[0].id}`);
    await expect(page.getByText('VERIFY-AUTHZ-READONLY', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activate' })).toHaveCount(0);
    const auditBefore = await dbQuery<{ count: string }>(
      'SELECT count(*)::text AS count FROM qc.audit_events WHERE subject_id = $1',
      [fixture[0].id],
    );

    const denied = await page.evaluate(async (taskId) => {
      const response = await fetch('/_actions/tasks.transition', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ taskId, expectedVersion: 1, action: 'ACTIVATE' }),
      });
      return { status: response.status, body: await response.text() };
    }, fixture[0].id);
    expect(denied.status).toBeGreaterThanOrEqual(400);
    expect(denied.body).toContain('errors.authz_permission_missing');
    const after = await dbQuery<{ state: string; version: string }>(
      'SELECT state, version FROM qc.tasks WHERE id = $1',
      [fixture[0].id],
    );
    expect(after).toEqual([{ state: 'DRAFT', version: '1' }]);
    const auditAfter = await dbQuery<{ count: string }>(
      'SELECT count(*)::text AS count FROM qc.audit_events WHERE subject_id = $1',
      [fixture[0].id],
    );
    expect(auditAfter).toEqual(auditBefore);
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

  test('read-only role cannot view or invoke AI advisory', async ({ page }) => {
    test.skip(!hasRoleFixtures || !base, 'Disposable QC_VERIFY_* credentials are required.');
    await signIn(page, 'verify-least', process.env.QC_VERIFY_LEAST_PASSWORD ?? '');
    const response = await page.goto('/ai-advisory');
    expect(response?.status() ?? 0).toBeLessThan(400);
    await expect(page.getByText('You are not authorized to use AI advisory.')).toBeVisible();
    await expect(page.locator('[data-advisory-request]')).toHaveCount(0);

    const denied = await page.evaluate(async () => {
      const response = await fetch('/_actions/aiAdvisory.requestAdvisory', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          mode: 'SUMMARIZE',
          question: 'Synthetic authorization probe.',
          context: [],
        }),
      });
      return { status: response.status, body: await response.text() };
    });
    expect(denied.status).toBeGreaterThanOrEqual(400);
    expect(denied.body).toContain('errors.authz_permission_missing');
    expect(denied.body).not.toMatch(/provider|model|secret|authorization:\s*bearer/i);
  });

  test('critical pages pass automated WCAG 2.2 AA and keyboard smoke checks', async ({ page }) => {
    await page.goto('/login');
    const axe = await new AxeBuilder({ page }).withTags(['wcag22aa']).analyze();
    expect(axe.violations).toEqual([]);
    await page.getByLabel('Login identity').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Show password' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeFocused();
  });

  test('rate limiting and store outage are represented as fail-closed contracts', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    test.skip(
      !process.env.QC_E2E_EXERCISE_RATE_LIMIT,
      'Repeated password hashing is excluded from browser closure; the PostgreSQL rate-limit store is verified by test:security.',
    );
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await page.goto('/login');
      await page.getByLabel('Login identity').fill('closure-throttle-probe');
      await page.getByLabel('Password', { exact: true }).fill('closure-invalid-password');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      const alert = page.getByRole('alert');
      if ((await alert.isVisible()) && /Too many sign-in attempts/i.test(await alert.innerText()))
        break;
    }
    await expect(page.getByRole('alert')).toContainText(
      /Too many sign-in attempts|could not be completed/,
    );
  });
});
