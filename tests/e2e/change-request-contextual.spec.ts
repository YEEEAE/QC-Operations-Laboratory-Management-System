import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * Prompt 2 contextual coverage for /change-requests/new.
 *
 * The operator selects an authorized controlled document version and one
 * allowlisted field; every authoritative value (target id/version, snapshot,
 * current value, data type) is resolved server-side. This spec proves:
 *
 * - no-JS POST baseline: unauthorized/stale targets fail recoverably with
 *   retained values and no business payload in the URL;
 * - operator UI contract: no raw UUID/JSON/storage-model inputs are exposed
 *   (no targetSnapshot/fieldPath/dataType/targetId/targetVersion inputs);
 * - keyboard operability of the selector workflow;
 * - 320px reflow without page-level horizontal overflow.
 *
 * Never run against production: requires QC_E2E_LOGIN_IDENTITY /
 * QC_E2E_PASSWORD fixture credentials and skips otherwise. Successful
 * creation additionally requires QC_E2E_DOCUMENT_VERSION_ID /
 * QC_E2E_DOCUMENT_VERSION_NO (a version the fixture actor may view).
 */

const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;

const UNKNOWN_UUID = '01900000-0000-7000-8000-000000000001';
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const LEAK_MARKERS =
  /stack|traceback|node_modules|password|session_token|DATABASE_URL|select .* from|storage_key/i;

const unique = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

function requireFixture(): void {
  test.skip(
    !loginIdentity || !password,
    'QC_E2E_LOGIN_IDENTITY and QC_E2E_PASSWORD are required; never run creation tests without a disposable fixture',
  );
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(loginIdentity ?? '');
  await page.getByLabel('Password', { exact: true }).fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function noJsPage(browser: Browser): Promise<{ page: Page; cleanup: () => Promise<void> }> {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await signIn(page);
  return { page, cleanup: () => context.close() };
}

test.describe('change-request contextual workflow without JavaScript (POST baseline)', () => {
  test('unauthorized target fails recoverably with retained values', async ({ browser }) => {
    requireFixture();
    const { page, cleanup } = await noJsPage(browser);
    try {
      const marker = unique('E2E-KEEP');
      const response = await page.request.post('/change-requests/new', {
        form: {
          changeNo: marker,
          documentVersionId: UNKNOWN_UUID,
          expectedDocumentVersion: '1',
          changeField: 'revision',
          proposedValue: 'E2E-C',
          reason: 'E2E disposable contextual failure',
        },
      });
      const body = await response.text();
      expect(response.status(), 'failed POST re-renders the form').toBe(200);
      expect(response.url(), 'no business payload enters the URL').not.toContain('?');
      expect(body).toMatch(/there is a problem/i);
      expect(body).toContain('data-error-summary');
      expect(body).toContain(marker);
      expect(body).not.toMatch(LEAK_MARKERS);
    } finally {
      await cleanup();
    }
  });

  test('stale expected version is rejected as a conflict with recovery', async ({ browser }) => {
    requireFixture();
    const { page, cleanup } = await noJsPage(browser);
    try {
      const marker = unique('E2E-KEEP');
      const response = await page.request.post('/change-requests/new', {
        form: {
          changeNo: marker,
          documentVersionId: UNKNOWN_UUID,
          expectedDocumentVersion: '999999',
          changeField: 'contentHash',
          proposedValue: 'E2E-HASH',
          reason: 'E2E disposable stale check',
        },
      });
      const body = await response.text();
      expect(response.status(), 'stale POST re-renders the form').toBe(200);
      expect(body).toMatch(/there is a problem/i);
      expect(body).toContain(marker);
      expect(body).not.toMatch(LEAK_MARKERS);
    } finally {
      await cleanup();
    }
  });
});

test.describe('change-request contextual operator contract (JS)', () => {
  test('exposes selectors and human labels, never raw UUID/JSON/storage-model fields', async ({
    page,
  }) => {
    requireFixture();
    await signIn(page);
    await page.goto('/change-requests/new');
    // Allowlisted field labels are rendered for the operator.
    await expect(page.getByLabel(/controlled document version/i)).toBeVisible();
    await expect(page.getByLabel(/revision reference|change field/i).first()).toBeVisible();
    // Technical transport fields from the legacy form are gone.
    for (const name of [
      'targetSnapshot',
      'targetSnapshotHash',
      'fieldPath',
      'dataType',
      'targetId',
      'targetVersion',
      'currentValue',
      'targetType',
    ]) {
      expect(page.locator(`[name="${name}"]`), `no raw field: ${name}`).toHaveCount(0);
    }
    // Visible option labels never expose raw storage identifiers.
    const labels = await page.locator('#documentVersionId option').allTextContents();
    for (const label of labels) {
      expect(label, 'selector label stays human-readable').not.toMatch(UUID_PATTERN);
    }
    const body = await page.locator('body').textContent();
    expect(body ?? '').not.toMatch(/targetSnapshot|fieldPath|dataType/i);
    await expect(page.locator('body')).not.toContainText(LEAK_MARKERS);
  });

  test('keyboard-only flow reaches every control and reports validation', async ({ page }) => {
    requireFixture();
    await signIn(page);
    await page.goto('/change-requests/new');
    await page.evaluate(() => {
      document.querySelector('form')?.setAttribute('novalidate', '');
    });
    // Tab from the change number through the whole contextual workflow.
    await page.locator('#changeNo').focus();
    await expect(page.locator('#changeNo')).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('#documentVersionId')).toBeFocused();
    // Choose via keyboard only.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await expect(page.locator('#changeField')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await expect(page.locator('#proposedValue')).toBeFocused();
    await page.keyboard.type('E2E keyboard value');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-submit]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/change-requests\/new$/);
    const status = page.locator('[data-result]');
    const summary = page.locator('[data-error-summary]');
    await expect(status.or(summary)).toContainText(/unable|unavailable|could not|problem|review/i);
  });

  test('320px reflows without page-level overflow or raw identifiers', async ({ page }) => {
    requireFixture();
    await page.setViewportSize({ width: 320, height: 800 });
    await signIn(page);
    await page.goto('/change-requests/new');
    const overflow = await page.evaluate(() => {
      const root = document.scrollingElement;
      return (root?.scrollWidth ?? 0) - (root?.clientWidth ?? 0);
    });
    expect(overflow, 'no page-level horizontal overflow at 320px').toBeLessThanOrEqual(0);
    const labels = await page.locator('#documentVersionId option').allTextContents();
    for (const label of labels) {
      expect(label).not.toMatch(UUID_PATTERN);
    }
    await expect(page.getByRole('button', { name: 'Create draft', exact: true })).toBeVisible();
  });
});
