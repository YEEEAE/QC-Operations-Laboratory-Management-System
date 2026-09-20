/**
 * QC-100-FINAL-013 — approved two-stage controlled approval chain, end to end,
 * on populated PostgreSQL.
 *
 * Owner-approved chain (P-05 + migration 0031, QC-100-FINAL-004):
 *
 *   draft → submit → review → [stage-1 Supervisor approve: workflow event, no
 *   signature] → PENDING_QCM_APPROVAL → [QCM = MANAGER, or named owner: final
 *   approve + binding electronic signature] → APPROVED (locked) → [audited
 *   REOPEN with reason] → UNDER_REVIEW
 *
 * Proven here per record type: the normal chain, return/correct/resubmit,
 * reauthentication, the lock, authorized REOPEN, and the denial classes
 * (wrong authority, missing authority, out-of-scope/inactive actor, author SoD,
 * stage skipping, stale version, repeated request, concurrent attempts). Every
 * denial is asserted together with the absence of state/audit/outbox/signature
 * side effects, so a refusal cannot hide a half-applied mutation.
 *
 * HOLD is exercised separately from PASS: a HOLD inspection result never
 * releases an item (PASS ≠ RELEASED), and a receiving item that is on HOLD is
 * never overwritten by an approval.
 *
 * Policy-blocked sources stay blocked. The production
 * `PostgresControlledLabSources.evaluate()` still refuses to calculate an
 * outcome (PD-01/PD-02/PD-38 OPEN); the laboratory cases inject a test-only
 * server evaluator that mirrors the frozen context snapshot, so the
 * source-drift guard inside `ApproveLabTestUseCase` is genuinely exercised. No
 * scientific limit, tolerance, method, unit or authority was invented.
 */
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { GetEquipmentEligibilityUseCase } from '../../../src/modules/assets/equipment/application/get-equipment-eligibility.js';
import { PostgresEquipmentEligibilityReader } from '../../../src/modules/assets/equipment/infrastructure/eligibility-reader.js';
import { createFinalApprovalCeremony } from '../../../src/modules/e-signatures/application/final-approval-ceremony.js';
import { createPasswordReauthenticationVerifier } from '../../../src/modules/e-signatures/application/reauthentication-verifier.js';
import { Argon2idPasswordHasher } from '../../../src/modules/identity/security/argon2-password-hasher.js';
import { ApproveInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/approve-inspection.js';
import { FinalApproveInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/final-approve-inspection.js';
import { ReopenInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/reopen-inspection.js';
import { ResumeInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/resume-inspection.js';
import { ReturnInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/return-inspection.js';
import { ReviewInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/review-inspection.js';
import { SubmitInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/submit-inspection.js';
import { PostgresInspectionRepository } from '../../../src/modules/quarantine/inspection/infrastructure/postgres-repository.js';
import { SaveInspectionDraftUseCase } from '../../../src/modules/quarantine/inspection/application/save-inspection-draft.js';
import { ReleaseReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/release-receiving.js';
import { PostgresReceivingRepository } from '../../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import { ApproveLabTestUseCase } from '../../../src/modules/laboratory/application/approve-lab-test.js';
import { CreateLabTestUseCase } from '../../../src/modules/laboratory/application/create-lab-test.js';
import { FinalApproveLabTestUseCase } from '../../../src/modules/laboratory/application/final-approve-lab-test.js';
import { ReopenLabTestUseCase } from '../../../src/modules/laboratory/application/reopen-lab-test.js';
import { ReviewLabTestUseCase } from '../../../src/modules/laboratory/application/review-lab-test.js';
import { SaveMeasurementsUseCase } from '../../../src/modules/laboratory/application/save-measurements.js';
import { SubmitLabTestUseCase } from '../../../src/modules/laboratory/application/submit-lab-test.js';
import { PostgresControlledLabSources } from '../../../src/modules/laboratory/infrastructure/postgres-controlled-sources.js';
import { PostgresLabRepository } from '../../../src/modules/laboratory/infrastructure/postgres-repository.js';
import type { ControlledLabSources } from '../../../src/modules/laboratory/ports/controlled-sources.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const AUTHOR_ID = '01900000-0000-7000-8000-000000000e01';
const INSPECTOR_ID = '01900000-0000-7000-8000-000000000e02';
const MANAGER_ID = '01900000-0000-7000-8000-000000000e03';
const SUPERVISOR_ID = '01900000-0000-7000-8000-000000000e04';
const EMPLOYEE_ID = '01900000-0000-7000-8000-000000000e05';
const OWNER_ID = '01900000-0000-7000-8000-000000000e06';

/** Test-only reauthentication secret; never a real credential and never logged. */
const REAUTH_SECRET = 'final-013-proof-reauth-secret';
const WRONG_REAUTH_SECRET = 'final-013-proof-wrong-secret';

/** The canonical two-stage authority permissions, per record type. */
const ALL_CONTROLLED_PERMISSIONS = [
  'PERM-QUAR-VIEW',
  'PERM-QUAR-RELEASE',
  'PERM-INSP-VIEW',
  'PERM-INSP-REVIEW',
  'PERM-APR-REVIEW',
  'PERM-INSP-APPROVE',
  'PERM-APR-APPROVE',
  'PERM-INSP-RETURN',
  'PERM-APR-RETURN',
  'PERM-INSP-REJECT',
  'PERM-APR-REJECT',
  'PERM-LAB-VIEW',
  'PERM-LAB-CREATE',
  'PERM-LAB-EDIT-DRAFT',
  'PERM-LAB-ENTER-MEASUREMENT',
  'PERM-LAB-SUBMIT',
  'PERM-LAB-REVIEW',
  'PERM-LAB-APPROVE',
  'PERM-LAB-RETURN',
  'PERM-ESIG-SIGN',
] as const;

type Grant = ActorContext['permissions'][number];

const grants = (codes: readonly string[], scopes: readonly string[] = ['GLOBAL']) =>
  codes.map((code) => ({ code, scopes }) as unknown as Grant);

const actor = (
  id: string,
  roles: readonly string[],
  codes: readonly string[],
  options: {
    loginIdentity?: string;
    accountState?: 'ACTIVE' | 'DISABLED';
    scopes?: readonly string[];
  } = {},
): ActorContext => ({
  id,
  loginIdentity: options.loginIdentity ?? `identity-${id.slice(-3)}`,
  accountState: options.accountState ?? 'ACTIVE',
  roles,
  permissions: grants(codes, options.scopes ?? ['GLOBAL']),
});

/** Stage-1 (Supervisor) authority; never the final approver. */
const supervisor = (id: string = SUPERVISOR_ID) =>
  actor(
    id,
    ['SUPERVISOR'],
    [
      'PERM-INSP-VIEW',
      'PERM-INSP-REVIEW',
      'PERM-APR-REVIEW',
      'PERM-INSP-APPROVE',
      'PERM-INSP-RETURN',
      'PERM-APR-RETURN',
      'PERM-LAB-VIEW',
      'PERM-LAB-REVIEW',
      'PERM-LAB-APPROVE',
      'PERM-LAB-RETURN',
    ],
  );
/** The QCM: final approval authority with the binding-signature ceremony grant. */
const qcm = (id: string = MANAGER_ID) =>
  actor(
    id,
    ['MANAGER'],
    [
      'PERM-INSP-VIEW',
      'PERM-APR-REVIEW',
      'PERM-INSP-RETURN',
      'PERM-APR-RETURN',
      'PERM-APR-REJECT',
      'PERM-APR-APPROVE',
      'PERM-ESIG-SIGN',
      'PERM-LAB-VIEW',
      'PERM-LAB-RETURN',
      'PERM-APR-APPROVE',
      'PERM-ESIG-SIGN',
      'PERM-QUAR-VIEW',
      'PERM-QUAR-RELEASE',
    ],
  );
/** The named canonical owner: same final-approval authority. */
const namedOwner = () =>
  actor(OWNER_ID, ['SYSTEM_OWNER'], ['PERM-INSP-VIEW', 'PERM-APR-APPROVE', 'PERM-ESIG-SIGN'], {
    loginIdentity: 'yazeed',
  });
/** Data-entry author: may create/submit/own drafts; may never approve or sign. */
const author = (id: string = AUTHOR_ID) =>
  actor(
    id,
    ['EMPLOYEE'],
    [
      'PERM-INSP-VIEW',
      'PERM-INSP-EDIT-DRAFT',
      'PERM-INSP-SUBMIT',
      'PERM-LAB-VIEW',
      'PERM-LAB-CREATE',
      'PERM-LAB-EDIT-DRAFT',
      'PERM-LAB-ENTER-MEASUREMENT',
      'PERM-LAB-SUBMIT',
    ],
  );
/**
 * A stage-1 reviewer who also performed the data entry: used only to prove that
 * separation of duties, not a missing permission, is what refuses self-review.
 */
const supervisorAsAuthor = () =>
  actor(
    SUPERVISOR_ID,
    ['SUPERVISOR'],
    [
      'PERM-LAB-VIEW',
      'PERM-LAB-CREATE',
      'PERM-LAB-EDIT-DRAFT',
      'PERM-LAB-ENTER-MEASUREMENT',
      'PERM-LAB-SUBMIT',
      'PERM-LAB-REVIEW',
      'PERM-LAB-APPROVE',
    ],
  );
/** Holds every controlled permission but is not a stage authority role. */
const employeeWithEveryPermission = () =>
  actor(EMPLOYEE_ID, ['EMPLOYEE'], ALL_CONTROLLED_PERMISSIONS);
/** Read grant limited to its own records only. */
const ownScopeManager = () =>
  actor(MANAGER_ID, ['MANAGER'], ['PERM-INSP-VIEW'], { scopes: ['OWN'] });

let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;

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
      await pool!.query(
        'SELECT count(*)::int AS count FROM qc.audit_events WHERE request_id = $1',
        [requestId],
      )
    ).rows[0].count,
  );

const outboxCount = async (dedupeKey: string): Promise<number> =>
  Number(
    (
      await pool!.query(
        'SELECT count(*)::int AS count FROM qc.outbox_events WHERE dedupe_key = $1',
        [dedupeKey],
      )
    ).rows[0].count,
  );

const record = async (table: 'inspection_reports' | 'lab_tests', id: string) =>
  (await pool!.query(`SELECT state, version, approved_at FROM qc.${table} WHERE id = $1`, [id]))
    .rows[0];

const signatures = async (subjectId: string) =>
  (
    await pool!.query(
      `SELECT actor_id, action, meaning, subject_version, request_id
         FROM qc.electronic_signatures WHERE subject_id = $1 ORDER BY signed_at`,
      [subjectId],
    )
  ).rows;

const receivingRow = async (id: string) =>
  (
    await pool!.query(
      'SELECT workflow_state, inspection_result, release_system, version FROM qc.receiving_items WHERE id = $1',
      [id],
    )
  ).rows[0];

const inspectionRepository = () =>
  new PostgresInspectionRepository(
    db,
    new PostgresAuditRepository(db),
    new PostgresOutboxRepository(db),
  );

const labRepository = () =>
  new PostgresLabRepository(db, new PostgresAuditRepository(db), new PostgresOutboxRepository(db));

const receivingRepository = () =>
  new PostgresReceivingRepository(
    db,
    new PostgresAuditRepository(db),
    new PostgresOutboxRepository(db),
  );

/** The real ceremony: real signature evidence + real server-side reauthentication. */
const ceremony = () => createFinalApprovalCeremony(createPasswordReauthenticationVerifier(db));

/**
 * TEST-ONLY server evaluator.
 *
 * The production adapter refuses to calculate an outcome until the approved
 * method source exists, which is asserted separately below. This double mirrors
 * the frozen context's own source reference and content hash, so the
 * `ApproveLabTestUseCase` source-drift guard is exercised for real; it supplies
 * no limit, unit or tolerance.
 */
const labSources = (): ControlledLabSources => {
  const controlled: ControlledLabSources = new PostgresControlledLabSources(db);
  return {
    listApprovedTemplates: () => controlled.listApprovedTemplates(),
    resolve: (templateVersionId, actor) => controlled.resolve(templateVersionId, actor),
    validateExecution: () => Promise.resolve(),
    evaluate: (test) =>
      Promise.resolve({
        result: 'PASS' as const,
        sourceReference: test.context.sourceReference,
        contentHash: test.context.contentHash,
      }),
  };
};

/** Real assets eligibility reader; the proof context carries no equipment usage. */
const assetsEligibility = () =>
  new GetEquipmentEligibilityUseCase(new PostgresEquipmentEligibilityReader(db));

async function seedUser(id: string, identity: string, passwordHash: string) {
  await pool!.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash, account_state)
     VALUES ($1, $2, $2, $3, 'ACTIVE')`,
    [id, identity, passwordHash],
  );
}

async function seedTemplate(tag: string, options: { withPoint?: boolean } = {}) {
  const templateId = crypto.randomUUID();
  const versionId = crypto.randomUUID();
  await pool!.query(
    `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
     VALUES ($1, $2, 'FINAL-013 proof template', true, $3)`,
    [templateId, `TPL-F013-${tag}`, AUTHOR_ID],
  );
  await pool!.query(
    `INSERT INTO qc.inspection_template_versions
       (id, template_id, version_no, state, created_by, content_hash, name)
     VALUES ($1, $2, 'v1', 'APPROVED', $3, $4, 'FINAL-013 proof template')`,
    [versionId, templateId, AUTHOR_ID, `hash-f013-${tag}`],
  );
  if (!options.withPoint) return { versionId, pointId: undefined };
  const sectionId = crypto.randomUUID();
  const pointId = crypto.randomUUID();
  await pool!.query(
    `INSERT INTO qc.inspection_template_sections (id, template_version_id, section_code, title, position)
     VALUES ($1, $2, 'S1', 'Proof section', 1)`,
    [sectionId, versionId],
  );
  await pool!.query(
    `INSERT INTO qc.inspection_template_points
       (id, section_id, point_code, label, data_type, required, position)
     VALUES ($1, $2, 'P1', 'Proof point', 'TEXT', true, 1)`,
    [pointId, sectionId],
  );
  return { versionId, pointId };
}

/** Populates one receiving item plus its inspection report. */
async function seedInspection(options: {
  tag: string;
  reportId: string;
  state: string;
  finalResult: 'PASS' | 'FAIL' | 'HOLD' | null;
  authorId?: string;
  version?: number;
  receivingState?: string;
  withExecution?: boolean;
}) {
  const receivingId = crypto.randomUUID();
  const authorId = options.authorId ?? INSPECTOR_ID;
  const receivingState = options.receivingState ?? 'UNDER_INSPECTION';
  await pool!.query(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date,
        workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES ($1, $2, $3, $4, 'FINAL-013 proof item', $5, 3, '2026-03-01', $6, 'IN_PROGRESS', false, $7, $7)`,
    [
      receivingId,
      `RCV-F013-${options.tag}`,
      `DOC-F013-${options.tag}`,
      `ITEM-F013-${options.tag}`,
      `LOT-F013-${options.tag}`,
      receivingState,
      AUTHOR_ID,
    ],
  );
  const { versionId, pointId } = await seedTemplate(options.tag, {
    withPoint: options.withExecution === true,
  });
  await pool!.query(
    `INSERT INTO qc.inspection_reports
       (id, inspection_no, receiving_item_id, template_version_id, state, final_result,
        author_id, created_by, version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8)`,
    [
      options.reportId,
      `INSP-F013-${options.tag}`,
      receivingId,
      versionId,
      options.state,
      options.finalResult,
      authorId,
      options.version ?? 3,
    ],
  );
  if (options.withExecution && pointId) {
    await pool!.query(
      `INSERT INTO qc.inspection_report_results
         (inspection_report_id, template_point_id, text_value, entered_by)
       VALUES ($1, $2, 'recorded by the author', $3)`,
      [options.reportId, pointId, authorId],
    );
    const fileId = crypto.randomUUID();
    await pool!.query(
      `INSERT INTO qc.files
         (id, original_filename, storage_key, storage_provider, mime_type, size_bytes, sha256, state, uploaded_by)
       VALUES ($1, 'proof.pdf', $2, 'OBJECT_STORAGE', 'application/pdf', 10, repeat('a', 64), 'ACTIVE', $3)`,
      [fileId, `f013/${options.tag}.pdf`, authorId],
    );
    await pool!.query(
      `INSERT INTO qc.evidence_links (file_id, subject_type, subject_id, evidence_type, linked_by)
       VALUES ($1, 'INSPECTION_REPORT', $2, 'INSPECTION_EVIDENCE', $3)`,
      [fileId, options.reportId, authorId],
    );
    if (options.state === 'SUBMITTED') {
      const snapshot = await pool!.query(
        `INSERT INTO qc.inspection_report_snapshots
           (inspection_report_id, snapshot_version, snapshot_stage, receiving_snapshot, template_snapshot,
            controlled_source_snapshot, criteria_snapshot, results_snapshot, snapshot_hash)
         VALUES ($1, $2, 'SUBMISSION', '{}'::jsonb, $3::jsonb, '[]'::jsonb, '[]'::jsonb, $4::jsonb, $5)
         RETURNING id`,
        [
          options.reportId,
          options.version ?? 3,
          JSON.stringify({ templateVersionId: versionId }),
          JSON.stringify([{ pointId, value: 'recorded by the author' }]),
          `seed-submission-${options.tag}`,
        ],
      );
      await pool!.query(`UPDATE qc.inspection_reports SET snapshot_id = $2 WHERE id = $1`, [
        options.reportId,
        snapshot.rows[0]!.id,
      ]);
    }
  }
  return { reportId: options.reportId, receivingId, templateVersionId: versionId };
}

/** Populates one approved laboratory template version with one controlled parameter. */
async function seedLabTemplate(tag: string, options: { approved?: boolean } = {}) {
  const templateId = crypto.randomUUID();
  const versionId = crypto.randomUUID();
  const parameterId = crypto.randomUUID();
  await pool!.query(
    `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by)
     VALUES ($1, $2, 'FINAL-013 proof method', true, $3)`,
    [templateId, `LAB-F013-${tag}`, AUTHOR_ID],
  );
  await pool!.query(
    `INSERT INTO qc.lab_test_template_versions
       (id, template_id, version_no, state, method_reference, content_hash, created_by)
     VALUES ($1, $2, 'v1', $3, $4, $5, $6)`,
    [
      versionId,
      templateId,
      options.approved === false ? 'DRAFT' : 'APPROVED',
      `METHOD-F013-${tag}`,
      `labhash-f013-${tag}`,
      AUTHOR_ID,
    ],
  );
  await pool!.query(
    `INSERT INTO qc.lab_test_template_parameters
       (id, template_version_id, parameter_code, label, data_type, unit, required,
        acceptance_rule_payload, controlled_source_reference, position)
     VALUES ($1, $2, 'P1', 'Proof parameter', 'NUMERIC', NULL, true, '{}'::jsonb, $3, 1)`,
    [parameterId, versionId, `SRC-F013-${tag}`],
  );
  return { templateId, versionId, parameterId };
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
  // A real Argon2id hash so the server-side reauthentication path is genuinely
  // verified rather than stubbed; one hash is reused for every proof account.
  const passwordHash = await new Argon2idPasswordHasher().hash(REAUTH_SECRET);
  for (const [id, identity] of [
    [AUTHOR_ID, 'f013-author'],
    [INSPECTOR_ID, 'f013-inspector'],
    [MANAGER_ID, 'f013-qcm'],
    [SUPERVISOR_ID, 'f013-supervisor'],
    [EMPLOYEE_ID, 'f013-employee'],
    [OWNER_ID, 'yazeed'],
  ] as const) {
    await seedUser(id, identity, passwordHash);
  }
}, 180_000);

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

describe('QC-100-FINAL-013 · inspection two-stage chain on populated PostgreSQL', () => {
  it('[normal] completes draft → stage-1 → PENDING_QCM_APPROVAL → final approval with the binding signature', async () => {
    const reportId = '01900000-0000-7000-8000-000000000e11';
    const { receivingId } = await seedInspection({
      tag: 'e11',
      reportId,
      state: 'UNDER_REVIEW',
      finalResult: 'PASS',
    });

    // Stage-1 (Supervisor): a workflow event, never the signature.
    const staged = await new ApproveInspectionUseCase(inspectionRepository()).execute({
      actor: supervisor(),
      id: reportId,
      expectedVersion: 3n,
      requestId: 'f013-insp-stage1-e11',
    });
    expect(staged.state).toBe('PENDING_QCM_APPROVAL');
    expect((await record('inspection_reports', reportId)).approved_at).toBeNull();
    expect(await signatures(reportId)).toHaveLength(0);
    expect(await auditCount(reportId, 'APPROVE')).toBe(1);
    expect(await outboxCount(`inspection:${reportId}:v4`)).toBe(1);

    // Stage-2 (QCM): the only transition that locks the record.
    const final = await new FinalApproveInspectionUseCase(
      inspectionRepository(),
      ceremony(),
    ).execute({
      actor: qcm(),
      id: reportId,
      expectedVersion: 4n,
      reauthenticationSecret: REAUTH_SECRET,
      requestId: 'f013-insp-final-e11',
    });
    expect(final.signatureId).toBeTruthy();
    const committed = await record('inspection_reports', reportId);
    expect(committed).toMatchObject({ state: 'APPROVED', version: '5' });
    expect(committed.approved_at).not.toBeNull();
    expect(await auditCount(reportId, 'FINAL_APPROVE')).toBe(1);
    expect(await outboxCount(`inspection:${reportId}:v5`)).toBe(1);
    const signed = await signatures(reportId);
    expect(signed).toHaveLength(1);
    expect(signed[0]).toMatchObject({
      actor_id: MANAGER_ID,
      action: 'FINAL_APPROVE',
      meaning: 'FINAL_APPROVE',
      subject_version: '4',
      request_id: 'f013-insp-final-e11',
    });

    // The QCM final approval is the inspection consequence on the receiving item,
    // and it never releases anything by itself (PASS ≠ RELEASED).
    expect(await receivingRow(receivingId)).toMatchObject({
      workflow_state: 'INSPECTION_COMPLETE',
      inspection_result: 'PASS',
      release_system: false,
    });

    // The approved record is locked: a second final approval is refused with no
    // new signature, audit row or version.
    await expect(
      new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
        actor: qcm(),
        id: reportId,
        expectedVersion: 5n,
        reauthenticationSecret: REAUTH_SECRET,
        requestId: 'f013-insp-final-e11-replay',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await signatures(reportId)).toHaveLength(1);
    expect(await auditCountByRequest('f013-insp-final-e11-replay')).toBe(0);
    expect(await record('inspection_reports', reportId)).toMatchObject({ version: '5' });
  });

  it('[normal] returns for correction, resumes, resubmits and completes with exactly one signature', async () => {
    const reportId = '01900000-0000-7000-8000-000000000e12';
    await seedInspection({
      tag: 'e12',
      reportId,
      state: 'SUBMITTED',
      // The official result is record data supplied by the approved controlled
      // source; the application itself cannot write it (see the [blocker] case
      // below, which proves that gap).
      finalResult: 'PASS',
      authorId: AUTHOR_ID,
      version: 5,
      withExecution: true,
    });

    await new ReviewInspectionUseCase(inspectionRepository()).execute({
      actor: supervisor(),
      id: reportId,
      expectedVersion: 5n,
      requestId: 'f013-insp-review-e12',
    });
    await new ApproveInspectionUseCase(inspectionRepository()).execute({
      actor: supervisor(),
      id: reportId,
      expectedVersion: 6n,
      requestId: 'f013-insp-stage1-e12',
    });
    expect((await record('inspection_reports', reportId)).state).toBe('PENDING_QCM_APPROVAL');

    // The QCM returns it for correction: reason is mandatory.
    await expect(
      new ReturnInspectionUseCase(inspectionRepository()).execute({
        actor: qcm(),
        id: reportId,
        expectedVersion: 7n,
        reason: '   ',
        requestId: 'f013-insp-return-blank-e12',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await new ReturnInspectionUseCase(inspectionRepository()).execute({
      actor: qcm(),
      id: reportId,
      expectedVersion: 7n,
      reason: 'Measurement remark illegible; correct and resubmit.',
      requestId: 'f013-insp-return-e12',
    });
    expect((await record('inspection_reports', reportId)).state).toBe('RETURNED');

    // Resume is the author's controlled re-entry: a review-only stage-1 actor
    // without the draft-edit grant cannot take the record back into editing.
    await expect(
      new ResumeInspectionUseCase(inspectionRepository()).execute({
        actor: supervisor(),
        id: reportId,
        expectedVersion: 8n,
        requestId: 'f013-insp-resume-other-e12',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(await record('inspection_reports', reportId)).toMatchObject({
      state: 'RETURNED',
      version: '8',
    });
    expect(await auditCount(reportId, 'RESUME')).toBe(0);
    await new ResumeInspectionUseCase(inspectionRepository()).execute({
      actor: author(),
      id: reportId,
      expectedVersion: 8n,
      requestId: 'f013-insp-resume-e12',
    });
    expect((await record('inspection_reports', reportId)).state).toBe('DRAFT');
    const returnedDraft = await inspectionRepository().get(reportId, author());
    await new SaveInspectionDraftUseCase(inspectionRepository()).execute({
      actor: author(),
      id: reportId,
      expectedVersion: 9n,
      results: (returnedDraft?.results ?? []).map((result) => ({
        ...result,
        value: 'corrected by the author',
      })),
      requestId: 'f013-insp-correct-e12',
    });
    await new SubmitInspectionUseCase(inspectionRepository()).execute({
      actor: author(),
      id: reportId,
      expectedVersion: 10n,
      requestId: 'f013-insp-resubmit-e12',
    });
    expect((await record('inspection_reports', reportId)).state).toBe('SUBMITTED');

    await new ReviewInspectionUseCase(inspectionRepository()).execute({
      actor: supervisor(),
      id: reportId,
      expectedVersion: 11n,
      requestId: 'f013-insp-review2-e12',
    });
    await new ApproveInspectionUseCase(inspectionRepository()).execute({
      actor: supervisor(),
      id: reportId,
      expectedVersion: 12n,
      requestId: 'f013-insp-stage1b-e12',
    });
    await new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
      actor: qcm(),
      id: reportId,
      expectedVersion: 13n,
      reauthenticationSecret: REAUTH_SECRET,
      requestId: 'f013-insp-final-e12',
    });
    expect(await record('inspection_reports', reportId)).toMatchObject({
      state: 'APPROVED',
      version: '14',
    });
    const executionHistory = await pool!.query(
      `SELECT results_snapshot FROM qc.inspection_report_snapshots
       WHERE inspection_report_id = $1 AND snapshot_stage = 'SUBMISSION' ORDER BY snapshot_version`,
      [reportId],
    );
    expect(executionHistory.rows).toHaveLength(2);
    expect(executionHistory.rows[0]?.results_snapshot).toMatchObject([
      { pointId: expect.any(String), value: 'recorded by the author' },
    ]);
    expect(executionHistory.rows[1]?.results_snapshot).toMatchObject([
      { value: 'corrected by the author' },
    ]);
    // The whole correction cycle produced exactly one binding signature, on the
    // final approval, and one audit row per controlled transition.
    expect(await signatures(reportId)).toHaveLength(1);
    // The seeded submission predates the fixture, so the only SUBMIT transition
    // recorded by a use case here is the resubmission after correction.
    expect(await auditCount(reportId, 'SUBMIT')).toBe(1);
    expect(await auditCount(reportId, 'RETURN')).toBe(1);
    expect(await auditCount(reportId, 'RESUME')).toBe(1);
    expect(await auditCount(reportId, 'FINAL_APPROVE')).toBe(1);
  });

  it('[wrong-role] denies the named owner, stage skipping, non-authority roles and inactive actors', async () => {
    // The named canonical owner holds the same final-approval authority as the QCM.
    const ownerReport = '01900000-0000-7000-8000-000000000e13';
    await seedInspection({
      tag: 'e13',
      reportId: ownerReport,
      state: 'PENDING_QCM_APPROVAL',
      finalResult: 'PASS',
      version: 4,
    });
    await new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
      actor: namedOwner(),
      id: ownerReport,
      expectedVersion: 4n,
      reauthenticationSecret: REAUTH_SECRET,
      requestId: 'f013-insp-final-owner-e13',
    });
    expect((await record('inspection_reports', ownerReport)).state).toBe('APPROVED');

    // Stage skipping: a QCM cannot final-approve a record that Supervisor has not
    // staged, and no UNDER_REVIEW → APPROVED path exists.
    const skipReport = '01900000-0000-7000-8000-000000000e14';
    await seedInspection({
      tag: 'e14',
      reportId: skipReport,
      state: 'UNDER_REVIEW',
      finalResult: 'PASS',
    });
    await expect(
      new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
        actor: qcm(),
        id: skipReport,
        expectedVersion: 3n,
        reauthenticationSecret: REAUTH_SECRET,
        requestId: 'f013-insp-skip-e14',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await signatures(skipReport)).toHaveLength(0);
    expect(await auditCountByRequest('f013-insp-skip-e14')).toBe(0);
    expect(await record('inspection_reports', skipReport)).toMatchObject({
      state: 'UNDER_REVIEW',
      version: '3',
    });

    // Supervisor is stage-1 only: no final approval, even with the ceremony grant.
    await expect(
      new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
        actor: supervisor(),
        id: skipReport,
        expectedVersion: 3n,
        reauthenticationSecret: REAUTH_SECRET,
        requestId: 'f013-insp-supervisor-final-e14',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });

    // An employee holding every controlled permission still has no stage authority.
    await expect(
      new ApproveInspectionUseCase(inspectionRepository()).execute({
        actor: employeeWithEveryPermission(),
        id: skipReport,
        expectedVersion: 3n,
        requestId: 'f013-insp-employee-stage1-e14',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await auditCountByRequest('f013-insp-employee-stage1-e14')).toBe(0);

    // A disabled account is refused before any authority check succeeds.
    await expect(
      new ApproveInspectionUseCase(inspectionRepository()).execute({
        actor: actor(SUPERVISOR_ID, ['SUPERVISOR'], ['PERM-INSP-VIEW', 'PERM-INSP-APPROVE'], {
          accountState: 'DISABLED',
        }),
        id: skipReport,
        expectedVersion: 3n,
        requestId: 'f013-insp-inactive-e14',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await record('inspection_reports', skipReport)).toMatchObject({ version: '3' });
  });

  it('[wrong-role] denies stage-1 approval by the author (separation of duties)', async () => {
    const reportId = '01900000-0000-7000-8000-000000000e15';
    await seedInspection({
      tag: 'e15',
      reportId,
      state: 'UNDER_REVIEW',
      finalResult: 'PASS',
      authorId: SUPERVISOR_ID,
    });
    await expect(
      new ApproveInspectionUseCase(inspectionRepository()).execute({
        actor: supervisor(),
        id: reportId,
        expectedVersion: 3n,
        requestId: 'f013-insp-sod-e15',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
    expect(await auditCountByRequest('f013-insp-sod-e15')).toBe(0);
    expect(await record('inspection_reports', reportId)).toMatchObject({
      state: 'UNDER_REVIEW',
      version: '3',
    });
  });

  it('[wrong-scope] hides another author’s record from an OWN-scoped read grant', async () => {
    const reportId = '01900000-0000-7000-8000-000000000e16';
    await seedInspection({
      tag: 'e16',
      reportId,
      state: 'UNDER_REVIEW',
      finalResult: 'PASS',
    });
    await expect(
      new ApproveInspectionUseCase(inspectionRepository()).execute({
        actor: ownScopeManager(),
        id: reportId,
        expectedVersion: 3n,
        requestId: 'f013-insp-scope-e16',
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    expect(await auditCountByRequest('f013-insp-scope-e16')).toBe(0);
    expect(await record('inspection_reports', reportId)).toMatchObject({ version: '3' });
  });

  it('[stale] denies a stale expected version and a repeated request without a second effect', async () => {
    const reportId = '01900000-0000-7000-8000-000000000e17';
    await seedInspection({
      tag: 'e17',
      reportId,
      state: 'UNDER_REVIEW',
      finalResult: 'PASS',
    });
    await expect(
      new ApproveInspectionUseCase(inspectionRepository()).execute({
        actor: supervisor(),
        id: reportId,
        expectedVersion: 2n,
        requestId: 'f013-insp-stale-e17',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(await record('inspection_reports', reportId)).toMatchObject({ version: '3' });
    expect(await auditCountByRequest('f013-insp-stale-e17')).toBe(0);

    await new ApproveInspectionUseCase(inspectionRepository()).execute({
      actor: supervisor(),
      id: reportId,
      expectedVersion: 3n,
      requestId: 'f013-insp-repeat-e17',
    });
    // The same request replayed after the commit is refused and, crucially, the
    // stored state and history gain nothing.
    await expect(
      new ApproveInspectionUseCase(inspectionRepository()).execute({
        actor: supervisor(),
        id: reportId,
        expectedVersion: 3n,
        requestId: 'f013-insp-repeat-e17',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await auditCountByRequest('f013-insp-repeat-e17')).toBe(1);
    expect(await record('inspection_reports', reportId)).toMatchObject({
      state: 'PENDING_QCM_APPROVAL',
      version: '4',
    });
  });

  it('[reauthentication] refuses a wrong secret before any signature or state change', async () => {
    const reportId = '01900000-0000-7000-8000-000000000e18';
    await seedInspection({
      tag: 'e18',
      reportId,
      state: 'PENDING_QCM_APPROVAL',
      finalResult: 'PASS',
      version: 4,
    });
    await expect(
      new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
        actor: qcm(),
        id: reportId,
        expectedVersion: 4n,
        reauthenticationSecret: WRONG_REAUTH_SECRET,
        requestId: 'f013-insp-reauth-e18',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
    await expect(
      new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
        actor: qcm(),
        id: reportId,
        expectedVersion: 4n,
        reauthenticationSecret: '   ',
        requestId: 'f013-insp-reauth-blank-e18',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
    expect(await signatures(reportId)).toHaveLength(0);
    expect(await auditCount(reportId, 'FINAL_APPROVE')).toBe(0);
    expect(await record('inspection_reports', reportId)).toMatchObject({
      state: 'PENDING_QCM_APPROVAL',
      version: '4',
    });
  });

  it('[blocker] proves no application path can supply the official inspection result that stage-1 approval requires', async () => {
    // 1. A browser-supplied official result is refused by contract.
    const draftReport = '01900000-0000-7000-8000-000000000e23';
    await seedInspection({
      tag: 'e23',
      reportId: draftReport,
      state: 'DRAFT',
      finalResult: null,
      authorId: AUTHOR_ID,
      version: 1,
      withExecution: true,
    });
    const draft = inspectionRepository();
    const loaded = await draft.get(draftReport, author());
    await expect(
      new SaveInspectionDraftUseCase(draft).execute({
        actor: author(),
        id: draftReport,
        expectedVersion: 1n,
        results: loaded?.results ?? [],
        finalResult: 'PASS',
        requestId: 'f013-insp-browser-result-e23',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });

    // 2. With no official result (the only state the application can produce,
    //    because no controlled inspection source is wired), stage-1 approval is
    //    unreachable: the approved two-stage inspection chain cannot complete
    //    until the PD-01/PD-02/PD-07 source exists. The refusal is fail-closed.
    const unreachableReport = '01900000-0000-7000-8000-000000000e24';
    await seedInspection({
      tag: 'e24',
      reportId: unreachableReport,
      state: 'UNDER_REVIEW',
      finalResult: null,
    });
    await expect(
      new ApproveInspectionUseCase(inspectionRepository()).execute({
        actor: supervisor(),
        id: unreachableReport,
        expectedVersion: 3n,
        requestId: 'f013-insp-no-result-e24',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await auditCountByRequest('f013-insp-no-result-e24')).toBe(0);
    expect(await record('inspection_reports', unreachableReport)).toMatchObject({
      state: 'UNDER_REVIEW',
      version: '3',
    });
    // The record keeps its state and version: no result, signature or approval
    // was fabricated for it.
    expect(await signatures(unreachableReport)).toHaveLength(0);
  });

  it('[concurrency] lets exactly one of two simultaneous stage-1 approvals win, five times over', async () => {
    for (let iteration = 1; iteration <= 5; iteration += 1) {
      const reportId = crypto.randomUUID();
      await seedInspection({
        tag: `e19-${iteration}`,
        reportId,
        state: 'UNDER_REVIEW',
        finalResult: 'PASS',
      });
      const attempt = (requestId: string) =>
        new ApproveInspectionUseCase(inspectionRepository()).execute({
          actor: supervisor(),
          id: reportId,
          expectedVersion: 3n,
          requestId,
        });
      const results = await Promise.allSettled([
        attempt(`f013-insp-race-a-${iteration}`),
        attempt(`f013-insp-race-b-${iteration}`),
      ]);
      const winners = results.filter((result) => result.status === 'fulfilled');
      const losers = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      expect(winners).toHaveLength(1);
      expect(losers).toHaveLength(1);
      expect(['CONFLICT_STALE_VERSION', 'AUTHZ_DENIED']).toContain(
        (losers[0].reason as { code?: string }).code,
      );
      expect(await auditCount(reportId, 'APPROVE')).toBe(1);
      expect(await record('inspection_reports', reportId)).toMatchObject({
        state: 'PENDING_QCM_APPROVAL',
        version: '4',
      });
    }
  });

  it('[lock] keeps the approved record immutable and reopens it only through the audited reason-bearing path', async () => {
    const reportId = '01900000-0000-7000-8000-000000000e20';
    await seedInspection({
      tag: 'e20',
      reportId,
      state: 'PENDING_QCM_APPROVAL',
      finalResult: 'PASS',
      version: 4,
      withExecution: true,
    });
    await new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
      actor: qcm(),
      id: reportId,
      expectedVersion: 4n,
      reauthenticationSecret: REAUTH_SECRET,
      requestId: 'f013-insp-final-e20',
    });
    expect((await record('inspection_reports', reportId)).state).toBe('APPROVED');

    // Ordinary editing of a locked record is refused (state/version gates).
    await expect(
      inspectionRepository().saveDraft({
        id: reportId,
        expectedVersion: 5n,
        actor: author(),
        results: [],
        requestId: 'f013-insp-edit-locked-e20',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });

    // REOPEN is reserved to the final-approval authority and needs a reason.
    await expect(
      new ReopenInspectionUseCase(inspectionRepository()).execute({
        actor: supervisor(),
        id: reportId,
        expectedVersion: 5n,
        reason: 'Supervisor may not reopen a locked record.',
        requestId: 'f013-insp-reopen-role-e20',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      new ReopenInspectionUseCase(inspectionRepository()).execute({
        actor: qcm(),
        id: reportId,
        expectedVersion: 5n,
        reason: '   ',
        requestId: 'f013-insp-reopen-blank-e20',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(await auditCount(reportId, 'REOPEN')).toBe(0);
    expect(await record('inspection_reports', reportId)).toMatchObject({
      state: 'APPROVED',
      version: '5',
    });

    await new ReopenInspectionUseCase(inspectionRepository()).execute({
      actor: qcm(),
      id: reportId,
      expectedVersion: 5n,
      reason: 'Post-approval review of the recorded evidence.',
      requestId: 'f013-insp-reopen-e20',
    });
    expect((await record('inspection_reports', reportId)).state).toBe('UNDER_REVIEW');
    expect(await auditCount(reportId, 'REOPEN')).toBe(1);
    // The signature history is preserved; reopening does not erase the approval.
    expect(await signatures(reportId)).toHaveLength(1);

    // Stage order is mandatory again after a reopen: no direct final approval.
    await expect(
      new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
        actor: qcm(),
        id: reportId,
        expectedVersion: 6n,
        reauthenticationSecret: REAUTH_SECRET,
        requestId: 'f013-insp-final-after-reopen-e20',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await new ApproveInspectionUseCase(inspectionRepository()).execute({
      actor: supervisor(),
      id: reportId,
      expectedVersion: 6n,
      requestId: 'f013-insp-stage1-after-reopen-e20',
    });
    expect(await record('inspection_reports', reportId)).toMatchObject({
      state: 'PENDING_QCM_APPROVAL',
      version: '7',
    });
  });

  it('[boundary] never treats HOLD as PASS and never overwrites a receiving HOLD', async () => {
    // A HOLD result completes the inspection chain but must not release the item.
    const holdReport = '01900000-0000-7000-8000-000000000e21';
    const { receivingId } = await seedInspection({
      tag: 'e21',
      reportId: holdReport,
      state: 'UNDER_REVIEW',
      finalResult: 'HOLD',
    });
    await new ApproveInspectionUseCase(inspectionRepository()).execute({
      actor: supervisor(),
      id: holdReport,
      expectedVersion: 3n,
      requestId: 'f013-insp-hold-stage1-e21',
    });
    await new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
      actor: qcm(),
      id: holdReport,
      expectedVersion: 4n,
      reauthenticationSecret: REAUTH_SECRET,
      requestId: 'f013-insp-hold-final-e21',
    });
    const held = await receivingRow(receivingId);
    expect(held).toMatchObject({
      workflow_state: 'INSPECTION_COMPLETE',
      inspection_result: 'HOLD',
      release_system: false,
    });
    // A HOLD (or FAIL) result is not a release: the release path denies it.
    await expect(
      new ReleaseReceivingUseCase(receivingRepository()).execute({
        actor: qcm(),
        id: receivingId,
        expectedVersion: BigInt(held.version),
        requestId: 'f013-hold-release-e21',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await receivingRow(receivingId)).toMatchObject({
      release_system: false,
      inspection_result: 'HOLD',
    });

    // A receiving item independently placed on HOLD is never resurrected by an
    // inspection approval; the controlled state wins.
    const protectedReport = '01900000-0000-7000-8000-000000000e22';
    const { receivingId: protectedReceiving } = await seedInspection({
      tag: 'e22',
      reportId: protectedReport,
      state: 'PENDING_QCM_APPROVAL',
      finalResult: 'PASS',
      version: 4,
      receivingState: 'HOLD',
    });
    await expect(
      new FinalApproveInspectionUseCase(inspectionRepository(), ceremony()).execute({
        actor: qcm(),
        id: protectedReport,
        expectedVersion: 4n,
        reauthenticationSecret: REAUTH_SECRET,
        requestId: 'f013-insp-hold-guard-e22',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(await receivingRow(protectedReceiving)).toMatchObject({ workflow_state: 'HOLD' });
    // Nothing half-applied: the record itself stays staged and unsigned.
    expect(await record('inspection_reports', protectedReport)).toMatchObject({
      state: 'PENDING_QCM_APPROVAL',
      version: '4',
    });
    expect(await auditCount(protectedReport, 'FINAL_APPROVE')).toBe(0);
    expect(await signatures(protectedReport)).toHaveLength(0);
  });
});

describe('QC-100-FINAL-013 · laboratory two-stage chain on populated PostgreSQL', () => {
  const buildTest = async (tag: string, as: ActorContext = author()) => {
    const { versionId, parameterId } = await seedLabTemplate(tag);
    const repository = labRepository();
    const sources = labSources();
    const created = await new CreateLabTestUseCase(repository, sources).execute({
      actor: as,
      templateVersionId: versionId,
      labTestNo: `LAB-F013-${tag}`,
      requestId: `f013-lab-create-${tag}`,
    });
    expect(created.state).toBe('DRAFT');
    return { test: created, repository, sources, parameterId };
  };

  const enterAndSubmit = async (
    context: Awaited<ReturnType<typeof buildTest>>,
    tag: string,
    as: ActorContext = author(),
  ) => {
    const sampleId = crypto.randomUUID();
    const saved = await new SaveMeasurementsUseCase(context.repository).execute({
      actor: as,
      id: context.test.id,
      expectedVersion: context.test.version,
      samples: [{ id: sampleId, identifier: `sample-${tag}` }],
      measurements: [
        {
          sampleId,
          parameterId: context.parameterId,
          raw: '1',
          unit: null,
          remarks: 'recorded by the author',
        },
      ],
      requestId: `f013-lab-save-${tag}`,
    });
    const submitted = await new SubmitLabTestUseCase(
      context.repository,
      context.sources,
      assetsEligibility(),
    ).execute({
      actor: as,
      id: saved.id,
      expectedVersion: saved.version,
      requestId: `f013-lab-submit-${tag}`,
    });
    expect(submitted.state).toBe('SUBMITTED');
    return submitted;
  };

  it('[normal] completes create → measurements → submit → stage-1 → final approval → reopen', async () => {
    const context = await buildTest('e31');
    const submitted = await enterAndSubmit(context, 'e31');
    const reviewed = await new ReviewLabTestUseCase(context.repository).execute({
      actor: supervisor(),
      id: submitted.id,
      expectedVersion: submitted.version,
      requestId: 'f013-lab-review-e31',
    });
    expect(reviewed.state).toBe('UNDER_REVIEW');

    const staged = await new ApproveLabTestUseCase(context.repository, context.sources).execute({
      actor: supervisor(),
      id: reviewed.id,
      expectedVersion: reviewed.version,
      requestId: 'f013-lab-stage1-e31',
    });
    expect(staged.state).toBe('PENDING_QCM_APPROVAL');
    expect(staged.scientificResult).toBe('PASS');
    expect(await signatures(staged.id)).toHaveLength(0);

    const approved = await new FinalApproveLabTestUseCase(context.repository, ceremony()).execute({
      actor: qcm(),
      id: staged.id,
      expectedVersion: staged.version,
      reauthenticationSecret: REAUTH_SECRET,
      requestId: 'f013-lab-final-e31',
    });
    expect(approved.signatureId).toBeTruthy();
    const committed = await record('lab_tests', staged.id);
    expect(committed).toMatchObject({ state: 'APPROVED' });
    expect(committed.approved_at).not.toBeNull();
    expect(await auditCount(staged.id, 'FINAL_APPROVE')).toBe(1);
    expect(await signatures(staged.id)).toHaveLength(1);

    // A locked laboratory record cannot be edited or re-approved.
    await expect(
      new SaveMeasurementsUseCase(context.repository).execute({
        actor: author(),
        id: staged.id,
        expectedVersion: BigInt(committed.version),
        samples: [],
        measurements: [],
        requestId: 'f013-lab-edit-locked-e31',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });

    // REOPEN needs the final-approval authority and a reason.
    await expect(
      new ReopenLabTestUseCase(context.repository).execute({
        actor: supervisor(),
        id: staged.id,
        expectedVersion: BigInt(committed.version),
        reason: 'Supervisor may not reopen a locked laboratory record.',
        requestId: 'f013-lab-reopen-role-e31',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    const reopened = await new ReopenLabTestUseCase(context.repository).execute({
      actor: qcm(),
      id: staged.id,
      expectedVersion: BigInt(committed.version),
      reason: 'Post-approval verification of the recorded measurement.',
      requestId: 'f013-lab-reopen-e31',
    });
    expect(reopened.state).toBe('UNDER_REVIEW');
    expect(await auditCount(staged.id, 'REOPEN')).toBe(1);
    expect(await signatures(staged.id)).toHaveLength(1);
  });

  it('[wrong-role] denies stage-1, final and named-owner stage order to non-authorities', async () => {
    const context = await buildTest('e32');
    const submitted = await enterAndSubmit(context, 'e32');
    const reviewed = await new ReviewLabTestUseCase(context.repository).execute({
      actor: supervisor(),
      id: submitted.id,
      expectedVersion: submitted.version,
      requestId: 'f013-lab-review-e32',
    });

    // Stage skipping: final approval on UNDER_REVIEW is refused.
    await expect(
      new FinalApproveLabTestUseCase(context.repository, ceremony()).execute({
        actor: qcm(),
        id: reviewed.id,
        expectedVersion: reviewed.version,
        reauthenticationSecret: REAUTH_SECRET,
        requestId: 'f013-lab-skip-e32',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await signatures(reviewed.id)).toHaveLength(0);

    // An employee with every controlled permission has no stage authority.
    await expect(
      new ApproveLabTestUseCase(context.repository, context.sources).execute({
        actor: employeeWithEveryPermission(),
        id: reviewed.id,
        expectedVersion: reviewed.version,
        requestId: 'f013-lab-employee-stage1-e32',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });

    // The author cannot review their own test (separation of duties): the same
    // actor holds the review permission here, so the refusal is SoD, not a
    // missing grant.
    const ownTest = await buildTest('e33', supervisorAsAuthor());
    const ownSubmitted = await enterAndSubmit(ownTest, 'e33', supervisorAsAuthor());
    await expect(
      new ReviewLabTestUseCase(ownTest.repository).execute({
        actor: supervisorAsAuthor(),
        id: ownSubmitted.id,
        expectedVersion: ownSubmitted.version,
        requestId: 'f013-lab-sod-e33',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
    expect(await auditCountByRequest('f013-lab-sod-e33')).toBe(0);
    expect(await record('lab_tests', ownSubmitted.id)).toMatchObject({
      state: 'SUBMITTED',
    });
  });

  it('[reauthentication] refuses a wrong secret before any laboratory signature or state change', async () => {
    const context = await buildTest('e34');
    const submitted = await enterAndSubmit(context, 'e34');
    const reviewed = await new ReviewLabTestUseCase(context.repository).execute({
      actor: supervisor(),
      id: submitted.id,
      expectedVersion: submitted.version,
      requestId: 'f013-lab-review-e34',
    });
    const staged = await new ApproveLabTestUseCase(context.repository, context.sources).execute({
      actor: supervisor(),
      id: reviewed.id,
      expectedVersion: reviewed.version,
      requestId: 'f013-lab-stage1-e34',
    });
    await expect(
      new FinalApproveLabTestUseCase(context.repository, ceremony()).execute({
        actor: qcm(),
        id: staged.id,
        expectedVersion: staged.version,
        reauthenticationSecret: WRONG_REAUTH_SECRET,
        requestId: 'f013-lab-reauth-e34',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
    expect(await signatures(staged.id)).toHaveLength(0);
    expect(await auditCount(staged.id, 'FINAL_APPROVE')).toBe(0);
    expect(await record('lab_tests', staged.id)).toMatchObject({
      state: 'PENDING_QCM_APPROVAL',
    });
  });

  it('[stale] denies a stale version and lets exactly one of two simultaneous stage-1 approvals win', async () => {
    for (let iteration = 1; iteration <= 5; iteration += 1) {
      const tag = `e35-${iteration}`;
      const context = await buildTest(tag);
      const submitted = await enterAndSubmit(context, tag);
      const reviewed = await new ReviewLabTestUseCase(context.repository).execute({
        actor: supervisor(),
        id: submitted.id,
        expectedVersion: submitted.version,
        requestId: `f013-lab-review-${tag}`,
      });
      await expect(
        new ApproveLabTestUseCase(context.repository, context.sources).execute({
          actor: supervisor(),
          id: reviewed.id,
          expectedVersion: reviewed.version - 1n,
          requestId: `f013-lab-stale-${tag}`,
        }),
      ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
      expect(await record('lab_tests', reviewed.id)).toMatchObject({ state: 'UNDER_REVIEW' });

      const attempt = (requestId: string) =>
        new ApproveLabTestUseCase(context.repository, context.sources).execute({
          actor: supervisor(),
          id: reviewed.id,
          expectedVersion: reviewed.version,
          requestId,
        });
      const requestA = `f013-lab-race-a-${tag}`;
      const requestB = `f013-lab-race-b-${tag}`;
      const results = await Promise.allSettled([attempt(requestA), attempt(requestB)]);
      const winnerIndex = results.findIndex((result) => result.status === 'fulfilled');
      const losers = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      // Exactly one winner, whichever interleaving the scheduler produced.
      expect(winnerIndex).toBeGreaterThanOrEqual(0);
      expect(losers).toHaveLength(1);
      expect(['CONFLICT_STALE_VERSION', 'AUTHZ_DENIED']).toContain(
        (losers[0].reason as { code?: string }).code,
      );
      expect(await auditCount(reviewed.id, 'APPROVE')).toBe(1);
      expect(await record('lab_tests', reviewed.id)).toMatchObject({
        state: 'PENDING_QCM_APPROVAL',
      });
      // The winner's request replayed after the commit gains nothing: the state
      // is no longer approvable and no second audit row appears for it.
      const winnerRequest = winnerIndex === 0 ? requestA : requestB;
      await expect(attempt(winnerRequest)).rejects.toMatchObject({
        code: 'AUTHZ_DENIED',
      });
      expect(await auditCountByRequest(winnerRequest)).toBe(1);
    }
  });

  it('[fail-closed] keeps the production laboratory source and provenance guards blocked', async () => {
    const controlled: ControlledLabSources = new PostgresControlledLabSources(db);
    const { versionId } = await seedLabTemplate('e36', { approved: false });
    // An unapproved template version can never become an execution context.
    await expect(controlled.resolve(versionId, author())).rejects.toMatchObject({
      code: 'AUTHZ_DENIED',
    });
    await expect(
      new CreateLabTestUseCase(labRepository(), controlled).execute({
        actor: author(),
        templateVersionId: versionId,
        labTestNo: 'LAB-F013-e36',
        requestId: 'f013-lab-unapproved-e36',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    // PD-01/PD-02 are unresolved: the production adapter still refuses to
    // calculate a scientific outcome, so no result can be inferred here.
    const approved = await seedLabTemplate('e37');
    const evaluated = await controlled.resolve(approved.versionId, author());
    await expect(
      controlled.evaluate({ context: evaluated } as unknown as Parameters<
        typeof controlled.evaluate
      >[0]),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });
});
