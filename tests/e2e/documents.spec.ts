import { expect, test } from '@playwright/test';

test.describe('Controlled Documents workflow boundaries', () => {
  test('protects the controlled document library when unauthenticated', async ({ page }) => {
    await page.goto('/documents');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fdocuments/);
  });

  test('does not expose an effective mutation route', async ({ page }) => {
    await page.goto('/documents/00000000-0000-7000-8000-000000000001/effective');
    await expect(page).toHaveURL(/\/login/);
  });

  test('keeps version and review routes behind authentication', async ({ page }) => {
    await page.goto('/documents/00000000-0000-7000-8000-000000000001/versions/00000000-0000-7000-8000-000000000002/review');
    await expect(page).toHaveURL(/\/login/);
  });
});
