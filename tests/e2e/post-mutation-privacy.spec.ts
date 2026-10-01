import { expect, test, type Browser, type Page } from '@playwright/test';

const loginIdentity = process.env.QC_E2E_LOGIN_IDENTITY;
const password = process.env.QC_E2E_PASSWORD;
const dailyRejectId = process.env.QC_E2E_DAILY_REJECT_ID;
const issueSlipId = process.env.QC_E2E_ISSUE_SLIP_ID;
const labFinalApprovalId = process.env.QC_E2E_LAB_FINAL_APPROVAL_ID;
const testTag = `POST-${Date.now().toString(36)}`;

async function authenticatedNoJsPage(
  browser: Browser,
): Promise<{ page: Page; close: () => Promise<void> }> {
  test.skip(!loginIdentity || !password, 'Disposable authenticated E2E credentials are required.');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByLabel('Login identity').fill(loginIdentity ?? '');
  await page.getByLabel('Password', { exact: true }).fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  return { page, close: () => context.close() };
}

async function currentExpectedVersion(page: Page, path: string): Promise<string> {
  await page.goto(path);
  const html = await page.content();
  const version = html.match(/name="expectedVersion" value="([1-9]\d*)"/);
  expect(version, `POST form version exists for ${path}`).not.toBeNull();
  return version![1];
}

test.describe('POST mutation transport privacy and recovery (disposable fixtures only)', () => {
  test('daily reject entry accepts populated POST and stale replay does not append twice', async ({
    browser,
  }) => {
    test.skip(
      !dailyRejectId,
      'QC_E2E_DAILY_REJECT_ID must identify an owned disposable DRAFT record.',
    );
    const { page, close } = await authenticatedNoJsPage(browser);
    try {
      const path = `/reject-reports/daily/${dailyRejectId}`;
      const version = await currentExpectedVersion(page, path);
      const marker = `${testTag}-DAILY`;
      const form = {
        intent: 'append',
        expectedVersion: version,
        itemDescription: marker,
        rejectQty: '2',
        goodQty: '8',
        rejectReason: 'POST transport fixture',
      };
      const positive = await page.request.post(path, { form });
      expect(positive.status()).toBe(200);
      expect(positive.url()).toBe(new URL(path, positive.url()).href);
      expect(positive.url()).not.toContain('?');
      expect(positive.url()).not.toContain(marker);
      const positiveBody = await positive.text();
      expect(positiveBody).toContain(`<td>${marker}</td>`);

      const staleReplay = await page.request.post(path, { form });
      expect(staleReplay.status()).toBe(200);
      expect(staleReplay.url()).not.toContain('?');
      expect((await staleReplay.text()).match(new RegExp(`<td>${marker}</td>`, 'g'))).toHaveLength(
        1,
      );
    } finally {
      await close();
    }
  });

  test('issue-slip approval confirmation accepts POST and rejects the stale duplicate', async ({
    browser,
  }) => {
    test.skip(
      !issueSlipId,
      'QC_E2E_ISSUE_SLIP_ID must identify an owned disposable approval-tracking slip.',
    );
    const { page, close } = await authenticatedNoJsPage(browser);
    try {
      const path = `/reject-reports/issue-slips/${issueSlipId}`;
      const version = await currentExpectedVersion(page, path);
      const html = await page.content();
      const role = html.match(/name="role" value="(SUPERVISOR|QC_MANAGER|FACTORY_DIRECTOR)"/)?.[1];
      expect(role).toBeTruthy();
      const approverName = `${testTag}-APPROVER`;
      const form = { intent: 'confirm', expectedVersion: version, role: role!, approverName };
      const positive = await page.request.post(path, { form });
      expect(positive.status()).toBe(200);
      expect(positive.url()).not.toContain('?');
      expect(positive.url()).not.toContain(approverName);
      expect(
        (await positive.text()).match(new RegExp(`approver: ${approverName}`, 'g')),
      ).toHaveLength(1);

      const duplicate = await page.request.post(path, { form });
      expect(duplicate.status()).toBe(200);
      expect(duplicate.url()).not.toContain('?');
      const duplicateBody = await duplicate.text();
      expect(duplicateBody.match(new RegExp(`approver: ${approverName}`, 'g'))).toHaveLength(1);
      expect(duplicateBody).toContain('data-post-error');
    } finally {
      await close();
    }
  });

  test('laboratory final approval denies a bad secret, accepts the valid ceremony, and keeps both out of the URL', async ({
    browser,
  }) => {
    test.skip(
      !labFinalApprovalId,
      'QC_E2E_LAB_FINAL_APPROVAL_ID must identify an owned disposable QCM-stage test.',
    );
    const { page, close } = await authenticatedNoJsPage(browser);
    try {
      const path = `/laboratory/tests/${labFinalApprovalId}/review`;
      const version = await currentExpectedVersion(page, path);
      const denied = await page.request.post(path, {
        form: {
          intent: 'final-approve',
          expectedVersion: version,
          reauthenticationSecret: 'intentionally-invalid-fixture-secret',
        },
      });
      expect(denied.status()).toBe(200);
      expect(denied.url()).not.toContain('?');
      expect(denied.url()).not.toContain('intentionally-invalid-fixture-secret');
      expect(await denied.text()).toContain('data-decision-error');

      const accepted = await page.request.post(path, {
        form: {
          intent: 'final-approve',
          expectedVersion: version,
          reauthenticationSecret: password ?? '',
        },
      });
      expect(accepted.status()).toBe(200);
      expect(accepted.url()).not.toContain('?');
      expect(accepted.url()).not.toContain(password ?? '');
      expect(await accepted.text()).not.toContain('name="reauthenticationSecret"');
    } finally {
      await close();
    }
  });
});
