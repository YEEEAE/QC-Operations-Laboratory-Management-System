import { test, expect } from '@playwright/test';

test.describe('Assets workspace route boundaries', () => {
  test('protects the Assets namespace when unauthenticated', async ({ page }) => {
    await page.goto('/assets');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fassets/);
  });

  test('does not expose an unregistered contextual creation route', async ({ page }) => {
    const response = await page.goto('/assets/equipment/00000000-0000-7000-8000-000000000001/calibrations/new');
    expect(response?.status()).toBeGreaterThanOrEqual(300);
  });
});
