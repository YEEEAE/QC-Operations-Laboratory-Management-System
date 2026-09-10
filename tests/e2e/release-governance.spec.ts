import { expect, test } from '@playwright/test';

test.describe('Production release governance (fail-closed)', () => {
  // Login rendering is slow in software-GL headless environments (known 3D-background limitation).
  test.describe.configure({ timeout: 120000 });

  test('redirects unauthenticated users from the release approval workspace', async ({ page }) => {
    await page.goto('/governance/releases/01900000-0000-7000-8000-00000000aa01');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fgovernance%2Freleases/);
  });

  test('never exposes an enabled approval action without a session', async ({ page }) => {
    await page.goto('/governance/releases/01900000-0000-7000-8000-00000000aa01');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('body')).not.toContainText('Approve release');
  });

  test('gated: authorized release approval stays disabled until every gate is PASS', async ({ page }) => {
    const identity = process.env.QC_E2E_LOGIN_IDENTITY;
    const password = process.env.QC_E2E_LOGIN_PASSWORD;
    const releaseId = process.env.QC_E2E_RELEASE_CANDIDATE_ID;
    test.skip(!identity || !password || !releaseId, 'Requires an authorized fixture and a PENDING release candidate (no production mutations).');
    await page.goto(`/governance/releases/${releaseId}`);
    await expect(page.locator('body')).toContainText('Production release approval');
    // Fail-closed UI: the approval action is disabled until all eight gates are confirmed.
    const submit = page.locator('[data-submit]');
    await expect(submit).toBeDisabled();
    const gates = page.locator('[data-gate]');
    await expect(gates).toHaveCount(8);
    for (const gate of await gates.all()) {
      await gate.check();
    }
    await expect(submit).toBeEnabled();
  });
});
