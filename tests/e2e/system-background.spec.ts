import { expect, test } from '@playwright/test';

test.describe('self-hosted system background', () => {
  test('keeps the login content above a non-interactive local background without external requests', async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin !== 'http://127.0.0.1:4321') externalRequests.push(request.url());
    });

    await page.goto('/login');
    await expect(page.locator('[data-system-background]')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('[data-system-background]')).toHaveCSS('pointer-events', 'none');
    await expect(page.locator('[data-system-background]')).toHaveCSS('position', 'fixed');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    const layering = await page.evaluate(() => {
      const background = document.querySelector<HTMLElement>('[data-system-background]');
      const content = document.querySelector<HTMLElement>('.system-content');
      return {
        background: Number(getComputedStyle(background!).zIndex),
        content: Number(getComputedStyle(content!).zIndex),
      };
    });
    expect(layering.content).toBeGreaterThan(layering.background);
    await expect(page.locator('[data-system-background] canvas')).toBeVisible();
    expect(externalRequests).toEqual([]);
  });

  test('does not initialize the renderer with reduced motion and excludes it from print', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/login');
    await expect(page.locator('[data-system-background]')).toHaveAttribute(
      'data-motion',
      'reduced',
    );
    await expect(page.locator('[data-system-background] canvas')).toBeHidden();

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-system-background]')).toBeHidden();
  });

  for (const surface of [
    { name: 'desktop 1440 English', width: 1440, height: 900, path: '/login', direction: 'ltr' },
    { name: 'desktop 1920 English', width: 1920, height: 1080, path: '/login', direction: 'ltr' },
    { name: 'tablet English', width: 768, height: 1024, path: '/login', direction: 'ltr' },
    {
      name: 'mobile Arabic RTL',
      width: 390,
      height: 844,
      path: '/login?locale=ar',
      direction: 'rtl',
    },
  ]) {
    test(`keeps the login surface readable at ${surface.name}`, async ({ page }) => {
      await page.setViewportSize({ width: surface.width, height: surface.height });
      await page.goto(surface.path);
      await expect(page.locator('html')).toHaveAttribute('dir', surface.direction);
      await expect(page.locator('.login-panel')).toBeVisible();
      await expect(page.locator('.login-panel')).toHaveCSS('background-color', 'rgb(27, 31, 27)');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        surface.width,
      );
    });
  }
});
