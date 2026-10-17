import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { expect, test, type Page } from '@playwright/test';

const baseURL = process.env.QC_NCR_E2E_BASE_URL ?? 'http://127.0.0.1:4321';
const identity = process.env.QC_NCR_E2E_LOGIN_IDENTITY;
const password = process.env.QC_NCR_E2E_PASSWORD;
const findingId = process.env.QC_NCR_E2E_FINDING_ID;
const otherFindingId = process.env.QC_NCR_E2E_OTHER_FINDING_ID;
const databaseUrl = process.env.QC_TEST_DATABASE_URL;

test.describe.configure({ mode: 'serial' });

async function dbQuery<T extends Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  if (!databaseUrl) throw new Error('QC_TEST_DATABASE_URL is required.');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    return (await pool.query<T>(text, values)).rows;
  } finally {
    await pool.end();
  }
}

async function postNative(
  page: Page,
  body: Record<string, string>,
): Promise<{ url: string; status: number; text: string }> {
  return page.evaluate(async (payload) => {
    const response = await fetch('/quality/ncr/new', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload).toString(),
    });
    return { url: response.url, status: response.status, text: await response.text() };
  }, body);
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(identity ?? '');
  await page.getByLabel('Password', { exact: true }).fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
}

const form = (intentId: string, ncrNo: string) => ({
  intentId,
  findingId: findingId ?? '',
  ncrNo,
  title: 'Recorded nonconformance from finding',
  description: 'Draft NCR created from an authorized finding.',
  affectedItemCode: 'ITEM-E2E',
  affectedLot: 'LOT-E2E',
});

test.use({ baseURL });

test.describe('CA-F-01 NCR creation from an authorized finding', () => {
  test.skip(
    !baseURL || !identity || !password || !findingId || !databaseUrl,
    'Disposable NCR E2E environment is required.',
  );

  test('creates a draft, links the finding, and appears in register and detail', async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`/quality/findings/${findingId}`);
    await page.getByRole('link', { name: 'Create NCR' }).click();
    await expect(page).toHaveURL(/\/quality\/ncr\/new/);
    await expect(page.locator('#findingId')).toHaveValue(findingId ?? '');
    await expect(page.locator('[data-finding-context]')).toBeVisible();
    await expect(page.locator('[data-context="number"]')).not.toBeEmpty();

    const ncrNo = `E2E-NCR-${randomUUID().slice(0, 8)}`;
    await page.getByLabel('NCR number').fill(ncrNo);
    await page.getByLabel('Title', { exact: true }).fill('Recorded E2E nonconformance');
    await page
      .getByLabel('Description', { exact: true })
      .fill('Draft NCR created from an authorized finding.');
    await page.getByLabel(/Affected item code/).fill('ITEM-E2E');
    await page.getByLabel(/Affected lot/).fill('LOT-E2E');
    const [created] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/quality/ncr/new',
      ),
      page.getByRole('button', { name: 'Create NCR' }).click(),
    ]);
    expect(created.status()).toBe(303);
    await expect(page).toHaveURL(/\/quality\/ncr\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(ncrNo);
    await expect(page.getByRole('heading', { name: 'Source finding' })).toBeVisible();
    const ncrUrl = page.url();
    const ncrId = ncrUrl.split('/').at(-1) ?? '';

    const audit = await dbQuery<{ action: string; new_state: string; request_id: string }>(
      `SELECT action, new_state, request_id FROM qc.audit_events
       WHERE subject_type = 'NCR' AND subject_id = $1`,
      [ncrId],
    );
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ action: 'CREATE', new_state: 'DRAFT' });

    await page.goto('/quality/ncr');
    const row = page.getByRole('row').filter({ hasText: ncrNo });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Draft');
    await row.getByRole('link', { name: ncrNo }).click();
    await expect(page).toHaveURL(new RegExp(`/quality/ncr/${ncrId}$`));
  });

  test('native POST replay returns the same record and conflicting replay is rejected', async ({
    page,
  }) => {
    await signIn(page);
    const ncrNo = `E2E-REPLAY-${randomUUID().slice(0, 8)}`;
    const intentId = randomUUID();
    const body = form(intentId, ncrNo);
    const first = await postNative(page, body);
    expect(new URL(first.url).pathname).toMatch(/^\/quality\/ncr\/[0-9a-f-]{36}$/);
    const location = new URL(first.url).pathname;

    const second = await postNative(page, body);
    expect(new URL(second.url).pathname).toBe(location);

    const records = await dbQuery<{ id: string }>(
      `SELECT id FROM qc.ncrs WHERE ncr_no = $1 AND finding_id = $2`,
      [ncrNo, findingId],
    );
    expect(records).toHaveLength(1);
    expect(`/quality/ncr/${records[0]!.id}`).toBe(location);
    const idempotency = await dbQuery<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.idempotency_records WHERE key LIKE $1`,
      [`ncr-create:%:${intentId}`],
    );
    expect(idempotency[0]?.count).toBe('1');

    const conflicting = await postNative(page, {
      ...body,
      title: 'Different intent with the same key',
    });
    expect(new URL(conflicting.url).pathname).toBe('/quality/ncr/new');
    expect(conflicting.text).toContain('conflicts with an existing record');
    const after = await dbQuery<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.ncrs WHERE ncr_no = $1`,
      [ncrNo],
    );
    expect(after[0]?.count).toBe('1');
  });

  test('native POST preserves values and rejects tampered owner, missing and out-of-scope sources', async ({
    page,
  }) => {
    await signIn(page);
    const attempts = [
      { ...form(randomUUID(), `E2E-OWNER-${randomUUID().slice(0, 8)}`), ownerId: randomUUID() },
      { ...form(randomUUID(), `E2E-MISSING-${randomUUID().slice(0, 8)}`), findingId: randomUUID() },
      {
        ...form(randomUUID(), `E2E-SCOPE-${randomUUID().slice(0, 8)}`),
        findingId: otherFindingId ?? randomUUID(),
      },
    ];
    for (const body of attempts) {
      const response = await postNative(page, body);
      expect(new URL(response.url).pathname).toBe('/quality/ncr/new');
      expect(response.text).toContain('could not be created');
      expect(response.text).toContain(`value="${body.ncrNo}"`);
      const rows = await dbQuery<{ count: string }>(
        `SELECT count(*)::text AS count FROM qc.ncrs WHERE ncr_no = $1`,
        [body.ncrNo],
      );
      expect(rows[0]?.count).toBe('0');
    }
  });

  test('submits the native POST baseline without JavaScript', async ({ browser, page }) => {
    await signIn(page);
    const state = await page.context().storageState();
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      storageState: state,
    });
    try {
      const noJs = await context.newPage();
      const ncrNo = `E2E-NOJS-${randomUUID().slice(0, 8)}`;
      await noJs.goto(`/quality/ncr/new?findingId=${findingId}`);
      await noJs.getByLabel('NCR number').fill(ncrNo);
      await noJs.getByLabel('Title', { exact: true }).fill('No-JS native NCR');
      await noJs.getByLabel('Description', { exact: true }).fill('Native POST without JavaScript.');
      await noJs.getByRole('button', { name: 'Create NCR' }).click();
      await expect(noJs).toHaveURL(/\/quality\/ncr\/[0-9a-f-]{36}$/);
      await expect(noJs.getByRole('heading', { level: 1 })).toHaveText(ncrNo);
    } finally {
      await context.close();
    }
  });
});
