import { expect, test } from '@playwright/test';

/**
 * Deployed build-identity verification (Prompt 12 / C-11).
 *
 * C-11 passes only when three samples are identical: the identity captured
 * at the START of the live run, the identity captured at the END of the
 * live run (detects a mid-run redeploy), and the expected identity from the
 * release evidence package (ledger). Any absence or mismatch fails closed —
 * blocked or incomplete means NOT VERIFIED, never PASS.
 *
 * Read-only: no business mutations are submitted. Secrets are never
 * recorded; only server-derived build metadata is asserted.
 */
test.describe('Deployed build identity (fail-closed C-11)', () => {
  test.describe.configure({ timeout: 120000 });

  test('unauthenticated build-identity API is denied without leaking identity', async ({
    page,
  }) => {
    const response = await page.request.get('/api/system/release-identity');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).not.toHaveProperty('release');
    expect(JSON.stringify(body)).not.toContain('rel-');
  });

  test('gated: visible and API identity equal the release ledger at start and end', async ({
    page,
  }) => {
    const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
    const password = process.env.QC_E2E_LOGIN_PASSWORD;
    const expected = {
      releaseId: process.env.QC_E2E_EXPECTED_RELEASE_ID,
      buildId: process.env.QC_E2E_EXPECTED_BUILD_ID,
      gitSha: process.env.QC_E2E_EXPECTED_GIT_SHA,
      buildTimestamp: process.env.QC_E2E_EXPECTED_BUILD_TIMESTAMP,
      environment: process.env.QC_E2E_EXPECTED_ENVIRONMENT,
    };
    test.skip(
      !loginIdentity ||
        !password ||
        !expected.releaseId ||
        !expected.buildId ||
        !expected.gitSha ||
        !expected.buildTimestamp ||
        !expected.environment,
      'Requires an authorized fixture plus the expected release-ledger identity (no production mutations).',
    );

    await page.goto('/login');
    await page.getByLabel('Login identity').fill(loginIdentity ?? '');
    await page.getByLabel('Password', { exact: true }).fill(password ?? '');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // START sample: server-derived identity only, never browser input.
    const startResponse = await page.request.get('/api/system/release-identity');
    expect(startResponse.status()).toBe(200);
    const start = ((await startResponse.json()) as { release: Record<string, string> }).release;
    for (const [field, value] of Object.entries(expected)) {
      expect(start[field === 'releaseId' ? 'id' : field]).toBe(value);
    }

    // Visible surface must equal the API surface on the same build.
    await page.goto('/system/health');
    const panel = page.getByTestId('release-identity');
    await expect(panel).toBeVisible();
    const visible = async (field: string) =>
      (await panel.locator(`[data-release-field="${field}"]`).innerText()).trim();
    expect(await visible('releaseId')).toBe(start.id);
    expect(await visible('buildId')).toBe(start.buildId);
    expect(await visible('gitSha')).toBe(start.gitSha);
    expect(await visible('buildTimestamp')).toBe(start.buildTimestamp);
    expect(await visible('environment')).toBe(start.environment);

    // Read-only traversal between samples; the build must not change under us.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/audit');
    await expect(page).toHaveURL(/\/audit/);

    // END sample: any drift fails the run (possible redeploy).
    const endResponse = await page.request.get('/api/system/release-identity');
    expect(endResponse.status()).toBe(200);
    const end = ((await endResponse.json()) as { release: Record<string, string> }).release;
    expect(end).toEqual(start);
    for (const [field, value] of Object.entries(expected)) {
      expect(end[field === 'releaseId' ? 'id' : field]).toBe(value);
    }
  });
});
