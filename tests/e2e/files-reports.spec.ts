import { expect, test, type Page } from '@playwright/test';

const UUID = '01900000-0000-7000-0000-0000000000f1';
const SENSITIVE = /password_hash|session|token|storage_key|DATABASE_URL|private-bucket/i;

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
  await page.getByLabel('Password').fill(credential);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function action(request: Page['request'], name: string, body: Record<string, unknown>) {
  const response = await request.post(`/_actions/${name}`, {
    headers: { origin: 'http://127.0.0.1:4321' },
    data: body,
  });
  return { response, text: await response.text() };
}

test.describe('files, evidence, reports, and exports security', () => {
  test('unauthenticated file and report surfaces never reveal existence or content', async ({ request, page }) => {
    for (const path of [`/files/${UUID}`, `/api/files/${UUID}`, '/reports', '/reports/quarantine-aging']) {
      const response = await page.goto(path);
      const status = response?.status() ?? 0;
      expect(status, path).toBeGreaterThanOrEqual(200);
      if (status < 400) expect(page.url(), path).toMatch(/\/login\?returnTo=/);
      expect(await page.content(), path).not.toMatch(SENSITIVE);
    }
    for (const name of ['reports.exportReport', 'files.download', 'files.upload']) {
      const result = await action(request, name, { id: UUID, reportCode: 'quarantine-aging', format: 'CSV' });
      expect(result.response.status(), name).toBeGreaterThanOrEqual(400);
      expect(result.text, name).not.toMatch(SENSITIVE);
    }
  });

  test('a user cannot download evidence outside the authorized subject scope', async ({ page, request }) => {
    await signIn(page);
    const fileId = configuredFixture('QC_E2E_UNAUTHORIZED_FILE_ID');
    const result = await action(request, 'files.download', { fileId, evidenceId: UUID });
    expect(result.response.status()).toBeGreaterThanOrEqual(400);
    expect(result.text).not.toMatch(/raw bytes|unauthorized subject|storage_key/i);
  });

  test('server detects a hash-mismatched evidence fixture before returning bytes', async ({ page, request }) => {
    await signIn(page);
    const evidenceId = configuredFixture('QC_E2E_TAMPERED_EVIDENCE_ID');
    const result = await action(request, 'files.download', { evidenceId });
    expect(result.response.status()).toBeGreaterThanOrEqual(400);
    expect(result.text).not.toMatch(/tampered|raw bytes|storage_key/i);
  });

  test('report screen and authorized export use the same scoped dataset', async ({ page, request }) => {
    await signIn(page);
    await page.goto('/reports/quarantine-aging');
    const toolbar = await page.locator('.toolbar').innerText();
    const screenCount = Number(toolbar.match(/(\d+) authorized rows/)?.[1]);
    expect(Number.isInteger(screenCount)).toBe(true);

    const result = await action(request, 'reports.exportReport', {
      reportCode: 'quarantine-aging',
      format: 'CSV',
    });
    expect(result.response.ok()).toBe(true);
    const payload = JSON.parse(result.text) as { data?: { rowCount?: number; contentBase64?: string }; rowCount?: number; contentBase64?: string };
    const data = payload.data ?? payload;
    expect(data.rowCount).toBe(screenCount);
    const csv = Buffer.from(data.contentBase64 ?? '', 'base64').toString('utf8');
    expect(csv).not.toMatch(/(^|[\r\n],?)[=+\-@][^\r\n]*/);
    expect(csv).not.toMatch(SENSITIVE);
  });

  test('spreadsheet exports neutralize formula-like values and do not leak unauthorized rows', async ({ page, request }) => {
    await signIn(page);
    const result = await action(request, 'reports.exportReport', {
      reportCode: configuredFixture('QC_E2E_FORMULA_REPORT_CODE'),
      format: 'CSV',
    });
    expect(result.response.ok()).toBe(true);
    const payload = JSON.parse(result.text) as { data?: { contentBase64?: string }; contentBase64?: string };
    const csv = Buffer.from((payload.data ?? payload).contentBase64 ?? '', 'base64').toString('utf8');
    for (const line of csv.split(/\r?\n/)) {
      for (const cell of line.split(',')) expect(cell.trimStart()).not.toMatch(/^[=+\-@]/);
    }
    expect(csv).not.toContain('OUT_OF_SCOPE_FIXTURE');
  });
});
