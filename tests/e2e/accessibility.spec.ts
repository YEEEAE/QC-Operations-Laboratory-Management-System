import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;

function requireAuthenticatedFixture(): void {
  test.skip(
    !loginIdentity || !password,
    'QC_E2E_LOGIN_IDENTITY and QC_E2E_PASSWORD are required for authenticated accessibility coverage',
  );
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(loginIdentity ?? '');
  await page.getByLabel('Password').fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function expectNoAxeViolations(page: Page, surface: string): Promise<void> {
  const result = await new AxeBuilder({ page }).withTags(['wcag22aa']).analyze();
  expect(result.violations, `${surface} has WCAG 2.2 AA violations`).toEqual([]);
}

async function assertKeyboardOrder(
  page: Page,
  labels = { identity: 'Login identity', password: 'Password', submit: 'Sign in' },
): Promise<void> {
  const identity = page.getByLabel(labels.identity);
  const credential = page.getByLabel(labels.password);
  const submit = page.getByRole('button', { name: labels.submit });

  await identity.focus();
  await expect(identity).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(credential).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();

  const focusStyle = await submit.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(
    focusStyle.outlineStyle !== 'none' || focusStyle.outlineWidth !== '0px',
    'the keyboard-focused submit control must have a visible focus treatment',
  ).toBe(true);
}

async function assertTableContracts(page: Page): Promise<void> {
  for (const table of await page.locator('table').all()) {
    await expect(table.locator('caption')).toHaveText(/.+/);
    await expect(table.locator('th')).not.toHaveCount(0);
    const unscopedHeaders = await table.locator('th:not([scope])').count();
    expect(unscopedHeaders, 'table headers must declare their row/column scope').toBe(0);
  }
}

async function assertChartContracts(page: Page): Promise<void> {
  for (const chart of await page.locator('svg[role="img"]').all()) {
    await expect(chart).toHaveAttribute('aria-label', /.+/);
    const figure = chart.locator('xpath=ancestor::figure[1]');
    await expect(figure.locator('table')).toHaveCount(1);
    await expect(figure.locator('table caption')).toHaveText(/.+/);
  }
}

test.describe('WCAG 2.2 AA accessibility baseline', () => {
  test('English login form has an accessible name, keyboard path, and no axe violations', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Login identity')).toHaveAttribute('autocomplete', 'username');
    await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'current-password');
    await expectNoAxeViolations(page, 'English login');
    await assertKeyboardOrder(page);
  });

  test('Arabic RTL login has localized accessible names and no axe violations', async ({
    page,
  }) => {
    await page.goto('/login?locale=ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: 'تسجيل الدخول' })).toBeVisible();
    await expect(page.getByLabel('معرّف الدخول')).toHaveAttribute('autocomplete', 'username');
    await expect(page.getByLabel('كلمة المرور')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    await expectNoAxeViolations(page, 'Arabic RTL login');
    await assertKeyboardOrder(page, {
      identity: 'معرّف الدخول',
      password: 'كلمة المرور',
      submit: 'تسجيل الدخول',
    });
  });

  test('safe 404 surface has a heading, recovery links, and no axe violations', async ({
    page,
  }) => {
    await page.goto('/definitely-not-a-page-master034');
    await expect(page).toHaveTitle(/Page not found/i);
    await expect(page.getByRole('heading', { name: /could not find/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /continue safely/i })).toBeVisible();
    await expectNoAxeViolations(page, 'safe 404');
  });

  test('authenticated operational surfaces cover navigation, forms, tables, chart summaries, status text, and dialogs', async ({
    page,
  }) => {
    requireAuthenticatedFixture();
    await signIn(page);

    for (const path of ['/dashboard', '/tasks', '/reports/quarantine-aging', '/ai-advisory']) {
      const response = await page.goto(path);
      expect(response?.status() ?? 0, path).toBeLessThan(400);
      await expectNoAxeViolations(page, path);
      await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
      await assertTableContracts(page);
      await assertChartContracts(page);

      for (const badge of await page.locator('.status-badge').all()) {
        await expect(badge).toHaveText(/.+/);
      }
      for (const dialog of await page.locator('dialog').all()) {
        const labelledBy = await dialog.getAttribute('aria-labelledby');
        expect(labelledBy, `${path} dialog must have an accessible title`).toBeTruthy();
        await expect(page.locator(`#${labelledBy}`)).toHaveCount(1);
      }
    }
  });

  test('reduced-motion preference is honored on the authenticated shell when fixtures exist', async ({
    page,
  }) => {
    requireAuthenticatedFixture();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signIn(page);
    await page.goto('/dashboard');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
      true,
    );
    const transitionDurations = await page
      .locator('*')
      .evaluateAll((elements) =>
        elements
          .map((element) => getComputedStyle(element).transitionDuration)
          .filter((duration) => duration !== '0s'),
      );
    expect(transitionDurations).toEqual([]);
  });
});
