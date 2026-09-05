import { expect, test } from '@playwright/test';

test.describe('Approvals and e-signature boundaries', () => {
  test('protects the scoped My Approvals queue and detail route', async ({ page }) => {
    await page.goto('/approvals');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fapprovals/);
    await page.goto('/approvals/00000000-0000-7000-0000-000000000001');
    await expect(page).toHaveURL(/\/login/);
  });

  test('does not expose an independent signature route', async ({ page }) => {
    await page.goto('/sign?id=00000000-0000-7000-0000-000000000001');
    await expect(page).toHaveURL(/\/login|\/404/);
  });
});
