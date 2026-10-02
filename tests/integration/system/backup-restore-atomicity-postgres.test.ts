import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { uuidv7 } from '../../../src/shared/id/uuid.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { RequestRestoreUseCase } from '../../../src/modules/backup-recovery/application/request-restore.js';
import { GetBackupUseCase } from '../../../src/modules/backup-recovery/application/get-backup.js';
import { backupEligibilityVersion } from '../../../src/modules/backup-recovery/domain/backup-eligibility.js';
import { PostgresBackupCatalogRepository } from '../../../src/modules/backup-recovery/infrastructure/postgres-repository.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

describe('restore intent PostgreSQL transaction', () => {
  let database: Kysely<DatabaseSchema> | undefined;
  let pool: ReturnType<typeof createPool> | undefined;
  let actorId: string;

  const operator = (
    permission: 'PERM-BKP-VIEW' | 'PERM-BKP-RESTORE-DRILL' | 'PERM-BKP-RESTORE-PRODUCTION',
  ): ActorContext => ({
    id: actorId,
    accountState: 'ACTIVE',
    roles: ['ADMIN'],
    permissions: [{ code: permission, scopes: ['GLOBAL'] }],
  });

  beforeAll(async () => {
    const url = getTestDatabaseUrl(await startPostgresContainer());
    pool = createPool({ connectionString: url, max: 5 });
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
    await migrate({ pool });
    actorId = uuidv7();
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, $2, 'Restore test operator', 'test-only-placeholder-not-a-secret')`,
      [actorId, `restore-test-${actorId}`],
    );
  }, 120_000);

  afterAll(async () => {
    await database?.destroy();
    pool = undefined;
    database = undefined;
    await stopPostgresContainer();
  });

  async function seedBackup(checksum: string | null = 'a'.repeat(64)): Promise<string> {
    const backupId = uuidv7();
    await pool!.query(
      `INSERT INTO qc.backup_runs (id, state, requested_by, checksum, database_schema_version, request_id)
       VALUES ($1, 'VERIFIED', $2, $3, '0042', $4)`,
      [backupId, actorId, checksum, `backup-${backupId}`],
    );
    return backupId;
  }

  function restoreRepository(
    failures: { audit?: boolean; outbox?: boolean } = {},
  ): PostgresBackupCatalogRepository {
    return new PostgresBackupCatalogRepository(
      database!,
      (transaction) =>
        failures.audit
          ? {
              append: async () => {
                throw new Error('injected audit failure');
              },
            }
          : new PostgresAuditRepository(transaction),
      (transaction) =>
        (() => {
          const outbox = new PostgresOutboxRepository(transaction);
          return failures.outbox
            ? {
                enqueue: async () => {
                  throw new Error('injected outbox failure');
                },
                claim: (limit: number) => outbox.claim(limit),
                markProcessed: (id: string) => outbox.markProcessed(id),
                markRetry: (id: string, error: string, availableAt: Date) =>
                  outbox.markRetry(id, error, availableAt),
              }
            : outbox;
        })(),
    );
  }

  async function request(
    backupId: string,
    restoreRepository: PostgresBackupCatalogRepository,
    input: {
      requestId?: string;
      reason?: string;
      restoreType?: 'DRILL' | 'PRODUCTION';
      expectedVersion?: string;
    } = {},
  ) {
    const backup = await restoreRepository.getBackup(backupId);
    if (!backup) throw new Error('Restore test backup was not found');
    const idempotencyKey = input.requestId ?? `restore-${uuidv7()}`;
    return new RequestRestoreUseCase(restoreRepository).execute({
      actor: operator(
        input.restoreType === 'PRODUCTION'
          ? 'PERM-BKP-RESTORE-PRODUCTION'
          : 'PERM-BKP-RESTORE-DRILL',
      ),
      backupId,
      restoreType: input.restoreType ?? 'DRILL',
      targetEnvironment: input.restoreType === 'PRODUCTION' ? 'production' : 'test',
      reason: input.reason ?? 'Approved isolated recovery drill after a schema change.',
      confirmation: true,
      expectedVersion: input.expectedVersion ?? backupEligibilityVersion(backup),
      idempotencyKey,
      requestId: idempotencyKey,
    });
  }

  async function counts(backupId: string) {
    const result = await pool!.query(
      `SELECT
         (SELECT count(*)::int FROM qc.restore_runs WHERE backup_run_id = $1) AS restores,
         (SELECT count(*)::int FROM qc.audit_events WHERE subject_id = $1 AND action = 'REQUEST_RESTORE') AS audits,
         (SELECT count(*)::int FROM qc.outbox_events WHERE aggregate_id = $1 AND event_type = 'BACKUP_RESTORE_REQUESTED') AS outbox`,
      [backupId],
    );
    return result.rows[0] as { restores: number; audits: number; outbox: number };
  }

  it('keeps a valid checksum available as a boolean without returning its value', async () => {
    const backupId = await seedBackup();
    const backup = await restoreRepository().getBackup(backupId);
    expect(backup?.hasChecksum).toBe(true);
    expect(backup).not.toHaveProperty('checksum');
    expect(await restoreRepository().getBackup(await seedBackup(null))).toMatchObject({
      hasChecksum: false,
    });
  });

  it('denies a mutation on a readable existing backup without changing restore, audit, or outbox rows', async () => {
    const backupId = await seedBackup();
    await expect(
      new GetBackupUseCase(restoreRepository()).execute({
        actor: operator('PERM-BKP-VIEW'),
        backupId,
      }),
    ).resolves.toMatchObject({ backup: { id: backupId } });
    const before = await counts(backupId);
    const currentBackup = await restoreRepository().getBackup(backupId);
    expect(currentBackup).toBeDefined();
    const deniedRequestId = `denied-${uuidv7()}`;
    await expect(
      new RequestRestoreUseCase(restoreRepository()).execute({
        actor: operator('PERM-BKP-VIEW'),
        backupId,
        restoreType: 'DRILL',
        targetEnvironment: 'test',
        reason: 'Not authorized for a restore drill.',
        confirmation: true,
        expectedVersion: backupEligibilityVersion(currentBackup!),
        idempotencyKey: deniedRequestId,
        requestId: deniedRequestId,
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(await counts(backupId)).toEqual(before);
  });

  it('rejects a stale backup eligibility snapshot without writing intent, audit, or outbox rows', async () => {
    const backupId = await seedBackup();
    const before = await counts(backupId);
    await expect(
      request(backupId, restoreRepository(), { expectedVersion: '0'.repeat(64) }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(await counts(backupId)).toEqual(before);
  });

  it('rolls back the intent when the restore insert fails', async () => {
    const backupId = await seedBackup();
    const before = await counts(backupId);
    await pool!.query(`
      CREATE FUNCTION qc.__adp26_fail_restore_insert() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected restore insert failure'; END $$;
      CREATE TRIGGER __adp26_fail_restore_insert
      BEFORE INSERT ON qc.restore_runs FOR EACH ROW
      EXECUTE FUNCTION qc.__adp26_fail_restore_insert();
    `);
    try {
      await expect(request(backupId, restoreRepository())).rejects.toBeInstanceOf(Error);
      expect(await counts(backupId)).toEqual(before);
    } finally {
      await pool!.query('DROP TRIGGER __adp26_fail_restore_insert ON qc.restore_runs');
      await pool!.query('DROP FUNCTION qc.__adp26_fail_restore_insert()');
    }
  });

  it.each(['audit', 'outbox'] as const)(
    'rolls back insert and paired effects when %s persistence fails',
    async (failedAdapter) => {
      const backupId = await seedBackup();
      const before = await counts(backupId);
      const repo = restoreRepository({ [failedAdapter]: true });
      await expect(request(backupId, repo)).rejects.toBeInstanceOf(Error);
      expect(await counts(backupId)).toEqual(before);
    },
  );

  it('persists the reason, replays the same fingerprint once, and rejects a conflicting reason', async () => {
    const backupId = await seedBackup();
    const requestId = `replay-${uuidv7()}`;
    const reason = 'Recover the approved isolated copy for a schema validation drill.';
    const before = await counts(backupId);
    const first = await request(backupId, restoreRepository(), { requestId, reason });
    const second = await request(backupId, restoreRepository(), { requestId, reason });
    expect(second.restore.id).toBe(first.restore.id);
    await expect(
      request(backupId, restoreRepository(), { requestId, reason: 'A different reason.' }),
    ).rejects.toMatchObject({ code: 'CONFLICT_DUPLICATE_COMMAND' });
    const stored = await pool!.query(
      `SELECT state, evidence->>'operatorReason' AS reason, evidence->>'restoreExecuted' AS executed
       FROM qc.restore_runs WHERE id = $1`,
      [first.restore.id],
    );
    expect(stored.rows[0]).toEqual({ state: 'PLANNED', reason, executed: 'false' });
    expect(await counts(backupId)).toEqual({
      restores: before.restores + 1,
      audits: before.audits + 1,
      outbox: before.outbox + 1,
    });
    const event = await pool!.query(
      `SELECT reason, payload->>'restoreRunId' AS restore_run_id,
              payload->>'idempotencyKey' AS idempotency_key,
              payload->>'expectedBackupVersion' AS expected_backup_version
       FROM qc.audit_events WHERE subject_id = $1 AND request_id = $2`,
      [backupId, requestId],
    );
    const currentBackup = await restoreRepository().getBackup(backupId);
    expect(currentBackup).toBeDefined();
    expect(event.rows[0]).toMatchObject({
      reason,
      restore_run_id: first.restore.id,
      idempotency_key: requestId,
      expected_backup_version: backupEligibilityVersion(currentBackup!),
    });
  });

  it('serializes concurrent retries and never executes a production restore request', async () => {
    const backupId = await seedBackup();
    const requestId = `race-${uuidv7()}`;
    const before = await counts(backupId);
    const [first, second] = await Promise.all([
      request(backupId, restoreRepository(), { requestId }),
      request(backupId, restoreRepository(), { requestId }),
    ]);
    expect(first.restore.id).toBe(second.restore.id);
    expect(first.restore.state).toBe('PLANNED');
    expect(first.orchestration.executed).toBe(false);
    expect(await counts(backupId)).toEqual({
      restores: before.restores + 1,
      audits: before.audits + 1,
      outbox: before.outbox + 1,
    });
    await expect(
      request(backupId, restoreRepository(), { restoreType: 'PRODUCTION' }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect((await counts(backupId)).restores).toBe(before.restores + 1);
  });
});
