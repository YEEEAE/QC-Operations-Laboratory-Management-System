import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { PostgresReleaseGovernanceRepository } from '../../../src/modules/release-governance/infrastructure/postgres-repository.js';
import { ApproveReleaseUseCase } from '../../../src/modules/release-governance/application/approve-release.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const GIT_SHA = 'c'.repeat(40);
const MANAGER_ID = '01900000-0000-7000-8000-00000000e001';

const manager = (): ActorContext => ({
  id: MANAGER_ID,
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: [{ code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] }],
});

let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;

beforeAll(async () => {
  const databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
  pool = createPool({ connectionString: databaseUrl, max: 10 });
  await pool!.query('DROP SCHEMA IF EXISTS qc CASCADE');
  await pool!
    .query(
      `CREATE SCHEMA IF NOT EXISTS qc;
     CREATE OR REPLACE FUNCTION qc.uuidv7() RETURNS uuid AS $f$ BEGIN RETURN gen_random_uuid(); END $f$ LANGUAGE plpgsql`,
    )
    .catch(() => undefined);
  await migrate({ pool: pool! });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
  await pool!.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash) VALUES ($1, $2, $3, 'test-only-placeholder-not-a-secret') ON CONFLICT (id) DO NOTHING`,
    [MANAGER_ID, 'release-conc-mgr', 'release-conc-mgr'],
  );
}, 180000);

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

async function createCandidate(suffix: string): Promise<string> {
  const rows = await pool!.query<{ id: string }>(
    `INSERT INTO qc.release_candidates (git_sha, build_id, application_version, migration_head, uat_cycle_id, uat_status, residual_risk_status, state)
     VALUES ($1, $2, $3, $4, $5, 'ACCEPTED', 'ACCEPTED', 'PENDING') RETURNING id::text AS id`,
    [GIT_SHA, `build-${suffix}`, '1.4.0', '0021_release_governance', `UAT-${suffix}`],
  );
  const releaseId = rows.rows[0].id;
  const gateSources: Record<string, string> = {
    ci: 'TRUSTED_CI',
    security: 'TRUSTED_SECURITY_SUITE',
    database: 'TRUSTED_DATABASE_PREFLIGHT',
    e2e: 'TRUSTED_PLAYWRIGHT',
    uat: 'SIGNED_UAT_CYCLE',
    signatures: 'E_SIGNATURE_STORE',
    criticalRisks: 'CONTROLLED_RISK_REGISTER',
    residualRisk: 'CONTROLLED_RISK_REGISTER',
  };
  for (const [index, [gate, source]] of Object.entries(gateSources).entries()) {
    await pool!.query(
      `INSERT INTO qc.release_gate_evidence (release_id, evidence_type, status, source, immutable_reference, observed_at, git_sha, build_id, application_version, migration_head, uat_cycle_id, release_version, evidence_version, recorded_by, audit_info)
       SELECT id, $2, 'PASS', $3, $4, CURRENT_TIMESTAMP, git_sha, build_id, application_version, migration_head, uat_cycle_id, version, $5, 'test-ci', '{}'::jsonb FROM qc.release_candidates WHERE id = $1`,
      [releaseId, gate, source, `test/${gate}/${suffix}`, index + 1],
    );
  }
  return releaseId;
}

function useCase() {
  const repository = new PostgresReleaseGovernanceRepository(db);
  const verifier = { verify: async () => true };
  return new ApproveReleaseUseCase(repository, verifier);
}

describe('release governance PostgreSQL concurrency and idempotency', () => {
  it('serializes concurrent approvals: at most one transition wins per version', async () => {
    const releaseId = await createCandidate(`conc-${Date.now()}`);
    const input = {
      actor: manager(),
      releaseId,
      expectedVersion: 1n,
      reauthenticationSecret: 'secret',
    };
    const row = await pool!.query<{ build_id: string; uat_cycle_id: string }>(
      `SELECT build_id, uat_cycle_id FROM qc.release_candidates WHERE id = $1`,
      [releaseId],
    );
    const base = { ...input, buildId: row.rows[0].build_id, uatCycleId: row.rows[0].uat_cycle_id };
    const results = await Promise.allSettled([
      useCase().execute({ ...base, requestId: `rel-conc-a-${Date.now()}` }),
      useCase().execute({ ...base, requestId: `rel-conc-b-${Date.now()}` }),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });

  it('replays the same request id without duplicating approvals, audit, or signatures', async () => {
    const releaseId = await createCandidate(`replay-${Date.now()}`);
    const requestId = `rel-replay-${Date.now()}`;
    const input = {
      actor: manager(),
      releaseId,
      expectedVersion: 1n,
      reauthenticationSecret: 'secret',
      requestId,
    };
    const first = await useCase().execute(input);
    const count = async (sql: string, value: string): Promise<number> =>
      Number((await pool!.query(sql, [value])).rows[0].count);
    const approvalsBefore = await count(
      `SELECT count(*)::int AS count FROM qc.release_approvals WHERE request_id = $1`,
      requestId,
    );
    const replay = await useCase().execute(input);
    const approvalsAfter = await count(
      `SELECT count(*)::int AS count FROM qc.release_approvals WHERE request_id = $1`,
      requestId,
    );
    const auditsAfter = await count(
      `SELECT count(*)::int AS count FROM qc.audit_events WHERE request_id = $1`,
      requestId,
    );
    expect(replay.id).toBe(first.id);
    expect(approvalsAfter).toBe(approvalsBefore);
    expect(approvalsAfter).toBe(1);
    expect(auditsAfter).toBe(1);
  });

  it('fails closed when a reused request id carries different command content', async () => {
    const releaseId = await createCandidate(`fingerprint-${Date.now()}`);
    const requestId = `rel-fingerprint-${Date.now()}`;
    await useCase().execute({
      actor: manager(),
      releaseId,
      expectedVersion: 1n,
      reauthenticationSecret: 'secret',
      requestId,
    });
    // Same request id, different expected version: the fingerprint no longer
    // matches the committed command, so the replay must not be returned.
    await expect(
      useCase().execute({
        actor: manager(),
        releaseId,
        expectedVersion: 2n,
        reauthenticationSecret: 'secret',
        requestId,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_DUPLICATE_COMMAND' });
    expect(
      (
        await pool!.query<{ count: number }>(
          'SELECT count(*)::int AS count FROM qc.release_approvals WHERE request_id = $1',
          [requestId],
        )
      ).rows[0].count,
    ).toBe(1);
  });

  it('leaves no half-committed state when a later step of the approval transaction fails', async () => {
    const releaseId = await createCandidate(`atomic-${Date.now()}`);
    const requestId = `rel-atomic-${Date.now()}`;
    const count = async (table: string, column: string, value: string): Promise<number> =>
      Number(
        (
          await pool!.query<{ count: number }>(
            `SELECT count(*)::int AS count FROM ${table} WHERE ${column} = $1`,
            [value],
          )
        ).rows[0].count,
      );

    // Inject the failure at the audit write: it happens inside the approval
    // transaction after the signature, the approval row, and the candidate
    // state transition have all been written. A single atomic transaction must
    // leave none of them behind.
    await pool!.query(`
      CREATE OR REPLACE FUNCTION qc.test_fail_release_approve_audit() RETURNS trigger AS $$
      BEGIN
        IF NEW.action = 'RELEASE_APPROVE' THEN
          RAISE EXCEPTION 'injected audit failure';
        END IF;
        RETURN NEW;
      END $$ LANGUAGE plpgsql;
      CREATE TRIGGER test_fail_release_approve_audit
        BEFORE INSERT ON qc.audit_events
        FOR EACH ROW EXECUTE FUNCTION qc.test_fail_release_approve_audit();
    `);

    try {
      await expect(
        useCase().execute({
          actor: manager(),
          releaseId,
          expectedVersion: 1n,
          reauthenticationSecret: 'secret',
          requestId,
        }),
        // Proves the abort happened at the injected step, i.e. after the
        // signature, approval, and state transition had already been written.
      ).rejects.toThrow(/injected audit failure/);

      const candidate = await pool!.query<{ state: string; version: string }>(
        'SELECT state, version FROM qc.release_candidates WHERE id = $1',
        [releaseId],
      );
      expect(candidate.rows[0]).toEqual({ state: 'PENDING', version: '1' });
      expect(await count('qc.release_approvals', 'release_id', releaseId)).toBe(0);
      expect(await count('qc.electronic_signatures', 'request_id', requestId)).toBe(0);
      expect(await count('qc.audit_events', 'request_id', requestId)).toBe(0);
      expect(
        await count('qc.idempotency_records', 'key', `RELEASE:APPROVE:${releaseId}:${requestId}`),
      ).toBe(0);
    } finally {
      await pool!.query(`
        DROP TRIGGER IF EXISTS test_fail_release_approve_audit ON qc.audit_events;
        DROP FUNCTION IF EXISTS qc.test_fail_release_approve_audit();
      `);
    }
  });

  it('rejects a stale expected version without mutating the candidate', async () => {
    const releaseId = await createCandidate(`stale-${Date.now()}`);
    await expect(
      useCase().execute({
        actor: manager(),
        releaseId,
        expectedVersion: 99n,
        reauthenticationSecret: 'secret',
        requestId: `rel-stale-${Date.now()}`,
      }),
    ).rejects.toMatchObject({ code: expect.any(String) });
    const state = await pool!.query<{ state: string }>(
      `SELECT state FROM qc.release_candidates WHERE id = $1`,
      [releaseId],
    );
    expect(state.rows[0].state).toBe('PENDING');
  });
});
