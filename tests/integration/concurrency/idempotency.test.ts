import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { SignControlledActionUseCase } from '../../../src/modules/e-signatures/application/sign-controlled-action.js';
import { PostgresSignatureEvidenceRepository } from '../../../src/modules/e-signatures/infrastructure/postgres-repository.js';
import { ReleaseReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/release-receiving.js';
import { PostgresReceivingRepository } from '../../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import {
  fingerprint,
  executeIdempotently,
} from '../../../src/shared/idempotency/idempotency-service.js';
import { PostgresIdempotencyRepository } from '../../../src/shared/idempotency/postgres-idempotency-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const ACTOR_ID = '01900000-0000-7000-8000-00000000c001';
const actor = (
  grants: readonly {
    code: ActorContext['permissions'][number]['code'];
    scopes: readonly ActorContext['permissions'][number]['scopes'][number][];
  }[],
): ActorContext => ({
  id: ACTOR_ID,
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: grants.map((grant) => ({ code: grant.code, scopes: grant.scopes })),
});

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
  await pool!.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash) VALUES ($1, 'idempotency-actor', 'Idempotency actor', 'test-only-placeholder-not-a-secret')`,
    [ACTOR_ID],
  );
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

describe('durable idempotency against real PostgreSQL', () => {
  it('reserves a given idempotency key exactly once under concurrent reservation attempts', async () => {
    const repository = new PostgresIdempotencyRepository(db);
    const record = {
      key: 'idem-reserve-1',
      fingerprint: fingerprint({ command: 'reserve' }),
      status: 'IN_PROGRESS' as const,
      response: null,
    };
    const results = await Promise.all(
      Array.from({ length: 8 }, () => repository.reserve({ ...record })),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    const stored = (
      await pool!.query(
        'SELECT count(*)::int AS count FROM qc.idempotency_records WHERE key = $1',
        [record.key],
      )
    ).rows[0].count;
    expect(stored).toBe(1);
  });

  it('returns the stored response on replay without rerunning the mutation', async () => {
    const repository = new PostgresIdempotencyRepository(db);
    let calls = 0;
    const command = { action: 'idem-replay', subjectId: '01900000-0000-7000-8000-00000000c010' };
    const work = () => {
      calls += 1;
      return Promise.resolve({ done: true, calls });
    };
    const key = 'idem-replay-1';
    await expect(executeIdempotently(repository, key, command, work)).resolves.toEqual({
      done: true,
      calls: 1,
    });
    await expect(executeIdempotently(repository, key, command, work)).resolves.toEqual({
      done: true,
      calls: 1,
    });
    expect(calls).toBe(1);
    const row = (
      await pool!.query(
        'SELECT status, response_payload FROM qc.idempotency_records WHERE key = $1',
        [key],
      )
    ).rows[0];
    expect(row.status).toBe('COMPLETED');
    expect(row.response_payload).toEqual({ done: true, calls: 1 });
  });

  it('rejects reuse of a completed key with a different command fingerprint', async () => {
    const repository = new PostgresIdempotencyRepository(db);
    const key = 'idem-conflict-1';
    await expect(
      executeIdempotently(repository, key, { value: 1 }, () => Promise.resolve('first')),
    ).resolves.toBe('first');
    await expect(
      executeIdempotently(repository, key, { value: 2 }, () => Promise.resolve('second')),
    ).rejects.toMatchObject({ code: 'CONFLICT_DUPLICATE_COMMAND' });
  });

  it('marks a failed command as FAILED and denies replay of the same key', async () => {
    const repository = new PostgresIdempotencyRepository(db);
    const key = 'idem-failed-1';
    await expect(
      executeIdempotently(repository, key, { value: 'boom' }, () =>
        Promise.reject(new Error('controlled failure')),
      ),
    ).rejects.toThrow('controlled failure');
    const row = (
      await pool!.query('SELECT status FROM qc.idempotency_records WHERE key = $1', [key])
    ).rows[0];
    expect(row.status).toBe('FAILED');
    await expect(
      executeIdempotently(repository, key, { value: 'boom' }, () => Promise.resolve('retried')),
    ).rejects.toMatchObject({ code: 'CONFLICT_DUPLICATE_COMMAND' });
  });

  it('executes a controlled release exactly once when the same idempotency key is replayed or raced', async () => {
    const receivingId = '01900000-0000-7000-8000-00000000c020';
    await pool!.query(
      `INSERT INTO qc.receiving_items (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by, version)
       VALUES ($1, 'RCV-IDEM-001', 'DOC-IDEM-001', 'ITEM-IDEM-001', 'Idempotency receiving item', 'LOT-IDEM-001', 3, '2026-01-06', 'RELEASE_PENDING', 'PASS', false, $2, $2, 4)`,
      [receivingId, ACTOR_ID],
    );
    const repository = new PostgresReceivingRepository(
      db,
      new PostgresAuditRepository(db),
      new PostgresOutboxRepository(db),
    );
    const release = new ReleaseReceivingUseCase(repository, { canRelease: () => true });
    const command = { id: receivingId, expectedVersion: '4' };
    const idempotentRelease = (requestId: string) =>
      executeIdempotently(new PostgresIdempotencyRepository(db), `idem-release-1`, command, () =>
        release.execute({
          actor: actor([
            { code: 'PERM-QUAR-VIEW', scopes: ['GLOBAL'] },
            { code: 'PERM-QUAR-RELEASE', scopes: ['GLOBAL'] },
          ]),
          id: receivingId,
          expectedVersion: 4n,
          requestId,
        }),
      );

    const outcomes = await Promise.allSettled([
      idempotentRelease('idem-rel-1'),
      idempotentRelease('idem-rel-2'),
    ]);
    const mutationResults = outcomes.filter(
      (o) => o.status === 'fulfilled',
    ) as PromiseFulfilledResult<{ id: string; version: bigint; releaseSystem: boolean }>[];
    const conflicts = outcomes.filter(
      (o) =>
        o.status === 'rejected' &&
        (o.reason as { code?: string })?.code === 'CONFLICT_DUPLICATE_COMMAND',
    );
    expect(mutationResults.length + conflicts.length).toBe(2);
    for (const result of mutationResults) {
      expect(result.value.releaseSystem).toBe(true);
      expect(result.value.version).toBe(5n);
    }

    const replayed = await idempotentRelease('idem-rel-3');
    expect(replayed.releaseSystem).toBe(true);
    // Replay returns the durable JSON snapshot of the original response: bigint
    // versions are preserved as strings there (stableJson contract).
    expect(String(replayed.version)).toBe('5');

    const row = (
      await pool!.query(
        'SELECT workflow_state, release_system, version FROM qc.receiving_items WHERE id = $1',
        [receivingId],
      )
    ).rows[0];
    expect(row.workflow_state).toBe('RELEASED');
    expect(row.release_system).toBe(true);
    expect(Number(row.version)).toBe(5);
    expect(await countAudit(receivingId, 'RELEASE')).toBe(1);
    expect(await countOutbox(`receiving:${receivingId}:v5`)).toBe(1);
  });

  it('records exactly one signature evidence row when a signing ceremony is replayed under the same key', async () => {
    const repository = new PostgresSignatureEvidenceRepository(db);
    const useCase = new SignControlledActionUseCase(repository, { verify: async () => true });
    const input = {
      actor: actor([{ code: 'PERM-ESIG-SIGN', scopes: ['GLOBAL'] }]),
      subjectType: 'INSPECTION_REPORT' as const,
      subjectId: '01900000-0000-7000-8000-00000000c030',
      subjectVersion: 4n,
      action: 'APPROVE',
      meaning: 'Approval of the inspection report',
      snapshotHash: 'hash-sign-idem-1',
      reauthenticationSecret: 'reauth-value-not-stored',
      requestId: 'idem-sign-1',
    };
    const key = 'idem-sign-ceremony-1';
    const command = {
      subjectId: input.subjectId,
      subjectVersion: '4',
      action: input.action,
      requestId: input.requestId,
    };
    const signed = await executeIdempotently(
      new PostgresIdempotencyRepository(db),
      key,
      command,
      () => useCase.execute(input),
    );
    const replayed = await executeIdempotently(
      new PostgresIdempotencyRepository(db),
      key,
      command,
      () => useCase.execute(input),
    );
    expect(replayed.id).toBe(signed.id);
    const rows = (
      await pool!.query(
        'SELECT count(*)::int AS count FROM qc.electronic_signatures WHERE subject_id = $1 AND request_id = $2',
        [input.subjectId, input.requestId],
      )
    ).rows[0].count;
    expect(rows).toBe(1);
  });
});
