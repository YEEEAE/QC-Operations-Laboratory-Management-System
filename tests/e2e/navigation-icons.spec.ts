import { expect, test, type Page } from '@playwright/test';

const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;
const placeholderGlyphs = /[⌂✓↳▣⚙◌▦⌁◉⇄▥✦◍◈☰◎⌘♥⛁▤●⌕→←↑↓↕‹⌄]/u;
const bannedTerms = /authorized read models?|\bread model\b/i;

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(loginIdentity ?? '');
  await page.getByLabel('Password').fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function expectIconContract(page: Page): Promise<void> {
  for (const icon of await page.locator('svg[aria-hidden="true"]').all()) {
    await expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    await expect(icon).toHaveAttribute('stroke', 'currentColor');
    await expect(icon).toHaveAttribute('stroke-width', '1.8');
    await expect(icon).toHaveAttribute('focusable', 'false');
  }
}

test.describe('unified SVG icon contract', () => {
  test('public login preserves the local SVG accessibility contract', async ({ page }) => {
    await page.goto('/login');
    await expectIconContract(page);
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(placeholderGlyphs);
    expect(text).not.toMatch(bannedTerms);
  });

  test('authenticated shell keeps navigation labels and SVGs through collapse and expansion', async ({
    page,
  }) => {
    test.skip(
      !loginIdentity || !password,
      'QC_E2E_LOGIN_IDENTITY and QC_E2E_PASSWORD are required',
    );
    await signIn(page);
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
    const firstLink = navigation.getByRole('link').first();
    const collapse = page.getByRole('button', { name: /collapse navigation/i });

    await expect(firstLink.locator('svg')).toBeVisible();
    await expect(firstLink.locator('.nav-label')).toBeVisible();
    await collapse.click();
    await expect(collapse).toHaveAttribute('aria-expanded', 'false');
    await expect(firstLink.locator('svg')).toBeVisible();
    await expect(firstLink.locator('.nav-label')).toBeHidden();
    await collapse.click();
    await expect(collapse).toHaveAttribute('aria-expanded', 'true');
    await expect(firstLink.locator('.nav-label')).toBeVisible();
    await expectIconContract(page);
  });

  test('authenticated shell remains usable at 320px, zoom, and forced colors', async ({ page }) => {
    test.skip(
      !loginIdentity || !password,
      'QC_E2E_LOGIN_IDENTITY and QC_E2E_PASSWORD are required',
    );
    await page.setViewportSize({ width: 320, height: 720 });
    await signIn(page);
    const toggle = page.getByRole('button', { name: 'Open navigation' });
    await toggle.click();
    await expect(
      page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link').first(),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(toggle).toBeVisible();
    await expectIconContract(page);
  });
});
