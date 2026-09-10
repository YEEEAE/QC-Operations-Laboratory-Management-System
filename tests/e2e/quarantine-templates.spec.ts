import { expect, test } from '@playwright/test';

test.describe('Quarantine template administration (F-10 / P-06)', () => {
  test('redirects unauthenticated users from the administration lifecycle', async ({ page }) => {
    await page.goto('/quarantine/admin');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fquarantine%2Fadmin/);
  });

  test('states the controlled-lifecycle boundary without exposing mutations', async ({ page }) => {
    await page.goto('/quarantine/admin');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fquarantine%2Fadmin/);
    // The login gate itself must not leak template internals.
    await expect(page.locator('body')).not.toContainText('SUPERSEDED');
  });

  test('gated: authority lifecycle passes on the release candidate', async ({ page }) => {
    const identity = process.env.QC_E2E_LOGIN_IDENTITY;
    const password = process.env.QC_E2E_LOGIN_PASSWORD;
    test.skip(!identity || !password, 'Requires an authorized fixture (no production mutations).');
    await page.goto('/quarantine/admin');
    await expect(page).toHaveURL(/\/quarantine\/admin/);
    // Lifecycle availability ledger with explicit disabled reasons (P-06).
    await expect(page.locator('body')).toContainText('Inspection template versions');
    await expect(page.locator('body')).toContainText('Create template');
  });
});
