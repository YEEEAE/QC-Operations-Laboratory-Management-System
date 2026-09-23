import { expect, test, type Page } from '@playwright/test';

/**
 * BI-01 live coverage: the open mobile navigation drawer isolates the
 * background from keyboard and assistive-technology interaction.
 *
 * Read-only GETs only — no record is created or mutated. All tests are
 * gated on QC_E2E_LOGIN_IDENTITY / QC_E2E_PASSWORD, following the existing
 * repository convention for authenticated browser coverage.
 */

const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;

const MOBILE = { width: 320, height: 800 };
const MOBILE_STANDARD = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };
const WIDE_DESKTOP = { width: 1440, height: 900 };

function requireFixture(): void {
  test.skip(
    !loginIdentity || !password,
    'QC_E2E_LOGIN_IDENTITY and QC_E2E_PASSWORD are required for BI-01 drawer coverage',
  );
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(loginIdentity ?? '');
  await page.getByLabel('Password', { exact: true }).fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function openDrawer(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: /navigation/i }).first();
  await expect(toggle, 'drawer starts closed').toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle, 'drawer reports open').toHaveAttribute('aria-expanded', 'true');
}

async function workspaceInert(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.querySelector('[data-app-workspace]')?.hasAttribute('inert') ?? false,
  );
}

async function bodyScrollLocked(page: Page): Promise<boolean> {
  return page.evaluate(() => document.body.style.overflow === 'hidden');
}

test.describe('BI-01 mobile drawer isolates the background', () => {
  test('nested sections support pointer and keyboard disclosure at mobile and desktop sizes', async ({
    page,
  }) => {
    requireFixture();
    await page.setViewportSize(MOBILE_STANDARD);
    await signIn(page);
    await page.goto('/dashboard');

    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const current = nav.getByRole('link', { name: 'Dashboard' });
    await expect(current).toHaveAttribute('aria-current', 'page');
    const overviewToggle = nav.locator('[data-section-id="overview"]');
    await expect(overviewToggle).toHaveAttribute('aria-expanded', 'true');
    const overviewListId = await overviewToggle.getAttribute('aria-controls');
    expect(overviewListId).toBeTruthy();
    await overviewToggle.click();
    await expect(overviewToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(overviewToggle).toHaveAttribute('aria-label', 'Expand Overview section');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(nav.locator('a[href="/dashboard"]')).toHaveAttribute('href', '/dashboard');
    await expect(page.locator(`#${overviewListId}`)).toBeHidden();

    await overviewToggle.focus();
    await page.keyboard.press('Space');
    await expect(overviewToggle).toHaveAttribute('aria-label', 'Collapse Overview section');
    await expect(overviewToggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Enter');
    await expect(overviewToggle).toHaveAttribute('aria-label', 'Expand Overview section');
    await expect(overviewToggle).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();

    for (const viewport of [MOBILE, MOBILE_STANDARD, WIDE_DESKTOP]) {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `navigation must reflow at ${viewport.width}px`).toBe(false);
      if (viewport.width < 761) {
        const opener = page.getByRole('button', { name: 'Open navigation' });
        const box = await opener.boundingBox();
        expect(
          box && box.width >= 44 && box.height >= 44,
          'mobile drawer opener meets 44px target',
        ).toBe(true);
        await opener.click();
        for (const control of [
          nav.locator('[data-section-id="overview"]'),
          nav.getByRole('link', { name: 'Dashboard' }),
          nav.getByRole('button', { name: 'Close navigation' }),
        ]) {
          const target = await control.boundingBox();
          expect(
            target && target.width >= 44 && target.height >= 44,
            'navigation controls meet 44px touch target',
          ).toBe(true);
        }
        await page.keyboard.press('Escape');
      }
    }

    await page.setViewportSize(MOBILE_STANDARD);
    await page.goto('/dashboard');
    await page.evaluate(() => {
      document.documentElement.style.zoom = '200%';
    });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  test('open drawer is inert outside, locks scroll, and moves focus inside (ltr)', async ({
    page,
  }) => {
    requireFixture();
    await page.setViewportSize(MOBILE);
    await signIn(page);
    await page.goto('/dashboard');

    expect(await workspaceInert(page), 'workspace starts interactive').toBe(false);
    expect(await bodyScrollLocked(page), 'body scroll starts unlocked').toBe(false);

    await openDrawer(page);

    expect(await workspaceInert(page), 'workspace is inert while the drawer is open').toBe(true);
    expect(await bodyScrollLocked(page), 'background scroll is locked while open').toBe(true);
    const firstLink = page.locator('#primary-navigation a[href]').first();
    await expect(firstLink, 'focus moves into the drawer on open').toBeFocused();
  });

  test('Tab and Shift+Tab stay inside the drawer', async ({ page }) => {
    requireFixture();
    await page.setViewportSize(MOBILE);
    await signIn(page);
    await page.goto('/dashboard');
    await openDrawer(page);

    const drawerControls = page.locator(
      '#primary-navigation a[href], #primary-navigation button:not([disabled])',
    );
    const controlCount = await drawerControls.count();
    expect(controlCount, 'drawer has controls to contain focus').toBeGreaterThan(1);

    const first = drawerControls.first();
    const last = drawerControls.last();

    await last.focus();
    await expect(last, 'setup focuses the last drawer control').toBeFocused();
    await page.keyboard.press('Tab');
    await expect(first, 'Tab on the last control wraps to the first').toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(last, 'Shift+Tab on the first control wraps to the last').toBeFocused();
  });

  test('Escape closes the drawer and returns focus to the toggle', async ({ page }) => {
    requireFixture();
    await page.setViewportSize(MOBILE);
    await signIn(page);
    await page.goto('/dashboard');
    await openDrawer(page);

    const toggle = page.getByRole('button', { name: /navigation/i }).first();
    await page.keyboard.press('Escape');

    await expect(toggle, 'drawer reports closed after Escape').toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(toggle, 'focus returns to the toggle after Escape').toBeFocused();
    expect(await workspaceInert(page), 'workspace inert state is removed on close').toBe(false);
    expect(await bodyScrollLocked(page), 'scroll lock is released on close').toBe(false);
  });

  test('leaving the mobile breakpoint removes every temporary state', async ({ page }) => {
    requireFixture();
    await page.setViewportSize(MOBILE);
    await signIn(page);
    await page.goto('/dashboard');
    await openDrawer(page);
    expect(await workspaceInert(page), 'workspace is inert before leaving the breakpoint').toBe(
      true,
    );

    await page.setViewportSize(DESKTOP);

    expect(await workspaceInert(page), 'workspace inert state is removed off-breakpoint').toBe(
      false,
    );
    expect(await bodyScrollLocked(page), 'scroll lock is released off-breakpoint').toBe(false);
    const parkedInert = await page.evaluate(
      () => document.querySelector('[data-sidebar-panel]')?.hasAttribute('inert') ?? false,
    );
    expect(parkedInert, 'sidebar parked inert state is removed off-breakpoint').toBe(false);
  });

  test('drawer honors reduced motion without transition', async ({ page }) => {
    requireFixture();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(MOBILE);
    await signIn(page);
    await page.goto('/dashboard');
    await openDrawer(page);

    const durations = await page
      .locator('[data-app-shell], [data-sidebar-panel]')
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).transitionDuration),
      );
    for (const duration of durations) {
      expect(duration === '0s' || duration === '0s, 0s', 'no transition under reduced motion').toBe(
        true,
      );
    }

    const toggle = page.getByRole('button', { name: /navigation/i }).first();
    await page.keyboard.press('Escape');
    await expect(toggle, 'Escape still closes under reduced motion').toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
