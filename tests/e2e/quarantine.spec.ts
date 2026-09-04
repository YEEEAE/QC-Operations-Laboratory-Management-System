import { expect, test } from '@playwright/test';

test.describe('Quarantine protected workspaces', () => {
  test('redirects unauthenticated users and does not expose a public inspection creator', async ({ page }) => {
    await page.goto('/quarantine');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fquarantine/);
    await page.goto('/quarantine/inspections/new');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fquarantine%2Finspections%2Fnew/);
  });

  test('keeps the controlled state vocabulary visible in the receiving workspace', async ({ page }) => {
    await page.goto('/quarantine/receiving');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fquarantine%2Freceiving/);
  });
});
