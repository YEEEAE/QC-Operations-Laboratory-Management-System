import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { PostgresInspectionRepository } from '../../../src/modules/quarantine/inspection/infrastructure/postgres-repository.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { RecordInspectionResultsUseCase } from '../../../src/modules/quarantine/inspection/application/record-inspection-results.js';
import {
  PostgresItemMappingReader,
  ResolveInspectionTemplateUseCase,
} from '../../../src/modules/quarantine/inspection/application/resolve-inspection-template.js';
import { RecordInspectionAqlUseCase } from '../../../src/modules/quarantine/inspection/application/inspection-aql-equipment.js';
import { StartInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/start-inspection.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const OWNER_ID = '01900000-0000-7000-8000-00000000e001';

const systemOwner = (): ActorContext => ({
  id: OWNER_ID,
  accountState: 'ACTIVE',
  roles: ['SYSTEM_OWNER'],
  permissions: [
    { code: 'PERM-INSP-CREATE', scopes: ['GLOBAL'] },
    { code: 'PERM-INSP-EDIT-DRAFT', scopes: ['GLOBAL'] },
    { code: 'PERM-INSP-ENTER-RESULT', scopes: ['GLOBAL'] },
  ],
});

let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;
let reportId: string;
const POINT_ID = '01900000-0000-7000-8000-00000000e030';
const resultEntry = {
  id: '01900000-0000-7000-8000-00000000e031',
  pointId: POINT_ID,
  value: '5.4',
  version: 1n,
};
const repository = () =>
  new PostgresInspectionRepository(
    db,
    new PostgresAuditRepository(db),
    new PostgresOutboxRepository(db),
  );
const record = (repo = repository()) => new RecordInspectionResultsUseCase(repo, repo);
const snapshot = async () => {
  const row = await pool!.query('SELECT * FROM qc.inspection_reports WHERE id=$1', [reportId]);
  const results = await pool!.query(
    'SELECT * FROM qc.inspection_report_results WHERE inspection_report_id=$1 ORDER BY id',
    [reportId],
  );
  const audit = await pool!.query('SELECT * FROM qc.audit_events ORDER BY id');
  const outbox = await pool!.query('SELECT * FROM qc.outbox_events ORDER BY id');
  return { row: row.rows, results: results.rows, audit: audit.rows, outbox: outbox.rows };
};

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
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash) VALUES ($1, 'qcdata002-owner', 'QC Data Owner', 'test-only-placeholder-not-a-secret') ON CONFLICT (id) DO NOTHING`,
    [OWNER_ID],
  );
}, 180000);

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

describe('QC-DATA-002 full workflow on PostgreSQL', () => {
  it('resolves template from approved mapping, evaluates measurements server-side and stores structured AQL', async () => {
    const stamp = Date.now();
    const repo = new PostgresInspectionRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );

    // 1. Approved template version bound to the report.
    const templateVersionId = '01900000-0000-7000-8000-00000000e010';
    await pool!.query(
      `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
       VALUES ('01900000-0000-7000-8000-00000000e011', 'TPL-DATA002-${stamp}', 'Nasal cannula QC', true, $1)
       ON CONFLICT (id) DO NOTHING`,
      [OWNER_ID],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_template_versions (id, template_id, version_no, state, name, effective_at, created_by)
       VALUES ($1, '01900000-0000-7000-8000-00000000e011', 'v1', 'APPROVED', 'Nasal cannula QC', now(), $2)
       ON CONFLICT (id) DO NOTHING`,
      [templateVersionId, OWNER_ID],
    );

    // 2. Deterministic item → template mapping.
    await pool!.query(
      `INSERT INTO qc.inspection_item_templates
         (id, item_code, template_id, state, effective_from, created_by, created_at)
       VALUES (qc.uuidv7(), $1, '01900000-0000-7000-8000-00000000e011', 'ACTIVE', CURRENT_DATE, $2, now())`,
      [`ITEM-DATA002-${stamp}`, OWNER_ID],
    );

    const resolution = await new ResolveInspectionTemplateUseCase(
      new PostgresItemMappingReader(db),
    ).resolve({ actor: systemOwner(), itemCode: `ITEM-DATA002-${stamp}` });
    expect(resolution.unique?.templateVersionId).toBe(templateVersionId);

    // 3. Start inspection from an existing receiving row (pre-filled header).
    const receivingId = '01900000-0000-7000-8000-00000000e020';
    await pool!.query(
      `INSERT INTO qc.receiving_items
         (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date,
          workflow_state, inspection_result, release_system, created_by)
       VALUES ($1, $2, $3, $4, 'Nasal oxygen cannula', 'LOT-DATA002', 1200,
               CURRENT_DATE, 'UNDER_INSPECTION', 'IN_PROGRESS', FALSE, $5)`,
      [
        receivingId,
        `RCV-DATA002-${stamp}`,
        `DOC-DATA002-${stamp}`,
        `ITEM-DATA002-${stamp}`,
        OWNER_ID,
      ],
    );
    // 4. Synthetic engineering range fixture; this is not a laboratory criterion.
    const sectionId = '01900000-0000-7000-8000-00000000e032';
    const pointId = '01900000-0000-7000-8000-00000000e030';
    await pool!.query(
      `INSERT INTO qc.inspection_template_sections
         (id, template_version_id, section_code, title, position)
       VALUES ($1, $2, 'SYNTHETIC', 'Synthetic engineering fixture', 1)
       ON CONFLICT (id) DO NOTHING`,
      [sectionId, templateVersionId],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_template_points
         (id, section_id, point_code, label, data_type, requirement_text, unit,
          required, position, acceptance_rule_type, acceptance_rule_payload)
       VALUES ($1, $2, 'SYNTHETIC-RANGE', 'Synthetic numeric fixture', 'NUMERIC_MEASUREMENT',
               'Synthetic test range 5.0–6.0', 'test-unit', TRUE, 1, 'RANGE_INCLUSIVE',
               '{"lower":"5.0","upper":"6.0"}'::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [pointId, sectionId],
    );

    const inspection = await new StartInspectionUseCase(repo, () => new Date()).execute({
      actor: systemOwner(),
      inspectionNo: `INSP-DATA002-${stamp}`,
      receiving: {
        receivingId,
        receivingNo: `RCV-${stamp}`,
        docNo: `DOC-${stamp}`,
        itemCode: `ITEM-DATA002-${stamp}`,
        description: 'Nasal oxygen cannula',
        lot: `LOT-${stamp}`,
        qty: '1200',
        receivingDate: new Date(),
      },
      template: {
        templateId: '01900000-0000-7000-8000-00000000e011',
        templateVersionId,
        versionNo: 'v1',
        templateSnapshot: {},
        approved: true,
      },
      requestId: `req-start-${stamp}`,
    });
    reportId = inspection.id;

    // 5. Server-side evaluation: numeric value inside range → PASS.
    await new RecordInspectionResultsUseCase(repo, {
      async listPointCriteria() {
        return [
          {
            pointId,
            dataType: 'NUMERIC_MEASUREMENT',
            acceptanceRuleType: 'RANGE_INCLUSIVE',
            acceptanceRulePayload: { lower: '5.0', upper: '6.0' },
          },
        ];
      },
    }).execute({
      actor: systemOwner(),
      id: inspection.id,
      expectedVersion: 1n,
      requestId: `req-eval-${stamp}`,
      results: [
        {
          id: '01900000-0000-7000-8000-00000000e031',
          pointId,
          value: '5.4000000000000000001',
          version: 1n,
        },
      ],
    });

    const stored = await pool!.query(
      `SELECT result, numeric_value::text AS numeric_value FROM qc.inspection_report_results WHERE inspection_report_id = $1`,
      [inspection.id],
    );
    expect(stored.rows[0]?.result).toBe('PASS');
    expect(stored.rows[0]?.numeric_value).toBe('5.4000000000000000001');
    expect((await repo.get(inspection.id, systemOwner()))?.results[0]?.value).toBe(
      '5.4000000000000000001',
    );

    // 6. Structured AQL persistence with an explicitly synthetic source label.
    // Synthetic persistence values only; they do not represent an approved
    // operational AQL source or sampling plan.
    await new RecordInspectionAqlUseCase(repo).execute({
      actor: systemOwner(),
      id: inspection.id,
      expectedVersion: 2n,
      aql: {
        aql: '1.0',
        codeLetter: 'H',
        inspectionLevel: 'II',
        sampleSize: '50',
        acceptNumber: '1',
        rejectNumber: '2',
        observedDefects: '0',
        samplingResult: 'ACCEPT',
        sourceReference: 'SYNTHETIC_TEST_FIXTURE_NOT_AN_APPROVED_AQL_SOURCE',
      },
      requestId: `req-aql-${stamp}`,
    });
    const aqlRow = await pool!.query(
      `SELECT aql, aql_code_letter, aql_sample_size, aql_sampling_result
       FROM qc.inspection_reports WHERE id = $1`,
      [inspection.id],
    );
    expect(aqlRow.rows[0]?.aql).toBe('1.0');
    expect(aqlRow.rows[0]?.aql_code_letter).toBe('H');
    expect(aqlRow.rows[0]?.aql_sampling_result).toBe('ACCEPT');
  });

  it('read-only actor reads the existing DRAFT then is denied with no row/results/audit/outbox writes', async () => {
    const actor: ActorContext = {
      ...systemOwner(),
      roles: ['EMPLOYEE'],
      permissions: [{ code: 'PERM-INSP-VIEW', scopes: ['GLOBAL'] }],
    };
    expect((await repository().get(reportId, actor))?.state).toBe('DRAFT');
    const before = await snapshot();
    await expect(
      record().execute({
        actor,
        id: reportId,
        expectedVersion: 3n,
        results: [resultEntry],
        requestId: 'adp03-denied',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(await snapshot()).toEqual(before);
    // Repository defense also rejects bypassing the application layer.
    await expect(
      repository().saveDraft({
        actor,
        id: reportId,
        expectedVersion: 3n,
        results: [resultEntry],
        requestId: 'adp03-direct',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(await snapshot()).toEqual(before);
  });

  it('audit insertion failure rolls back the report version and replacement results', async () => {
    const before = await snapshot();
    await pool!
      .query(`CREATE FUNCTION qc.adp03_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit failure'; END $$;
      CREATE TRIGGER adp03_fail_audit BEFORE INSERT ON qc.audit_events FOR EACH ROW EXECUTE FUNCTION qc.adp03_fail_audit()`);
    try {
      await expect(
        record().execute({
          actor: systemOwner(),
          id: reportId,
          expectedVersion: 3n,
          results: [{ ...resultEntry, value: '8' }],
          requestId: 'adp03-audit-fail',
        }),
      ).rejects.toThrow();
      expect(await snapshot()).toEqual(before);
    } finally {
      await pool!.query(
        'DROP TRIGGER adp03_fail_audit ON qc.audit_events; DROP FUNCTION qc.adp03_fail_audit()',
      );
    }
  });

  it('locked-record authorization rejects scope and stale versions before writes', async () => {
    const actor: ActorContext = {
      ...systemOwner(),
      id: '01900000-0000-7000-8000-00000000e099',
      permissions: [
        { code: 'PERM-INSP-VIEW', scopes: ['GLOBAL'] },
        { code: 'PERM-INSP-EDIT-DRAFT', scopes: ['OWN'] },
      ],
    };
    expect((await repository().get(reportId, actor))?.state).toBe('DRAFT');
    const before = await snapshot();
    await expect(
      repository().saveDraft({
        actor,
        id: reportId,
        expectedVersion: 3n,
        results: [resultEntry],
        requestId: 'adp03-scope',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SCOPE_DENIED' });
    await expect(
      repository().saveDraft({
        actor: systemOwner(),
        id: reportId,
        expectedVersion: 2n,
        results: [resultEntry],
        requestId: 'adp03-stale',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(await snapshot()).toEqual(before);
    await pool!.query(
      "UPDATE qc.inspection_reports SET state='SUBMITTED',submitted_at=now() WHERE id=$1",
      [reportId],
    );
    try {
      const locked = await snapshot();
      await expect(
        repository().saveDraft({
          actor: systemOwner(),
          id: reportId,
          expectedVersion: 3n,
          results: [resultEntry],
          requestId: 'adp03-state',
        }),
      ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
      expect(await snapshot()).toEqual(locked);
    } finally {
      await pool!.query(
        "UPDATE qc.inspection_reports SET state='DRAFT',submitted_at=NULL WHERE id=$1",
        [reportId],
      );
    }
  });

  it('same-version race commits exactly once and stale replay changes nothing', async () => {
    const before = await snapshot();
    const command = {
      actor: systemOwner(),
      id: reportId,
      expectedVersion: 3n,
      results: [resultEntry],
      requestId: 'adp03-race-replay',
    };
    const attempts = await Promise.allSettled([
      record().execute(command),
      record().execute(command),
    ]);
    expect(attempts.filter((a) => a.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.find((a) => a.status === 'rejected')).toMatchObject({
      reason: { code: 'CONFLICT_STALE_VERSION' },
    });
    const after = await snapshot();
    expect(after.row[0].version).toBe('4');
    expect(after.audit.length).toBe(before.audit.length + 1);
    expect(after.outbox).toEqual(before.outbox);
    await expect(record().execute(command)).rejects.toMatchObject({
      code: 'CONFLICT_STALE_VERSION',
    });
    expect(await snapshot()).toEqual(after);
  });
});
