import { expect, test } from '@playwright/test';

test.describe('Change Request governance boundaries', () => {
  test('protects the register and draft route when unauthenticated', async ({ page }) => {
    await page.goto('/change-requests');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fchange-requests/);
    await page.goto('/change-requests/new');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fchange-requests%2Fnew/);
  });

  test('protects record and explicit review routes', async ({ page }) => {
    await page.goto('/change-requests/00000000-0000-7000-8000-000000000001');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/change-requests/00000000-0000-7000-8000-000000000001/review');
    await expect(page).toHaveURL(/\/login/);
  });

  test('keeps the GET record route read-only', async ({ page }) => {
    const response = await page.goto('/change-requests/00000000-0000-7000-8000-000000000001');
    expect(response?.request().method()).toBe('GET');
  });
});
