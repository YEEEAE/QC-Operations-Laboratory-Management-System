import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * F-04 / F-05 resilience coverage for the nine Tier-2 create routes.
 *
 * - no-JS mode (`javaScriptEnabled: false` + direct form POSTs through
 *   `page.request`): exercises the real POST baseline. No Astro Action JSON,
 *   no client script involved.
 * - JS mode: progressive-enhancement path (pending state, inline errors,
 *   client redirect) with native validation disabled so the server path is
 *   exercised through the enhancement.
 * - Every successful creation uses disposable `E2E-…` identifiers and asserts
 *   the redirect carries only the new record id — never business payload.
 * - Never run against production: the suite requires explicit
 *   QC_E2E_LOGIN_IDENTITY / QC_E2E_PASSWORD fixture credentials and skips
 *   otherwise. Laboratory success additionally requires
 *   QC_E2E_LAB_TEMPLATE_VERSION_ID (an approved template version the test
 *   actor may use); its validation-failure case runs with a crafted unknown
 *   UUID instead.
 */

const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;
const LAB_TEMPLATE_VERSION_ID = process.env.QC_E2E_LAB_TEMPLATE_VERSION_ID;

const UNKNOWN_UUID = '01900000-0000-7000-8000-000000000001';
const DETAIL_ID = '[0-9a-fA-F-]{36}';
const TODAY = '2026-09-09';
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

/** Create disposable equipment through the POST baseline; return its id. */
async function createEquipment(page: Page, tag: string): Promise<string> {
  const equipmentNo = unique(`E2E-EQP-${tag}`);
  const response = await page.request.post('/assets/equipment/new', {
    form: { equipmentNo, name: `E2E disposable equipment ${tag}` },
  });
  expect(response.status(), 'equipment baseline creation').toBe(200);
  const match = response.url().match(new RegExp(`/assets/equipment/(${DETAIL_ID})$`));
  expect(match, `equipment redirect carries only the id: ${response.url()}`).not.toBeNull();
  expect(response.url()).not.toContain(equipmentNo);
  return match![1];
}

interface RouteSpec {
  path: string;
  submitName: string;
  /** Invalid payload; the retained marker is merged into `retainedField`. */
  invalidForm: Record<string, string>;
  retainedField: string;
  needsEquipment: boolean;
  needsLabTemplate: boolean;
  validForm: (tag: string, equipmentId: string) => Record<string, string>;
  detailPattern: RegExp;
}

const ROUTES: RouteSpec[] = [
  {
    path: '/tasks/new',
    submitName: 'Save Draft',
    invalidForm: {},
    retainedField: 'title',
    needsEquipment: false,
    needsLabTemplate: false,
    validForm: (tag) => ({
      taskNo: unique(`E2E-TSK-${tag}`),
      title: `E2E disposable task ${tag}`,
      priority: 'NORMAL',
    }),
    detailPattern: new RegExp(`/tasks/(${DETAIL_ID})$`),
  },
  {
    path: '/laboratory/tests/new',
    submitName: 'Save controlled draft',
    invalidForm: { templateVersionId: UNKNOWN_UUID, labTestNo: unique('E2E-LAB') },
    retainedField: 'labTestNo',
    needsEquipment: false,
    needsLabTemplate: true,
    validForm: (tag) => ({
      templateVersionId: LAB_TEMPLATE_VERSION_ID ?? UNKNOWN_UUID,
      labTestNo: unique(`E2E-LAB-${tag}`),
    }),
    detailPattern: new RegExp(`/laboratory/tests/(${DETAIL_ID})$`),
  },
  {
    path: '/assets/equipment/new',
    submitName: 'Create draft',
    invalidForm: {},
    retainedField: 'name',
    needsEquipment: false,
    needsLabTemplate: false,
    validForm: (tag) => ({
      equipmentNo: unique(`E2E-EQP-${tag}`),
      name: `E2E disposable equipment ${tag}`,
    }),
    detailPattern: new RegExp(`/assets/equipment/(${DETAIL_ID})$`),
  },
  {
    path: '/assets/calibrations/new',
    submitName: 'Create draft',
    invalidForm: {
      calibrationNo: unique('E2E-CAL'),
      equipmentId: UNKNOWN_UUID,
      calibrationDate: TODAY,
    },
    retainedField: 'calibrationNo',
    needsEquipment: true,
    needsLabTemplate: false,
    validForm: (tag, equipmentId) => ({
      calibrationNo: unique(`E2E-CAL-${tag}`),
      equipmentId,
      calibrationDate: TODAY,
    }),
    detailPattern: new RegExp(`/assets/calibrations/(${DETAIL_ID})$`),
  },
  {
    path: '/assets/maintenance/new',
    submitName: 'Create draft',
    invalidForm: {
      maintenanceNo: unique('E2E-MNT'),
      equipmentId: UNKNOWN_UUID,
      description: 'E2E disposable maintenance (invalid reference)',
    },
    retainedField: 'maintenanceNo',
    needsEquipment: true,
    needsLabTemplate: false,
    validForm: (tag, equipmentId) => ({
      maintenanceNo: unique(`E2E-MNT-${tag}`),
      equipmentId,
      description: `E2E disposable maintenance ${tag}`,
    }),
    detailPattern: new RegExp(`/assets/maintenance/(${DETAIL_ID})$`),
  },
  {
    path: '/change-requests/new',
    submitName: 'Create draft',
    invalidForm: {
      changeNo: unique('E2E-CHG'),
      targetType: 'EQUIPMENT',
      targetId: UNKNOWN_UUID,
      targetVersion: '1',
      reason: 'E2E disposable change (malformed snapshot)',
      targetSnapshot: '{oops',
      fieldPath: 'location',
      dataType: 'string',
      proposedValue: 'E2E-BAY',
    },
    retainedField: 'changeNo',
    needsEquipment: true,
    needsLabTemplate: false,
    validForm: (tag, equipmentId) => ({
      changeNo: unique(`E2E-CHG-${tag}`),
      targetType: 'EQUIPMENT',
      targetId: equipmentId,
      targetVersion: '1',
      reason: `E2E disposable change ${tag}`,
      targetSnapshot: '{}',
      fieldPath: 'location',
      dataType: 'string',
      proposedValue: 'E2E-BAY',
    }),
    detailPattern: new RegExp(`/change-requests/(${DETAIL_ID})$`),
  },
  {
    path: '/documents/new',
    submitName: 'Create catalog entry',
    invalidForm: {},
    retainedField: 'title',
    needsEquipment: false,
    needsLabTemplate: false,
    validForm: (tag) => ({
      documentNo: unique(`E2E-DOC-${tag}`),
      documentType: 'WI',
      title: `E2E disposable document ${tag}`,
    }),
    detailPattern: new RegExp(`/documents/(${DETAIL_ID})$`),
  },
  {
    path: '/quality/findings/new',
    submitName: 'Save Draft',
    invalidForm: {},
    retainedField: 'title',
    needsEquipment: false,
    needsLabTemplate: false,
    validForm: (tag) => ({
      findingNo: unique(`E2E-FND-${tag}`),
      title: `E2E disposable finding ${tag}`,
      description: `E2E disposable finding ${tag}`,
    }),
    detailPattern: new RegExp(`/quality/findings/(${DETAIL_ID})$`),
  },
  {
    path: '/quarantine/receiving/new',
    submitName: 'Create receiving item',
    invalidForm: {},
    retainedField: 'itemCode',
    needsEquipment: false,
    needsLabTemplate: false,
    validForm: (tag) => ({
      receivingNo: unique(`E2E-RCV-${tag}`),
      docNo: unique('E2E-DOC'),
      itemCode: unique('E2E-ITEM'),
      lot: unique('E2E-LOT'),
      description: `E2E disposable receiving ${tag}`,
      qty: '5',
      receivingDate: TODAY,
    }),
    detailPattern: new RegExp(`/quarantine/receiving/(${DETAIL_ID})$`),
  },
];

test.describe('create-form resilience without JavaScript (POST baseline)', () => {
  for (const route of ROUTES) {
    test(`${route.path}: validation failure renders a recoverable summary`, async ({ browser }) => {
      requireFixture();
      const { page, cleanup } = await noJsPage(browser);
      try {
        const marker = unique('E2E-KEEP');
        const response = await page.request.post(route.path, {
          form: { ...route.invalidForm, [route.retainedField]: marker },
        });
        const body = await response.text();
        expect(response.status(), 'failed POST re-renders the form').toBe(200);
        expect(response.url(), 'no business payload enters the URL').not.toContain('?');
        expect(body).toMatch(/there is a problem/i);
        expect(body).toContain('data-error-summary');
        expect(body).toContain(marker);
        expect(body).not.toMatch(LEAK_MARKERS);
        expect(body).not.toMatch(/something interrupted this request/i);
      } finally {
        await cleanup();
      }
    });

    test(`${route.path}: successful creation redirects to the new record only`, async ({
      browser,
    }) => {
      requireFixture();
      if (route.needsLabTemplate && !LAB_TEMPLATE_VERSION_ID) {
        test.skip(true, 'QC_E2E_LAB_TEMPLATE_VERSION_ID is required for laboratory creation');
      }
      const { page, cleanup } = await noJsPage(browser);
      try {
        const tag = Math.random().toString(36).slice(2, 6);
        const equipmentId = route.needsEquipment ? await createEquipment(page, tag) : '';
        const payload = route.validForm(tag, equipmentId);
        const response = await page.request.post(route.path, { form: payload });
        expect(response.status(), 'successful POST lands on the detail page').toBe(200);
        const url = response.url();
        expect(url).toMatch(route.detailPattern);
        expect(url, 'no business payload enters the URL').not.toContain('?');
        for (const value of Object.values(payload)) {
          if (value && value.length > 3 && !value.includes('-')) continue;
          if (value) expect(url).not.toContain(value);
        }
        const body = await response.text();
        expect(body).not.toMatch(LEAK_MARKERS);
      } finally {
        await cleanup();
      }
    });
  }
});

test.describe('create-form resilience with JavaScript (progressive enhancement)', () => {
  for (const route of ROUTES) {
    test(`${route.path}: validation failure stays on the form with guidance`, async ({ page }) => {
      requireFixture();
      await signIn(page);
      await page.goto(route.path);
      await page.evaluate(() => {
        document.querySelector('form')?.setAttribute('novalidate', '');
      });
      const marker = unique('E2E-KEEP');
      const invalid = { ...route.invalidForm, [route.retainedField]: marker };
      for (const [name, value] of Object.entries(invalid)) {
        await page.locator(`[name="${name}"]`).fill(value);
      }
      await page.getByRole('button', { name: route.submitName, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${route.path}$`));
      const status = page.locator('[data-result]');
      const summary = page.locator('[data-error-summary]');
      await expect(
        status.or(summary),
        'enhancement reports the failure without navigating away',
      ).toContainText(/unable|unavailable|could not|problem|review/i);
      expect(page.url()).not.toContain('?');
      await expect(page.locator('body')).not.toContainText(LEAK_MARKERS);
    });

    test(`${route.path}: successful creation redirects to the new record only`, async ({
      page,
    }) => {
      requireFixture();
      if (route.needsLabTemplate && !LAB_TEMPLATE_VERSION_ID) {
        test.skip(true, 'QC_E2E_LAB_TEMPLATE_VERSION_ID is required for laboratory creation');
      }
      await signIn(page);
      const tag = Math.random().toString(36).slice(2, 6);
      const equipmentId = route.needsEquipment ? await createEquipment(page, tag) : '';
      const payload = route.validForm(tag, equipmentId);
      await page.goto(route.path);
      for (const [name, value] of Object.entries(payload)) {
        await page.locator(`[name="${name}"]`).fill(value);
      }
      await page.getByRole('button', { name: route.submitName, exact: true }).click();
      await expect(page).toHaveURL(route.detailPattern);
      expect(page.url(), 'no business payload enters the URL').not.toContain('?');
      for (const value of Object.values(payload)) {
        if (value) expect(page.url()).not.toContain(value);
      }
      await expect(page.locator('body')).not.toContainText(LEAK_MARKERS);
    });
  }
});
