import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { createReportDraftOperations } from '../../../src/modules/laboratory/application/report-drafts.js';
import { emptyReportDraft } from '../../../src/modules/laboratory/domain/report-draft.js';
import { PostgresReportDraftRepository } from '../../../src/modules/laboratory/infrastructure/postgres-report-draft-repository.js';
import type { ReportDraftRepository } from '../../../src/modules/laboratory/ports/report-draft-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const OWNER = '01900000-0000-7000-8000-00000000c001';
const OTHER = '01900000-0000-7000-8000-00000000c002';
const actor = (
  id: string,
  grants: ActorContext['permissions'],
  accountState: ActorContext['accountState'] = 'ACTIVE',
): ActorContext => ({
  id,
  accountState,
  roles: [],
  permissions: grants,
});
const grant = (
  code: ActorContext['permissions'][number]['code'],
  ...scopes: ActorContext['permissions'][number]['scopes'][number][]
) => ({ code, scopes });

let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema> | undefined;
let operations: ReturnType<typeof createReportDraftOperations>;
let repository: ReportDraftRepository;

beforeAll(async () => {
  const connectionString = getTestDatabaseUrl(await startPostgresContainer());
  pool = createPool({ connectionString, max: 8 });
  await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
  await migrate({ pool });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
  repository = new PostgresReportDraftRepository(db);
  operations = createReportDraftOperations(repository);
  for (const [id, login] of [
    [OWNER, 'report-draft-owner'],
    [OTHER, 'report-draft-other'],
  ] as const) {
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash) VALUES ($1, $2, $3, 'test-only-placeholder-not-a-secret')`,
      [id, login, `Report draft ${login}`],
    );
  }
});

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

describe('laboratory report drafts on PostgreSQL', () => {
  it('applies migration 0039 and preserves create/load/update/audit data', async () => {
    const applied = await pool!.query(
      `SELECT 1 FROM qc.schema_migrations WHERE version = '0039' AND name = 'laboratory_report_drafts'`,
    );
    expect(applied.rowCount).toBe(1);
    const schema = await pool!.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'qc' AND table_name = 'laboratory_report_drafts' ORDER BY ordinal_position`,
    );
    expect(schema.rows.map((row) => row.column_name)).toEqual([
      'id',
      'report_type',
      'form_data',
      'author_id',
      'created_at',
      'updated_at',
      'version',
    ]);
    expect(schema.rows.find((row) => row.column_name === 'form_data')?.data_type).toBe('jsonb');

    const owner = actor(OWNER, [
      grant('PERM-LAB-VIEW', 'OWN'),
      grant('PERM-LAB-CREATE', 'OWN'),
      grant('PERM-LAB-EDIT-DRAFT', 'OWN'),
    ]);
    const data = emptyReportDraft('SUBATMOSPHERIC_AIR_LEAKAGE');
    data.lotNumber = 'PG-LOT-001';
    data.samples[11]!.leakageRate = '0.0000000000000001';
    const id = await operations.save({ actor: owner, data, requestId: 'pg-draft-create' });
    const row = await pool!.query(
      'SELECT report_type, form_data, author_id, version FROM qc.laboratory_report_drafts WHERE id = $1',
      [id],
    );
    expect(row.rows[0]).toMatchObject({
      report_type: 'SUBATMOSPHERIC_AIR_LEAKAGE',
      author_id: OWNER,
      version: '1',
    });
    expect(row.rows[0].form_data.samples[11].leakageRate).toBe('0.0000000000000001');
    const loaded = await operations.get(owner, id);
    expect(loaded.data).toEqual(data);
    expect((await operations.list(owner)).map((draft) => draft.id)).toContain(id);
    expect(await operations.list(actor(OTHER, [grant('PERM-LAB-VIEW', 'OWN')]))).toHaveLength(0);
    expect(await operations.list(actor(OTHER, [grant('PERM-LAB-VIEW', 'GLOBAL')]))).toHaveLength(1);

    data.samples[11]!.result = 'PASS';
    await operations.save({
      actor: owner,
      id,
      expectedVersion: 1n,
      data,
      requestId: 'pg-draft-update',
    });
    expect((await operations.get(owner, id)).version).toBe(2n);
    expect((await operations.get(owner, id)).data.samples[11]?.result).toBe('PASS');
    expect(
      await pool!
        .query(
          `SELECT 1 FROM qc.audit_events WHERE subject_id = $1 AND action IN ('CREATE','SAVE')`,
          [id],
        )
        .then((result) => result.rowCount),
    ).toBe(2);
  });

  it('rejects stale concurrent updates, cross-owner access, forged author data, and type switching', async () => {
    const owner = actor(OWNER, [
      grant('PERM-LAB-VIEW', 'OWN'),
      grant('PERM-LAB-CREATE', 'OWN'),
      grant('PERM-LAB-EDIT-DRAFT', 'OWN'),
    ]);
    const data = emptyReportDraft('PRESSURE_DECAY');
    const id = await operations.save({ actor: owner, data, requestId: 'pg-concurrency-create' });
    const updates = await Promise.allSettled([
      operations.save({
        actor: owner,
        id,
        expectedVersion: 1n,
        data,
        requestId: 'pg-concurrency-a',
      }),
      operations.save({
        actor: owner,
        id,
        expectedVersion: 1n,
        data: { ...data, lotNumber: 'SECOND' },
        requestId: 'pg-concurrency-b',
      }),
    ]);
    expect(updates.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(
      (updates.find((result) => result.status === 'rejected') as PromiseRejectedResult).reason,
    ).toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect((await operations.get(owner, id)).version).toBe(2n);

    await expect(
      operations.get(actor(OTHER, [grant('PERM-LAB-VIEW', 'OWN')]), id),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    await expect(
      operations.save({
        actor: actor(OTHER, [grant('PERM-LAB-EDIT-DRAFT', 'OWN')]),
        id,
        expectedVersion: 2n,
        data,
        requestId: 'forged-owner',
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    await expect(
      operations.save({
        actor: owner,
        id,
        expectedVersion: 2n,
        data: emptyReportDraft('SUBATMOSPHERIC_AIR_LEAKAGE'),
        requestId: 'switch-type',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    const persisted = await pool!.query(
      'SELECT author_id, report_type, version FROM qc.laboratory_report_drafts WHERE id = $1',
      [id],
    );
    expect(persisted.rows[0]).toMatchObject({
      author_id: OWNER,
      report_type: 'PRESSURE_DECAY',
      version: '2',
    });
    expect(
      await pool!
        .query(`SELECT count(*)::int AS count FROM qc.audit_events WHERE subject_id = $1`, [id])
        .then((result) => result.rows[0].count),
    ).toBe(2);
  });

  it('requires the exact active permission and keeps draft mutations outside controlled lab state', async () => {
    const data = emptyReportDraft('PRESSURE_DECAY');
    await expect(
      operations.save({
        actor: actor(OWNER, [], 'ACTIVE'),
        data,
        requestId: 'no-create-permission',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      operations.list(actor(OWNER, [grant('PERM-LAB-VIEW', 'OWN')], 'DISABLED')),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    const before = await pool!.query('SELECT count(*)::int AS count FROM qc.lab_tests');
    const id = await operations.save({
      actor: actor(OWNER, [grant('PERM-LAB-CREATE', 'OWN')]),
      data,
      requestId: 'boundary-create',
    });
    expect(id).toBeTruthy();
    const after = await pool!.query('SELECT count(*)::int AS count FROM qc.lab_tests');
    expect(after.rows[0].count).toBe(before.rows[0].count);
    const audit = await pool!.query(
      'SELECT action, subject_type FROM qc.audit_events WHERE subject_id = $1',
      [id],
    );
    expect(audit.rows).toEqual([{ action: 'CREATE', subject_type: 'LAB_REPORT_DRAFT' }]);
  });
});
