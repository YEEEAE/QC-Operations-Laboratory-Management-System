import { randomUUID } from 'node:crypto';
import { Kysely, PostgresDialect } from 'kysely';
import type { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { parsePageInput, type PageResult } from '../../../src/shared/pagination/page.js';
import { PostgresEquipmentRepository } from '../../../src/modules/assets/equipment/infrastructure/postgres-repository.js';
import { PostgresCalibrationRepository } from '../../../src/modules/assets/calibration/infrastructure/postgres-repository.js';
import { PostgresMaintenanceRepository } from '../../../src/modules/assets/maintenance/infrastructure/postgres-repository.js';
import { PostgresReceivingRepository } from '../../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import { PostgresInspectionRepository } from '../../../src/modules/quarantine/inspection/infrastructure/postgres-repository.js';
import { PostgresTemplateRepository } from '../../../src/modules/quarantine/templates/infrastructure/postgres-repository.js';
import { PostgresDocumentRepository } from '../../../src/modules/documents/infrastructure/postgres-repository.js';
import { PostgresNcrRepository } from '../../../src/modules/quality/ncr/infrastructure/postgres-repository.js';
import { PostgresRcaRepository } from '../../../src/modules/quality/rca/infrastructure/postgres-repository.js';
import { PostgresCapaRepository } from '../../../src/modules/quality/capa/infrastructure/postgres-repository.js';
import { PostgresChangeRequestRepository } from '../../../src/modules/change-requests/infrastructure/postgres-repository.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';
import { seedControlledInspectionReadVersion } from '../../helpers/controlled-inspection-read-fixture.js';

const mine = randomUUID();
const other = randomUUID();
const run = randomUUID().slice(0, 8);
const stamp = new Date('2026-01-01T12:00:00Z');
let pool: Pool | undefined;
let db: Kysely<DatabaseSchema>;
const statements: string[] = [];
const ownedIds = new Map<string, string[]>();
const seededIds = new Map<string, string[]>();
const ncrIds: string[] = [];

const actor = (permission: string, global = false): ActorContext => ({
  id: mine, accountState: 'ACTIVE', roles: ['Employee'],
  permissions: [{ code: permission as never, scopes: [global ? 'GLOBAL' : 'OWN'] }],
});

beforeAll(async () => {
  const uri = getTestDatabaseUrl(await startPostgresContainer({ tls: true }));
  const parsed = new URL(uri);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) || !parsed.pathname.startsWith('/qc_')) {
    throw new Error('Register fixture requires an explicitly disposable loopback qc_ database');
  }
  pool = createPool({ connectionString: uri });
  const version = await pool.query('SHOW server_version_num');
  expect(Number(version.rows[0].server_version_num)).toBeGreaterThanOrEqual(180000);
  expect(Number(version.rows[0].server_version_num)).toBeLessThan(190000);
  await migrate({ pool });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }), log(event) {
    if (event.level === 'query') statements.push(event.query.sql);
  } });
  await pool.query('INSERT INTO qc.users(id,login_identity,display_name,password_hash) VALUES ($1,$2,$3,$4),($5,$6,$7,$4)',
    [mine, `paging-${run}-mine`, 'Paging mine', 'synthetic-test-only', other, `paging-${run}-other`, 'Paging other']);
  for (let index = 0; index < 60; index += 1) {
    const owner = index % 2 === 0 ? mine : other;
    const label = `PAGING-${run}-${String(index).padStart(3, '0')}`;
    const equipment = randomUUID();
    const receiving = randomUUID();
    const ncr = randomUUID();
    const template = randomUUID();
    const entries: [string, string, string, unknown[]][] = [
      ['equipment', equipment, 'equipment_no,name,state,created_by,updated_at', [label, label, 'DRAFT', owner, stamp]],
      ['calibration_records', randomUUID(), 'calibration_no,equipment_id,state,calibration_date,created_by,updated_at', [label, equipment, 'DRAFT', '2026-01-01', owner, stamp]],
      ['maintenance_records', randomUUID(), 'maintenance_no,equipment_id,state,description,created_by,updated_at', [label, equipment, 'DRAFT', label, owner, stamp]],
      ['receiving_items', receiving, 'receiving_no,doc_no,item_code,description,lot,qty,receiving_date,workflow_state,inspection_result,release_system,created_by,updated_at', [label, label, label, label, label, '1', '2026-01-01', 'READY_FOR_INSPECTION', 'NOT_STARTED', false, owner, stamp]],
      ['document_identities', randomUUID(), 'document_no,document_type,title,active,created_by,owner_id,updated_at', [label, 'SOP', label, true, owner, owner, stamp]],
      ['ncrs', ncr, 'ncr_no,title,description,state,created_by,updated_at', [label, label, label, 'DRAFT', owner, stamp]],
      ['rcas', randomUUID(), 'rca_no,ncr_id,state,created_by,updated_at', [label, ncr, 'DRAFT', owner, stamp]],
      ['capas', randomUUID(), 'capa_no,ncr_id,title,description,state,verification_required,effectiveness_required,created_by,updated_at', [label, ncr, label, label, 'DRAFT', false, false, owner, stamp]],
      ['change_requests', randomUUID(), 'change_no,target_type,target_id,target_version,state,reason,target_snapshot,requested_by,updated_at', [label, 'DOCUMENT', randomUUID(), '1', 'DRAFT', label, '{}', owner, stamp]],
      ['inspection_templates', template, 'template_code,name,active,created_by,updated_at', [label, label, true, owner, stamp]],
    ];
    for (const [table, id, columns, values] of entries) {
      await pool.query(`INSERT INTO qc.${table}(id,${columns}) VALUES (${[id, ...values].map((_, offset) => `$${offset + 1}`).join(',')})`, [id, ...values]);
      seededIds.set(table, [...(seededIds.get(table) ?? []), id]);
      if (owner === mine) ownedIds.set(table, [...(ownedIds.get(table) ?? []), id]);
    }
    ncrIds.push(ncr);
    const version = await seedControlledInspectionReadVersion(pool, { templateId: template, actorId: owner, receivingId: receiving, versionNo: label });
    const inspection = randomUUID();
    await pool.query('INSERT INTO qc.inspection_reports(id,inspection_no,receiving_item_id,template_version_id,state,author_id,assigned_user_id,created_by,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$6,$6,$7)',
      [inspection, label, receiving, version.rows[0].id, 'DRAFT', owner, stamp]);
    seededIds.set('inspection_reports', [...(seededIds.get('inspection_reports') ?? []), inspection]);
    if (owner === mine) ownedIds.set('inspection_reports', [...(ownedIds.get('inspection_reports') ?? []), inspection]);
  }
});

afterAll(async () => {
  if (pool && db) {
    for (const table of ['inspection_reports', 'rcas', 'capas', 'ncrs', 'change_requests', 'calibration_records', 'maintenance_records', 'equipment', 'document_identities']) {
      await pool.query(`DELETE FROM qc.${table} WHERE id=ANY($1::uuid[])`, [seededIds.get(table) ?? []]);
    }
    const templateIds = seededIds.get('inspection_templates') ?? [];
    await pool.query('DELETE FROM qc.inspection_item_templates WHERE template_id=ANY($1::uuid[])', [templateIds]);
    await pool.query('DELETE FROM qc.inspection_template_versions WHERE template_id=ANY($1::uuid[])', [templateIds]);
    await pool.query('DELETE FROM qc.inspection_templates WHERE id=ANY($1::uuid[])', [templateIds]);
    await pool.query('DELETE FROM qc.receiving_items WHERE id=ANY($1::uuid[])', [seededIds.get('receiving_items') ?? []]);
    await pool.query('DELETE FROM qc.users WHERE id=ANY($1::uuid[])', [[mine, other]]);
  }
  await db?.destroy();
  await stopPostgresContainer();
});

type Read = (page: number, global?: boolean) => Promise<PageResult<{ id: string }>>;
const readers: { table: string; read: Read }[] = [
  { table: 'equipment', read: (page, global) => new PostgresEquipmentRepository(db).listPage({ actor: actor('PERM-EQP-VIEW', global), page: parsePageInput({ page }) }) },
  { table: 'calibration_records', read: (page, global) => new PostgresCalibrationRepository(db).listPage({ actor: actor('PERM-CAL-VIEW', global), page: parsePageInput({ page }) }) },
  { table: 'maintenance_records', read: (page, global) => new PostgresMaintenanceRepository(db).listPage({ actor: actor('PERM-MNT-VIEW', global), page: parsePageInput({ page }) }) },
  { table: 'receiving_items', read: (page, global) => new PostgresReceivingRepository(db).listPage({ actor: actor('PERM-QUAR-VIEW', global), page: parsePageInput({ page }) }) },
  { table: 'document_identities', read: (page, global) => new PostgresDocumentRepository(db).listDocumentsPage({ actor: actor('PERM-DOC-VIEW', global), page: parsePageInput({ page }) }) },
  { table: 'ncrs', read: (page) => new PostgresNcrRepository(db).listPage({ actor: actor('PERM-NCR-VIEW'), page: parsePageInput({ page }) }) },
  { table: 'rcas', read: (page) => new PostgresRcaRepository(db).listPage({ actor: actor('PERM-RCA-VIEW'), page: parsePageInput({ page }) }) },
  { table: 'capas', read: (page) => new PostgresCapaRepository(db).listPage({ actor: actor('PERM-CAPA-VIEW'), page: parsePageInput({ page }) }) },
  { table: 'inspection_reports', read: (page, global) => new PostgresInspectionRepository(db).listPage({ actor: actor('PERM-INSP-VIEW', global), page: parsePageInput({ page }) }) },
];

describe('bounded register SQL reads on populated PostgreSQL 18', () => {
  for (const { table, read } of readers) {
    it(`${table}: exact scope before paging, complete totals and stable page boundaries`, async () => {
      const expected = [...ownedIds.get(table)!].sort().reverse();
      statements.length = 0;
      const first = await read(1);
      const second = await read(2);
      const repeated = await read(1);
      const overflow = await read(999);
      expect(first.total).toBe(30);
      expect(first.items.map((row) => row.id)).toEqual(expected.slice(0, 25));
      expect(second.items.map((row) => row.id)).toEqual(expected.slice(25));
      expect(repeated.items).toEqual(first.items);
      expect(overflow.page).toBe(2);
      expect(overflow.items.map((row) => row.id)).toEqual(second.items.map((row) => row.id));
      const primaryReads = statements.filter((statement) => statement.includes(`from "${table}"`) && !statement.includes('count(*)'));
      expect(primaryReads.some((statement) => statement.includes('limit') && statement.includes('offset'))).toBe(true);
    });
  }
  it('asset GLOBAL differs from OWN and unsupported scope remains empty', async () => {
    const repo = new PostgresEquipmentRepository(db);
    expect((await repo.listPage({ actor: actor('PERM-EQP-VIEW', true), page: parsePageInput() })).total).toBe(60);
    expect(await repo.listPage({ actor: { ...actor('PERM-EQP-VIEW'), permissions: [{ code: 'PERM-EQP-VIEW', scopes: ['ASSIGNED'] }] }, page: parsePageInput() })).toMatchObject({ items: [], total: 0 });
  });
  it('document owner overrides creator and inactive identities never enter totals', async () => {
    const id = ownedIds.get('document_identities')![0];
    await pool!.query('UPDATE qc.document_identities SET owner_id=$2 WHERE id=$1', [id, other]);
    const repo = new PostgresDocumentRepository(db);
    expect((await repo.listDocumentsPage({ actor: actor('PERM-DOC-VIEW'), page: parsePageInput() })).total).toBe(29);
    await pool!.query('UPDATE qc.document_identities SET owner_id=$2,active=false WHERE id=$1', [id, mine]);
    expect((await repo.listDocumentsPage({ actor: actor('PERM-DOC-VIEW'), page: parsePageInput() })).total).toBe(29);
  });
  it('NCR and CAPA include owned records made by another account', async () => {
    const ncr = ncrIds[1];
    await pool!.query('UPDATE qc.ncrs SET owner_id=$2 WHERE id=$1', [ncr, mine]);
    expect((await new PostgresNcrRepository(db).listPage({ actor: actor('PERM-NCR-VIEW'), page: parsePageInput() })).total).toBe(31);
    await pool!.query('UPDATE qc.capas SET owner_id=$2 WHERE id=$1', [seededIds.get('capas')![1], mine]);
    expect((await new PostgresCapaRepository(db).listPage({ actor: actor('PERM-CAPA-VIEW'), page: parsePageInput() })).total).toBe(31);
  });
  it('asset, document, receiving and inspection filters narrow totals before limits', async () => {
    const equipmentId = ownedIds.get('equipment')![0];
    expect((await new PostgresCalibrationRepository(db).listPage({ actor: actor('PERM-CAL-VIEW'), filter: { equipmentId }, page: parsePageInput() })).total).toBe(1);
    expect((await new PostgresMaintenanceRepository(db).listPage({ actor: actor('PERM-MNT-VIEW'), filter: { equipmentId }, page: parsePageInput() })).total).toBe(1);
    expect((await new PostgresEquipmentRepository(db).listPage({ actor: actor('PERM-EQP-VIEW'), filter: { state: 'ACTIVE' }, page: parsePageInput() })).total).toBe(0);
    expect((await new PostgresDocumentRepository(db).listDocumentsPage({ actor: actor('PERM-DOC-VIEW'), filter: { state: 'EFFECTIVE' }, page: parsePageInput() })).total).toBe(0);
    expect((await new PostgresReceivingRepository(db).listPage({ actor: actor('PERM-QUAR-VIEW'), search: '%', page: parsePageInput() })).total).toBe(0);
    expect((await new PostgresReceivingRepository(db).listPage({ actor: actor('PERM-QUAR-VIEW'), inspectionResult: 'PASS', releaseState: 'RELEASE_PENDING', page: parsePageInput() })).total).toBe(0);
    expect((await new PostgresInspectionRepository(db).listPage({ actor: actor('PERM-INSP-VIEW'), finalResult: 'PASS', page: parsePageInput() })).total).toBe(0);
  });
  it('RCA state and CAPA source filters are applied before totals and SQL limits', async () => {
    const id = ncrIds[0];
    expect((await new PostgresRcaRepository(db).listPage({ actor: actor('PERM-RCA-VIEW'), ncrId: id, state: 'DRAFT', page: parsePageInput() })).total).toBe(1);
    expect((await new PostgresRcaRepository(db).listPage({ actor: actor('PERM-RCA-VIEW'), ncrId: id, state: 'SUBMITTED', page: parsePageInput() })).total).toBe(0);
    expect((await new PostgresCapaRepository(db).listPage({ actor: actor('PERM-CAPA-VIEW'), ncrId: id, page: parsePageInput() })).total).toBe(1);
  });
  it('change request permission and OWN/GLOBAL predicates survive paging', async () => {
    const repo = new PostgresChangeRequestRepository(db);
    const own = await repo.listPage({ actor: actor('PERM-CHG-VIEW'), page: parsePageInput({ page: 2 }) });
    expect(own.total).toBe(30);
    expect(own.items).toHaveLength(5);
    expect(own.items.every((row) => row.changeRequest.requestedBy === mine)).toBe(true);
    expect((await repo.listPage({ actor: actor('PERM-CHG-VIEW', true), page: parsePageInput() })).total).toBe(60);
    expect((await repo.listPage({ actor: { ...actor('PERM-CHG-VIEW'), permissions: [] }, page: parsePageInput() })).total).toBe(0);
  });
  it('template state filter precedes paging and reports the full matching total', async () => {
    const repo = new PostgresTemplateRepository(db);
    const result = await repo.listPage({ actor: actor('PERM-ADM-TEMPLATES'), state: 'APPROVED', page: parsePageInput({ page: 3 }) });
    expect(result.total).toBe(60);
    expect(result.items).toHaveLength(10);
    expect((await repo.listPage({ actor: actor('PERM-ADM-TEMPLATES'), state: 'VOID', page: parsePageInput() })).total).toBe(0);
  });
});
