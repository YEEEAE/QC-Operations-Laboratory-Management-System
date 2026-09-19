import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;
const adminIdentity = process.env.QC_E2E_ADMIN_LOGIN_IDENTITY;
const adminPassword = process.env.QC_E2E_ADMIN_PASSWORD;

/**
 * QC-100-FINAL-006: the authenticated accessibility tests share one disposable
 * fixture session instead of signing in per test. The login endpoint is
 * rate-limited (RATE_LIMIT_LOGIN_MAX per window), and a per-test login made the
 * suite fail with AUTH_RATE_LIMITED instead of exercising accessibility.
 */
const AUTHENTICATED_STATE_PATH = 'test-results/.a11y-authenticated-state.json';
const ADMIN_STATE_PATH = 'test-results/.a11y-admin-state.json';
const EMPTY_STATE = '{"cookies":[],"origins":[]}';

function hasFixture(): boolean {
  return Boolean(loginIdentity && password);
}

function requireAuthenticatedFixture(): void {
  test.skip(
    !hasFixture(),
    'QC_E2E_LOGIN_IDENTITY and QC_E2E_PASSWORD are required for authenticated accessibility coverage',
  );
}

function hasAdminFixture(): boolean {
  return Boolean(adminIdentity && adminPassword);
}

function writeStateFile(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, 'utf8');
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(loginIdentity ?? '');
  await page.getByLabel('Password', { exact: true }).fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function signInWith(page: Page, identity: string, secret: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(identity);
  await page.getByLabel('Password', { exact: true }).fill(secret);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

interface AxeScanResult {
  readonly violations: readonly { id: string; impact?: string; nodes: readonly unknown[] }[];
  readonly incomplete: readonly {
    id: string;
    impact?: string;
    nodes: readonly { target?: string[] }[];
  }[];
  readonly passes: readonly { id: string }[];
}

// QC-100-FINAL-006: scan with the WCAG 2/2.1/2.2 A+AA tag set AND explicitly enable
// label-content-name-mismatch (best-practice rule, not covered by the wcag tags and
// the source of the 2026-09-18 serious finding on the global search link).
async function analyzeAccessibility(page: Page): Promise<AxeScanResult> {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .withRules(['label-content-name-mismatch'])
    .analyze();
  return result as AxeScanResult;
}

async function expectNoAxeViolations(page: Page, surface: string): Promise<void> {
  const result = await analyzeAccessibility(page);
  const violationSummary = result.violations.map(
    (violation) => `${violation.id} (${violation.impact ?? 'unknown'}) x${violation.nodes.length}`,
  );
  expect(
    violationSummary,
    `${surface} has WCAG 2/2.1/2.2 A/AA violations (label-content-name-mismatch explicitly enabled)`,
  ).toEqual([]);
}

async function assertKeyboardOrder(
  page: Page,
  labels = { identity: 'Login identity', password: 'Password', submit: 'Sign in' },
): Promise<void> {
  const identity = page.getByLabel(labels.identity);
  // The login form also owns a "Show password" toggle whose accessible name
  // contains the word "Password"; match the field exactly so the assertion
  // stays about the labelled input instead of tripping Playwright strict mode.
  const credential = page.getByLabel(labels.password, { exact: true });
  const toggle = page.getByRole('button', { name: 'Show password' });
  const submit = page.getByRole('button', { name: labels.submit, exact: true });

  await identity.focus();
  await expect(identity).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(credential).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toggle, 'the password toggle must be reachable by keyboard').toBeFocused();

  const focusStyle = await toggle.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(
    focusStyle.outlineStyle !== 'none' || focusStyle.outlineWidth !== '0px',
    'the keyboard-focused control must have a visible focus treatment',
  ).toBe(true);

  await page.keyboard.press('Enter');
  await expect(credential, 'the toggle must flip the field type').toHaveAttribute('type', 'text');
  await expect(toggle).toHaveAttribute('aria-label', 'Hide password');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(credential).toHaveAttribute('type', 'password');

  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();
}

async function assertVisibleFocus(page: Page, target: ReturnType<Page['locator']>, label: string) {
  await target.focus();
  await expect(target, `${label} must accept focus`).toBeFocused();
  const style = await target.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      boxShadow: computed.boxShadow,
    };
  });
  expect(
    style.outlineStyle !== 'none' || style.outlineWidth !== '0px' || style.boxShadow !== 'none',
    `${label} must render a visible focus indicator`,
  ).toBe(true);
}

/** WCAG 1.4.10 reflow + 4.1.2: no page-level overflow at the given transformation. */
async function assertNoPageOverflow(page: Page, surface: string): Promise<void> {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(overflow.documentWidth, `${surface}: document overflow`).toBeLessThanOrEqual(
    overflow.viewportWidth + 1,
  );
  expect(overflow.bodyWidth, `${surface}: body overflow`).toBeLessThanOrEqual(
    overflow.viewportWidth + 1,
  );
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
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    await expectNoAxeViolations(page, 'English login');
    await assertKeyboardOrder(page);
  });

  test('Login ignores the locale parameter and stays English LTR (F-12 English-only)', async ({
    page,
  }) => {
    await page.goto('/login?locale=ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Login identity')).toHaveAttribute('autocomplete', 'username');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    await expectNoAxeViolations(page, 'English-only login with locale param');
    await assertKeyboardOrder(page);
  });

  test('safe 404 surface has a heading, recovery links, and no axe violations', async ({
    page,
  }) => {
    await page.goto('/definitely-not-a-page-master034');
    await expect(page).toHaveTitle(/Page not found/i);
    await expect(page.getByRole('heading', { name: /could not find/i })).toBeVisible();
    // QC-100-FINAL-018: the 404 keeps one clear recovery action (label updated
    // from the duplicated "Continue safely"/"Go back" pair).
    await expect(page.getByRole('link', { name: /go to dashboard/i })).toBeVisible();
    await expectNoAxeViolations(page, 'safe 404');
  });

  // QC-100-FINAL-006: the 2026-09-18 explicit live axe scan recorded one serious
  // label-content-name-mismatch node (the topbar search link whose aria-label did
  // not contain the visible "Search" text). The shared fix keeps the accessible
  // name aligned with the visible label; this regression test asserts the rule
  // itself passes on the topbar via the authenticated dashboard surface.
  test('authenticated topbar accessible names match their visible text (label-content-name-mismatch regression)', async ({
    page,
  }) => {
    requireAuthenticatedFixture();
    await page.goto('/dashboard');

    const result = await analyzeAccessibility(page);
    const mismatches = result.violations.filter(
      (violation) => violation.id === 'label-content-name-mismatch',
    );
    expect(
      mismatches,
      'accessible names must contain their visible label text (label-content-name-mismatch)',
    ).toEqual([]);
    // Investigate incomplete results instead of treating them as passing: the rule
    // must not leave any node on the topbar needing manual review.
    const incompleteMismatches = result.incomplete.filter(
      (check) => check.id === 'label-content-name-mismatch',
    );
    expect(
      incompleteMismatches,
      'label-content-name-mismatch checks on the topbar must be complete, not needing review',
    ).toEqual([]);
  });

  test('authenticated operational surfaces cover navigation, forms, tables, chart summaries, status text, and dialogs', async ({
    page,
  }) => {
    requireAuthenticatedFixture();

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
    await page.goto('/dashboard');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
      true,
    );
    const runningTransitions = await page
      .locator('*')
      .evaluateAll((elements) =>
        elements
          .map((element) => getComputedStyle(element).transitionDuration)
          .filter((duration) => Number.parseFloat(duration) > 0),
      );
    expect(
      runningTransitions,
      'reduced motion must remove transitions entirely (a near-zero duration still animates)',
    ).toEqual([]);
    const runningAnimations = await page
      .locator('*')
      .evaluateAll((elements) =>
        elements
          .map((element) => getComputedStyle(element).animationName)
          .filter((name) => name !== 'none'),
      );
    expect(runningAnimations, 'reduced motion must remove animations').toEqual([]);
  });

  test('axe color-contrast and label-content-name-mismatch checks complete without manual review on representative surfaces', async ({
    page,
  }) => {
    requireAuthenticatedFixture();
    for (const path of ['/dashboard', '/tasks']) {
      await page.goto(path);
      const result = await analyzeAccessibility(page);
      const incomplete = result.incomplete
        .filter((check) => ['color-contrast', 'label-content-name-mismatch'].includes(check.id))
        .map((check) => `${check.id} x${check.nodes.length}`);
      expect(incomplete, `${path} has accessibility checks that still need manual review`).toEqual(
        [],
      );
      const ran = new Set(result.passes.map((rule) => rule.id));
      expect(ran.has('color-contrast'), `${path} did not evaluate colour contrast`).toBe(true);
      expect(
        ran.has('label-content-name-mismatch'),
        `${path} did not evaluate label-content-name-mismatch`,
      ).toBe(true);
    }
  });
});
test.describe('authenticated keyboard-only, focus, and session recovery', () => {
  test.use({ storageState: AUTHENTICATED_STATE_PATH });

  test.beforeAll(async ({ browser }) => {
    if (!hasFixture()) {
      writeStateFile(AUTHENTICATED_STATE_PATH, EMPTY_STATE);
      return;
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page);
    await context.storageState({ path: AUTHENTICATED_STATE_PATH });
    await context.close();
  });

  test('skip link is reachable, becomes visible, and moves focus to the main content', async ({
    page,
  }) => {
    requireAuthenticatedFixture();
    await page.goto('/dashboard');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip, 'the shell must expose a skip link').toBeAttached();

    await skip.focus();
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box, 'the focused skip link must be visible').not.toBeNull();
    expect(box!.y, 'the focused skip link must be pulled into the viewport').toBeGreaterThanOrEqual(
      0,
    );
    expect(box!.width > 0 && box!.height > 0).toBe(true);

    await page.keyboard.press('Enter');
    await expect(
      page.locator(':focus'),
      'activating the skip link must move focus to the main content',
    ).toHaveAttribute('id', 'main-content');
  });

  test('the first tab stop is the skip link and shell controls keep visible focus', async ({
    page,
  }) => {
    requireAuthenticatedFixture();
    await page.goto('/dashboard');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-skip-link');

    await assertVisibleFocus(
      page,
      page.getByRole('link', { name: /Search authorized records/ }),
      'global search link',
    );
    const notifications = page.getByRole('link', { name: /Notifications|unread notifications/ });
    if ((await notifications.count()) > 0) {
      await assertVisibleFocus(page, notifications.first(), 'notifications link');
    }
    await assertVisibleFocus(
      page,
      page.getByRole('button', { name: /Collapse navigation|Expand navigation/ }).first(),
      'sidebar collapse control',
    );
  });

  test('session recovery: a forged session cookie redirects to login with a safe returnTo and no content leak', async ({
    page,
    context,
  }) => {
    requireAuthenticatedFixture();
    await context.addCookies([
      {
        name: 'qc_session',
        value: 'forged-session-token-value',
        url: 'http://127.0.0.1:4321',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const response = await page.goto('/dashboard');
    expect(
      response?.status() ?? 0,
      'a forged session must not render the protected page',
    ).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fdashboard/);
    await expect(page.locator('input[name="returnTo"]')).toHaveValue('/dashboard');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/VERIFY-/);
    await expectNoAxeViolations(page, 'login after forged session');
  });
});

test.describe('authenticated validation, target size, and forced colors', () => {
  test.use({ storageState: AUTHENTICATED_STATE_PATH });

  test.beforeAll(() => {
    if (!hasFixture()) writeStateFile(AUTHENTICATED_STATE_PATH, EMPTY_STATE);
  });

  test('validation errors are announced, focused, and linked to their field', async ({ page }) => {
    requireAuthenticatedFixture();
    const response = await page.goto('/quarantine/receiving/new');
    if ((response?.status() ?? 200) >= 400) {
      test.skip(true, 'receiving create form is not reachable for this fixture actor');
      return;
    }
    const form = page.locator('form').first();
    await form.locator('button[type="submit"], [type="submit"]').first().click();

    const summary = page.locator('[role="alert"], .form-error-summary').first();
    await expect(
      summary,
      'invalid submission must produce an announced error summary',
    ).toBeVisible();

    const focusInfo = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      return {
        tag: element?.tagName ?? '',
        id: element?.id ?? '',
        role: element?.getAttribute('role') ?? '',
      };
    });
    expect(
      focusInfo.role === 'alert' ||
        focusInfo.id.toLowerCase().includes('error') ||
        focusInfo.id.toLowerCase().includes('summary'),
      `focus must move to the error summary, received ${JSON.stringify(focusInfo)}`,
    ).toBe(true);

    const links = summary.locator('a[href^="#"]');
    expect(await links.count(), 'error summary must link to at least one field').toBeGreaterThan(0);
    await links.first().click();
    const focusedId = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(focusedId, 'following an error link must move focus to that field').not.toBe('');
  });

  test('project target-size requirement: shell controls are at least 44px at 375px', async ({
    page,
  }) => {
    requireAuthenticatedFixture();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');

    const targets = [
      page.getByRole('button', { name: /navigation/i }).first(),
      page.getByRole('link', { name: /Search authorized records/ }).first(),
      page.getByRole('link', { name: /Notifications|unread notifications/ }).first(),
      page.getByRole('link', { name: /Approvals|pending approvals/ }).first(),
    ];
    for (const target of targets) {
      if ((await target.count()) === 0) continue;
      const box = await target.boundingBox();
      expect(box, 'target must have a measurable box').not.toBeNull();
      expect(
        box!.height,
        'project target-size requirement is 44px for shell controls',
      ).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('forced colors keeps shell controls and status text perceivable', async ({ page }) => {
    requireAuthenticatedFixture();
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/dashboard');
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    const bodyText = await page.locator('main').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(30);
    await expectNoAxeViolations(page, 'dashboard under forced colors');
    test.describe('authenticated modal dialog keyboard contract (admin surface)', () => {
      test.use({ storageState: ADMIN_STATE_PATH });

      test.beforeAll(async ({ browser }) => {
        if (!hasAdminFixture()) {
          writeStateFile(ADMIN_STATE_PATH, EMPTY_STATE);
          return;
        }
        const context = await browser.newContext();
        const page = await context.newPage();
        await signInWith(page, adminIdentity ?? '', adminPassword ?? '');
        await context.storageState({ path: ADMIN_STATE_PATH });
        await context.close();
      });

      test('dialog opens with focus inside, announces its title, closes on Escape, and returns focus', async ({
        page,
      }) => {
        test.skip(
          !hasAdminFixture(),
          'QC_E2E_ADMIN_LOGIN_IDENTITY and QC_E2E_ADMIN_PASSWORD are required for the administration dialog surface',
        );

        const listResponse = await page.goto('/admin/users');
        if ((listResponse?.status() ?? 200) >= 400) {
          test.skip(
            true,
            'the administration user register is not reachable for this fixture actor',
          );
          return;
        }
        const detailLink = page.locator('a[href^="/admin/users/"]').first();
        if ((await detailLink.count()) === 0) {
          test.skip(
            true,
            'no administration user detail link is available in this fixture dataset',
          );
          return;
        }
        await detailLink.click();

        const trigger = page.locator('[data-dialog-open]').first();
        if ((await trigger.count()) === 0) {
          test.skip(true, 'no dialog trigger is rendered for this fixture actor');
          return;
        }
        const dialogId = await trigger.getAttribute('data-dialog-open');
        const dialog = page.locator(`#${dialogId}`);
        await expect(dialog, 'the trigger must reference a rendered dialog').toHaveCount(1);
        await expect(dialog).not.toHaveAttribute('open', /.*/);

        await trigger.focus();
        await page.keyboard.press('Enter');
        await expect(dialog, 'Enter on the trigger must open the dialog').toHaveAttribute(
          'open',
          '',
        );
        await expect(
          page.locator(`#${dialogId}-title`),
          'the dialog title must carry the announced name and receive focus',
        ).toBeFocused();

        const focusInside = await dialog.evaluate((element) =>
          element.contains(document.activeElement),
        );
        expect(focusInside, 'focus must move inside the opened dialog').toBe(true);

        await page.keyboard.press('Escape');
        await expect(dialog, 'Escape must close the dialog').not.toHaveAttribute('open', /.*/);
        await expect(trigger, 'focus must return to the trigger after closing').toBeFocused();
      });
    });
  });
});
interface MatrixViewport {
  readonly name: string;
  readonly width: number;
  readonly height: number;
}

/**
 * QC-100-FINAL-006 required matrix: 320/375/414/768/1024/1440 plus landscape,
 * evaluated on representative authenticated page families (dashboard, register,
 * create form, report).
 */
const MATRIX_VIEWPORTS: readonly MatrixViewport[] = [
  { name: '320', width: 320, height: 800 },
  { name: '375', width: 375, height: 812 },
  { name: '414', width: 414, height: 896 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 },
  { name: 'landscape-phone', width: 812, height: 375 },
  { name: 'landscape-tablet', width: 1024, height: 768 },
];

const MATRIX_SURFACES = [
  '/dashboard',
  '/tasks',
  '/quarantine/receiving/new',
  '/reports/quarantine-aging',
];

test.describe('authenticated responsive, zoom, and text-spacing matrix', () => {
  test.use({ storageState: AUTHENTICATED_STATE_PATH });

  test.beforeAll(() => {
    if (!hasFixture()) writeStateFile(AUTHENTICATED_STATE_PATH, EMPTY_STATE);
  });

  for (const viewport of MATRIX_VIEWPORTS) {
    test(`reflows at ${viewport.name} (${viewport.width}x${viewport.height}) without overflow`, async ({
      page,
    }) => {
      requireAuthenticatedFixture();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const path of MATRIX_SURFACES) {
        await page.goto(path);
        await assertNoPageOverflow(page, `${path} @${viewport.name}`);
        await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeAttached();
        if (viewport.width <= 414) {
          const toggle = page.getByRole('button', { name: /navigation/i }).first();
          if ((await toggle.count()) > 0) {
            await expect(
              toggle,
              `${path} @${viewport.name}: drawer toggle reachable`,
            ).toBeVisible();
          }
        }
      }
    });
  }

  for (const factor of [2, 4] as const) {
    test(`${factor * 100}% zoom keeps the dashboard and create form reachable without horizontal overflow`, async ({
      page,
    }) => {
      requireAuthenticatedFixture();
      await page.setViewportSize({ width: 1280, height: 900 });
      for (const path of ['/dashboard', '/quarantine/receiving/new']) {
        await page.goto(path);
        await page.evaluate((value) => {
          document.documentElement.style.zoom = String(value);
        }, factor);
        await assertNoPageOverflow(page, `${path} @${factor * 100}%`);
        const controls = page.locator(
          'button:visible, input:visible, select:visible, textarea:visible',
        );
        const count = Math.min(await controls.count(), 30);
        for (let index = 0; index < count; index += 1) {
          const box = await controls.nth(index).boundingBox();
          expect(box, 'visible control must have a box').not.toBeNull();
          expect(
            box!.x + box!.width,
            `${path} @${factor * 100}%: control extends past the viewport`,
          ).toBeLessThanOrEqual(1281);
        }
        await page.evaluate(() => {
          document.documentElement.style.zoom = '';
        });
      }
    });
  }

  test('user text-spacing overrides do not clip content or controls', async ({ page }) => {
    requireAuthenticatedFixture();
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ['/dashboard', '/tasks']) {
      await page.goto(path);
      await page.addStyleTag({
        content: `
          html { letter-spacing: .12em !important; word-spacing: .5em !important; }
          body, button, input, select, textarea { line-height: 1.8 !important; }
          p, h1, h2, h3, label, legend, a, button { overflow-wrap: anywhere !important; }
        `,
      });
      await assertNoPageOverflow(page, `${path} text-spacing`);
      const clipped = await page
        .locator('h1:visible, h2:visible, label:visible, .status-badge:visible')
        .evaluateAll((elements) =>
          elements
            .filter((element) => element.scrollWidth > element.clientWidth + 1)
            .map((element) => element.className),
        );
      expect(clipped, `${path}: essential text clipped by text-spacing overrides`).toEqual([]);
    }
  });
});
