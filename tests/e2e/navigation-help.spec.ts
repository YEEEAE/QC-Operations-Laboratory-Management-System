import { expect, test } from '@playwright/test';

test.describe('authenticated navigation and operating guide', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.QC_E2E_LOGIN_IDENTITY || !process.env.QC_E2E_PASSWORD,
      'Authenticated disposable fixture credentials are required',
    );
    await page.goto('/login');
    await page.getByLabel('Login identity').fill(process.env.QC_E2E_LOGIN_IDENTITY!);
    await page.getByLabel('Password', { exact: true }).fill(process.env.QC_E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('opens the actual palette, filters pages and restores keyboard focus', async ({ page }) => {
    const trigger = page.locator('[data-command-trigger]');
    await trigger.focus();
    await page.keyboard.press('Control+k');
    const dialog = page.locator('[data-command-palette]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-command-query]')).toBeFocused();
    await dialog.locator('[data-command-query]').fill('laboratory');
    await expect(dialog.locator('[data-command-item]:visible')).not.toHaveCount(0);
    await expect(dialog.locator('[data-command-item]:visible').first()).toContainText(
      /laboratory/i,
    );
    await page.keyboard.press('ArrowDown');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('filters navigation and restores expanded sections after reload', async ({ page }) => {
    const filter = page.locator('[data-navigation-filter]');
    await filter.fill('calibration');
    await expect(page.locator('.nav-groups .nav-link:visible')).toHaveCount(1);
    await expect(page.locator('.nav-groups .nav-link:visible')).toHaveText('Calibration records');
    await page.keyboard.press('Escape');
    const quality = page.locator('[data-section-id="quality"]');
    if ((await quality.getAttribute('aria-expanded')) === 'false') await quality.click();
    await page.reload();
    await expect(quality).toHaveAttribute('aria-expanded', 'true');
  });

  test('searches guide sections and clears empty results', async ({ page }) => {
    await page.goto('/help');
    const query = page.locator('[data-help-query]');
    await query.fill('unmatchable-guide-query');
    await expect(page.locator('[data-help-section]:visible')).toHaveCount(0);
    await expect(page.locator('[data-help-search-status]')).toHaveText('0 matching sections');
    await query.fill('');
    await expect(page.locator('[data-help-section]:visible')).toHaveCount(6);
  });

  test('keeps native GET and live filtering equal for actual heading and instruction words', async ({
    page,
    browser,
  }) => {
    const nativeContext = await browser.newContext({
      javaScriptEnabled: false,
      storageState: await page.context().storageState(),
    });
    try {
      const native = await nativeContext.newPage();
      for (const term of ['second', 'permission', 'Service interruption']) {
        await native.goto(new URL(`/help?q=${encodeURIComponent(term)}`, page.url()).href);
        const serverSections = await native
          .locator('[data-help-section]:visible')
          .evaluateAll((sections) => sections.map((section) => section.id));
        await page.goto('/help');
        await page.locator('[data-help-query]').fill(term);
        const clientSections = await page
          .locator('[data-help-section]:visible')
          .evaluateAll((sections) => sections.map((section) => section.id));
        expect(clientSections).toEqual(serverSections);
        if (term === 'second') {
          await expect(native.locator('#interruption')).toBeVisible();
          await expect(native.locator('#interruption h2')).toHaveText('Service interruption');
          await expect(native.locator('#interruption')).toContainText('second channel');
        }
      }
    } finally {
      await nativeContext.close();
    }
  });
});
