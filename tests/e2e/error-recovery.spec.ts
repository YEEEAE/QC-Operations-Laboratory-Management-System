import { expect, test, type Page } from '@playwright/test';

const UNKNOWN_ID = '01900000-0000-7000-0000-0000000000f1';
const LEAK_MARKERS =
  /stack|traceback|node_modules|password|session_token|DATABASE_URL|select .* from|storage_key/i;
const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;

function requireAuthenticatedFixture(): void {
  test.skip(
    !loginIdentity || !password,
    'QC_E2E_LOGIN_IDENTITY and QC_E2E_PASSWORD are required for authenticated failure coverage',
  );
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(loginIdentity ?? '');
  await page.getByLabel('Password').fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('safe error and recovery behavior', () => {
  test('unknown routes are safe 404s without stack or sensitive internals', async ({ request }) => {
    const response = await request.get('/definitely-not-a-page-master034');
    const body = await response.text();
    expect(response.status()).toBe(404);
    expect(body).toMatch(/could not find that page/i);
    expect(body).not.toMatch(LEAK_MARKERS);
  });

  test('500 error surface has a request reference and no stack trace', async ({ request }) => {
    const response = await request.get('/500');
    const body = await response.text();
    expect(response.status()).toBeGreaterThanOrEqual(500);
    expect(body).toMatch(/something interrupted this request/i);
    expect(body).toMatch(/reference:/i);
    expect(body).not.toMatch(LEAK_MARKERS);
    expect(body).not.toMatch(/at .+\(\//);
  });

  test('readiness dependency failure is explicit and sanitized', async ({ request }) => {
    const response = await request.get('/api/health/ready');
    const body = await response.text();
    expect([200, 503]).toContain(response.status());
    expect(response.headers()['content-type']).toContain('application/json');
    expect(body).not.toMatch(LEAK_MARKERS);
    if (response.status() === 503) expect(body).toMatch(/unhealthy|not ready/i);
  });

  test('IDOR-shaped unauthenticated requests do not reveal record existence', async ({
    request,
  }) => {
    for (const path of [
      `/documents/${UNKNOWN_ID}`,
      `/laboratory/tests/${UNKNOWN_ID}`,
      `/approvals/${UNKNOWN_ID}`,
      `/api/files/${UNKNOWN_ID}`,
    ]) {
      const response = await request.get(path, { maxRedirects: 0 });
      const body = await response.text();
      expect(response.status(), path).toBeGreaterThanOrEqual(300);
      expect(body, path).not.toMatch(/APPROVED|RELEASED|inspection_result|release_system/i);
      expect(body, path).not.toMatch(LEAK_MARKERS);
    }
  });

  test('stale controlled command is rejected rather than retried as an overwrite when fixture exists', async ({
    page,
  }) => {
    requireAuthenticatedFixture();
    const staleTaskId = process.env.QC_E2E_STALE_TASK_ID;
    test.skip(!staleTaskId, 'QC_E2E_STALE_TASK_ID is required for stale-version E2E injection');
    await signIn(page);

    const response = await page.request.post('/_actions/tasks.transition', {
      data: { taskId: staleTaskId, expectedVersion: '0', action: 'START' },
    });
    const body = await response.text();
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(body).toMatch(/STALE|CONFLICT|version|not applied/i);
    expect(body).not.toMatch(LEAK_MARKERS);
  });

  test('AI provider degradation is announced without turning advisory into authority', async ({
    page,
  }) => {
    requireAuthenticatedFixture();
    await signIn(page);
    await page.goto('/ai-advisory');
    const request = page.waitForRequest((candidate) => candidate.url().includes('/_actions/'));
    await page.route('**/_actions/**', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'SYSTEM_AI_UNAVAILABLE', requestId: 'e2e-ai-degraded' }),
      });
    });
    const form = page.locator('[data-advisory-request]');
    await form.getByLabel('Question / prompt').fill('Summarize this authorized context.');
    await form.getByRole('button', { name: 'Request advisory' }).click();
    await request;
    await expect(page.getByText('Advisory unavailable.')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(
      /approve with ai|release using ai|official pass|official fail/i,
    );
  });
});
