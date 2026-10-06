import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { PostgresTemplateRepository } from '../../../src/modules/quarantine/templates/infrastructure/postgres-repository.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { CreateTemplateUseCase } from '../../../src/modules/quarantine/templates/application/create-template.js';
import { ReviewTemplateUseCase } from '../../../src/modules/quarantine/templates/application/lifecycle.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const SUPERVISOR_ID = '01900000-0000-7000-8000-00000000d001';
const EMPLOYEE_ID = '01900000-0000-7000-8000-00000000d002';
const OWNER_ID = '01900000-0000-7000-8000-00000000d003';
const ADMIN_ID = '01900000-0000-7000-8000-00000000d004';

const actor = (id: string, roles: string[]): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles,
  permissions: [
    { code: 'PERM-ADM-TEMPLATES', scopes: ['GLOBAL'] },
    { code: 'PERM-ESIG-SIGN', scopes: ['GLOBAL'] },
  ],
});

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
    [SUPERVISOR_ID, 'template-conc-sup'],
    [EMPLOYEE_ID, 'template-conc-emp'],
    [OWNER_ID, 'yazeed'],
    [ADMIN_ID, 'template-conc-admin'],
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

describe('template PostgreSQL concurrency and idempotency (P-06)', () => {
  it('allows canonical yazeed and leaves a valid row plus audit/outbox unchanged for noncanonical owner and Admin denial', async () => {
    const repo = new PostgresTemplateRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    const stamp = Date.now();
    const draft = await new CreateTemplateUseCase(repo).execute({
      actor: actor(EMPLOYEE_ID, ['EMPLOYEE']),
      templateCode: 'F-823-T1',
      versionNo: '2',
      name: 'Inspection & Test Report for Raw Material',
      requestId: `auth-create-${stamp}`,
    });
    const supervisor = actor(SUPERVISOR_ID, ['SUPERVISOR']);
    expect(await repo.get(draft.id, supervisor)).toMatchObject({ id: draft.id, state: 'DRAFT' });

    const snapshot = async () => {
      const row = await pool!.query(
        'SELECT state, version::text FROM qc.inspection_template_versions WHERE id = $1',
        [draft.id],
      );
      const audit = await pool!.query(
        'SELECT count(*)::int AS count FROM qc.audit_events WHERE subject_id = $1',
        [draft.id],
      );
      const outbox = await pool!.query(
        'SELECT count(*)::int AS count FROM qc.outbox_events WHERE aggregate_id = $1',
        [draft.id],
      );
      return { row: row.rows[0], audit: audit.rows[0].count, outbox: outbox.rows[0].count };
    };
    const before = await snapshot();
    const review = new ReviewTemplateUseCase(repo);

    await expect(
      review.execute({
        actor: { ...actor(OWNER_ID, ['SYSTEM_OWNER']), loginIdentity: 'not-yazeed' },
        id: draft.id,
        expectedVersion: 1n,
        requestId: `auth-deny-owner-${stamp}`,
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      review.execute({
        actor: { ...actor(ADMIN_ID, ['ADMIN']), permissions: [] },
        id: draft.id,
        expectedVersion: 1n,
        requestId: `auth-deny-admin-${stamp}`,
      }),
    ).rejects.toBeInstanceOf(AppError);
    expect(await snapshot()).toEqual(before);

    const canonicalOwner = { ...actor(OWNER_ID, ['SYSTEM_OWNER']), loginIdentity: 'yazeed' };
    const approvedReview = await review.execute({
      actor: canonicalOwner,
      id: draft.id,
      expectedVersion: 1n,
      requestId: `auth-allow-yazeed-${stamp}`,
    });
    expect(approvedReview.state).toBe('UNDER_REVIEW');
  });

  it('serializes concurrent reviews: at most one transition wins per version', async () => {
    const repo = new PostgresTemplateRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    const stamp = Date.now();
    const draft = await new CreateTemplateUseCase(repo).execute({
      actor: {
        ...actor(EMPLOYEE_ID, ['EMPLOYEE']),
        permissions: [{ code: 'PERM-ADM-TEMPLATES', scopes: ['GLOBAL'] }],
      },
      templateCode: 'F-823-T2',
      versionNo: '1',
      name: 'Inspection & Test Report for General Material',
      requestId: `conc-create-${stamp}`,
    });
    expect(draft.state).toBe('DRAFT');
    const review = new ReviewTemplateUseCase(repo);
    const results = await Promise.allSettled([
      review.execute({
        actor: actor(SUPERVISOR_ID, ['SUPERVISOR']),
        id: draft.id,
        expectedVersion: 1n,
        requestId: `conc-a-${stamp}`,
      }),
      review.execute({
        actor: actor(SUPERVISOR_ID, ['SUPERVISOR']),
        id: draft.id,
        expectedVersion: 1n,
        requestId: `conc-b-${stamp}`,
      }),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });

  it('replays the same request id without duplicating audit or outbox rows', async () => {
    const repo = new PostgresTemplateRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    const stamp = Date.now();
    const draft = await new CreateTemplateUseCase(repo).execute({
      actor: {
        ...actor(EMPLOYEE_ID, ['EMPLOYEE']),
        permissions: [{ code: 'PERM-ADM-TEMPLATES', scopes: ['GLOBAL'] }],
      },
      templateCode: 'F-823-T3',
      versionNo: '3',
      name: 'Inspection & Test Report for Aluminum Strip',
      requestId: `replay-create-${stamp}`,
    });
    const requestId = `replay-review-${stamp}`;
    const review = new ReviewTemplateUseCase(repo);
    const first = await review.execute({
      actor: actor(SUPERVISOR_ID, ['SUPERVISOR']),
      id: draft.id,
      expectedVersion: 1n,
      requestId,
    });
    const count = async (table: string, column: string, value: string): Promise<number> =>
      Number(
        (
          await pool!.query(`SELECT count(*)::int AS count FROM ${table} WHERE ${column} = $1`, [
            value,
          ])
        ).rows[0].count,
      );
    const auditsBefore = await count('qc.audit_events', 'request_id', requestId);
    const replay = await review.execute({
      actor: actor(SUPERVISOR_ID, ['SUPERVISOR']),
      id: draft.id,
      expectedVersion: 1n,
      requestId,
    });
    const auditsAfter = await count('qc.audit_events', 'request_id', requestId);
    const outboxAfter = await count('qc.outbox_events', 'dedupe_key', `template:${draft.id}:v2`);
    expect(replay.id).toBe(first.id);
    expect(replay.state).toBe('UNDER_REVIEW');
    expect(auditsAfter).toBe(auditsBefore);
    expect(outboxAfter).toBe(1);
  });
});
