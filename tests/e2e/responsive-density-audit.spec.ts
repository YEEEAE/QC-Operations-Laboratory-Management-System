import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Responsive/density audit against the real authenticated read model.
 *
 * The suite is intentionally fixture-gated: a provider-unavailable or empty
 * page is still a valid state to render, but it is not a substitute for the
 * current-content pass required by this audit. No route in this file creates
 * or mutates a controlled record.
 */

const identity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;

const widths = [320, 375, 414, 768, 1024, 1440] as const;
const heights: Record<(typeof widths)[number], number> = {
  320: 800,
  375: 812,
  414: 896,
  768: 1024,
  1024: 768,
  1440: 900,
};

const routeFamilies = {
  overview: ['/dashboard', '/tasks', '/notifications', '/search'],
  quality: ['/quality', '/quality/findings', '/quality/ncr', '/quality/rca', '/quality/capa'],
  quarantine: [
    '/quarantine',
    '/quarantine/receiving',
    '/quarantine/inspections',
    '/quarantine/receiving/new',
  ],
  laboratory: ['/laboratory', '/laboratory/tests', '/laboratory/tests/new'],
  assets: ['/assets', '/assets/equipment', '/assets/calibrations', '/assets/maintenance'],
  documentsGovernance: [
    '/documents',
    '/documents/new',
    '/change-requests',
    '/change-requests/new',
    '/approvals',
    '/reports',
  ],
  advisoryAndSystem: ['/ai-advisory', '/system/backups'],
} as const;

const allRoutes = Object.values(routeFamilies).flat();

function requireFixture(): void {
  test.skip(
    !identity || !password,
    'QC_E2E_LOGIN_IDENTITY and QC_E2E_PASSWORD are required for the current-content audit',
  );
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(identity ?? '');
  await page.getByLabel('Password', { exact: true }).fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function assertNoPageOverflow(page: Page, label: string): Promise<void> {
  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(metrics.documentWidth, `${label}: document overflow`).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
  expect(metrics.bodyWidth, `${label}: body overflow`).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
}

async function assertInsideViewport(target: Locator, page: Page, label: string): Promise<void> {
  await expect(target.first(), `${label} is visible`).toBeVisible();
  const box = await target.first().boundingBox();
  expect(box, `${label} has a bounding box`).not.toBeNull();
  const viewport = page.viewportSize();
  expect(box!.x, `${label} starts inside viewport`).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width, `${label} ends inside viewport`).toBeLessThanOrEqual(
    (viewport?.width ?? 0) + 1,
  );
}

async function assertContainedTables(page: Page, label: string): Promise<void> {
  const wrappers = page.locator('.table-wrap, .table-scroll');
  for (let index = 0; index < (await wrappers.count()); index += 1) {
    const wrapper = wrappers.nth(index);
    const box = await wrapper.boundingBox();
    if (!box) continue;
    const viewport = page.viewportSize()?.width ?? 0;
    expect(box.x, `${label}: table region starts inside viewport`).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, `${label}: table region owns horizontal scroll`).toBeLessThanOrEqual(
      viewport + 1,
    );
    const state = await wrapper.evaluate((element) => {
      const table = element.querySelector('table');
      return {
        wrapperOverflow: getComputedStyle(element).overflowX,
        tableWide: Boolean(table && table.scrollWidth > element.clientWidth + 1),
      };
    });
    expect(state.wrapperOverflow, `${label}: table wrapper uses horizontal overflow`).toMatch(
      /auto|scroll/,
    );
    if (state.tableWide) expect(state.wrapperOverflow).toMatch(/auto|scroll/);
  }
}

async function assertReflowContracts(page: Page, label: string): Promise<void> {
  await assertNoPageOverflow(page, label);
  await assertContainedTables(page, label);

  for (const selector of ['fieldset', '.page-head', '.head', '.form-actions', '.actions']) {
    const items = page.locator(selector);
    for (let index = 0; index < (await items.count()); index += 1) {
      const item = items.nth(index);
      if (!(await item.isVisible().catch(() => false))) continue;
      await assertInsideViewport(item, page, `${label}: ${selector}`);
    }
  }

  const critical = page.locator('h1:visible, h2:visible, h3:visible, legend:visible, label:visible, .status-badge:visible');
  const criticalCount = Math.min(await critical.count(), 40);
  for (let index = 0; index < criticalCount; index += 1) {
    const item = critical.nth(index);
    const box = await item.boundingBox();
    if (!box) continue;
    expect(box.x, `${label}: essential text left clipping`).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, `${label}: essential text right clipping`).toBeLessThanOrEqual(
      (page.viewportSize()?.width ?? 0) + 1,
    );
    const clipped = await item.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
    expect(clipped, `${label}: essential text is clipped`).toBe(false);
  }

  const actionBars = page.locator('.form-actions, .actions, .page-head, .head');
  for (let index = 0; index < (await actionBars.count()); index += 1) {
    const bar = actionBars.nth(index);
    if (!(await bar.isVisible().catch(() => false))) continue;
    const controls = bar.locator('a, button, input, select, textarea');
    for (let child = 0; child < (await controls.count()); child += 1) {
      await assertInsideViewport(controls.nth(child), page, `${label}: action control`);
    }
  }

  const dialogs = page.locator('dialog[open], [role="dialog"]:visible');
  for (let index = 0; index < (await dialogs.count()); index += 1) {
    await assertInsideViewport(dialogs.nth(index), page, `${label}: dialog/panel`);
  }

  const bodyText = await page.locator('main').innerText().catch(() => '');
  expect(bodyText.trim().length, `${label}: current route rendered usable content`).toBeGreaterThan(30);
}

async function applyTextSpacingOverride(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      html { letter-spacing: .12em !important; word-spacing: .5em !important; }
      body, button, input, select, textarea { line-height: 1.8 !important; }
      p, h1, h2, h3, label, legend, a, button { overflow-wrap: anywhere !important; }
    `,
  });
}

test.describe('full responsive and density audit with current content', () => {
  for (const width of widths) {
    test(`all route families reflow at ${width}px`, async ({ page }) => {
      requireFixture();
      await page.setViewportSize({ width, height: heights[width] });
      await signIn(page);
      for (const path of allRoutes) {
        const response = await page.goto(path);
        expect(response?.status() ?? 0, `${path} @${width}`).toBeLessThan(500);
        expect(page.url(), `${path} @${width} must stay authenticated`).not.toMatch(/\/login/);
        await assertReflowContracts(page, `${path} @${width}`);
      }
    });
  }

  test('phone landscape and tablet landscape keep forms and tables reachable', async ({ page }) => {
    requireFixture();
    await signIn(page);
    for (const viewport of [
      { width: 812, height: 375, label: 'phone-landscape' },
      { width: 1024, height: 768, label: 'tablet-landscape' },
    ]) {
      await page.setViewportSize(viewport);
      for (const path of ['/dashboard', '/tasks', '/quarantine/receiving/new', '/laboratory/tests']) {
        await page.goto(path);
        await assertReflowContracts(page, `${path} ${viewport.label}`);
      }
    }
  });

  for (const direction of ['ltr', 'rtl'] as const) {
    test(`200% browser-scale reflow preserves focusable content (${direction})`, async ({ page }) => {
      requireFixture();
      await page.setViewportSize({ width: 1024, height: 900 });
      await signIn(page);
      for (const path of ['/dashboard', '/tasks', '/quarantine/receiving/new', '/documents']) {
        await page.goto(path);
        await page.locator('html').evaluate((html, dir) => html.setAttribute('dir', dir), direction);
        await page.evaluate(() => {
          document.documentElement.style.zoom = '2';
        });
        await assertReflowContracts(page, `${path} @200% ${direction}`);
        await page.evaluate(() => {
          document.documentElement.style.zoom = '';
        });
      }
    });
  }

  test('browser text-spacing overrides do not clip essential content', async ({ page }) => {
    requireFixture();
    await page.setViewportSize({ width: 375, height: 812 });
    await signIn(page);
    for (const path of ['/dashboard', '/tasks', '/quality/findings', '/documents', '/approvals']) {
      await page.goto(path);
      await applyTextSpacingOverride(page);
      await assertReflowContracts(page, `${path} text-spacing override`);
    }
  });

  for (const density of ['comfortable', 'standard', 'compact'] as const) {
    test(`${density} density keeps controls readable and reachable`, async ({ page }) => {
      requireFixture();
      await page.setViewportSize({ width: 375, height: 812 });
      await signIn(page);
      for (const path of ['/dashboard', '/tasks', '/quarantine/receiving/new', '/laboratory/tests']) {
        await page.goto(path);
        await page.locator('html').evaluate((html, value) => html.setAttribute('data-density', value), density);
        await assertReflowContracts(page, `${path} ${density}`);
        const controls = page.locator('button:visible, input:visible, select:visible, textarea:visible');
        for (let index = 0; index < Math.min(await controls.count(), 60); index += 1) {
          const box = await controls.nth(index).boundingBox();
          if (!box) continue;
          expect(box.height, `${path} ${density}: control hit target`).toBeGreaterThanOrEqual(40);
        }
      }
    });
  }

  test('mobile drawer is reachable, contained, and does not obscure focused content', async ({ page }) => {
    requireFixture();
    await page.setViewportSize({ width: 320, height: 800 });
    await signIn(page);
    await page.goto('/dashboard');
    const toggle = page.getByRole('button', { name: /open navigation/i });
    await assertInsideViewport(toggle, page, 'mobile navigation toggle');
    await toggle.click();
    const drawer = page.locator('#primary-navigation');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await assertInsideViewport(drawer, page, 'mobile drawer');
    await expect(drawer.locator('a[href]').first()).toBeFocused();
    await assertNoPageOverflow(page, 'mobile drawer open');
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });
});
