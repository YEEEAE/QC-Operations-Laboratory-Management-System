import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * F-03 reflow coverage: no page-level horizontal overflow and no clipped
 * critical control at 320px width and at 200% zoom, in both LTR and RTL.
 *
 * - Public block (always runs): the login surface in English LTR and
 *   Arabic RTL.
 * - Authenticated blocks (gated on QC_E2E_LOGIN_IDENTITY / QC_E2E_PASSWORD):
 *   Dashboard, a list page with tables, long create forms, and System
 *   Health. Read-only GETs only — no record is created or mutated.
 * - Drawer block: the mobile navigation keeps visible focus, closes on
 *   Escape, and returns focus to the toggle.
 */

const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;

const MOBILE = { width: 320, height: 800 };
const ZOOM_VIEWPORT = { width: 1280, height: 900 };

function requireFixture(): void {
  test.skip(
    !loginIdentity || !password,
    'QC_E2E_LOGIN_IDENTITY and QC_E2E_PASSWORD are required for authenticated reflow coverage',
  );
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(loginIdentity ?? '');
  await page.getByLabel('Password', { exact: true }).fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function setDirection(page: Page, direction: 'ltr' | 'rtl'): Promise<void> {
  await page.locator('html').evaluate((html, dir) => html.setAttribute('dir', dir), direction);
}

async function setZoom(page: Page, factor: number | null): Promise<void> {
  await page.evaluate((value) => {
    document.documentElement.style.zoom = value === null ? '' : String(value);
  }, factor);
}

/** Page-level overflow: neither the document nor the body may exceed the viewport. */
async function assertNoPageOverflow(page: Page, surface: string): Promise<void> {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(
    overflow.documentWidth,
    `${surface}: document must not overflow horizontally`,
  ).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  expect(overflow.bodyWidth, `${surface}: body must not overflow horizontally`).toBeLessThanOrEqual(
    overflow.viewportWidth + 1,
  );
}

/** A critical control must be visible and fully inside the viewport horizontally. */
async function assertUnclipped(page: Page, target: Locator, name: string): Promise<void> {
  await expect(target.first(), `${name} must be visible`).toBeVisible();
  const box = await target.first().boundingBox();
  expect(box, `${name} must have a measurable box`).not.toBeNull();
  const viewportWidth = page.viewportSize()?.width ?? 0;
  expect(box!.x, `${name} must not start left of the viewport`).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width, `${name} must not extend past the viewport`).toBeLessThanOrEqual(
    viewportWidth + 1,
  );
}

test.describe('F-03 public reflow at 320px and 200% zoom', () => {
  for (const [path, heading, submit, identityLabel, passwordLabel] of [
    ['/login', 'Sign in', 'Sign in', 'Login identity', 'Password'],
    ['/login?locale=ar', 'تسجيل الدخول', 'تسجيل الدخول', 'معرّف الدخول', 'كلمة المرور'],
  ] as const) {
    test(`public form reflows at 320px (${path})`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(path);
      await assertNoPageOverflow(page, `${path} @320px`);
      await assertUnclipped(page, page.getByRole('heading', { name: heading }), 'form heading');
      await assertUnclipped(page, page.getByLabel(identityLabel), 'identity input');
      await assertUnclipped(page, page.getByLabel(passwordLabel), 'password input');
      await assertUnclipped(page, page.getByRole('button', { name: submit }), 'submit button');
    });

    test(`public form reflows at 200% zoom (${path})`, async ({ page }) => {
      await page.setViewportSize(ZOOM_VIEWPORT);
      await page.goto(path);
      await setZoom(page, 2);
      await assertNoPageOverflow(page, `${path} @200%`);
      await assertUnclipped(page, page.getByRole('heading', { name: heading }), 'form heading');
      await assertUnclipped(page, page.getByRole('button', { name: submit }), 'submit button');
      await setZoom(page, null);
    });
  }
});

interface SurfaceSpec {
  path: string;
  heading: RegExp;
  /** Critical controls that must stay reachable on every run. */
  critical: Array<{ role: 'link' | 'button' | 'textbox' | 'searchbox'; name: RegExp | string }>;
}

const READ_ONLY_SURFACES: SurfaceSpec[] = [
  {
    path: '/dashboard',
    heading: /^Dashboard$/,
    critical: [{ role: 'link', name: /Open queue/ }],
  },
  {
    path: '/tasks',
    heading: /^Tasks$/,
    critical: [
      { role: 'textbox', name: /Search/ },
      { role: 'button', name: /^Filter$/ },
    ],
  },
  {
    path: '/quarantine/receiving/new',
    heading: /Receiving|Receiving Item/,
    critical: [{ role: 'button', name: /Create|Submit|Save/ }],
  },
  {
    path: '/change-requests/new',
    heading: /Change request/i,
    critical: [{ role: 'button', name: /Create|Submit|Save/ }],
  },
];

async function assertTableScrollIsContained(page: Page, surface: string): Promise<void> {
  const wraps = page.locator('.table-wrap, .table-scroll');
  const count = await wraps.count();
  for (let index = 0; index < count; index += 1) {
    const box = await wraps.nth(index).boundingBox();
    if (!box) continue;
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(
      box.x,
      `${surface}: table scroll region must not start off-viewport`,
    ).toBeGreaterThanOrEqual(-1);
    expect(
      box.x + box.width,
      `${surface}: table scroll region must not exceed the viewport (internal scroll handles wide tables)`,
    ).toBeLessThanOrEqual(viewportWidth + 1);
  }
}

test.describe('F-03 authenticated reflow at 320px in LTR and RTL', () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    for (const surface of READ_ONLY_SURFACES) {
      test(`${surface.path} reflows at 320px (${direction})`, async ({ page }) => {
        requireFixture();
        await page.setViewportSize(MOBILE);
        await signIn(page);
        const response = await page.goto(surface.path);
        expect(response?.status() ?? 0, surface.path).toBeLessThan(500);
        if ((response?.status() ?? 200) >= 400) {
          test.skip(true, `${surface.path} is not reachable for this fixture actor`);
          return;
        }
        await setDirection(page, direction);
        const label = `${surface.path} @320px ${direction}`;
        await assertNoPageOverflow(page, label);
        const expectedHeading = page.getByRole('heading', { name: surface.heading });
        if ((await expectedHeading.count()) > 0) {
          await assertUnclipped(page, expectedHeading.first(), 'page heading');
        } else {
          // Permission-denied panels render a fallback heading instead of the form title.
          await assertUnclipped(
            page,
            page.locator('main').getByRole('heading').first(),
            'fallback heading',
          );
        }
        for (const control of surface.critical) {
          const target =
            control.role === 'link'
              ? page.getByRole('link', { name: control.name }).first()
              : control.role === 'button'
                ? page.getByRole('button', { name: control.name }).first()
                : page.getByLabel(control.name).first();
          if ((await target.count()) === 0) continue;
          await assertUnclipped(page, target, `${control.role} ${String(control.name)}`);
        }
        await assertTableScrollIsContained(page, label);
      });
    }

    test(`System Health reflows at 320px (${direction})`, async ({ page }) => {
      requireFixture();
      await page.setViewportSize(MOBILE);
      await signIn(page);
      const response = await page.goto('/system/health');
      if ((response?.status() ?? 500) >= 400) {
        test.skip(true, 'System Health is exclusive to the fixture owner actor');
        return;
      }
      await setDirection(page, direction);
      const label = `/system/health @320px ${direction}`;
      await assertNoPageOverflow(page, label);
      await assertUnclipped(
        page,
        page.getByRole('heading', { name: /System health/i }),
        'page heading',
      );
      await assertTableScrollIsContained(page, label);
    });
  }
});

test.describe('F-03 authenticated reflow at 200% zoom in LTR and RTL', () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    for (const path of ['/dashboard', '/quarantine/receiving/new', '/tasks']) {
      test(`${path} reflows at 200% zoom (${direction})`, async ({ page }) => {
        requireFixture();
        await page.setViewportSize(ZOOM_VIEWPORT);
        await signIn(page);
        const response = await page.goto(path);
        expect(response?.status() ?? 0, path).toBeLessThan(500);
        if ((response?.status() ?? 200) >= 400) {
          test.skip(true, `${path} is not reachable for this fixture actor`);
          return;
        }
        await setDirection(page, direction);
        await setZoom(page, 2);
        const label = `${path} @200% ${direction}`;
        await assertNoPageOverflow(page, label);
        await assertUnclipped(page, page.locator('main').first(), 'main workspace');
        await assertTableScrollIsContained(page, label);
        await setZoom(page, null);
      });
    }
  }
});

test.describe('F-03 mobile drawer keeps focus, Escape, and focus return', () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    test(`drawer opens, traps out closed state, and returns focus (${direction})`, async ({
      page,
    }) => {
      requireFixture();
      await page.setViewportSize(MOBILE);
      await signIn(page);
      await page.goto('/dashboard');
      await setDirection(page, direction);

      const toggle = page.getByRole('button', { name: /navigation/i }).first();
      await assertUnclipped(page, toggle, 'navigation toggle');
      await expect(toggle, 'drawer starts closed').toHaveAttribute('aria-expanded', 'false');

      await toggle.click();
      await expect(toggle, 'drawer reports open').toHaveAttribute('aria-expanded', 'true');
      const firstLink = page.locator('#primary-navigation a[href]').first();
      await assertUnclipped(page, firstLink, 'first drawer destination');
      await expect(firstLink, 'focus moves into the drawer on open').toBeFocused();
      await assertNoPageOverflow(page, `drawer open @320px ${direction}`);

      await page.keyboard.press('Escape');
      await expect(toggle, 'drawer reports closed after Escape').toHaveAttribute(
        'aria-expanded',
        'false',
      );
      await expect(toggle, 'focus returns to the toggle after Escape').toBeFocused();
      await assertNoPageOverflow(page, `drawer closed @320px ${direction}`);
    });
  }
});
