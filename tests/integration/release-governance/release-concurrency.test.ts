import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { PostgresReleaseGovernanceRepository } from '../../../src/modules/release-governance/infrastructure/postgres-repository.js';
import { ApproveReleaseUseCase } from '../../../src/modules/release-governance/application/approve-release.js';
import type { ReleaseGateEvidence } from '../../../src/modules/release-governance/domain/release-approval.js';
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

const passGates: ReleaseGateEvidence = {
  ci: 'PASS',
  security: 'PASS',
  database: 'PASS',
  e2e: 'PASS',
  uat: 'PASS',
  signatures: 'PASS',
  criticalRisks: 'PASS',
  residualRisk: 'PASS',
};

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
  return rows.rows[0].id;
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
      gitSha: GIT_SHA,
      buildId: '',
      applicationVersion: '1.4.0',
      migrationHead: '0021_release_governance',
      uatCycleId: '',
      gates: passGates,
      risks: [],
      uatStatus: 'ACCEPTED',
      residualRiskStatus: 'ACCEPTED',
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
    const row = await pool!.query<{ build_id: string; uat_cycle_id: string }>(
      `SELECT build_id, uat_cycle_id FROM qc.release_candidates WHERE id = $1`,
      [releaseId],
    );
    const requestId = `rel-replay-${Date.now()}`;
    const input = {
      actor: manager(),
      releaseId,
      expectedVersion: 1n,
      gitSha: GIT_SHA,
      buildId: row.rows[0].build_id,
      applicationVersion: '1.4.0',
      migrationHead: '0021_release_governance',
      uatCycleId: row.rows[0].uat_cycle_id,
      gates: passGates,
      risks: [],
      uatStatus: 'ACCEPTED',
      residualRiskStatus: 'ACCEPTED',
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

  it('rejects a stale expected version without mutating the candidate', async () => {
    const releaseId = await createCandidate(`stale-${Date.now()}`);
    const row = await pool!.query<{ build_id: string; uat_cycle_id: string }>(
      `SELECT build_id, uat_cycle_id FROM qc.release_candidates WHERE id = $1`,
      [releaseId],
    );
    await expect(
      useCase().execute({
        actor: manager(),
        releaseId,
        expectedVersion: 99n,
        gitSha: GIT_SHA,
        buildId: row.rows[0].build_id,
        applicationVersion: '1.4.0',
        migrationHead: '0021_release_governance',
        uatCycleId: row.rows[0].uat_cycle_id,
        gates: passGates,
        risks: [],
        uatStatus: 'ACCEPTED',
        residualRiskStatus: 'ACCEPTED',
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
