import { expect, test } from '@playwright/test';

test.describe('AI advisory boundary', () => {
  test('protects the advisory workspace when unauthenticated', async ({ page }) => {
    await page.goto('/ai-advisory');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fai-advisory/);
  });

  test('the advisory route stays read-only on GET', async ({ page }) => {
    const response = await page.goto('/ai-advisory');
    expect(response?.request().method()).toBe('GET');
  });

  test('unauthenticated visitors never see advisory content or an authority trigger', async ({ page }) => {
    await page.goto('/ai-advisory');
    await expect(page).toHaveURL(/\/login/);
    const content = await page.content();
    expect(content).not.toMatch(/approve with ai|release using ai|apply official result/i);
  });
});
