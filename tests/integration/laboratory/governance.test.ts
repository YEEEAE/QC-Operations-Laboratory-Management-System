import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { PostgresLabRepository } from '../../../src/modules/laboratory/infrastructure/postgres-repository.js';
import { PostgresControlledLabSources } from '../../../src/modules/laboratory/infrastructure/postgres-controlled-sources.js';
import { RejectLabTestUseCase } from '../../../src/modules/laboratory/application/reject-lab-test.js';
import { CreateRetestUseCase } from '../../../src/modules/laboratory/application/create-retest.js';
import { transitionLab } from '../../../src/modules/laboratory/domain/lab-state.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';
import type { RetestPolicy } from '../../../src/modules/laboratory/ports/controlled-sources.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const AUTHOR_ID = '01900000-0000-7000-8000-0000000000e1';
const MANAGER_ID = '01900000-0000-7000-8000-0000000000e2';

const authorActor: ActorContext = {
  id: AUTHOR_ID,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [{ code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] }],
};

const managerActor: ActorContext = {
  id: MANAGER_ID,
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: [
    { code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-LAB-REJECT', scopes: ['GLOBAL'] },
    { code: 'PERM-APR-REJECT', scopes: ['GLOBAL'] },
    { code: 'PERM-LAB-RETEST', scopes: ['GLOBAL'] },
    { code: 'PERM-LAB-AUTHORIZE-RETEST', scopes: ['GLOBAL'] },
  ],
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
  for (const [id, identity] of [
    [AUTHOR_ID, 'lab-gov-author'],
    [MANAGER_ID, 'lab-gov-manager'],
  ] as const) {
    await pool!.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash) VALUES ($1, $2, $3, 'test-only-placeholder-not-a-secret') ON CONFLICT (id) DO NOTHING`,
      [id, identity, identity],
    );
  }
}, 180000);

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

async function seedApprovedTemplate(): Promise<string> {
  const templateId = crypto.randomUUID();
  const versionId = crypto.randomUUID();
  await pool!.query(
    `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by) VALUES ($1, $2, $3, true, $4)`,
    [templateId, `TPL-${crypto.randomUUID()}`, 'Test-only governed template', AUTHOR_ID],
  );
  await pool!.query(
    `INSERT INTO qc.lab_test_template_versions (id, template_id, version_no, state, method_reference, content_hash, created_by)
     VALUES ($1, $2, 'v1', 'APPROVED', 'TEST-ONLY-METHOD', $3, $4)`,
    [versionId, templateId, 'a'.repeat(64), AUTHOR_ID],
  );
  await pool!.query(
    `INSERT INTO qc.lab_test_template_parameters (id, template_version_id, parameter_code, label, data_type, unit, required, position, acceptance_rule_payload, controlled_source_reference)
     VALUES ($1, $2, 'obs', 'Observation', 'NUMERIC', 'mg', true, 1, $3::jsonb, 'TEST-ONLY-SOURCE')`,
    [crypto.randomUUID(), versionId, JSON.stringify({ reference: 'fixture-only' })],
  );
  return versionId;
}

async function seedUnderReviewTest(templateVersionId: string): Promise<string> {
  const sources = new PostgresControlledLabSources(db);
  const context = await sources.resolve(templateVersionId);
  const now = new Date().toISOString();
  const test: LabTest = {
    id: crypto.randomUUID(),
    labTestNo: `LT-${crypto.randomUUID()}`,
    state: 'UNDER_REVIEW',
    scientificResult: null,
    authorId: AUTHOR_ID,
    createdBy: AUTHOR_ID,
    version: 3n,
    context,
    samples: [{ id: crypto.randomUUID(), identifier: 'sample-1' }],
    measurements: [],
    originalTestId: null,
    retestSequence: 0,
    retestReason: null,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
    reviewStartedAt: now,
    approvedAt: null,
    rejectedAt: null,
  };
  await repository().create(test, {
    actor: authorActor,
    requestId: 'seed-lab-test',
    action: 'CREATE',
  });
  return test.id;
}

function repository() {
  return new PostgresLabRepository(
    db,
    new PostgresAuditRepository(db),
    new PostgresOutboxRepository(db),
  );
}

describe('laboratory governance on PostgreSQL (fail-closed policy)', () => {
  it('reject persists no state change without an approved policy source', async () => {
    const templateVersionId = await seedApprovedTemplate();
    const testId = await seedUnderReviewTest(templateVersionId);
    await expect(
      new RejectLabTestUseCase(repository()).execute({
        actor: managerActor,
        id: testId,
        expectedVersion: 3n,
        reason: 'documented reject reason',
        requestId: 'pg-reject-deny',
      }),
    ).rejects.toMatchObject({ code: 'POLICY_SOURCE_REQUIRED' });
    const row = await pool!.query(`SELECT state FROM qc.lab_tests WHERE id = $1`, [testId]);
    expect(row.rows[0]?.state).toBe('UNDER_REVIEW');
  });

  it('a supplied policy persists REJECTED with a snapshot, audit row and outbox event', async () => {
    const templateVersionId = await seedApprovedTemplate();
    const testId = await seedUnderReviewTest(templateVersionId);
    const saved = await new RejectLabTestUseCase(repository(), {
      authorize: async () => {},
    }).execute({
      actor: managerActor,
      id: testId,
      expectedVersion: 3n,
      reason: 'measurement record incomplete for the approved method',
      requestId: 'pg-reject-allow',
    });
    expect(saved.state).toBe('REJECTED');
    expect(saved.rejectedAt).not.toBeNull();
    const snapshots = await pool!.query(
      `SELECT snapshot_stage FROM qc.lab_test_snapshots WHERE lab_test_id = $1 ORDER BY snapshot_version`,
      [testId],
    );
    expect(snapshots.rows.map((r: { snapshot_stage: string }) => r.snapshot_stage)).toEqual([
      'CREATE',
      'REJECT',
    ]);
    const audit = await pool!.query(
      `SELECT action, old_state, new_state, reason FROM qc.audit_events
       WHERE subject_type = 'LAB_TEST' AND subject_id = $1 AND action = 'REJECT'`,
      [testId],
    );
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({
      action: 'REJECT',
      old_state: 'UNDER_REVIEW',
      new_state: 'REJECTED',
      reason: 'measurement record incomplete for the approved method',
    });
    const outbox = await pool!.query(
      `SELECT event_type, payload FROM qc.outbox_events
       WHERE aggregate_type = 'LAB_TEST' AND aggregate_id = $1 ORDER BY created_at`,
      [testId],
    );
    expect(outbox.rows).toHaveLength(2);
    expect((outbox.rows.at(-1) as { payload: Record<string, unknown> }).payload).toMatchObject({
      action: 'REJECT',
      state: 'REJECTED',
    });
  });

  it('a supplied retest policy links a new DRAFT to the original and preserves history', async () => {
    const templateVersionId = await seedApprovedTemplate();
    const originalId = await seedUnderReviewTest(templateVersionId);
    const sources = new PostgresControlledLabSources(db);
    const policy: RetestPolicy = {
      authorize: async ({ original }) => ({
        sequence: original.retestSequence + 1,
        labTestNo: `${original.labTestNo}-R1`,
        templateVersionId: original.context.templateVersionId,
      }),
    };
    const retest = await new CreateRetestUseCase(repository(), sources, policy).execute({
      actor: managerActor,
      originalId,
      reason: 'suspected contamination; supervisor ordered repeat',
      requestId: 'pg-retest',
    });
    const originalRow = await pool!.query(
      `SELECT state, retest_sequence FROM qc.lab_tests WHERE id = $1`,
      [originalId],
    );
    expect(originalRow.rows[0]).toMatchObject({ state: 'UNDER_REVIEW', retest_sequence: 0 });
    const retestRow = await pool!.query(
      `SELECT state, original_test_id, retest_sequence, retest_reason FROM qc.lab_tests WHERE id = $1`,
      [retest.id],
    );
    expect(retestRow.rows[0]).toMatchObject({
      state: 'DRAFT',
      original_test_id: originalId,
      retest_sequence: 1,
      retest_reason: 'suspected contamination; supervisor ordered repeat',
    });
    const audit = await pool!.query(
      `SELECT action FROM qc.audit_events
       WHERE subject_type = 'LAB_TEST' AND subject_id = $1 AND action = 'CREATE_RETEST'`,
      [retest.id],
    );
    expect(audit.rows).toHaveLength(1);
  });

  it('state machine denies VOID transitions while no VOID policy is approved (TR-LAB-008)', () => {
    for (const state of ['APPROVED', 'REJECTED'] as const) {
      expect(() => transitionLab(state, 'VOID' as never)).toThrow();
    }
  });
});
