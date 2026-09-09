import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'small-mobile', width: 320, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'small-desktop', width: 1024, height: 900 },
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'large-desktop', width: 1440, height: 900 },
] as const;

async function assertNoUnexpectedOverflow(page: import('@playwright/test').Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(overflow.documentWidth, 'document must not overflow horizontally').toBeLessThanOrEqual(
    overflow.viewportWidth + 1,
  );
  expect(overflow.bodyWidth, 'body must not overflow horizontally').toBeLessThanOrEqual(
    overflow.viewportWidth + 1,
  );
}

test.describe('responsive accessibility baseline', () => {
  for (const viewport of viewports) {
    test(`English LTR login reflows at ${viewport.name} (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/login');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByLabel('Login identity')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await assertNoUnexpectedOverflow(page);

      if (viewport.width <= 768) {
        const controls = await page
          .locator('button, input:not([type="hidden"]), select, textarea')
          .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
        expect(
          Math.min(...controls),
          'touch controls must retain a usable target size',
        ).toBeGreaterThanOrEqual(48);
      }
    });
  }

  test('LTR and RTL reflow keep the same content reachable at 200% text zoom', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/login');

    for (const direction of ['ltr', 'rtl'] as const) {
      await page.locator('html').evaluate((html, dir) => html.setAttribute('dir', dir), direction);
      await page.evaluate(() => {
        document.documentElement.style.zoom = '2';
      });
      await assertNoUnexpectedOverflow(page);
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await page.evaluate(() => {
        document.documentElement.style.zoom = '';
      });
    }
  });

  test('English-only login reflow at 400% zoom without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    for (const [path, heading, submit] of [
      ['/login', 'Sign in', 'Sign in'],
      ['/login?locale=ar', 'Sign in', 'Sign in'],
    ] as const) {
      await page.goto(path);
      await page.evaluate(() => {
        document.documentElement.style.zoom = '4';
      });
      await assertNoUnexpectedOverflow(page);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      await expect(page.getByRole('button', { name: submit })).toBeVisible();
      await page.evaluate(() => {
        document.documentElement.style.zoom = '';
      });
    }
  });

  test('portrait and landscape both keep the form usable', async ({ page }) => {
    await page.goto('/login');
    for (const size of [
      { width: 375, height: 812 },
      { width: 812, height: 375 },
    ]) {
      await page.setViewportSize(size);
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      await assertNoUnexpectedOverflow(page);
    }
  });
});
