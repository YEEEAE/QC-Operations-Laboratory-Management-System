import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { ApproveVersionUseCase } from '../../../src/modules/documents/application/approve-version.js';
import type { DocumentIdentity } from '../../../src/modules/documents/domain/document.js';
import type { DocumentVersion } from '../../../src/modules/documents/domain/document-version.js';
import { PostgresDocumentRepository } from '../../../src/modules/documents/infrastructure/postgres-repository.js';
import { ApproveLabTestUseCase } from '../../../src/modules/laboratory/application/approve-lab-test.js';
import type {
  ControlledContext,
  LabTest,
} from '../../../src/modules/laboratory/domain/lab-test.js';
import { PostgresLabRepository } from '../../../src/modules/laboratory/infrastructure/postgres-repository.js';
import { UpdateRolePermissionsUseCase } from '../../../src/modules/administration/application/update-role-permissions.js';
import { PostgresAuthorizationRepository } from '../../../src/modules/administration/infrastructure/postgres-authorization-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { ApproveInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/approve-inspection.js';
import { PostgresInspectionRepository } from '../../../src/modules/quarantine/inspection/infrastructure/postgres-repository.js';
import { ReleaseReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/release-receiving.js';
import { PostgresReceivingRepository } from '../../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const AUTHOR_ID = '01900000-0000-7000-8000-00000000a001';
const APPROVER_ID = '01900000-0000-7000-8000-00000000a002';
const ADMIN_ID = '01900000-0000-7000-8000-00000000a003';

const actor = (
  id: string,
  grants: readonly {
    code: ActorContext['permissions'][number]['code'];
    scopes: readonly ActorContext['permissions'][number]['scopes'][number][];
  }[],
): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: grants.map((grant) => ({ code: grant.code, scopes: grant.scopes })),
});

const approver = () =>
  actor(APPROVER_ID, [
    { code: 'PERM-QUAR-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-QUAR-RELEASE', scopes: ['GLOBAL'] },
    { code: 'PERM-INSP-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-INSP-APPROVE', scopes: ['GLOBAL'] },
    { code: 'PERM-LAB-APPROVE', scopes: ['GLOBAL'] },
    { code: 'PERM-DOC-APPROVE', scopes: ['GLOBAL'] },
    { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
  ]);

const rejectedCode = (outcome: PromiseSettledResult<unknown>): string | undefined =>
  outcome.status === 'rejected'
    ? ((outcome.reason as { code?: string })?.code ?? String(outcome.reason))
    : undefined;

const rejectionSummary = (outcomes: readonly PromiseSettledResult<unknown>[]): string =>
  JSON.stringify(
    outcomes.map((outcome) =>
      outcome.status === 'fulfilled' ? 'fulfilled' : rejectedCode(outcome),
    ),
  );

let databaseUrl: string;
let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;

beforeAll(async () => {
  databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
  pool = createPool({ connectionString: databaseUrl, max: 10 });
  // Per-suite schema isolation: safe on disposable containers and required when
  // QC_TEST_DATABASE_URL points at a reused local cluster.
  await pool!.query('DROP SCHEMA IF EXISTS qc CASCADE');
  // Compatibility stand-in for pre-18 engines where uuidv7() is not native;
  // native uuidv7 (PostgreSQL 18) resolves first via search_path order.
  await pool!
    .query(
      `CREATE SCHEMA IF NOT EXISTS qc;
     CREATE OR REPLACE FUNCTION qc.uuidv7() RETURNS uuid AS $f$ BEGIN RETURN gen_random_uuid(); END $f$ LANGUAGE plpgsql`,
    )
    .catch(() => undefined);
  await migrate({ pool: pool! });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
  for (const [id, login] of [
    [AUTHOR_ID, 'concurrency-author'],
    [APPROVER_ID, 'concurrency-approver'],
    [ADMIN_ID, 'concurrency-admin'],
  ] as const) {
    await pool!.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash) VALUES ($1, $2, $3, 'test-only-placeholder-not-a-secret')`,
      [id, login, `Concurrency ${login}`],
    );
  }
});

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

const countAudit = async (subjectId: string, action: string): Promise<number> =>
  Number(
    (
      await pool!.query(
        'SELECT count(*)::int AS count FROM qc.audit_events WHERE subject_id = $1 AND action = $2',
        [subjectId, action],
      )
    ).rows[0].count,
  );

const countOutbox = async (dedupeKey: string): Promise<number> =>
  Number(
    (
      await pool!.query(
        'SELECT count(*)::int AS count FROM qc.outbox_events WHERE dedupe_key = $1',
        [dedupeKey],
      )
    ).rows[0].count,
  );

describe('Tier-1 controlled mutations under real PostgreSQL concurrency', () => {
  it('executes exactly one of two concurrent receiving releases and never overwrites silently', async () => {
    const id = '01900000-0000-7000-8000-00000000b001';
    await pool!.query(
      `INSERT INTO qc.receiving_items (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by, version)
       VALUES ($1, 'RCV-CM-001', 'DOC-CM-001', 'ITEM-CM-001', 'Concurrency receiving item', 'LOT-CM-001', 2, '2026-01-05', 'RELEASE_PENDING', 'PASS', false, $2, $2, 4)`,
      [id, AUTHOR_ID],
    );
    const repository = new PostgresReceivingRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    const useCase = new ReleaseReceivingUseCase(repository, { canRelease: () => true });
    const input = { actor: approver(), id, expectedVersion: 4n, requestId: 'cm-release-1' };

    const outcomes = await Promise.allSettled([
      useCase.execute({ ...input, requestId: 'cm-release-1' }),
      useCase.execute({ ...input, requestId: 'cm-release-2' }),
    ]);

    expect(rejectionSummary(outcomes), rejectionSummary(outcomes)).toContain('fulfilled');
    expect(
      outcomes.filter((o) => o.status === 'fulfilled'),
      rejectionSummary(outcomes),
    ).toHaveLength(1);
    expect(
      outcomes.map(rejectedCode).filter((code) => code === 'CONFLICT_STALE_VERSION'),
      rejectionSummary(outcomes),
    ).toHaveLength(1);

    const row = (
      await pool!.query(
        'SELECT workflow_state, release_system, released_by, version FROM qc.receiving_items WHERE id = $1',
        [id],
      )
    ).rows[0];
    expect(row.workflow_state).toBe('RELEASED');
    expect(row.release_system).toBe(true);
    expect(row.released_by).toBe(APPROVER_ID);
    expect(Number(row.version)).toBe(5);
    expect(await countAudit(id, 'RELEASE')).toBe(1);
    expect(await countOutbox(`receiving:${id}:v5`)).toBe(1);
  });

  it('executes exactly one of two concurrent inspection approvals and denies a stale replay without new evidence', async () => {
    const receivingId = '01900000-0000-7000-8000-00000000b010';
    const templateId = '01900000-0000-7000-8000-00000000b011';
    const templateVersionId = '01900000-0000-7000-8000-00000000b012';
    const reportId = '01900000-0000-7000-8000-00000000b013';
    await pool!.query(
      `INSERT INTO qc.receiving_items (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date, created_by, updated_by)
       VALUES ($1, 'RCV-CM-002', 'DOC-CM-002', 'ITEM-CM-002', 'Inspection concurrency item', 'LOT-CM-002', 1, '2026-01-05', $2, $2)`,
      [receivingId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by) VALUES ($1, 'TPL-CM-001', 'Concurrency template', true, $2)`,
      [templateId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_template_versions (id, template_id, version_no, state, created_by) VALUES ($1, $2, 'v1', 'APPROVED', $3)`,
      [templateVersionId, templateId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_reports (id, inspection_no, receiving_item_id, template_version_id, state, final_result, author_id, created_by, version)
       VALUES ($1, 'INSP-CM-001', $2, $3, 'UNDER_REVIEW', 'PASS', $4, $4, 3)`,
      [reportId, receivingId, templateVersionId, AUTHOR_ID],
    );
    const repository = new PostgresInspectionRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    const useCase = new ApproveInspectionUseCase(repository, { canApprove: () => true });

    const outcomes = await Promise.allSettled([
      useCase.execute({
        actor: approver(),
        id: reportId,
        expectedVersion: 3n,
        requestId: 'cm-insp-approve-1',
      }),
      useCase.execute({
        actor: approver(),
        id: reportId,
        expectedVersion: 3n,
        requestId: 'cm-insp-approve-2',
      }),
    ]);

    expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(1);
    expect(
      outcomes.map(rejectedCode).filter((code) => code === 'CONFLICT_STALE_VERSION'),
    ).toHaveLength(1);
    const row = (
      await pool!.query('SELECT state, version FROM qc.inspection_reports WHERE id = $1', [
        reportId,
      ])
    ).rows[0];
    expect(row.state).toBe('APPROVED');
    expect(Number(row.version)).toBe(4);
    const approverRecorded = (
      await pool!.query(
        'SELECT actor_id FROM qc.audit_events WHERE subject_id = $1 AND action = $2',
        [reportId, 'APPROVE'],
      )
    ).rows[0];
    expect(approverRecorded.actor_id).toBe(APPROVER_ID);
    expect(await countAudit(reportId, 'APPROVE')).toBe(1);
    expect(await countOutbox(`inspection:${reportId}:v4`)).toBe(1);
    const receiving = (
      await pool!.query(
        'SELECT workflow_state, inspection_result FROM qc.receiving_items WHERE id = $1',
        [receivingId],
      )
    ).rows[0];
    expect(receiving.workflow_state).toBe('INSPECTION_COMPLETE');
    expect(receiving.inspection_result).toBe('PASS');

    // Replay is denied before any mutation: the state gate (APPROVED is not an
    // approvable state) fires earlier in the authorize chain than the version gate.
    await expect(
      useCase.execute({
        actor: approver(),
        id: reportId,
        expectedVersion: 3n,
        requestId: 'cm-insp-approve-replay',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await countAudit(reportId, 'APPROVE')).toBe(1);
    expect(await countOutbox(`inspection:${reportId}:v4`)).toBe(1);
  });

  it('executes exactly one of two concurrent laboratory approvals on the same version', async () => {
    const templateId = '01900000-0000-7000-8000-00000000b020';
    const templateVersionId = '01900000-0000-7000-8000-00000000b021';
    const testId = '01900000-0000-7000-8000-00000000b022';
    await pool!.query(
      `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by) VALUES ($1, 'LABTPL-CM-001', 'Concurrency lab template', true, $2)`,
      [templateId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.lab_test_template_versions (id, template_id, version_no, state, created_by) VALUES ($1, $2, 'v1', 'APPROVED', $3)`,
      [templateVersionId, templateId, AUTHOR_ID],
    );
    const context: ControlledContext = {
      templateVersionId,
      versionNo: 'v1',
      methodReference: 'METHOD-CM-001',
      sourceReference: 'SRC-CM-001',
      contentHash: 'hash-lab-cm-001',
      parameters: [
        {
          id: 'param-cm-1',
          code: 'P1',
          label: 'Assay',
          dataType: 'NUMERIC',
          unit: '%',
          required: true,
          sourceReference: 'SRC-CM-001',
          criteria: { operator: '<=', value: 100 },
        },
      ],
      documents: [],
      equipment: [],
      source: { reference: 'SRC-CM-001' },
      requirementsReference: 'REQ-CM-001',
    };
    const draft = (): LabTest => ({
      id: testId,
      labTestNo: 'LAB-CM-001',
      state: 'UNDER_REVIEW',
      scientificResult: null,
      authorId: AUTHOR_ID,
      createdBy: AUTHOR_ID,
      version: 2n,
      context,
      samples: [{ id: '01900000-0000-7000-8000-00000000b023', identifier: 'SAMPLE-CM-001' }],
      measurements: [],
      originalTestId: null,
      retestSequence: 0,
      retestReason: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      submittedAt: '2026-01-02T00:00:00.000Z',
      reviewStartedAt: '2026-01-02T01:00:00.000Z',
      approvedAt: null,
    });
    const repository = new PostgresLabRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    await repository.create(draft(), {
      actor: actor(AUTHOR_ID, [{ code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] }]),
      requestId: 'cm-lab-create',
      action: 'CREATE',
    });
    const useCase = new ApproveLabTestUseCase(
      repository,
      {
        resolve: async () => context,
        validateExecution: async () => {},
        evaluate: async () => ({
          result: 'PASS',
          sourceReference: context.sourceReference,
          contentHash: context.contentHash,
        }),
      },
      { authorize: async () => {} },
    );

    const outcomes = await Promise.allSettled([
      useCase.execute({
        actor: approver(),
        id: testId,
        expectedVersion: 2n,
        requestId: 'cm-lab-approve-1',
      }),
      useCase.execute({
        actor: approver(),
        id: testId,
        expectedVersion: 2n,
        requestId: 'cm-lab-approve-2',
      }),
    ]);

    expect(
      outcomes.filter((o) => o.status === 'fulfilled'),
      rejectionSummary(outcomes),
    ).toHaveLength(1);
    expect(
      outcomes.map(rejectedCode).filter((code) => code === 'CONFLICT_STALE_VERSION'),
      rejectionSummary(outcomes),
    ).toHaveLength(1);
    const row = (
      await pool!.query(
        'SELECT state, scientific_result, version, approved_at FROM qc.lab_tests WHERE id = $1',
        [testId],
      )
    ).rows[0];
    expect(row.state).toBe('APPROVED');
    expect(row.scientific_result).toBe('PASS');
    expect(row.approved_at).not.toBeNull();
    expect(Number(row.version)).toBe(3);
    expect(await countAudit(testId, 'APPROVE')).toBe(1);
    expect(await countOutbox(`lab:${testId}:v3`)).toBe(1);
  });

  it('executes exactly one of two concurrent document version approvals via the row lock barrier', async () => {
    const documentId = '01900000-0000-7000-8000-00000000b030';
    const versionId = '01900000-0000-7000-8000-00000000b031';
    const repository = new PostgresDocumentRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    const identity: DocumentIdentity = {
      id: documentId,
      documentNo: 'WI-CM-001',
      documentType: 'WI',
      title: 'Concurrency controlled document',
      ownerId: AUTHOR_ID,
      active: true,
      createdBy: AUTHOR_ID,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      version: 1n,
    };
    await repository.createDocument({
      document: identity,
      actor: actor(AUTHOR_ID, [{ code: 'PERM-DOC-VIEW', scopes: ['GLOBAL'] }]),
      requestId: 'cm-doc-create',
    });
    const version: DocumentVersion = {
      id: versionId,
      documentId,
      revision: '1',
      state: 'IN_REVIEW',
      contentHash: 'hash-doc-cm-001',
      createdBy: AUTHOR_ID,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      version: 1n,
      files: [],
    };
    await repository.createVersion({
      version,
      actor: actor(AUTHOR_ID, [{ code: 'PERM-DOC-VIEW', scopes: ['GLOBAL'] }]),
      requestId: 'cm-doc-version',
    });
    const useCase = new ApproveVersionUseCase(repository);

    const outcomes = await Promise.allSettled([
      useCase.execute({
        actor: approver(),
        versionId,
        expectedVersion: 1n,
        requestId: 'cm-doc-approve-1',
      }),
      useCase.execute({
        actor: approver(),
        versionId,
        expectedVersion: 1n,
        requestId: 'cm-doc-approve-2',
      }),
    ]);

    expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(1);
    expect(
      outcomes.map(rejectedCode).filter((code) => code === 'CONFLICT_STALE_VERSION'),
    ).toHaveLength(1);
    const row = (
      await pool!.query(
        'SELECT state, version, approved_by FROM qc.document_versions WHERE id = $1',
        [versionId],
      )
    ).rows[0];
    expect(row.state).toBe('APPROVED');
    expect(Number(row.version)).toBe(2);
    expect(row.approved_by).toBe(APPROVER_ID);
    expect(await countAudit(versionId, 'APPROVE')).toBe(1);
    expect(await countOutbox(`document-version:${versionId}:v2`)).toBe(1);
  });

  it('applies exactly one of two concurrent role permission updates on the same role version', async () => {
    const roleId = '01900000-0000-7000-8000-00000000b040';
    await pool!.query(
      `INSERT INTO qc.roles (id, code, name, is_system_role, active, version) VALUES ($1, 'ROLE-CM-001', 'Concurrency role', false, true, 2)`,
      [roleId],
    );
    await pool!.query(
      `INSERT INTO qc.permissions (code, domain, action, risk_level) VALUES ('PERM-QUAR-VIEW', 'QUARANTINE', 'VIEW', 'UNSPECIFIED'), ('PERM-QUAR-CREATE', 'QUARANTINE', 'CREATE', 'UNSPECIFIED')`,
    );
    const repository = new PostgresAuthorizationRepository(db, new PostgresAuditRepository(db));
    const useCase = new UpdateRolePermissionsUseCase(repository);
    const admin = () =>
      actor(ADMIN_ID, [{ code: 'PERM-ADM-PERMISSION-ASSIGN', scopes: ['GLOBAL'] }]);

    const outcomes = await Promise.allSettled([
      useCase.execute({
        actor: admin(),
        roleId,
        permissionCodes: ['PERM-QUAR-VIEW'],
        expectedVersion: 2n,
        requestId: 'cm-role-1',
      }),
      useCase.execute({
        actor: admin(),
        roleId,
        permissionCodes: ['PERM-QUAR-CREATE'],
        expectedVersion: 2n,
        requestId: 'cm-role-2',
      }),
    ]);

    expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(1);
    expect(
      outcomes.map(rejectedCode).filter((code) => code === 'CONFLICT_STALE_VERSION'),
    ).toHaveLength(1);
    const role = (await pool!.query('SELECT version FROM qc.roles WHERE id = $1', [roleId]))
      .rows[0];
    expect(Number(role.version)).toBe(3);
    const granted = (
      await pool!.query(
        'SELECT count(*)::int AS count FROM qc.role_permissions WHERE role_id = $1',
        [roleId],
      )
    ).rows[0].count;
    expect(granted).toBe(1);
    expect(await countAudit(roleId, 'UPDATE_ROLE_PERMISSIONS')).toBe(1);
  });
});
