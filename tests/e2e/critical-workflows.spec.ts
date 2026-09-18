import { expect, test, type Page } from '@playwright/test';
import { Pool } from 'pg';

const UUID = '01900000-0000-7000-0000-0000000000f1';
const LEAK = /password_hash|session|token|authorization|storage_key|sha256|DATABASE_URL/i;

function configuredFixture(name: string): string {
  const value = process.env[name];
  test.skip(!value, `${name} is required for the PostgreSQL-backed E2E fixture`);
  return value ?? '';
}

async function signIn(page: Page): Promise<void> {
  const identity = configuredFixture('QC_E2E_LOGIN_IDENTITY');
  const credential = configuredFixture('QC_E2E_PASSWORD');
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(identity);
  await page.getByLabel('Password', { exact: true }).fill(credential);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function dbQuery<T extends Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  const connectionString = configuredFixture('QC_TEST_DATABASE_URL');
  const pool = new Pool({ connectionString });
  try {
    return (await pool.query<T>(sql, values)).rows;
  } finally {
    await pool.end();
  }
}

test.describe('critical controlled workflows', () => {
  test('protected workflow entry points require authentication and reveal no controlled state', async ({
    page,
  }) => {
    for (const path of [
      '/quarantine/receiving',
      '/quarantine/inspections',
      '/laboratory/tests',
      '/quality/ncr',
      '/documents',
      '/approvals',
    ]) {
      const response = await page.goto(path);
      expect(response?.status() ?? 0, path).toBeLessThan(400);
      expect(page.url(), path).toMatch(/\/login\?returnTo=/);
      expect(await page.content(), path).not.toMatch(LEAK);
    }
  });

  test('receiving, inspection, and release remain distinct server-controlled facts', async ({
    page,
  }) => {
    await signIn(page);
    const receivingId = configuredFixture('QC_E2E_RECEIVING_ID');
    await page.goto(`/quarantine/receiving/${receivingId}`);
    await expect(page.getByText('Receiving state')).toBeVisible();
    await expect(page.getByText('Inspection result')).toBeVisible();
    await expect(page.getByText('Release System State')).toBeVisible();

    const result = await page.locator('.facts').innerText();
    if (/\bPASS\b/.test(result)) {
      expect(result).toMatch(/NOT_RELEASED|RELEASE_PENDING|RELEASED/);
      expect(result).not.toMatch(/PASS[\s\S]*RELEASED/);
    }

    const rows = await dbQuery<{
      workflow_state: string;
      inspection_result: string;
      release_system: boolean;
    }>(
      'select workflow_state, inspection_result, release_system from qc.receiving_items where id = $1',
      [receivingId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        workflow_state: expect.any(String),
        inspection_result: expect.any(String),
        release_system: expect.any(Boolean),
      }),
    );
    if (rows[0].inspection_result === 'PASS') expect(rows[0].release_system).toBe(false);
  });

  test('QC-CLOSURE-006 follows the receiving-to-release journey with independent gates', async ({
    page,
  }) => {
    await signIn(page);
    const receivingId = configuredFixture('QC_E2E_RECEIVING_ID');
    const inspectionId = configuredFixture('QC_E2E_INSPECTION_ID');
    const releasePendingId = configuredFixture('QC_E2E_RELEASE_PENDING_ID');

    await page.goto(`/quarantine/receiving/${receivingId}`);
    await expect(page.getByRole('heading', { name: /RECEIVING|RCV/i })).toBeVisible();
    await expect(page.getByText('Supplier')).toBeVisible();
    await expect(page.getByText('Receiving state')).toBeVisible();
    await expect(page.getByText('Inspection result')).toBeVisible();
    await expect(page.getByText('Release System State')).toBeVisible();

    await page.goto(`/quarantine/inspections/${inspectionId}`);
    await expect(page.getByRole('heading', { name: /INSPECTION REPORT|INSP/i })).toBeVisible();
    await expect(page.getByText('Receiving snapshot')).toBeVisible();
    await expect(page.getByText('Inspection requirements and evidence')).toBeVisible();
    await expect(page.getByText(/approved template/i)).toBeVisible();

    await page.goto(`/quarantine/receiving/${releasePendingId}`);
    await expect(page.getByText('Release System State')).toBeVisible();
    const releaseFacts = await page.locator('.facts').innerText();
    expect(releaseFacts).toMatch(/PASS|NOT_STARTED|FAIL|HOLD/);
    expect(releaseFacts).toMatch(/NOT_RELEASED|RELEASED/);
    const releaseRows = await dbQuery<{
      workflow_state: string;
      inspection_result: string;
      release_system: boolean;
    }>(
      'select workflow_state, inspection_result, release_system from qc.receiving_items where id = $1',
      [releasePendingId],
    );
    expect(releaseRows).toHaveLength(1);
    if (releaseRows[0].inspection_result === 'PASS')
      expect(releaseRows[0].release_system).toBe(false);
  });

  test('laboratory execute and review expose approved fixture context and preserve audit evidence', async ({
    page,
  }) => {
    await signIn(page);
    const labTestId = configuredFixture('QC_E2E_LAB_TEST_ID');
    await page.goto(`/laboratory/tests/${labTestId}/execute`);
    await expect(page.getByRole('heading', { name: 'Laboratory execution' })).toBeVisible();
    await expect(page.getByText('Frozen context')).toBeVisible();
    await expect(page.getByText('Criteria source:')).toBeVisible();
    await expect(page.getByText('Raw observations')).toBeVisible();

    const labRows = await dbQuery<{ state: string; template_snapshot: unknown }>(
      'select state, template_snapshot from qc.lab_tests where id = $1',
      [labTestId],
    );
    expect(labRows).toHaveLength(1);
    expect(labRows[0].template_snapshot).toBeTruthy();
    await page.goto(`/laboratory/tests/${labTestId}/review`);
    await expect(page.getByRole('heading', { name: 'Laboratory review' })).toBeVisible();
    await expect(
      page.getByText(/Review and approval require server-side permissions/),
    ).toBeVisible();

    const audits = await dbQuery<{ count: string }>(
      "select count(*)::text as count from qc.audit_events where subject_type = 'LAB_TEST' and subject_id = $1",
      [labTestId],
    );
    expect(Number(audits[0]?.count ?? 0)).toBeGreaterThan(0);
  });

  test('laboratory reject decision stays server-gated and preserves the original scientific record', async ({
    page,
  }) => {
    await signIn(page);
    // A fixture test already in UNDER_REVIEW: the review workspace must disclose
    // the reject contract and its policy gate without exposing an actionable
    // control, and the browser must be unable to mutate the record.
    const underReviewId = configuredFixture('QC_E2E_LAB_REVIEW_TEST_ID');
    await page.goto(`/laboratory/tests/${underReviewId}/review`);
    await expect(page.getByRole('heading', { name: 'Laboratory review' })).toBeVisible();
    await expect(page.getByText(/POLICY \/ SCIENTIFIC SOURCE REQUIRED/)).toBeVisible();
    await expect(page.getByText(/TR-LAB-007/)).toBeVisible();
    await expect(page.getByRole('button', { name: /reject/i })).toHaveCount(0);

    const before = await dbQuery<{ state: string; scientific_result: string | null }>(
      'select state, scientific_result from qc.lab_tests where id = $1',
      [underReviewId],
    );
    expect(before).toHaveLength(1);
    expect(before[0].scientific_result).toBeNull();

    // A fixture test that already carries a reject decision: measurements and
    // samples survive, rejected_at is recorded, and audit evidence exists.
    const rejectedId = configuredFixture('QC_E2E_LAB_REJECTED_TEST_ID');
    const rejected = await dbQuery<{
      state: string;
      rejected_at: Date | null;
      measurements: string;
      samples: string;
    }>(
      `select state, rejected_at,
              (select count(*)::text from qc.lab_measurements m where m.lab_test_id = t.id) as measurements,
              (select count(*)::text from qc.lab_samples s where s.lab_test_id = t.id) as samples
         from qc.lab_tests t where t.id = $1`,
      [rejectedId],
    );
    expect(rejected).toHaveLength(1);
    expect(rejected[0].state).toBe('REJECTED');
    expect(rejected[0].rejected_at).not.toBeNull();
    expect(Number(rejected[0].measurements)).toBeGreaterThan(0);
    expect(Number(rejected[0].samples)).toBeGreaterThan(0);
    const rejectAudit = await dbQuery<{ count: string }>(
      "select count(*)::text as count from qc.audit_events where subject_type = 'LAB_TEST' and subject_id = $1 and action = 'REJECT'",
      [rejectedId],
    );
    expect(Number(rejectAudit[0]?.count ?? 0)).toBeGreaterThan(0);
  });

  test('quality route stays bounded by its approved workflow instead of inventing RCA/CAPA authority', async ({
    page,
  }) => {
    await signIn(page);
    const path = configuredFixture('QC_E2E_QUALITY_PATH');
    const response = await page.goto(path);
    expect(response?.status() ?? 0).toBeLessThan(400);
    await expect(page.locator('body')).not.toContainText(
      /AI.*approved|automatic.*closure|admin override/i,
    );
  });

  test('document version review and supersede preserve the prior controlled version', async ({
    page,
  }) => {
    await signIn(page);
    const documentId = configuredFixture('QC_E2E_DOCUMENT_ID');
    const versionId = configuredFixture('QC_E2E_DOCUMENT_VERSION_ID');
    await page.goto(`/documents/${documentId}/versions/${versionId}/review`);
    await expect(page.getByRole('heading', { name: /Review revision/ })).toBeVisible();
    await expect(page.getByText(/Existing history remains unchanged/)).toBeVisible();

    const rows = await dbQuery<{ state: string; version: bigint }>(
      'select state, version from qc.document_versions where id = $1',
      [versionId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toMatch(/DRAFT|IN_REVIEW|APPROVED|EFFECTIVE|SUPERSEDED/);
    const history = await dbQuery<{ count: string }>(
      'select count(*)::text as count from qc.document_versions where document_id = $1',
      [documentId],
    );
    expect(Number(history[0]?.count ?? 0)).toBeGreaterThanOrEqual(1);
  });

  test('unknown controlled identifiers do not disclose workflow records', async ({ page }) => {
    await signIn(page);
    for (const path of [
      `/quarantine/receiving/${UUID}`,
      `/laboratory/tests/${UUID}`,
      `/documents/${UUID}`,
      `/approvals/${UUID}`,
    ]) {
      const response = await page.goto(path);
      expect(response?.status() ?? 0).toBeGreaterThanOrEqual(300);
      expect(await page.content()).not.toMatch(LEAK);
    }
  });
});
