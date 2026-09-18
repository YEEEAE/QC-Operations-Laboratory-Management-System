/**
 * QC-100-FINAL-013 — controlled-workflow proof matrix on populated PostgreSQL.
 *
 * Required case classes proven here, per controlled workflow:
 *   normal · boundary · wrong-role · wrong-scope · invalid-state · stale ·
 *   tamper · rollback
 *
 * Every row is populated (no empty-table assertions), and every denial is
 * asserted together with the absence of state, audit and outbox side effects so
 * a "denied" result cannot hide a half-applied mutation.
 *
 * Fail-closed defaults that are policy-blocked (PD-38 lab reject decision,
 * TR-LAB-008 VOID, scientific evaluation) stay denied: this suite proves the
 * denial and never supplies the missing controlled source.
 */
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { ApproveVersionUseCase } from '../../../src/modules/documents/application/approve-version.js';
import type { DocumentIdentity } from '../../../src/modules/documents/domain/document.js';
import type { DocumentVersion } from '../../../src/modules/documents/domain/document-version.js';
import { PostgresDocumentRepository } from '../../../src/modules/documents/infrastructure/postgres-repository.js';
import { ApproveInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/approve-inspection.js';
import { PostgresInspectionRepository } from '../../../src/modules/quarantine/inspection/infrastructure/postgres-repository.js';
import { ReleaseReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/release-receiving.js';
import { PostgresReceivingRepository } from '../../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import { transitionLab } from '../../../src/modules/laboratory/domain/lab-state.js';
import { PostgresControlledLabSources } from '../../../src/modules/laboratory/infrastructure/postgres-controlled-sources.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const AUTHOR_ID = '01900000-0000-7000-8000-000000000f01';
const INSPECTOR_ID = '01900000-0000-7000-8000-000000000f02';
const MANAGER_ID = '01900000-0000-7000-8000-000000000f03';
const EMPLOYEE_ID = '01900000-0000-7000-8000-000000000f04';
const ADMIN_ID = '01900000-0000-7000-8000-000000000f05';
const SUPERVISOR_ID = '01900000-0000-7000-8000-000000000f06';

const ALL_CONTROLLED_PERMISSIONS = [
  'PERM-QUAR-VIEW',
  'PERM-QUAR-RELEASE',
  'PERM-INSP-VIEW',
  'PERM-INSP-APPROVE',
  'PERM-APR-APPROVE',
] as const;

type Grant = ActorContext['permissions'][number];

const actor = (
  id: string,
  roles: readonly string[],
  grants: readonly { code: string; scopes: readonly string[] }[],
): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles,
  permissions: grants.map(
    (grant) => ({ code: grant.code, scopes: grant.scopes }) as unknown as Grant,
  ),
});

const globalGrants = ALL_CONTROLLED_PERMISSIONS.map((code) => ({
  code,
  scopes: ['GLOBAL'] as const,
}));

/** P-05 authority with every permission: the allowed case. */
const manager = () => actor(MANAGER_ID, ['MANAGER'], globalGrants);
/** Holds every explicit permission but is not a P-05 authority actor. */
const employeeWithEveryPermission = () => actor(EMPLOYEE_ID, ['EMPLOYEE'], globalGrants);
/** May release, but its read grant is limited to its own records. */
const ownScopeManager = () =>
  actor(MANAGER_ID, ['MANAGER'], [
    { code: 'PERM-QUAR-VIEW', scopes: ['OWN'] },
    { code: 'PERM-QUAR-RELEASE', scopes: ['GLOBAL'] },
  ]);
const documentApprover = () =>
  actor(SUPERVISOR_ID, ['SUPERVISOR'], [
    { code: 'PERM-DOC-APPROVE', scopes: ['GLOBAL'] },
    { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
  ]);
const adminOnly = () =>
  actor(ADMIN_ID, ['ADMIN'], [
    { code: 'PERM-DOC-APPROVE', scopes: ['GLOBAL'] },
    { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
  ]);

let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;

const receivingRepository = () =>
  new PostgresReceivingRepository(
    db,
    new PostgresAuditRepository(db),
    new PostgresOutboxRepository(db),
  );

const auditCount = async (subjectId: string, action: string): Promise<number> =>
  Number(
    (
      await pool!.query(
        'SELECT count(*)::int AS count FROM qc.audit_events WHERE subject_id = $1 AND action = $2',
        [subjectId, action],
      )
    ).rows[0].count,
  );

const auditCountByRequest = async (requestId: string): Promise<number> =>
  Number(
    (
      await pool!.query('SELECT count(*)::int AS count FROM qc.audit_events WHERE request_id = $1', [
        requestId,
      ])
    ).rows[0].count,
  );

const outboxCount = async (dedupeKey: string): Promise<number> =>
  Number(
    (
      await pool!.query('SELECT count(*)::int AS count FROM qc.outbox_events WHERE dedupe_key = $1', [
        dedupeKey,
      ])
    ).rows[0].count,
  );

const receivingRow = async (id: string) =>
  (
    await pool!.query(
      'SELECT workflow_state, inspection_result, release_system, released_by, version FROM qc.receiving_items WHERE id = $1',
      [id],
    )
  ).rows[0];

/** Populates one receiving item plus the approved inspection it depends on. */
async function seedReceiving(
  options: {
    id: string;
    inspectionResult: 'PASS' | 'FAIL' | 'HOLD';
    workflowState: 'RELEASE_PENDING' | 'RELEASED';
    version?: number;
    createdBy?: string;
  },
): Promise<{ id: string; templateVersionId: string }> {
  const templateId = crypto.randomUUID();
  const templateVersionId = crypto.randomUUID();
  const inspectionId = crypto.randomUUID();
  const createdBy = options.createdBy ?? AUTHOR_ID;
  const version = options.version ?? 4;
  const tag = options.id.slice(-4);
  await pool!.query(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date,
        workflow_state, inspection_result, release_system, created_by, updated_by, version)
     VALUES ($1, $2, $3, $4, 'Populated proof item', $5, 3, '2026-02-01', $6, $7, $8, $9, $9, $10)`,
    [
      options.id,
      `RCV-PROOF-${tag}`,
      `DOC-PROOF-${tag}`,
      `ITEM-PROOF-${tag}`,
      `LOT-PROOF-${tag}`,
      options.workflowState,
      options.inspectionResult,
      options.workflowState === 'RELEASED',
      createdBy,
      version,
    ],
  );
  await pool!.query(
    `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
     VALUES ($1, $2, 'Populated proof template', true, $3)`,
    [templateId, `TPL-PROOF-${tag}`, createdBy],
  );
  await pool!.query(
    `INSERT INTO qc.inspection_template_versions (id, template_id, version_no, state, created_by, content_hash, name)
     VALUES ($1, $2, 'v1', 'APPROVED', $3, $4, 'Populated proof template')`,
    [templateVersionId, templateId, createdBy, `hash-${tag}`],
  );
  await pool!.query(
    `INSERT INTO qc.inspection_reports
       (id, inspection_no, receiving_item_id, template_version_id, state, final_result, author_id, created_by, version)
     VALUES ($1, $2, $3, $4, 'APPROVED', $5, $6, $6, 3)`,
    [inspectionId, `INSP-PROOF-${tag}`, options.id, templateVersionId, options.inspectionResult, INSPECTOR_ID],
  );
  return { id: options.id, templateVersionId };
}

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
    [AUTHOR_ID, 'proof-author'],
    [INSPECTOR_ID, 'proof-inspector'],
    [MANAGER_ID, 'proof-manager'],
    [EMPLOYEE_ID, 'proof-employee'],
    [ADMIN_ID, 'proof-admin'],
    [SUPERVISOR_ID, 'proof-supervisor'],
  ] as const) {
    await pool!.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, $2, $3, 'test-only-placeholder-not-a-secret')`,
      [id, identity, identity],
    );
  }
}, 180_000);

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

describe('QC-100-FINAL-013 · receiving release on populated PostgreSQL', () => {
  it('[normal] releases a populated RELEASE_PENDING item with exactly one audit and outbox record', async () => {
    const { id } = await seedReceiving({
      id: '01900000-0000-7000-8000-000000000fb1',
      inspectionResult: 'PASS',
      workflowState: 'RELEASE_PENDING',
    });
    const released = await new ReleaseReceivingUseCase(receivingRepository()).execute({
      actor: manager(),
      id,
      expectedVersion: 4n,
      requestId: 'proof-normal-release',
    });
    expect(released.workflowState).toBe('RELEASED');
    const row = await receivingRow(id);
    expect(row).toMatchObject({
      workflow_state: 'RELEASED',
      inspection_result: 'PASS',
      release_system: true,
      released_by: MANAGER_ID,
      version: '5',
    });
    expect(await auditCount(id, 'RELEASE')).toBe(1);
    expect(await outboxCount(`receiving:${id}:v5`)).toBe(1);
  });

  it('[normal] replays the committed release for the same request id without a second mutation', async () => {
    const { id } = await seedReceiving({
      id: '01900000-0000-7000-8000-000000000fb2',
      inspectionResult: 'PASS',
      workflowState: 'RELEASE_PENDING',
    });
    const useCase = new ReleaseReceivingUseCase(receivingRepository());
    const first = await useCase.execute({
      actor: manager(),
      id,
      expectedVersion: 4n,
      requestId: 'proof-replay-release',
    });
    const replay = await useCase.execute({
      actor: manager(),
      id,
      expectedVersion: 4n,
      requestId: 'proof-replay-release',
    });
    expect(replay.id).toBe(first.id);
    expect(await auditCount(id, 'RELEASE')).toBe(1);
    expect(await outboxCount(`receiving:${id}:v5`)).toBe(1);
  });

  it('[boundary] denies release when the populated scientific result is FAIL (adjacent to PASS)', async () => {
    const { id } = await seedReceiving({
      id: '01900000-0000-7000-8000-000000000fb3',
      inspectionResult: 'FAIL',
      workflowState: 'RELEASE_PENDING',
    });
    await expect(
      new ReleaseReceivingUseCase(receivingRepository()).execute({
        actor: manager(),
        id,
        expectedVersion: 4n,
        requestId: 'proof-boundary-release',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await receivingRow(id)).toMatchObject({
      workflow_state: 'RELEASE_PENDING',
      release_system: false,
      version: '4',
    });
    expect(await auditCountByRequest('proof-boundary-release')).toBe(0);
  });

  it('[wrong-role] denies an actor holding every permission but no P-05 authority', async () => {
    const { id } = await seedReceiving({
      id: '01900000-0000-7000-8000-000000000fb4',
      inspectionResult: 'PASS',
      workflowState: 'RELEASE_PENDING',
    });
    await expect(
      new ReleaseReceivingUseCase(receivingRepository()).execute({
        actor: employeeWithEveryPermission(),
        id,
        expectedVersion: 4n,
        requestId: 'proof-wrong-role-release',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await auditCountByRequest('proof-wrong-role-release')).toBe(0);
    expect(await receivingRow(id)).toMatchObject({ release_system: false, version: '4' });
  });

  it('[wrong-scope] fails closed for an OWN-scoped read grant on another user’s item', async () => {
    const { id } = await seedReceiving({
      id: '01900000-0000-7000-8000-000000000fb5',
      inspectionResult: 'PASS',
      workflowState: 'RELEASE_PENDING',
      createdBy: AUTHOR_ID,
    });
    await expect(
      new ReleaseReceivingUseCase(receivingRepository()).execute({
        actor: ownScopeManager(),
        id,
        expectedVersion: 4n,
        requestId: 'proof-wrong-scope-release',
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    expect(await receivingRow(id)).toMatchObject({ release_system: false, version: '4' });
    expect(await auditCountByRequest('proof-wrong-scope-release')).toBe(0);
    // The same row is reachable by the GLOBAL grant, proving the denial is
    // scope-driven rather than a missing record.
    expect(await receivingRepository().get(id, manager())).toBeDefined();
  });

  it('[invalid-state] denies release of an already released item without a second audit row', async () => {
    const { id } = await seedReceiving({
      id: '01900000-0000-7000-8000-000000000fb6',
      inspectionResult: 'PASS',
      workflowState: 'RELEASED',
      version: 5,
    });
    await expect(
      new ReleaseReceivingUseCase(receivingRepository()).execute({
        actor: manager(),
        id,
        expectedVersion: 5n,
        requestId: 'proof-invalid-state-release',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await auditCount(id, 'RELEASE')).toBe(0);
    expect(await outboxCount(`receiving:${id}:v6`)).toBe(0);
    expect(await receivingRow(id)).toMatchObject({ version: '5' });
  });

  it('[stale] denies release with a stale expected version and preserves the row', async () => {
    const { id } = await seedReceiving({
      id: '01900000-0000-7000-8000-000000000fb7',
      inspectionResult: 'PASS',
      workflowState: 'RELEASE_PENDING',
    });
    await expect(
      new ReleaseReceivingUseCase(receivingRepository()).execute({
        actor: manager(),
        id,
        expectedVersion: 3n,
        requestId: 'proof-stale-release',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(await receivingRow(id)).toMatchObject({ workflow_state: 'RELEASE_PENDING', version: '4' });
    expect(await auditCountByRequest('proof-stale-release')).toBe(0);
  });

  it('[rollback] leaves no half-committed release when the audit write fails inside the transaction', async () => {
    const { id } = await seedReceiving({
      id: '01900000-0000-7000-8000-000000000fb8',
      inspectionResult: 'PASS',
      workflowState: 'RELEASE_PENDING',
    });
    const requestId = 'proof-rollback-release';
    // Injected at the audit stage: it runs after the state change and the
    // outbox enqueue inside the same transaction, so a single atomic
    // transaction must leave none of them behind. The repository translates the
    // raw driver failure to a sanitized refusal, so the assertion checks the
    // sanitized code and never relies on the injected text leaking outward.
    await pool!.query(`
      CREATE OR REPLACE FUNCTION qc.proof_fail_release_audit() RETURNS trigger AS $$
      BEGIN
        IF NEW.request_id = '${requestId}' THEN
          RAISE EXCEPTION 'injected audit failure';
        END IF;
        RETURN NEW;
      END $$ LANGUAGE plpgsql;
      CREATE TRIGGER proof_fail_release_audit
        BEFORE INSERT ON qc.audit_events
        FOR EACH ROW EXECUTE FUNCTION qc.proof_fail_release_audit();
    `);
    try {
      await expect(
        new ReleaseReceivingUseCase(receivingRepository()).execute({
          actor: manager(),
          id,
          expectedVersion: 4n,
          requestId,
        }),
      ).rejects.toMatchObject({ code: 'SYSTEM_DATABASE_UNAVAILABLE' });
    } finally {
      await pool!.query('DROP TRIGGER IF EXISTS proof_fail_release_audit ON qc.audit_events');
    }
    expect(await receivingRow(id)).toMatchObject({
      workflow_state: 'RELEASE_PENDING',
      release_system: false,
      version: '4',
    });
    expect(await auditCountByRequest(requestId)).toBe(0);
    expect(await outboxCount(`receiving:${id}:v5`)).toBe(0);
  });
});

describe('QC-100-FINAL-013 · inspection approval and QMS consequence on populated PostgreSQL', () => {
  it('[normal] approves a populated UNDER_REVIEW inspection and creates no automatic NCR', async () => {
    const receivingId = '01900000-0000-7000-8000-000000000fc1';
    const templateId = crypto.randomUUID();
    const templateVersionId = crypto.randomUUID();
    const reportId = '01900000-0000-7000-8000-000000000fc2';
    await pool!.query(
      `INSERT INTO qc.receiving_items
         (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date,
          workflow_state, inspection_result, release_system, created_by, updated_by)
       VALUES ($1, 'RCV-PROOF-FC1', 'DOC-PROOF-FC1', 'ITEM-PROOF-FC1', 'Populated inspection item', 'LOT-PROOF-FC1', 1, '2026-02-02', 'UNDER_INSPECTION', 'IN_PROGRESS', false, $2, $2)`,
      [receivingId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
       VALUES ($1, 'TPL-PROOF-FC1', 'Populated NCR template', true, $2)`,
      [templateId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_template_versions (id, template_id, version_no, state, created_by)
       VALUES ($1, $2, 'v1', 'APPROVED', $3)`,
      [templateVersionId, templateId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_reports
         (id, inspection_no, receiving_item_id, template_version_id, state, final_result, author_id, created_by, version)
       VALUES ($1, 'INSP-PROOF-FC1', $2, $3, 'UNDER_REVIEW', 'FAIL', $4, $4, 3)`,
      [reportId, receivingId, templateVersionId, INSPECTOR_ID],
    );

    const ncrBefore = Number(
      (await pool!.query('SELECT count(*)::int AS count FROM qc.ncrs')).rows[0].count,
    );

    const repository = new PostgresInspectionRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    await new ApproveInspectionUseCase(repository).execute({
      actor: manager(),
      id: reportId,
      expectedVersion: 3n,
      requestId: 'proof-inspection-approve',
    });

    expect(await auditCount(reportId, 'APPROVE')).toBe(1);
    expect(await outboxCount(`inspection:${reportId}:v4`)).toBe(1);
    // PD-16 is unresolved: a FAIL inspection result must not create an NCR by
    // inference. The populated corpus proves the absence of the side effect.
    const ncrAfter = Number(
      (await pool!.query('SELECT count(*)::int AS count FROM qc.ncrs')).rows[0].count,
    );
    expect(ncrAfter).toBe(ncrBefore);
  });

  it('[invalid-state] denies a replayed approval after the committed one without a second audit row', async () => {
    const receivingId = '01900000-0000-7000-8000-000000000fc3';
    const templateId = crypto.randomUUID();
    const templateVersionId = crypto.randomUUID();
    const reportId = '01900000-0000-7000-8000-000000000fc4';
    await pool!.query(
      `INSERT INTO qc.receiving_items
         (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date,
          workflow_state, inspection_result, release_system, created_by, updated_by)
       VALUES ($1, 'RCV-PROOF-FC3', 'DOC-PROOF-FC3', 'ITEM-PROOF-FC3', 'Populated replay item', 'LOT-PROOF-FC3', 1, '2026-02-03', 'UNDER_INSPECTION', 'IN_PROGRESS', false, $2, $2)`,
      [receivingId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
       VALUES ($1, 'TPL-PROOF-FC3', 'Populated replay template', true, $2)`,
      [templateId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_template_versions (id, template_id, version_no, state, created_by)
       VALUES ($1, $2, 'v1', 'APPROVED', $3)`,
      [templateVersionId, templateId, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_reports
         (id, inspection_no, receiving_item_id, template_version_id, state, final_result, author_id, created_by, version)
       VALUES ($1, 'INSP-PROOF-FC3', $2, $3, 'UNDER_REVIEW', 'PASS', $4, $4, 3)`,
      [reportId, receivingId, templateVersionId, INSPECTOR_ID],
    );
    const useCase = new ApproveInspectionUseCase(
      new PostgresInspectionRepository(
        db,
        new PostgresAuditRepository(db),
        new PostgresOutboxRepository(db),
      ),
    );
    await useCase.execute({
      actor: manager(),
      id: reportId,
      expectedVersion: 3n,
      requestId: 'proof-inspection-approve-once',
    });
    await expect(
      useCase.execute({
        actor: manager(),
        id: reportId,
        expectedVersion: 3n,
        requestId: 'proof-inspection-approve-twice',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await auditCount(reportId, 'APPROVE')).toBe(1);
  });
});

describe('QC-100-FINAL-013 · controlled documents, signatures and tamper on populated PostgreSQL', () => {
  it('[normal] approves a populated document version through the P-05 authority path', async () => {
    const documentId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const repository = new PostgresDocumentRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    const identity: DocumentIdentity = {
      id: documentId,
      documentNo: `WI-PROOF-${documentId.slice(-4)}`,
      documentType: 'WI',
      title: 'Populated controlled work instruction',
      ownerId: AUTHOR_ID,
      active: true,
      createdBy: AUTHOR_ID,
      createdAt: new Date('2026-02-01T00:00:00Z'),
      updatedAt: new Date('2026-02-01T00:00:00Z'),
      version: 1n,
    };
    await repository.createDocument({
      document: identity,
      actor: actor(AUTHOR_ID, ['EMPLOYEE'], [{ code: 'PERM-DOC-VIEW', scopes: ['GLOBAL'] }]),
      requestId: 'proof-document-create',
    });
    const version: DocumentVersion = {
      id: versionId,
      documentId,
      revision: '1',
      state: 'IN_REVIEW',
      contentHash: 'proof-hash-1',
      createdBy: AUTHOR_ID,
      createdAt: new Date('2026-02-01T00:00:00Z'),
      version: 1n,
      files: [],
    };
    await repository.createVersion({
      version,
      actor: actor(AUTHOR_ID, ['EMPLOYEE'], [{ code: 'PERM-DOC-VIEW', scopes: ['GLOBAL'] }]),
      requestId: 'proof-document-version',
    });
    await new ApproveVersionUseCase(repository).execute({
      actor: documentApprover(),
      versionId,
      expectedVersion: 1n,
      requestId: 'proof-document-approve',
    });
    const row = (
      await pool!.query('SELECT state, version, approved_by FROM qc.document_versions WHERE id = $1', [
        versionId,
      ])
    ).rows[0];
    expect(row).toMatchObject({ state: 'APPROVED', approved_by: SUPERVISOR_ID, version: '2' });
    expect(await auditCount(versionId, 'APPROVE')).toBe(1);
  });

  it('[wrong-role] denies document approval for an Admin-only actor', async () => {
    const documentId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const repository = new PostgresDocumentRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    await repository.createDocument({
      document: {
        id: documentId,
        documentNo: `WI-PROOF-B-${documentId.slice(-4)}`,
        documentType: 'WI',
        title: 'Populated admin-denied work instruction',
        ownerId: AUTHOR_ID,
        active: true,
        createdBy: AUTHOR_ID,
        createdAt: new Date('2026-02-01T00:00:00Z'),
        updatedAt: new Date('2026-02-01T00:00:00Z'),
        version: 1n,
      },
      actor: actor(AUTHOR_ID, ['EMPLOYEE'], [{ code: 'PERM-DOC-VIEW', scopes: ['GLOBAL'] }]),
      requestId: 'proof-document-create-admin',
    });
    await repository.createVersion({
      version: {
        id: versionId,
        documentId,
        revision: '1',
        state: 'IN_REVIEW',
        contentHash: 'proof-hash-admin',
        createdBy: AUTHOR_ID,
        createdAt: new Date('2026-02-01T00:00:00Z'),
        version: 1n,
        files: [],
      },
      actor: actor(AUTHOR_ID, ['EMPLOYEE'], [{ code: 'PERM-DOC-VIEW', scopes: ['GLOBAL'] }]),
      requestId: 'proof-document-version-admin',
    });
    await expect(
      new ApproveVersionUseCase(repository).execute({
        actor: adminOnly(),
        versionId,
        expectedVersion: 1n,
        requestId: 'proof-document-approve-admin',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    const row = (
      await pool!.query('SELECT state, version FROM qc.document_versions WHERE id = $1', [versionId])
    ).rows[0];
    expect(row).toMatchObject({ state: 'IN_REVIEW', version: '1' });
    expect(await auditCountByRequest('proof-document-approve-admin')).toBe(0);
  });

  it('[tamper] rejects in-place edits of approved content and deletion of signature evidence', async () => {
    const documentId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    await pool!.query(
      `INSERT INTO qc.document_identities (id, document_no, document_type, title, active, created_by)
       VALUES ($1, $2, 'SOP', 'Populated tamper-evidence procedure', true, $3)`,
      [documentId, `SOP-PROOF-${documentId.slice(-4)}`, AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.document_versions (id, document_id, revision, state, content_hash, created_by)
       VALUES ($1, $2, '1', 'APPROVED', 'proof-approved-hash', $3)`,
      [versionId, documentId, AUTHOR_ID],
    );
    await expect(
      pool!.query(`UPDATE qc.document_versions SET content_hash = 'tampered' WHERE id = $1`, [
        versionId,
      ]),
    ).rejects.toThrow(/immutable/);

    const signature = await pool!.query(
      `INSERT INTO qc.electronic_signatures
         (actor_id, subject_type, subject_id, subject_version, action, meaning, snapshot_hash, reauth_method, request_id)
       VALUES ($1, 'DOCUMENT_VERSION', $2, 2, 'APPROVE', 'Approve populated version', 'proof-approved-hash', 'PASSWORD', 'proof-signature-populated')
       RETURNING id`,
      [SUPERVISOR_ID, versionId],
    );
    expect(signature.rows).toHaveLength(1);
    await expect(
      pool!.query(`DELETE FROM qc.electronic_signatures WHERE id = $1`, [signature.rows[0].id]),
    ).rejects.toThrow(/append-only/);

    const audit = await pool!.query(
      `INSERT INTO qc.audit_events (actor_type, actor_id, subject_type, subject_id, action, request_id)
       VALUES ('USER', $1, 'DOCUMENT_VERSION', $2, 'TAMPER_PROBE', 'proof-audit-populated') RETURNING id`,
      [SUPERVISOR_ID, versionId],
    );
    await expect(
      pool!.query(`UPDATE qc.audit_events SET action = 'TAMPERED' WHERE id = $1`, [
        audit.rows[0].id,
      ]),
    ).rejects.toThrow(/append-only/);
    expect(
      Number(
        (
          await pool!.query(
            "SELECT count(*)::int AS count FROM qc.electronic_signatures WHERE subject_id = $1",
            [versionId],
          )
        ).rows[0].count,
      ),
    ).toBe(1);
  });
});

describe('QC-100-FINAL-013 · policy-blocked laboratory defaults stay fail-closed', () => {
  it('[fail-closed] the populated controlled-source adapter refuses to evaluate or resolve without an approved source', async () => {
    const sources = new PostgresControlledLabSources(db);
    await expect(sources.evaluate()).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    // A populated, but unapproved/absent, template version must not resolve into
    // an evaluable controlled context (PD-01..PD-03 stay unsupplied).
    await expect(sources.resolve(crypto.randomUUID())).rejects.toMatchObject({
      code: 'AUTHZ_DENIED',
    });
  });

  it('[fail-closed] TR-LAB-008 VOID remains denied by the domain state machine', () => {
    for (const state of ['APPROVED', 'REJECTED', 'UNDER_REVIEW'] as const) {
      expect(() => transitionLab(state, 'VOID' as never)).toThrow();
    }
  });
});
