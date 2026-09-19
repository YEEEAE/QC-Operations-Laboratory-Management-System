/**
 * QC-100-FINAL-004 Task 5 — PostgreSQL integration coverage for the controlled
 * UAT evidence ingestion path (disposable cluster; no production connection).
 *
 * Proven against the real schema from migrations 0022/0023:
 * - cycle creation binds identity + snapshot hash (unique cycle_id enforced);
 * - session/defect writes are audited and id-deduplicated by DB constraints;
 * - acceptance WITHOUT a real e-signature fails closed;
 * - the acceptance transaction writes `release_gate_evidence(uat,
 *   SIGNED_UAT_CYCLE)` atomically only for ACCEPTED outcomes;
 * - automated-only cycles can never be accepted;
 * - REJECTED acceptance commits no gate evidence row.
 */
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { PostgresUatEvidenceRepository, executeUatAcceptance } from '../../../src/modules/uat-evidence/infrastructure/postgres-repository.js';
import {
  CreateUatCycleUseCase,
  GetUatCycleEvidenceUseCase,
  RecordUatDefectUseCase,
  RecordUatSessionUseCase,
} from '../../../src/modules/uat-evidence/application/use-cases.js';
import { uatCycleSnapshotHash, AUTOMATED_PARTICIPANT_CODE } from '../../../src/modules/uat-evidence/domain/uat-evidence.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const GIT_SHA = 'b'.repeat(40);
const RELEASE_ROW_ID = '01900000-0000-7000-8000-00000000bb01';
const MANAGER_ID = '01900000-0000-7000-8000-00000000bb02';
const EMPLOYEE_ID = '01900000-0000-7000-8000-00000000bb03';

const identity = {
  cycleId: 'UAT-INT-001',
  releaseId: 'rel-int-uat',
  gitSha: GIT_SHA,
  buildId: 'qc-closure-inttest01',
  applicationVersion: '0.1.0',
  migrationHead: '0030_reject_reports_role_parity',
  environment: 'test' as const,
  planReference: 'Documents/UAT-ACCEPTANCE-PLAN.md',
};

const manager = (): ActorContext => ({
  id: MANAGER_ID,
  loginIdentity: 'uat-int-mgr',
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: [
    { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
    { code: 'PERM-RPT-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-ESIG-SIGN', scopes: ['GLOBAL'] },
  ],
});

let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;
let repository: PostgresUatEvidenceRepository;

beforeAll(async () => {
  const databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
  pool = createPool({ connectionString: databaseUrl, max: 10 });
  await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
  await pool
    .query(
      `CREATE SCHEMA IF NOT EXISTS qc;
       CREATE OR REPLACE FUNCTION qc.uuidv7() RETURNS uuid AS $f$ BEGIN RETURN gen_random_uuid(); END $f$ LANGUAGE plpgsql`,
    )
    .catch(() => undefined);
  await migrate({ pool: pool! });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
  repository = new PostgresUatEvidenceRepository(db);
  await pool.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
     VALUES ($1, 'uat-int-mgr', 'UAT integration manager', 'test-only-placeholder-not-a-secret'),
            ($2, 'uat-int-emp', 'UAT integration employee', 'test-only-placeholder-not-a-secret')
     ON CONFLICT (id) DO NOTHING`,
    [MANAGER_ID, EMPLOYEE_ID],
  );
  await pool.query(
    `INSERT INTO qc.release_candidates (id, git_sha, build_id, application_version, migration_head, uat_cycle_id, uat_status, residual_risk_status, state)
     VALUES ($1, $2, $3, $4, $5, 'UAT-INT-001', 'UNVERIFIED', 'OPEN', 'PENDING')
     ON CONFLICT (id) DO NOTHING`,
    [RELEASE_ROW_ID, GIT_SHA, identity.buildId, identity.applicationVersion, identity.migrationHead],
  );
}, 180000);

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

const sessionInput = (sessionId: string, participantCode: string) => ({
  sessionId,
  taskId: 'T-UAT-01',
  participantRole: 'QC Employee',
  participantCode,
  startedAt: new Date('2026-09-19T09:00:00Z'),
  endedAt: new Date('2026-09-19T09:05:00Z'),
  timeOnTaskSeconds: 300,
  taskSuccess: true,
  errorCount: 0,
  backtrackingCount: 0,
  failedNavigationCount: 0,
  formCorrectionCount: 0,
  assistance: 'none' as const,
  wrongActionAttempts: 0,
  confidence1To5: 5,
  seq1To7: 7,
  observations: 'Integration session completed as expected.',
  severity: 'NONE' as const,
  participantComments: 'No issues observed.',
  scenarioStatus: 'PASS' as const,
  taskAcceptReject: 'ACCEPT' as const,
  evidenceReference: `audit/uat/${sessionId}`,
});

describe('UAT evidence ingestion on PostgreSQL', () => {
  it('creates a cycle with identity binding + snapshot hash and enforces cycle_id uniqueness', async () => {
    const created = await new CreateUatCycleUseCase(repository).execute({
      identity,
      requestId: 'int-create-1',
      status: 'IN_PROGRESS',
    });
    expect(created.evidenceSnapshotHash).toBe(uatCycleSnapshotHash(identity));
    expect(created.status).toBe('IN_PROGRESS');
    await expect(
      new CreateUatCycleUseCase(repository).execute({ identity, requestId: 'int-create-2' }),
    ).rejects.toMatchObject({ code: 'RESOURCE_ALREADY_EXISTS' });
  });

  it('records audited sessions and defects; summary distinguishes human vs automated', async () => {
    await new RecordUatSessionUseCase(repository).execute({
      cycleId: identity.cycleId,
      session: sessionInput('INT-SES-1', 'uat-qc-01'),
      requestId: 'int-ses-1',
    });
    await new RecordUatSessionUseCase(repository).execute({
      cycleId: identity.cycleId,
      session: sessionInput('INT-SES-2', AUTOMATED_PARTICIPANT_CODE),
      requestId: 'int-ses-2',
    });
    await expect(
      new RecordUatSessionUseCase(repository).execute({
        cycleId: identity.cycleId,
        session: sessionInput('INT-SES-1', 'uat-qc-01'),
        requestId: 'int-ses-3',
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_ALREADY_EXISTS' });
    await new RecordUatDefectUseCase(repository).execute({
      cycleId: identity.cycleId,
      defect: {
        defectId: 'INT-DEF-1',
        sessionId: 'INT-SES-1',
        taskId: 'T-UAT-01',
        severity: 'MINOR',
        title: 'Label alignment',
        observedEvidence: 'Observed',
        expectedBusinessOutcome: 'Expected',
        actualBusinessOutcome: 'Actual',
        requestIdOrRef: 'int-req-def-1',
        status: 'CLOSED',
      },
      requestId: 'int-def-1',
    });
    const summary = await repository.getEvidenceSummary(identity.cycleId);
    expect(summary).toEqual({ sessionCount: 2, humanSessionCount: 1, openCriticalDefectCount: 0 });
    const audits = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.audit_events
       WHERE subject_type IN ('UAT_CYCLE','UAT_SESSION_EVIDENCE','UAT_DEFECT') AND action LIKE 'UAT_%'`,
    );
    // Exactly: 1 cycle creation + 2 session writes + 1 defect write. The
    // rejected duplicate session above is denied before any write, so it adds
    // no audit row.
    expect(Number(audits.rows[0].count)).toBe(4);
  });

  it('fails closed: acceptance without a real cycle-bound e-signature is denied', async () => {
    await expect(
      executeUatAcceptance(db, {
        cycleId: identity.cycleId,
        acceptance: {
          cycleId: identity.cycleId,
          outcome: 'ACCEPTED',
          authorizedSignerId: MANAGER_ID,
          signatureEvidenceId: '00000000-0000-7000-8000-00000000dead',
          reauthenticatedAt: new Date(),
          evidenceSnapshotHash: uatCycleSnapshotHash(identity),
          requestId: 'int-accept-nosig',
        },
        gateEvidence: {
          releaseId: RELEASE_ROW_ID,
          cycleReference: identity.cycleId,
          status: 'PASS',
          immutableReference: 'uat-cycle:INT:nosig',
          observedAt: new Date(),
          gitSha: GIT_SHA,
          buildId: identity.buildId,
          applicationVersion: identity.applicationVersion,
          migrationHead: identity.migrationHead,
          releaseVersion: 1n,
          evidenceVersion: 1n,
          recordedBy: MANAGER_ID,
          auditInfo: {},
        },
        signer: { id: MANAGER_ID, loginIdentity: 'uat-int-mgr', accountState: 'ACTIVE', roles: ['MANAGER'] },
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    const gateRows = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.release_gate_evidence WHERE uat_cycle_id = $1`,
      [identity.cycleId],
    );
    expect(Number(gateRows.rows[0].count)).toBe(0);
  });

  it('refuses to accept an automated-only cycle even with a valid signature', async () => {
    // Isolated automated-only cycle.
    const autoIdentity = { ...identity, cycleId: 'UAT-INT-AUTO' };
    await new CreateUatCycleUseCase(repository).execute({
      identity: autoIdentity,
      requestId: 'int-auto-1',
      status: 'IN_PROGRESS',
    });
    await new RecordUatSessionUseCase(repository).execute({
      cycleId: autoIdentity.cycleId,
      session: sessionInput('INT-AUTO-SES-1', AUTOMATED_PARTICIPANT_CODE),
      requestId: 'int-auto-ses-1',
    });
    const signatureId = '01900000-0000-7000-8000-00000000ab01';
    await pool!.query(
      `INSERT INTO qc.electronic_signatures (id, actor_id, subject_type, subject_id, subject_version, action, meaning, snapshot_hash, reauth_method, request_id)
       VALUES ($1, $2, 'UAT_CYCLE', (SELECT id FROM qc.uat_cycles WHERE cycle_id = $3), 1, 'UAT_ACCEPT', 'test meaning', $4, 'PASSWORD', 'int-auto-sig')`,
      [signatureId, MANAGER_ID, autoIdentity.cycleId, '0'.repeat(64)],
    );
    await expect(
      executeUatAcceptance(db, {
        cycleId: autoIdentity.cycleId,
        acceptance: {
          cycleId: autoIdentity.cycleId,
          outcome: 'ACCEPTED',
          authorizedSignerId: MANAGER_ID,
          signatureEvidenceId: signatureId,
          reauthenticatedAt: new Date(),
          evidenceSnapshotHash: uatCycleSnapshotHash(autoIdentity),
          requestId: 'int-auto-accept',
        },
        gateEvidence: {
          releaseId: RELEASE_ROW_ID,
          cycleReference: autoIdentity.cycleId,
          status: 'PASS',
          immutableReference: 'uat-cycle:INT:auto',
          observedAt: new Date(),
          gitSha: GIT_SHA,
          buildId: autoIdentity.buildId,
          applicationVersion: autoIdentity.applicationVersion,
          migrationHead: autoIdentity.migrationHead,
          releaseVersion: 1n,
          evidenceVersion: 1n,
          recordedBy: MANAGER_ID,
          auditInfo: {},
        },
        signer: { id: MANAGER_ID, loginIdentity: 'uat-int-mgr', accountState: 'ACTIVE', roles: ['MANAGER'] },
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
    const gateRows = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.release_gate_evidence WHERE uat_cycle_id = $1`,
      [autoIdentity.cycleId],
    );
    expect(Number(gateRows.rows[0].count)).toBe(0);
  });

  it('commits gate evidence (SIGNED_UAT_CYCLE) atomically with an ACCEPTED human cycle', async () => {
    const signatureId = '01900000-0000-7000-8000-00000000ab02';
    await pool!.query(
      `INSERT INTO qc.electronic_signatures (id, actor_id, subject_type, subject_id, subject_version, action, meaning, snapshot_hash, reauth_method, request_id)
       VALUES ($1, $2, 'UAT_CYCLE', (SELECT id FROM qc.uat_cycles WHERE cycle_id = $3), 1, 'UAT_ACCEPT', 'accept UAT-INT-001', $4, 'PASSWORD', 'int-accept-sig')`,
      [signatureId, MANAGER_ID, identity.cycleId, '1'.repeat(64)],
    );
    const result = await executeUatAcceptance(db, {
      cycleId: identity.cycleId,
      acceptance: {
        cycleId: identity.cycleId,
        outcome: 'ACCEPTED',
        authorizedSignerId: MANAGER_ID,
        signatureEvidenceId: signatureId,
        reauthenticatedAt: new Date(),
        evidenceSnapshotHash: uatCycleSnapshotHash(identity),
        requestId: 'int-accept-1',
      },
      gateEvidence: {
        releaseId: RELEASE_ROW_ID,
        cycleReference: identity.cycleId,
        status: 'PASS',
        immutableReference: `uat-cycle:${identity.cycleId}:${signatureId}`,
        observedAt: new Date(),
        gitSha: GIT_SHA,
        buildId: identity.buildId,
        applicationVersion: identity.applicationVersion,
        migrationHead: identity.migrationHead,
        releaseVersion: 1n,
        evidenceVersion: 1n,
        recordedBy: MANAGER_ID,
        auditInfo: { outcome: 'ACCEPTED' },
      },
      signer: { id: MANAGER_ID, loginIdentity: 'uat-int-mgr', accountState: 'ACTIVE', roles: ['MANAGER'] },
    });
    expect(result.outcome).toBe('ACCEPTED');
    const gate = await pool!.query<{ status: string; source: string }>(
      `SELECT status, source FROM qc.release_gate_evidence
       WHERE uat_cycle_id = $1 AND evidence_type = 'uat'`,
      [identity.cycleId],
    );
    expect(gate.rows).toHaveLength(1);
    expect(gate.rows[0]).toEqual({ status: 'PASS', source: 'SIGNED_UAT_CYCLE' });
    const audit = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.audit_events WHERE action = 'UAT_CYCLE_ACCEPTANCE_RECORDED'`,
    );
    expect(Number(audit.rows[0].count)).toBe(1);
  });

  it('derives the trusted-source gate as PASS only via domain deriveReleaseEvidence', async () => {
    const { deriveReleaseEvidence } = await import(
      '../../../src/modules/release-governance/domain/release-approval.js'
    );
    const candidate = {
      releaseId: RELEASE_ROW_ID,
      gitSha: GIT_SHA,
      buildId: identity.buildId,
      applicationVersion: identity.applicationVersion,
      migrationHead: identity.migrationHead,
      uatCycleId: identity.cycleId,
      uatStatus: 'ACCEPTED',
      residualRiskStatus: 'OPEN',
      state: 'PENDING' as const,
      version: 1n,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const rows = await pool!.query<Record<string, unknown>>(
      `SELECT * FROM qc.release_gate_evidence WHERE uat_cycle_id = $1 AND evidence_type = 'uat'`,
      [identity.cycleId],
    );
    const record = {
      ...rows.rows[0],
      evidenceType: 'uat' as const,
      status: rows.rows[0].status as never,
      source: rows.rows[0].source as string,
      immutableReference: rows.rows[0].immutable_reference as string,
      observedAt: rows.rows[0].observed_at as Date,
      releaseVersion: BigInt(rows.rows[0].release_version as string),
      evidenceVersion: BigInt(rows.rows[0].evidence_version as string),
      recordedBy: rows.rows[0].recorded_by as string,
      auditInfo: rows.rows[0].audit_info as unknown,
      releaseId: rows.rows[0].release_id as string,
      gitSha: rows.rows[0].git_sha as string,
      buildId: rows.rows[0].build_id as string,
      applicationVersion: rows.rows[0].application_version as string,
      migrationHead: rows.rows[0].migration_head as string,
      uatCycleId: rows.rows[0].uat_cycle_id as string,
    } as never;
    const snapshot = deriveReleaseEvidence(
      candidate,
      [record] as Parameters<typeof deriveReleaseEvidence>[1],
      [],
      new Date(),
    );
    expect(snapshot.gates.uat).toBe('PASS');
  });

  it('REJECTED acceptance commits no gate evidence row', async () => {
    const rejectIdentity = { ...identity, cycleId: 'UAT-INT-REJ' };
    await new CreateUatCycleUseCase(repository).execute({
      identity: rejectIdentity,
      requestId: 'int-rej-1',
      status: 'IN_PROGRESS',
    });
    await new RecordUatSessionUseCase(repository).execute({
      cycleId: rejectIdentity.cycleId,
      session: sessionInput('INT-REJ-SES-1', 'uat-qc-02'),
      requestId: 'int-rej-ses-1',
    });
    const signatureId = '01900000-0000-7000-8000-00000000ab03';
    await pool!.query(
      `INSERT INTO qc.electronic_signatures (id, actor_id, subject_type, subject_id, subject_version, action, meaning, snapshot_hash, reauth_method, request_id)
       VALUES ($1, $2, 'UAT_CYCLE', (SELECT id FROM qc.uat_cycles WHERE cycle_id = $3), 1, 'UAT_ACCEPT', 'reject UAT-INT-REJ', $4, 'PASSWORD', 'int-rej-sig')`,
      [signatureId, MANAGER_ID, rejectIdentity.cycleId, '2'.repeat(64)],
    );
    await executeUatAcceptance(db, {
      cycleId: rejectIdentity.cycleId,
      acceptance: {
        cycleId: rejectIdentity.cycleId,
        outcome: 'REJECTED',
        authorizedSignerId: MANAGER_ID,
        signatureEvidenceId: signatureId,
        reauthenticatedAt: new Date(),
        evidenceSnapshotHash: uatCycleSnapshotHash(rejectIdentity),
        requestId: 'int-rej-accept',
      },
      gateEvidence: {
        releaseId: RELEASE_ROW_ID,
        cycleReference: rejectIdentity.cycleId,
        status: 'UNVERIFIED',
        immutableReference: 'uat-cycle:INT:rej',
        observedAt: new Date(),
        gitSha: GIT_SHA,
        buildId: rejectIdentity.buildId,
        applicationVersion: rejectIdentity.applicationVersion,
        migrationHead: rejectIdentity.migrationHead,
        releaseVersion: 1n,
        evidenceVersion: 1n,
        recordedBy: MANAGER_ID,
        auditInfo: {},
      },
      signer: { id: MANAGER_ID, loginIdentity: 'uat-int-mgr', accountState: 'ACTIVE', roles: ['MANAGER'] },
    });
    const gateRows = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.release_gate_evidence WHERE uat_cycle_id = $1`,
      [rejectIdentity.cycleId],
    );
    expect(Number(gateRows.rows[0].count)).toBe(0);
  });

  it('read model authorization denies employees and serves managers', async () => {
    await expect(
      new GetUatCycleEvidenceUseCase(repository).execute({
        actor: {
          id: EMPLOYEE_ID,
          loginIdentity: 'uat-int-emp',
          accountState: 'ACTIVE',
          roles: ['EMPLOYEE'],
          permissions: [],
        },
        cycleId: identity.cycleId,
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    const view = await new GetUatCycleEvidenceUseCase(repository).execute({
      actor: manager(),
      cycleId: identity.cycleId,
    });
    expect(view.cycle.cycleId).toBe(identity.cycleId);
    expect(view.releaseGateStatus).toBe('PASS');
    expect(view.summary.sessionCount).toBe(2);
  });
});
