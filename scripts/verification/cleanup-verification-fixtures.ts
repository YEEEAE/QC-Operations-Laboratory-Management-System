/**
 * Cleanup disposable verification fixtures (Prompt 13).
 *
 * Same non-production guards as the seed script. Revokes `verify-*`
 * role/scope grants and disables `verify-*` accounts instead of deleting
 * history (controlled history is preserved; accounts become DISABLED).
 * Never touches `yazeed`.
 */
import { Pool } from 'pg';

function fail(message: string): never {
  throw new Error(message);
}

function requireGuard(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
    fail('Refusing verification cleanup: NODE_ENV must be development or test.');
  }
  if (env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true') {
    fail('Refusing verification cleanup: QC_SEED_ALLOW_NON_PRODUCTION=true is required.');
  }
  if (env.QC_VERIFICATION_SEED_ALLOW !== 'true') {
    fail('Refusing verification cleanup: QC_VERIFICATION_SEED_ALLOW=true is required.');
  }
  if (!env.DATABASE_URL) fail('Refusing verification cleanup: DATABASE_URL is required.');
}

async function main(): Promise<void> {
  requireGuard(process.env);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: 'qc-verification-cleanup',
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const targets = await client.query<{ id: string; login_identity: string }>(
      `SELECT id, login_identity FROM qc.users WHERE login_identity LIKE 'verify-%'`,
    );
    for (const target of targets.rows) {
      if (target.login_identity === 'yazeed') {
        fail('Refusing verification cleanup: yazeed must never be cleaned up.');
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
      await client.query(
        `UPDATE qc.users SET account_state = 'DISABLED' WHERE id = $1`,
        [target.id],
      );
      await client.query(
        `INSERT INTO qc.audit_events (actor_type, subject_type, subject_id, action, request_id, reason)
         VALUES ('SYSTEM', 'USER', $1, 'VERIFY_FIXTURE_CLEANED_UP', 'verify-cleanup', 'Prompt 13 expiry/cleanup')`,
        [target.id],
      );
    }
    await client.query('COMMIT');
    console.log(`Verification cleanup complete: ${targets.rows.length} disposable account(s) disabled.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Verification cleanup failed.');
  process.exitCode = 1;
});
