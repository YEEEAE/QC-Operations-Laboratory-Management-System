import { Kysely, PostgresDialect } from 'kysely';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';
import { ImportControlledInspectionSourcesUseCase } from '../../../src/modules/quarantine/catalog/application/import-controlled-sources.js';
import { InspectionReportCatalog } from '../../../src/modules/quarantine/catalog/application/catalog.js';
import {
  PostgresItemMappingReader,
  ResolveInspectionTemplateUseCase,
  ManageItemTemplateMappingUseCase,
} from '../../../src/modules/quarantine/inspection/application/resolve-inspection-template.js';
import { PostgresInspectionRepository } from '../../../src/modules/quarantine/inspection/infrastructure/postgres-repository.js';
import { PostgresReceivingRepository } from '../../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import { PostgresTemplateRepository } from '../../../src/modules/quarantine/templates/infrastructure/postgres-repository.js';
import { CreateInspectionFromReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/create-inspection-from-receiving.js';
import { SaveControlledInspectionFormUseCase } from '../../../src/modules/quarantine/inspection/application/save-controlled-form.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { uuidv7 } from '../../../src/shared/id/uuid.js';
import { controlledFormSchema } from '../../../src/modules/quarantine/catalog/domain/controlled-form.js';
import { LinkInspectionEquipmentUseCase } from '../../../src/modules/quarantine/inspection/application/inspection-aql-equipment.js';
import { GetEquipmentEligibilityUseCase } from '../../../src/modules/assets/equipment/application/get-equipment-eligibility.js';
import { PostgresEquipmentEligibilityReader } from '../../../src/modules/assets/equipment/infrastructure/eligibility-reader.js';
const id = uuidv7();
const actor: ActorContext = {
  id,
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: [
    'PERM-ADM-TEMPLATES',
    'PERM-INSP-CREATE',
    'PERM-INSP-VIEW',
    'PERM-INSP-EDIT-DRAFT',
    'PERM-RCV-VIEW',
  ].map((code) => ({
    code: code as ActorContext['permissions'][number]['code'],
    scopes: ['GLOBAL'],
  })),
};
let pool: ReturnType<typeof createPool>;
let db: Kysely<DatabaseSchema>;
let templateId: string;
let templateVersionId: string;
let reportId: string;
let receivingId: string;
const repo = () =>
  new PostgresInspectionRepository(
    db,
    new PostgresAuditRepository(db),
    new PostgresOutboxRepository(db),
  );
const resolver = () => new ResolveInspectionTemplateUseCase(new PostgresItemMappingReader(db));
const origin = () =>
  new CreateInspectionFromReceivingUseCase({
    receiving: new PostgresReceivingRepository(db),
    inspection: repo(),
    template: new PostgresTemplateRepository(db),
    mapping: resolver(),
  });
const receive = async (item = 'CATALOG-TEST') => {
  const rid = uuidv7();
  await pool.query(
    `INSERT INTO qc.receiving_items (id,receiving_no,doc_no,item_code,description,lot,qty,receiving_date,workflow_state,inspection_result,release_system,created_by,supplier_name,purchase_order_no) VALUES ($1,$2,'DOC-TEST',$3,'Synthetic fixture','LOT-ORIGINAL',1200,CURRENT_DATE,'READY_FOR_INSPECTION','NOT_STARTED',false,$4,'Fixture supplier','PO-ORIGINAL')`,
    [rid, rid, item, id],
  );
  return rid;
};
beforeAll(async () => {
  pool = createPool({
    connectionString: getTestDatabaseUrl(await startPostgresContainer()),
    max: 10,
  });
  await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
  await migrate({ pool });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
  await pool.query(
    "INSERT INTO qc.users(id,login_identity,display_name,password_hash) VALUES($1,'catalog-test','Synthetic catalog test actor','synthetic-test-only')",
    [id],
  );
}, 180000);
afterAll(async () => {
  await db?.destroy();
  await stopPostgresContainer();
});
describe('controlled catalogue on disposable PG18', () => {
  it('migrates all exact master identities and reruns without duplicating rows', async () => {
    await migrate({ pool });
    expect(
      (await pool.query('SELECT count(*)::int n FROM qc.inspection_report_catalog')).rows[0].n,
    ).toBe(194);
    await expect(
      new InspectionReportCatalog(db).resolveIdentity({ actor, catalogId: uuidv7() }),
    ).rejects.toThrow();
    expect(
      (await new InspectionReportCatalog(db).search({ actor, search: 'Genrel' }))[0]
        ?.official_title,
    ).toBe('Inspection & Test Report for Genrel Products');
    expect(await new InspectionReportCatalog(db).search({ actor, search: 'F-823-T175' })).toEqual(
      [],
    );
  });
  it('imports source drafts idempotently without auto approval or mapping', async () => {
    const importer = new ImportControlledInspectionSourcesUseCase(db);
    expect(await importer.execute({ actor, requestId: 'import-1' })).toMatchObject({
      templatesCreated: 13,
      sourcePages: 28,
    });
    expect(await importer.execute({ actor, requestId: 'import-2' })).toMatchObject({
      templatesCreated: 0,
      existingTemplates: 13,
    });
    const rows = await db.selectFrom('inspection_template_versions').selectAll().execute();
    expect(rows).toHaveLength(13);
    expect(rows.every((r) => r.state === 'DRAFT')).toBe(true);
    const version = rows.find((r) => r.source_document?.endsWith('#page=2'))!;
    templateVersionId = version.id;
    templateId = version.template_id;
    expect(
      (await pool.query('SELECT count(*)::int n FROM qc.inspection_item_templates')).rows[0].n,
    ).toBe(0);
  });
  it('blocks nonmembers, conflict revisions and master identity edits', async () => {
    expect(
      (
        await pool.query(
          "SELECT count(*)::int n FROM qc.inspection_report_catalog WHERE doc_code='F-823-T132'",
        )
      ).rows[0].n,
    ).toBe(0);
    expect(
      (
        await pool.query(
          "SELECT catalog_state FROM qc.inspection_report_catalog WHERE doc_code='F-823-T102'",
        )
      ).rows[0].catalog_state,
    ).toBe('SOURCE_CONFLICT');
    await expect(
      pool.query(
        "UPDATE qc.inspection_report_catalog SET official_title='silently corrected' WHERE doc_code='F-823-T90'",
      ),
    ).rejects.toThrow();
    await expect(pool.query('DELETE FROM qc.inspection_report_source_evidence')).rejects.toThrow();
  });
  it('does not resolve DRAFT or unmapped templates, rejects direct creation', async () => {
    receivingId = await receive();
    await new ManageItemTemplateMappingUseCase(db).create({
      actor,
      itemCode: 'CATALOG-TEST',
      templateId,
      effectiveFrom: '2026-01-01',
      requestId: 'map-1',
    });
    expect((await resolver().resolve({ actor, itemCode: 'CATALOG-TEST' })).unique).toBeNull();
    await expect(
      origin().execute({
        actor,
        receivingId,
        templateVersionId,
        inspectionNo: 'TEST-BLOCKED',
        requestId: 'draft-start',
      }),
    ).rejects.toThrow();
  });
  it('resolves approved mapped template and captures receiving/schema server-side', async () => {
    // SQL approval below is solely engineering fixture setup, not human approval evidence.
    await pool.query(
      "UPDATE qc.inspection_template_versions SET state='APPROVED',effective_at=now(),approved_at=now(),approved_by=$2 WHERE id=$1",
      [templateVersionId, id],
    );
    expect(
      (await resolver().resolve({ actor, itemCode: 'CATALOG-TEST' })).unique?.templateVersionId,
    ).toBe(templateVersionId);
    const report = await origin().execute({
      actor,
      receivingId,
      templateVersionId,
      inspectionNo: 'TEST-CONTROLLED',
      requestId: 'start',
    });
    reportId = report.id;
    const stored = await repo().get(reportId, actor);
    expect(stored?.receiving.purchaseOrderNo).toBe('PO-ORIGINAL');
    expect(stored?.template.templateSnapshot.docCode).toBe('F-823-T40');
    expect(stored?.template.templateSnapshot.digitalForm).toBeTruthy();
    expect(
      (
        await pool.query(
          "SELECT count(*)::int n FROM qc.audit_events WHERE subject_id=$1 AND action='INSPECTION_CREATED'",
          [reportId],
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it('blocks arbitrary version, unmapped item and unauthorized actor without writes', async () => {
    const rid = await receive('UNMAPPED');
    for (const input of [
      { actor, templateVersionId: uuidv7() },
      { actor, templateVersionId },
      { actor: { ...actor, permissions: [] }, templateVersionId },
    ])
      await expect(
        origin().execute({
          ...input,
          receivingId: rid,
          inspectionNo: uuidv7(),
          requestId: uuidv7(),
        }),
      ).rejects.toThrow();
    expect((await pool.query('SELECT count(*)::int n FROM qc.inspection_reports')).rows[0].n).toBe(
      1,
    );
  });
  it('keeps historical Receiving and template snapshot after later source changes', async () => {
    const before = await repo().get(reportId, actor);
    await pool.query(
      "UPDATE qc.receiving_items SET lot='LATER-LOT',purchase_order_no='LATER-PO' WHERE id=$1",
      [receivingId],
    );
    await expect(
      pool.query("UPDATE qc.inspection_template_versions SET digital_form='{}' WHERE id=$1", [
        templateVersionId,
      ]),
    ).rejects.toThrow();
    await pool.query("UPDATE qc.inspection_template_versions SET state='STOPPED' WHERE id=$1", [
      templateVersionId,
    ]);
    expect((await resolver().resolve({ actor, itemCode: 'CATALOG-TEST' })).unique).toBeNull();
    const after = await repo().get(reportId, actor);
    expect(after?.receiving).toEqual(before?.receiving);
    expect(after?.template.templateSnapshot).toEqual(before?.template.templateSnapshot);
  });
  it('rejects unknown/read-only point values and stale concurrent writes', async () => {
    const save = new SaveControlledInspectionFormUseCase(db);
    await expect(
      save.execute({
        actor,
        id: reportId,
        expectedVersion: 1n,
        values: { headers: { supplier: 'forged' }, points: {} },
        requestId: 'forged',
      }),
    ).rejects.toThrow();
    const command = {
      actor,
      id: reportId,
      expectedVersion: 1n,
      values: { headers: {}, points: {}, generalRemarks: 'Engineering draft persistence only' },
      requestId: 'race',
    };
    const results = await Promise.allSettled([save.execute(command), save.execute(command)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await repo().get(reportId, actor))?.version).toBe(2n);
    await expect(save.execute(command)).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
  });
  it('rolls back form/version when audit insertion fails', async () => {
    await pool.query(
      "CREATE FUNCTION qc.fail_catalog_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit failure'; END $$; CREATE TRIGGER fail_catalog_audit BEFORE INSERT ON qc.audit_events FOR EACH ROW EXECUTE FUNCTION qc.fail_catalog_audit()",
    );
    try {
      await expect(
        new SaveControlledInspectionFormUseCase(db).execute({
          actor,
          id: reportId,
          expectedVersion: 2n,
          values: { headers: {}, points: {}, generalRemarks: 'Should roll back' },
          requestId: 'audit-fail',
        }),
      ).rejects.toThrow();
      expect((await repo().get(reportId, actor))?.version).toBe(2n);
    } finally {
      await pool.query(
        'DROP TRIGGER fail_catalog_audit ON qc.audit_events; DROP FUNCTION qc.fail_catalog_audit()',
      );
    }
  });
  it.each(['F-823-T61', 'F-823-T76'])(
    'persists precise repeatable source rows for %s',
    async (code) => {
      const version = (
        await pool.query(
          'SELECT v.* FROM qc.inspection_template_versions v JOIN qc.inspection_templates t ON t.id=v.template_id WHERE t.template_code=$1',
          [code],
        )
      ).rows[0];
      await pool.query(
        "UPDATE qc.inspection_template_versions SET state='APPROVED',effective_at=now(),approved_at=now(),approved_by=$2 WHERE id=$1",
        [version.id, id],
      );
      const itemCode = `ROWS-${code}`;
      await new ManageItemTemplateMappingUseCase(db).create({
        actor,
        itemCode,
        templateId: version.template_id,
        effectiveFrom: '2026-01-01',
        requestId: uuidv7(),
      });
      const receivingId = await receive(itemCode);
      const report = await origin().execute({
        actor,
        receivingId,
        templateVersionId: version.id,
        inspectionNo: uuidv7(),
        requestId: uuidv7(),
      });
      const schema = controlledFormSchema.parse(version.digital_form);
      const point = schema.sections.flatMap((s) => s.points).find((p) => p.dataType === 'TABLE')!;
      const rows =
        code === 'F-823-T61'
          ? [
              { standard: '1.2300', equipment: '1.230001', result: 'PASS' },
              { standard: '0.000100', equipment: '0.000099', result: 'FAIL' },
            ]
          : [
              {
                description: 'Synthetic part A',
                lot: 'ROW-A',
                quantity: '12.3400',
                level: 'II',
                size: '5',
                colourDimensions: 'Synthetic colour/dimensions',
              },
              {
                description: 'Synthetic part B',
                lot: 'ROW-B',
                quantity: '0.000100',
                level: 'II',
                size: '5',
                colourDimensions: 'Synthetic colour/dimensions',
              },
            ];
      await new SaveControlledInspectionFormUseCase(db).execute({
        actor,
        id: report.id,
        expectedVersion: 1n,
        values: { headers: {}, points: { [point.key]: { rows } } },
        requestId: uuidv7(),
      });
      const stored = (
        await pool.query('SELECT form_values FROM qc.inspection_reports WHERE id=$1', [report.id])
      ).rows[0].form_values;
      expect(stored.points[point.key].rows).toEqual(rows);
      expect((await repo().get(report.id, actor))?.finalResult).not.toBe('PASS');
    },
  );
  it('captures eligible equipment on the server, derives its certificate and rejects forgery', async () => {
    const report = (
      await pool.query(
        "SELECT r.id,r.version FROM qc.inspection_reports r JOIN qc.inspection_template_versions v ON v.id=r.template_version_id JOIN qc.inspection_templates t ON t.id=v.template_id WHERE t.template_code='F-823-T61' ORDER BY r.created_at DESC LIMIT 1",
      )
    ).rows[0];
    const equipmentId = uuidv7(),
      calibrationId = uuidv7();
    await pool.query(
      "INSERT INTO qc.equipment(id,equipment_no,name,state,created_by) VALUES($1,$2,'Synthetic cylinder','ACTIVE',$3)",
      [equipmentId, equipmentId, id],
    );
    await pool.query(
      "INSERT INTO qc.calibration_records(id,calibration_no,equipment_id,state,calibration_date,due_date,certificate_no,created_by) VALUES($1,$2,$3,'CURRENT',current_date,current_date+30,'SYNTHETIC-CERTIFICATE',$4)",
      [calibrationId, calibrationId, equipmentId, id],
    );
    await pool.query('UPDATE qc.equipment SET current_calibration_id=$1 WHERE id=$2', [
      calibrationId,
      equipmentId,
    ]);
    const equipmentActor: ActorContext = {
      ...actor,
      permissions: [
        ...actor.permissions,
        { code: 'PERM-EQP-VIEW', scopes: ['GLOBAL'] },
        { code: 'PERM-CAL-VIEW', scopes: ['GLOBAL'] },
      ],
    };
    const inspectionRepo = repo();
    await new LinkInspectionEquipmentUseCase(
      inspectionRepo,
      inspectionRepo.equipmentUsage,
      new GetEquipmentEligibilityUseCase(new PostgresEquipmentEligibilityReader(db)),
    ).execute({
      actor: equipmentActor,
      id: report.id,
      expectedVersion: BigInt(report.version),
      usage: { equipmentId, calibrationRecordId: calibrationId },
      requestId: uuidv7(),
    });
    const save = new SaveControlledInspectionFormUseCase(db);
    const current = await repo().get(report.id, actor);
    await save.execute({
      actor,
      id: report.id,
      expectedVersion: current!.version,
      values: { headers: {}, points: {} },
      requestId: uuidv7(),
    });
    const row = (
      await pool.query('SELECT form_values,version FROM qc.inspection_reports WHERE id=$1', [
        report.id,
      ])
    ).rows[0];
    expect(row.form_values.headers).toMatchObject({
      equipmentId,
      calibrationId,
      certificate: 'SYNTHETIC-CERTIFICATE',
    });
    await expect(
      save.execute({
        actor,
        id: report.id,
        expectedVersion: BigInt(row.version),
        values: { headers: { equipmentId, calibrationId, certificate: 'FORGED' }, points: {} },
        requestId: uuidv7(),
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect((await repo().get(report.id, actor))?.version).toBe(BigInt(row.version));
  });
});
