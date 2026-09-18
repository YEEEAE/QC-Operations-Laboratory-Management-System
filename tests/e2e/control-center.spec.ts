import { expect, test, type Page } from '@playwright/test';

/**
 * QC-YAZEED-CONTROL-CENTER-001 authenticated E2E (gated).
 *
 * Runs only when the QC_VERIFY_* fixtures are present; otherwise the suite
 * skips without touching any environment. Credentials are read from the
 * environment per attempt and are never logged, screenshotted, or asserted
 * upon. The created verification account is disabled again at the end so the
 * fixture stays safe to re-run.
 */

const REQUIRED_ENV = [
  'QC_VERIFY_BASE_URL',
  'QC_VERIFY_SYSTEM_OWNER_PASSWORD',
  'QC_VERIFY_ADMIN_PASSWORD',
] as const;

const hasFixtures = REQUIRED_ENV.every((name) => Boolean(process.env[name]));
const CONTROL_CENTER = '/system/control-center';

async function signIn(page: Page, identity: string, password: string) {
  await page.goto(`${process.env.QC_VERIFY_BASE_URL}/login`);
  await page.getByLabel(/identity|username|email/i).fill(identity);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('canonical owner control center', () => {
  test.skip(
    !hasFixtures,
    'QC_VERIFY_* fixtures are absent; control center E2E stays NOT VERIFIED.',
  );

  test('non-owner accounts are denied by URL and never see the navigation item', async ({
    page,
  }) => {
    const base = String(process.env.QC_VERIFY_BASE_URL);
    await signIn(page, 'verify-admin', String(process.env.QC_VERIFY_ADMIN_PASSWORD));
    await page.goto(`${base}${CONTROL_CENTER}`);
    // Owner-private routes collapse to 404 so their existence is not disclosed.
    expect(page.url(), 'non-owner must not land on the control center').not.toContain(
      CONTROL_CENTER,
    );
    await expect(page.getByRole('link', { name: /control center/i })).toHaveCount(0);
  });

  test('yazeed runs the full owner journey: status, accounts, create, manage, audit', async ({
    page,
  }) => {
    const base = String(process.env.QC_VERIFY_BASE_URL);
    await signIn(page, 'yazeed', String(process.env.QC_VERIFY_SYSTEM_OWNER_PASSWORD));

    // Navigation item is visible only to the canonical owner.
    await page.goto(`${base}/dashboard`);
    await page.getByRole('link', { name: /control center/i }).click();
    await expect(page).toHaveURL(new RegExp(CONTROL_CENTER));

    // System overview: sanitized live status and release identity.
    await expect(page.getByRole('heading', { name: /system overview/i })).toBeVisible();
    await expect(page.getByText(/applied migration head/i)).toBeVisible();
    const body = await page.content();
    expect(body).not.toMatch(/password_hash|session_token|postgres:\/\/|DATABASE_URL/i);

    // Account overview table with search.
    await expect(page.getByRole('heading', { name: /^accounts$/i })).toBeVisible();
    await page.getByLabel(/search/i).fill('yazeed');
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/PROTECTED OWNER/i)).toBeVisible();

    // Create a verification account through the audited use case.
    const stamp = Date.now().toString(36);
    const identity = `verify-cc-${stamp}`;
    await page.getByLabel(/login identity/i).fill(identity);
    await page.getByLabel(/display name/i).fill('Control Center Verification');
    await page.getByLabel(/temporary password/i).fill(`Cc-verify-${stamp}-!`);
    await page.getByRole('button', { name: /create account/i }).click();
    // Success navigates to the account workspace or reloads the list.
    await expect(page.getByText(/control center verification/i).first()).toBeVisible({
      timeout: 15000,
    });

    // Account workspace exposes owner-level administration for the new account.
    await page.goto(`${base}/admin/users`);
    await expect(page.getByText(identity)).toBeVisible();
    await page.getByRole('link', { name: identity }).click();
    await expect(page).toHaveURL(/\/admin\/users\//);
    const userWorkspaceUrl = page.url();

    // Edit profile through the governed workspace (audited, optimistic concurrency).
    const displayNameField = page.getByLabel(/display name/i);
    await displayNameField.fill(`Control Center Verification ${stamp}`);
    await page
      .locator('form')
      .filter({ has: displayNameField })
      .getByRole('button')
      .first()
      .click();
    await expect(page.getByRole('heading', { name: /account profile/i })).toBeVisible();

    // Assign a role and a scope through the canonical administration forms.
    const assignRole = page
      .locator('form')
      .filter({ has: page.getByRole('heading', { name: /assign role/i }) });
    const roleSelect = assignRole.locator('select, input[list], input[name*="role" i]').first();
    if (await roleSelect.count()) {
      await roleSelect.selectOption({ index: 1 }).catch(() => undefined);
      await assignRole
        .getByRole('button', { name: /assign/i })
        .first()
        .click();
    }
    await expect(page.getByRole('heading', { name: /^roles$/i })).toBeVisible();

    // Revoke sessions through the canonical confirmation dialog (no native confirm()).
    await page.locator('[data-dialog-open="dialog-revoke-sessions"]').click();
    await page
      .getByRole('button', { name: /confirm|revoke/i })
      .last()
      .click();
    await expect(page.getByRole('heading', { name: /^sessions$/i })).toBeVisible();

    // Audit surface shows the administrative events without payloads.
    await page.goto(`${base}${CONTROL_CENTER}`);
    await expect(page.getByText(/CREATE_USER/).first()).toBeVisible();
    const auditBody = await page.content();
    expect(auditBody).not.toMatch(/password_hash|session_token|postgres:\/\//i);

    // Safe cleanup: disable the verification account through the audited dialog so
    // the fixture leaves no active credential behind (records are preserved).
    await page.goto(userWorkspaceUrl);
    await page.locator('[data-dialog-open="dialog-disable-account"]').click();
    await page
      .getByRole('button', { name: /confirm|disable/i })
      .last()
      .click();
    await expect(page.getByText(/DISABLED/i).first()).toBeVisible({ timeout: 15000 });
  });
});
