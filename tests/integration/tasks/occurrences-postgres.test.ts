import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { CreateTaskUseCase } from '../../../src/modules/tasks/application/create.js';
import { PostgresTaskRepository } from '../../../src/modules/tasks/infrastructure/postgres-repository.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const run = randomUUID();
const actor: ActorContext = {
  id: randomUUID(),
  loginIdentity: `occurrence-${run}`,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [{ code: 'PERM-TASK-CREATE', scopes: ['OWN'] }],
};
let pool: Pool;
let database: Kysely<DatabaseSchema>;
const request = (suffix: string) => ({
  actor,
  taskNo: `OCC-${run}-${suffix}`,
  title: 'Synthetic recurrence fixture',
  priority: 'NORMAL',
  recurrenceRuleId: `RULE-${run}-${suffix}`,
  occurrenceKey: '2026-10-08T00:00:00.000Z',
  requestId: `req-${run}-${suffix}`,
});
const repository = () =>
  new PostgresTaskRepository(
    database,
    new PostgresAuditRepository(database),
    new PostgresOutboxRepository(database),
  );

describe('Task recurring occurrence PostgreSQL atomicity', () => {
  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer({ tls: true })),
      max: 6,
    });
    await migrate({ pool });
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
    await pool.query(
      "INSERT INTO qc.users (id, login_identity, display_name, password_hash) VALUES ($1,$2,'Synthetic occurrence operator','test-only-placeholder')",
      [actor.id, actor.loginIdentity],
    );
  });
  afterAll(async () => {
    await database?.destroy();
    await stopPostgresContainer();
  });

  it('concurrent identical occurrence generation produces one task, audit and outbox', async () => {
    const useCase = new CreateTaskUseCase(repository());
    const input = request('race');
    const tasks = await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        useCase.execute({ ...input, requestId: `${input.requestId}-${index}` }),
      ),
    );
    expect(new Set(tasks.map((task) => task.id)).size).toBe(1);
    const taskId = tasks[0]!.id;
    expect(
      (
        await pool.query(
          'SELECT count(*)::int AS count FROM qc.tasks WHERE recurrence_rule_id=$1',
          [input.recurrenceRuleId],
        )
      ).rows,
    ).toEqual([{ count: 1 }]);
    expect(
      (
        await pool.query(
          "SELECT count(*)::int AS count FROM qc.audit_events WHERE subject_type='TASK' AND subject_id=$1",
          [taskId],
        )
      ).rows,
    ).toEqual([{ count: 1 }]);
    expect(
      (
        await pool.query(
          "SELECT count(*)::int AS count FROM qc.outbox_events WHERE aggregate_type='TASK' AND aggregate_id=$1",
          [taskId],
        )
      ).rows,
    ).toEqual([{ count: 1 }]);
  });
  it('refuses changed payload for an existing pair without additional writes', async () => {
    const useCase = new CreateTaskUseCase(repository());
    const input = request('conflict');
    const task = await useCase.execute(input);
    await expect(useCase.execute({ ...input, title: 'Changed request' })).rejects.toMatchObject({
      code: 'CONFLICT_DUPLICATE_COMMAND',
    });
    expect((await pool.query('SELECT title FROM qc.tasks WHERE id=$1', [task.id])).rows).toEqual([
      { title: input.title },
    ]);
    expect(
      (
        await pool.query(
          "SELECT count(*)::int AS count FROM qc.audit_events WHERE subject_type='TASK' AND subject_id=$1",
          [task.id],
        )
      ).rows,
    ).toEqual([{ count: 1 }]);
  });
  it('rolls back the occurrence and outbox when audit append fails, allowing a later successful retry', async () => {
    const input = request('rollback');
    const failing = new PostgresTaskRepository(
      database,
      {
        append: async () => {
          throw new Error('Synthetic audit failure');
        },
      },
      new PostgresOutboxRepository(database),
    );
    await expect(new CreateTaskUseCase(failing).execute(input)).rejects.toThrow();
    expect(
      (
        await pool.query('SELECT id FROM qc.tasks WHERE recurrence_rule_id=$1', [
          input.recurrenceRuleId,
        ])
      ).rows,
    ).toEqual([]);
    const task = await new CreateTaskUseCase(repository()).execute(input);
    expect(task.recurrence?.ruleId).toBe(input.recurrenceRuleId);
  });
  it('refuses deletion of a generated draft so a later replay preserves the original identity', async () => {
    const input = request('retained');
    const repo = repository();
    const useCase = new CreateTaskUseCase(repo);
    const task = await useCase.execute(input);
    await expect(
      repo.deleteDraft({
        id: task.id,
        actor,
        expectedVersion: 1n,
        requestId: `${run}-delete`,
        reason: 'Synthetic retention probe',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_DUPLICATE_COMMAND' });
    expect((await useCase.execute(input)).id).toBe(task.id);
  });
});
