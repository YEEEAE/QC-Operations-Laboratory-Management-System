import { test, expect } from '@playwright/test';
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { mkdirSync, writeFileSync } from 'node:fs';

// Opt-in only: run after the dynamic-workflow suite against its disposable fixture.
const url = process.env.QC_ADP03_DATABASE_URL;
const enabled = Boolean(url);
if (url) {
  const parsed = new URL(url);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.pathname !== '/qc_adp26_03')
    throw new Error('QC-ADP26-03 E2E requires its dedicated loopback disposable database.');
}
test.use({ trace: 'off', video: 'off' });
test.describe('QC-ADP26-03 real inspection draft authorization', () => {
  test.skip(!enabled, 'Dedicated disposable PostgreSQL fixture is required.');
  test('readable DRAFT, direct denial, authorized write and real responsive workspace', async ({
    browser,
  }) => {
    const pool = new Pool({ connectionString: url });
    const ownerId = '01900000-0000-7000-8000-00000000e001';
    const readId = randomUUID();
    const tokens = [randomBytes(32).toString('base64url'), randomBytes(32).toString('base64url')];
    const sessions: string[] = [];
    try {
      const report = (
        await pool.query(
          "SELECT id,version,inspection_no FROM qc.inspection_reports WHERE author_id=$1 AND state='DRAFT' ORDER BY created_at DESC LIMIT 1",
          [ownerId],
        )
      ).rows[0];
      expect(report).toBeTruthy();
      await pool.query(
        'INSERT INTO qc.users(id,login_identity,display_name,password_hash) VALUES($1,$2,$3,$4)',
        [
          readId,
          `adp03-read-${readId}`,
          'Synthetic read-only actor',
          'test-only-placeholder-not-a-secret',
        ],
      );
      await pool.query(
        `INSERT INTO qc.permissions(code,domain,action,risk_level) VALUES('PERM-INSP-EDIT-DRAFT','quarantine','EDIT','MEDIUM') ON CONFLICT(code) DO NOTHING`,
      );
      await pool.query(
        `INSERT INTO qc.role_permissions(role_id,permission_id) SELECT r.id,p.id FROM qc.roles r,qc.permissions p WHERE r.code='EMPLOYEE' AND p.code='PERM-INSP-EDIT-DRAFT' ON CONFLICT DO NOTHING`,
      );
      await pool.query(
        `INSERT INTO qc.user_roles(user_id,role_id,assigned_by) SELECT $1,id,$1 FROM qc.roles WHERE code='EMPLOYEE' AND NOT EXISTS(SELECT 1 FROM qc.user_roles WHERE user_id=$1 AND role_id=qc.roles.id AND revoked_at IS NULL)`,
        [ownerId],
      );
      await pool.query(
        `INSERT INTO qc.user_scopes(user_id,scope_kind,assigned_by) SELECT $1,'GLOBAL',$1 WHERE NOT EXISTS(SELECT 1 FROM qc.user_scopes WHERE user_id=$1 AND scope_kind='GLOBAL' AND revoked_at IS NULL)`,
        [ownerId],
      );
      for (const [index, userId] of [readId, ownerId].entries()) {
        const id = randomUUID();
        sessions.push(id);
        await pool.query(
          `INSERT INTO qc.sessions(id,user_id,session_token_hash,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')`,
          [id, userId, createHash('sha256').update(tokens[index]!).digest('hex')],
        );
      }
      const snapshot = async () => {
        const row = await pool.query('SELECT * FROM qc.inspection_reports WHERE id=$1', [
          report.id,
        ]);
        const results = await pool.query(
          'SELECT * FROM qc.inspection_report_results WHERE inspection_report_id=$1 ORDER BY id',
          [report.id],
        );
        const audit = await pool.query(
          'SELECT * FROM qc.audit_events WHERE subject_id=$1 ORDER BY id',
          [report.id],
        );
        const outbox = await pool.query('SELECT * FROM qc.outbox_events ORDER BY id');
        return { row: row.rows, results: results.rows, audit: audit.rows, outbox: outbox.rows };
      };
      const route = `/quarantine/inspections/${report.id}/execute`;
      const contexts = await Promise.all(
        tokens.map((token) =>
          browser.newContext({
            baseURL: 'http://127.0.0.1:4323',
            storageState: {
              cookies: [
                {
                  name: '__Host-qc_session',
                  value: token,
                  domain: '127.0.0.1',
                  path: '/',
                  httpOnly: true,
                  secure: true,
                  sameSite: 'Strict',
                  expires: -1,
                },
              ],
              origins: [],
            },
          }),
        ),
      );
      try {
        const readPage = await contexts[0]!.newPage();
        const get = await readPage.goto(route);
        expect(get?.status()).toBe(200);
        await expect(
          readPage.getByText(report.inspection_no, { exact: false }).first(),
        ).toBeVisible();
        await expect(readPage.getByText('Execution is read-only for this account.')).toBeVisible();
        await expect(readPage.getByRole('button', { name: 'Save results' })).toHaveCount(0);
        const before = await snapshot();
        const payload = {
          id: report.id,
          expectedVersion: report.version,
          results: [
            {
              id: randomUUID(),
              pointId: '01900000-0000-7000-8000-00000000e030',
              value: '5.4',
              version: '1',
            },
          ],
        };
        const post = async (page: import('@playwright/test').Page) =>
          page.evaluate(async (payload) => {
            const response = await fetch('/_actions/quarantine.recordInspectionResults', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            return { status: response.status, body: await response.text() };
          }, payload);
        const denied = await post(readPage);
        expect(denied.status).toBe(403);
        expect(denied.body).toMatch(/AUTHZ_PERMISSION_MISSING|authz_permission_missing/);
        expect(await snapshot()).toEqual(before);
        const page = await contexts[1]!.newPage();
        await page.goto(route);
        await expect(page.getByRole('button', { name: 'Save results' })).toBeVisible();
        await expect(page.getByLabel('Measured value')).toBeVisible();
        for (const width of [320, 375, 768, 1440, 720]) {
          await page.setViewportSize({ width, height: 900 });
          await page.reload();
          await expect(page.getByLabel('Measured value')).toBeVisible();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          ).toBe(true);
          mkdirSync('.ci-results/QC-ADP26-03-captures', { recursive: true });
          await page.screenshot({
            path: `.ci-results/QC-ADP26-03-captures/${width}.png`,
            fullPage: true,
          });
        }
        await page.getByLabel('Measured value').focus();
        await expect(page.getByLabel('Measured value')).toBeFocused();
        const positive = await post(page);
        expect(positive.status).toBe(200);
        const after = await snapshot();
        expect(BigInt(after.row[0].version)).toBe(BigInt(report.version) + 1n);
        expect(after.audit.length).toBe(before.audit.length + 1);
        expect(after.outbox).toEqual(before.outbox);
        const stale = await post(page);
        expect(stale.status).toBe(409);
        expect(await snapshot()).toEqual(after);
        await page.getByLabel('Measured value').fill('5.4');
        await page.getByRole('button', { name: 'Save results' }).click();
        await expect(page.locator('[data-result]')).toContainText(/changed|version|refresh/i);
        await expect(page.getByLabel('Measured value')).toHaveValue('5.4');
        await expect(page.locator('[data-result]')).toBeFocused();
        expect(await snapshot()).toEqual(after);
        // Retained non-secret observations only: no session tokens or credential rows.
        mkdirSync('.ci-results', { recursive: true });
        writeFileSync(
          '.ci-results/QC-ADP26-03-http.json',
          JSON.stringify(
            {
              route,
              reportId: report.id,
              role: 'read-only versus EMPLOYEE+EDIT-DRAFT/GLOBAL',
              state: 'DRAFT',
              before: {
                version: report.version,
                resultCount: before.results.length,
                auditCount: before.audit.length,
                outboxCount: before.outbox.length,
              },
              after: {
                version: after.row[0].version,
                resultCount: after.results.length,
                auditCount: after.audit.length,
                outboxCount: after.outbox.length,
              },
              deniedStatus: denied.status,
              positiveStatus: positive.status,
              staleStatus: stale.status,
              widths: [320, 375, 768, 1440],
              zoom: 'NOT VERIFIED',
              AT: 'NOT VERIFIED',
            },
            null,
            2,
          ),
        );
      } finally {
        await Promise.all(contexts.map((c) => c.close()));
      }
    } finally {
      for (const sessionId of sessions)
        await pool.query(
          "UPDATE qc.sessions SET revoked_at=now(),revoked_reason='TEST_FINISHED' WHERE id=$1",
          [sessionId],
        );
      await pool.end();
    }
  });
});
