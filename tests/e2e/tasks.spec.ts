import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

test('tasks route is protected', async ({ page }) => {
  await page.goto('/tasks');
  await expect(page).toHaveURL(/\/login/);
});

test('authenticated task journey preserves state, audit, scope, and version', async ({ page }) => {
  test.skip(
    !process.env.QC_VERIFY_SYSTEM_OWNER_PASSWORD || !process.env.QC_TEST_DATABASE_URL,
    'Candidate-bound local owner and disposable PostgreSQL fixtures are required.',
  );
  const pool = new Pool({ connectionString: process.env.QC_TEST_DATABASE_URL });
  const taskNo = `TASK-E2E-${randomUUID()}`;
  try {
    await page.goto('/login');
    await page.getByLabel('Login identity').fill('yazeed');
    await page
      .getByLabel('Password', { exact: true })
      .fill(process.env.QC_VERIFY_SYSTEM_OWNER_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/tasks/new');
    await expect(page.getByRole('region', { name: 'Draft details' })).toContainText(
      'You (signed-in account)',
    );
    await expect(page.getByRole('region', { name: 'Draft details' })).toContainText(/Version\s*1/);
    await expect(page.getByRole('region', { name: 'Draft details' })).toContainText(
      'Activate the draft when it is ready',
    );
    await page.getByLabel('Task number').fill(taskNo);
    await page.getByLabel('Title').fill('Authenticated lifecycle evidence');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]+$/i);
    const taskId = page.url().split('/').pop()!;
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();
    await expect(page.getByText('Not specified', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Activate when the draft is ready.', { exact: true }),
    ).toBeVisible();

    for (const [action, state, reason] of [
      ['ACTIVATE', 'Open', ''],
      ['START', 'In progress', ''],
      ['HOLD', 'On hold', 'Waiting for a controlled prerequisite'],
      ['RESUME', 'In progress', ''],
      ['COMPLETE', 'Completed', ''],
      ['REOPEN', 'In progress', 'Follow-up verification is required'],
    ] as const) {
      const reasonInput = page.getByLabel(/Reason/);
      if (reason) await reasonInput.fill(reason);
      if (action === 'RESUME') {
        await reasonInput.focus();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Resume' })).toBeFocused();
      }
      const actionName = (
        {
          ACTIVATE: 'Activate',
          START: 'Start',
          HOLD: 'Put on hold',
          RESUME: 'Resume',
          COMPLETE: 'Complete',
          REOPEN: 'Reopen',
        } as const
      )[action];
      await page.getByRole('button', { name: actionName, exact: true }).click();
      await expect(page.getByText(state, { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Transition history' })).toBeVisible();
    }

    await page.setViewportSize({ width: 320, height: 800 });
    const width = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);

    const completeButton = page.getByRole('button', { name: 'Complete', exact: true });
    await completeButton.evaluate((button) => button.setAttribute('data-version', '6'));
    await completeButton.click();
    await expect(page.getByRole('status')).toContainText('The action was not applied');

    const taskRows = await pool.query<{ state: string; version: string }>(
      'SELECT state, version::text FROM qc.tasks WHERE id = $1 AND task_no = $2',
      [taskId, taskNo],
    );
    expect(taskRows.rows).toEqual([{ state: 'IN_PROGRESS', version: '7' }]);
    const auditRows = await pool.query<{
      action: string;
      old_state: string | null;
      new_state: string | null;
    }>(
      'SELECT action, old_state, new_state FROM qc.audit_events WHERE subject_type = $1 AND subject_id = $2 ORDER BY event_no',
      ['TASK', taskId],
    );
    expect(auditRows.rows).toEqual([
      { action: 'CREATE_TASK', old_state: null, new_state: 'DRAFT' },
      { action: 'ACTIVATE', old_state: 'DRAFT', new_state: 'OPEN' },
      { action: 'START', old_state: 'OPEN', new_state: 'IN_PROGRESS' },
      { action: 'HOLD', old_state: 'IN_PROGRESS', new_state: 'ON_HOLD' },
      { action: 'RESUME', old_state: 'ON_HOLD', new_state: 'IN_PROGRESS' },
      { action: 'COMPLETE', old_state: 'IN_PROGRESS', new_state: 'COMPLETED' },
      { action: 'REOPEN', old_state: 'COMPLETED', new_state: 'IN_PROGRESS' },
    ]);
    const outboxRows = await pool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM qc.outbox_events WHERE aggregate_type = $1 AND aggregate_id = $2',
      ['TASK', taskId],
    );
    expect(outboxRows.rows[0]?.count).toBe('7');

    await page.goto(`/tasks?q=${encodeURIComponent(`no-match-${taskNo}`)}`);
    await expect(page.getByRole('heading', { name: 'No tasks match these filters' })).toBeVisible();
  } finally {
    await pool.end();
  }
});
