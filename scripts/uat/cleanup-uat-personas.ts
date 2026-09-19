/**
 * Cleanup disposable UAT personas (QC-100-FINAL-004 Task 4).
 *
 * Same non-production guards as the seed script. Revokes `uat-*` role/scope
 * grants and disables `uat-*` accounts instead of deleting history (controlled
 * history is preserved; accounts become DISABLED). Never touches `yazeed`.
 */
import { Pool } from 'pg';

function fail(message: string): never {
  throw new Error(message);
}

function requireGuard(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
    fail('Refusing UAT cleanup: NODE_ENV must be development or test.');
  }
  if (env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true') {
    fail('Refusing UAT cleanup: QC_SEED_ALLOW_NON_PRODUCTION=true is required.');
  }
  if (env.QC_UAT_SEED_ALLOW !== 'true') {
    fail('Refusing UAT cleanup: QC_UAT_SEED_ALLOW=true is required.');
  }
  if (!env.DATABASE_URL) fail('Refusing UAT cleanup: DATABASE_URL is required.');
  const lowered = (env.DATABASE_URL ?? '').toLowerCase();
  if (
    lowered.includes('qclevel.top') ||
    lowered.includes('render.com') ||
    (lowered.includes('prod') &&
      !lowered.includes('test') &&
      !lowered.includes('dev') &&
      !lowered.includes('localhost') &&
      !lowered.includes('127.0.0.1'))
  ) {
    fail('Refusing UAT cleanup: DATABASE_URL looks like production.');
  }
}

async function main(): Promise<void> {
  requireGuard(process.env);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: 'qc-uat-cleanup',
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const targets = await client.query<{ id: string; login_identity: string }>(
      `SELECT id, login_identity FROM qc.users WHERE login_identity LIKE 'uat-%'`,
    );
    for (const target of targets.rows) {
      if (target.login_identity === 'yazeed') {
        fail('Refusing UAT cleanup: yazeed must never be cleaned up.');
      }
      await client.query(
        `UPDATE qc.user_roles SET revoked_at = NOW(), revoked_by = user_id
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [target.id],
      );
      await client.query(
        `UPDATE qc.user_scopes SET revoked_at = NOW(), revoked_by = user_id
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [target.id],
      );
      await client.query(`UPDATE qc.users SET account_state = 'DISABLED' WHERE id = $1`, [
        target.id,
      ]);
      await client.query(
        `INSERT INTO qc.audit_events (actor_type, subject_type, subject_id, action, request_id, reason)
         VALUES ('SYSTEM', 'USER', $1, 'UAT_FIXTURE_CLEANED_UP', 'uat-cleanup', 'QC-100-FINAL-004 UAT expiry/cleanup')`,
        [target.id],
      );
    }
    await client.query('COMMIT');
    console.log(
      `UAT cleanup complete: ${targets.rows.length} disposable account(s) disabled (yazeed untouched).`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'UAT cleanup failed.');
  process.exitCode = 1;
});
