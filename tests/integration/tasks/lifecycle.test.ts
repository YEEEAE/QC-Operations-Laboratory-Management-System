import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { CreateTaskUseCase } from '../../../src/modules/tasks/application/create.js';
import { GetTaskUseCase } from '../../../src/modules/tasks/application/get.js';
import { TransitionTaskUseCase } from '../../../src/modules/tasks/application/transition.js';
import { PostgresTaskRepository } from '../../../src/modules/tasks/infrastructure/postgres-repository.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const ownerId = '01900000-0000-7000-8000-00000000f101';
const otherId = '01900000-0000-7000-8000-00000000f102';
const run = randomUUID().slice(0, 8);
const permission = (
  code: string,
  scopes: readonly ('OWN' | 'ASSIGNED' | 'GLOBAL')[] = ['OWN'],
) => ({
  code: code as ActorContext['permissions'][number]['code'],
  scopes,
});
const owner: ActorContext = {
  id: ownerId,
  loginIdentity: `task-owner-${run}`,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    permission('PERM-TASK-CREATE'),
    permission('PERM-TASK-VIEW'),
    permission('PERM-TASK-EDIT'),
    permission('PERM-TASK-BLOCK'),
    permission('PERM-TASK-COMPLETE'),
    permission('PERM-TASK-REOPEN'),
  ],
};
const otherWithTransitionPermission: ActorContext = {
  id: otherId,
  loginIdentity: `task-other-${run}`,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [permission('PERM-TASK-COMPLETE')],
};

let pool: Pool | undefined;
let db: Kysely<DatabaseSchema> | undefined;

describe('task lifecycle transaction and audit parity', () => {
  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer({ tls: true })),
      max: 6,
    });
    await migrate({ pool });
    db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, $2, 'Task owner', 'test-only-placeholder'), ($3, $4, 'Other user', 'test-only-placeholder')
       ON CONFLICT (id) DO NOTHING`,
      [ownerId, owner.loginIdentity, otherId, otherWithTransitionPermission.loginIdentity],
    );
  });

  afterAll(async () => {
    await db?.destroy();
    await pool?.end();
    await stopPostgresContainer();
  });

  it('creates, transitions, and reopens with exact version, audit, and outbox agreement', async () => {
    const audit = new PostgresAuditRepository(db!);
    const outbox = new PostgresOutboxRepository(db!);
    const repository = new PostgresTaskRepository(db!, audit, outbox);
    const task = await new CreateTaskUseCase(repository).execute({
      actor: owner,
      taskNo: `TASK-E2E-${run}-LIFECYCLE`,
      title: 'Lifecycle proof',
      priority: 'UNSPECIFIED',
      requestId: `task-create-${run}`,
    });
    const transition = new TransitionTaskUseCase(repository);
    const actions = [
      ['ACTIVATE', 'OPEN', undefined],
      ['START', 'IN_PROGRESS', undefined],
      ['HOLD', 'ON_HOLD', 'Waiting for access'],
      ['RESUME', 'IN_PROGRESS', undefined],
      ['COMPLETE', 'COMPLETED', undefined],
      ['REOPEN', 'IN_PROGRESS', 'Follow-up required'],
    ] as const;
    let version = task.version;
    const expectedStates = [
      'OPEN',
      'IN_PROGRESS',
      'ON_HOLD',
      'IN_PROGRESS',
      'COMPLETED',
      'IN_PROGRESS',
    ];
    for (let index = 0; index < actions.length; index += 1) {
      const [action, state, reason] = actions[index]!;
      const updated = await transition.execute({
        actor: owner,
        taskId: task.id,
        expectedVersion: version,
        action,
        reason,
        requestId: `task-${action.toLowerCase()}-${run}`,
      });
      version += 1n;
      expect(updated).toMatchObject({ state, version });
      const stored = await pool!.query<{ state: string; version: string }>(
        'SELECT state, version::text FROM qc.tasks WHERE id = $1',
        [task.id],
      );
      expect(stored.rows).toEqual([{ state, version: version.toString() }]);
      const event = await pool!.query<{
        action: string;
        old_state: string;
        new_state: string;
        request_id: string;
      }>(
        'SELECT action, old_state, new_state, request_id FROM qc.audit_events WHERE subject_type = $1 AND subject_id = $2 ORDER BY event_no DESC LIMIT 1',
        ['TASK', task.id],
      );
      expect(event.rows[0]).toMatchObject({
        action,
        old_state: expectedStates[index - 1] ?? 'DRAFT',
        new_state: state,
        request_id: `task-${action.toLowerCase()}-${run}`,
      });
      const eventCount = await pool!.query<{ count: string }>(
        'SELECT count(*)::text AS count FROM qc.outbox_events WHERE aggregate_type = $1 AND aggregate_id = $2',
        ['TASK', task.id],
      );
      expect(Number(eventCount.rows[0]?.count)).toBe(index + 2);
    }

    const detail = await new GetTaskUseCase(repository).execute({ actor: owner, taskId: task.id });
    expect(detail.ownerDisplayName).toBe('Task owner');
    expect(detail.assigneeDisplayName).toBe('Unassigned');
    expect(detail.history.map(({ oldState, newState }) => [oldState, newState])).toEqual([
      [undefined, 'DRAFT'],
      ['DRAFT', 'OPEN'],
      ['OPEN', 'IN_PROGRESS'],
      ['IN_PROGRESS', 'ON_HOLD'],
      ['ON_HOLD', 'IN_PROGRESS'],
      ['IN_PROGRESS', 'COMPLETED'],
      ['COMPLETED', 'IN_PROGRESS'],
    ]);
    expect(detail.history.every((event) => event.actorLabel === 'You')).toBe(true);
  });

  it('refuses wrong-scope and stale-version transitions without row, audit, or outbox changes', async () => {
    const repository = new PostgresTaskRepository(
      db!,
      new PostgresAuditRepository(db!),
      new PostgresOutboxRepository(db!),
    );
    const task = await new CreateTaskUseCase(repository).execute({
      actor: owner,
      taskNo: `TASK-E2E-${run}-DENIAL`,
      title: 'Denial proof',
      priority: 'LOW',
      requestId: `task-denial-create-${run}`,
    });
    await new TransitionTaskUseCase(repository).execute({
      actor: owner,
      taskId: task.id,
      expectedVersion: 1n,
      action: 'ACTIVATE',
      requestId: `task-denial-activate-${run}`,
    });
    await new TransitionTaskUseCase(repository).execute({
      actor: owner,
      taskId: task.id,
      expectedVersion: 2n,
      action: 'START',
      requestId: `task-denial-start-${run}`,
    });
    const before = await pool!.query('SELECT state, version FROM qc.tasks WHERE id = $1', [
      task.id,
    ]);
    const auditBefore = await pool!.query(
      'SELECT count(*)::text AS count FROM qc.audit_events WHERE subject_type = $1 AND subject_id = $2',
      ['TASK', task.id],
    );
    const outboxBefore = await pool!.query(
      'SELECT count(*)::text AS count FROM qc.outbox_events WHERE aggregate_type = $1 AND aggregate_id = $2',
      ['TASK', task.id],
    );
    await expect(
      new TransitionTaskUseCase(repository).execute({
        actor: otherWithTransitionPermission,
        taskId: task.id,
        expectedVersion: 3n,
        action: 'COMPLETE',
        requestId: `task-denied-scope-${run}`,
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SCOPE_DENIED' });
    await expect(
      new TransitionTaskUseCase(repository).execute({
        actor: owner,
        taskId: task.id,
        expectedVersion: 1n,
        action: 'COMPLETE',
        requestId: `task-denied-stale-${run}`,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(
      (await pool!.query('SELECT state, version FROM qc.tasks WHERE id = $1', [task.id])).rows,
    ).toEqual(before.rows);
    expect(
      (
        await pool!.query(
          'SELECT count(*)::text AS count FROM qc.audit_events WHERE subject_type = $1 AND subject_id = $2',
          ['TASK', task.id],
        )
      ).rows,
    ).toEqual(auditBefore.rows);
    expect(
      (
        await pool!.query(
          'SELECT count(*)::text AS count FROM qc.outbox_events WHERE aggregate_type = $1 AND aggregate_id = $2',
          ['TASK', task.id],
        )
      ).rows,
    ).toEqual(outboxBefore.rows);
  });

  it('refuses assignment without its separate permission before any record or audit write', async () => {
    const repository = new PostgresTaskRepository(
      db!,
      new PostgresAuditRepository(db!),
      new PostgresOutboxRepository(db!),
    );
    const taskNo = `TASK-E2E-${run}-ASSIGN-DENIAL`;
    await expect(
      new CreateTaskUseCase(repository).execute({
        actor: owner,
        taskNo,
        title: 'Assignment denial proof',
        priority: 'LOW',
        currentAssigneeId: otherId,
        requestId: `task-denied-assignment-${run}`,
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(
      (await pool!.query('SELECT id FROM qc.tasks WHERE task_no = $1', [taskNo])).rows,
    ).toEqual([]);
    expect(
      (
        await pool!.query('SELECT id FROM qc.audit_events WHERE request_id = $1', [
          `task-denied-assignment-${run}`,
        ])
      ).rows,
    ).toEqual([]);
  });
});
