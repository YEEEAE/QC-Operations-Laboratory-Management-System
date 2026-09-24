/**
 * QC-100-FINAL-022 item 3 — "My work today" parity, scope, time and bounds.
 *
 * This suite runs the real queue against populated PostgreSQL and proves the
 * four things the workspace claims:
 *   - the number a group publishes is the register's own full count, beyond a
 *     single page, and the group's bounded list is a slice of the same set;
 *   - ordering is total and stable, so two reads cannot disagree;
 *   - another account's identical rows never appear, and a register the account
 *     may not read is reported as unreadable instead of as an empty group;
 *   - the UTC day boundary decides "due today" versus "overdue", and a record
 *     assigned more than once is still listed once.
 *
 * Statement counts are taken from the real SQL Kysely issues over the same
 * pool the registers use, and the payload is measured on the rendered read
 * model, not estimated.
 */
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { GetMyWorkUseCase } from '../../../src/modules/dashboard/application/get-my-work.js';
import {
  buildMyWork,
  createMyWorkQuery,
  MY_WORK_ITEM_LIMIT,
} from '../../../src/modules/dashboard/application/my-work-queue.js';
import { readMetricSource } from '../../../src/modules/dashboard/application/dashboard-attention.js';
import {
  dashboardMetricSources,
  type DashboardSourceDependencies,
} from '../../../src/modules/dashboard/application/dashboard-sources.js';
import { ListInspectionsUseCase } from '../../../src/modules/quarantine/inspection/application/list-inspections.js';
import { PostgresInspectionRepository } from '../../../src/modules/quarantine/inspection/infrastructure/postgres-repository.js';
import { ListReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/list-receiving.js';
import { PostgresReceivingRepository } from '../../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import { ListTasksUseCase } from '../../../src/modules/tasks/application/list.js';
import { PostgresTaskRepository } from '../../../src/modules/tasks/infrastructure/postgres-repository.js';
import { GetLabWorkloadUseCase } from '../../../src/modules/laboratory/application/get-lab-workload.js';
import { PostgresLabRepository } from '../../../src/modules/laboratory/infrastructure/postgres-repository.js';
import { ListCalibrationsUseCase } from '../../../src/modules/assets/calibration/application/list-calibrations.js';
import { PostgresCalibrationRepository } from '../../../src/modules/assets/calibration/infrastructure/postgres-repository.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { parsePageInput } from '../../../src/shared/pagination/page.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const MINE = '01900000-0000-7000-8000-00000000d801';
const OTHER = '01900000-0000-7000-8000-00000000d802';
const RUN = randomUUID().slice(0, 8);
const DAY = 24 * 60 * 60 * 1000;

/** A ceiling far above the real count and far below a per-row blow-up. */
const STATEMENT_CEILING = 60;
/** The bounded page cannot grow past four groups of ten, so the payload must not either. */
const PAYLOAD_CEILING = 80_000;

const actorWith = (permissions: readonly string[]): ActorContext => ({
  id: MINE,
  loginIdentity: `my-work-mine-${RUN}`,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: permissions.map((code) => ({ code: code as never, scopes: ['GLOBAL'] as const })),
});

const FULL_ACTOR = actorWith([
  'PERM-TASK-VIEW',
  'PERM-QUAR-VIEW',
  'PERM-INSP-VIEW',
  'PERM-LAB-VIEW',
  'PERM-CAL-VIEW',
]);
/** Reads the tasks register only: every other group must report "unreadable". */
const TASKS_ONLY_ACTOR = actorWith(['PERM-TASK-VIEW']);

let pool: Pool | undefined;
let databaseUrl: string;
let db: Kysely<DatabaseSchema>;
const countingDatabases = new Set<Kysely<DatabaseSchema>>();

function countingDatabase(): { db: Kysely<DatabaseSchema>; statements: string[] } {
  const statements: string[] = [];
  const countedDb = new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({ pool: createPool({ connectionString: databaseUrl, max: 3 }) }),
    log(event) {
      if (event.level === 'query') statements.push(event.query.sql);
    },
  });
  countingDatabases.add(countedDb);
  return {
    statements,
    db: countedDb,
  };
}

function sourceDependencies(db: Kysely<DatabaseSchema>): DashboardSourceDependencies {
  const tasks = new ListTasksUseCase(new PostgresTaskRepository(db));
  const receiving = new ListReceivingUseCase(new PostgresReceivingRepository(db));
  const inspections = new ListInspectionsUseCase(new PostgresInspectionRepository(db));
  const calibrations = new ListCalibrationsUseCase(new PostgresCalibrationRepository(db));
  const laboratory = new GetLabWorkloadUseCase(new PostgresLabRepository(db));
  return {
    approvals: { execute: async () => [] },
    notifications: { listOwn: async () => [] },
    receiving: { execute: (input) => receiving.execute(input) },
    inspections: { execute: (input) => inspections.execute(input) },
    tasks: {
      execute: (input) => tasks.execute({ ...input, page: parsePageInput({ pageSize: 25 }) }),
    },
    calibrations: { execute: (input) => calibrations.execute(input) },
    laboratory: { execute: (input) => laboratory.execute(input) },
    documentReview: { execute: async () => ({ total: 0, items: [] }) },
  };
}

function myWorkOver(db: Kysely<DatabaseSchema>) {
  return new GetMyWorkUseCase(
    createMyWorkQuery(dashboardMetricSources(sourceDependencies(db)), read),
  );
}

const read = async (source: Parameters<typeof readMetricSource>[0], actor: ActorContext) => {
  const result = await readMetricSource(source, actor);
  return { value: result.metric.value, rows: result.rows };
};

const groupOf = (model: Awaited<ReturnType<GetMyWorkUseCase['execute']>>, category: string) =>
  model.groups.find((group) => group.definition.category === category)!;

beforeAll(async () => {
  databaseUrl = getTestDatabaseUrl(await startPostgresContainer({ tls: true }));
  pool = createPool({ connectionString: databaseUrl, max: 5 });
  await migrate({ pool });
  db = new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({
      pool: createPool({ connectionString: databaseUrl, max: 5 }),
    }),
  });
  await pool.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
     VALUES ($1, $2, 'My work mine', 'test-only-placeholder'),
            ($3, $4, 'My work other', 'test-only-placeholder')
     ON CONFLICT (id) DO NOTHING`,
    [MINE, `my-work-mine-${RUN}`, OTHER, `my-work-other-${RUN}`],
  );

  const utcStart = utcDayStart(new Date());
  // The UTC day boundary, exactly: midnight belongs to today, one millisecond
  // earlier belongs to overdue, and the next midnight belongs to neither.
  await seedTask('boundary-midnight', MINE, 'OPEN', utcStart);
  await seedTask('boundary-before', MINE, 'OPEN', new Date(utcStart.getTime() - 1));
  await seedTask('boundary-next', MINE, 'OPEN', new Date(utcStart.getTime() + DAY));
  // Volume: more than one register page of open work assigned to this account.
  for (let index = 0; index < 30; index += 1) {
    await seedTask(
      `bulk-${String(index).padStart(2, '0')}`,
      MINE,
      'OPEN',
      new Date(Date.now() + (index + 2) * DAY),
    );
  }
  // A record carried by three assignment rows but held once: current_assignee_id
  // is the register's single holder pointer. It is seeded last so it is on the
  // register's own newest-first page (the page the queue samples) and the
  // single-listing claim is actually observed.
  const duplicated = await seedTask(
    'duplicate-assignment',
    MINE,
    'OPEN',
    new Date(Date.now() + DAY),
  );
  for (let index = 0; index < 3; index += 1) {
    await pool.query(
      `INSERT INTO qc.task_assignments (id, task_id, assignee_id, assigned_by, reason)
       VALUES (gen_random_uuid(), $1, $2, $2, $3)`,
      [duplicated, MINE, `reassignment ${index}`],
    );
  }
  await seedTask('other-open', OTHER, 'OPEN', new Date(Date.now() - 5 * DAY));
  // Held work is dated in the future so the blocked group is not also an
  // overdue case: this suite proves each group's boundary separately.
  await seedTask('mine-held', MINE, 'ON_HOLD', new Date(Date.now() + 5 * DAY));
  await seedTask('other-held', OTHER, 'ON_HOLD', new Date(Date.now() - DAY));

  await seedReceiving('mine-hold', MINE, 'HOLD');
  await seedReceiving('other-hold', OTHER, 'HOLD');
  await seedInspection('mine-returned', MINE, 'RETURNED');
  await seedInspection('other-returned', OTHER, 'RETURNED');
});

afterAll(async () => {
  await Promise.all([...countingDatabases].map((countedDb) => countedDb.destroy()));
  await pool?.query('DELETE FROM qc.task_assignments WHERE assignee_id IN ($1, $2)', [MINE, OTHER]);
  await pool?.query('DELETE FROM qc.tasks WHERE task_no LIKE $1', [`MYW-${RUN}%`]);
  await pool?.query('DELETE FROM qc.inspection_reports WHERE inspection_no LIKE $1', [
    `INSP-MYW-${RUN}%`,
  ]);
  await pool?.query('DELETE FROM qc.receiving_items WHERE receiving_no LIKE $1', [`MYW-${RUN}%`]);
  await pool?.query('DELETE FROM qc.inspection_template_versions WHERE version_no = $1', [
    `MYW-${RUN}-v1`,
  ]);
  await pool?.query('DELETE FROM qc.inspection_templates WHERE template_code = $1', [`MYW-${RUN}`]);
  await pool?.query('DELETE FROM qc.users WHERE id IN ($1, $2)', [MINE, OTHER]);
  await db?.destroy();
  await pool?.end();
  await stopPostgresContainer();
});

describe('My work today parity and scope', () => {
  it('publishes the register total beyond one page and lists only the bounded slice', async () => {
    const model = await myWorkOver(db).execute(FULL_ACTOR);
    const assigned = groupOf(model, 'ASSIGNED');
    // 30 bulk rows + 3 boundary rows + the duplicated-assignment row + the held
    // row (still open). The other account's rows are excluded by the same
    // predicate the link carries.
    const register = await new ListTasksUseCase(new PostgresTaskRepository(db)).execute({
      actor: FULL_ACTOR,
      filter: { assigneeId: MINE, open: true },
      page: parsePageInput({ pageSize: 25 }),
    });
    expect(register.total).toBe(35);
    // The population is beyond one register page, so this is a real bounded
    // read and not a page-length coincidence.
    expect(register.total).toBeGreaterThan(25);

    // The count the group publishes is the register's own total …
    const assignedTaskLink = assigned.registerLinks.find(
      (link) => link.sourceKey === 'tasks-assigned',
    )!;
    expect(assignedTaskLink.count).toBe(register.total);
    // … and the same set is reproduced by walking every register page.
    let seen = 0;
    let total = Number.POSITIVE_INFINITY;
    for (let page = 1; seen < total; page += 1) {
      const result = await new ListTasksUseCase(new PostgresTaskRepository(db)).execute({
        actor: FULL_ACTOR,
        filter: { assigneeId: MINE, open: true },
        page: parsePageInput({ page, pageSize: 25 }),
      });
      total = result.total;
      seen += result.items.length;
      if (!result.items.length) break;
    }
    expect(seen).toBe(register.total);
    // The group's own list is the bounded page, shorter than the population.
    expect(assigned.count).toBeGreaterThan(MY_WORK_ITEM_LIMIT);
    expect(assigned.items).toHaveLength(MY_WORK_ITEM_LIMIT);
    expect(assigned.message).toContain('most urgent');
  });

  it('applies the UTC day boundary to due-today and overdue', async () => {
    const model = await myWorkOver(db).execute(FULL_ACTOR);
    const dueTitles = groupOf(model, 'DUE_TODAY').items.map((item) => item.title);
    const overdueTitles = groupOf(model, 'OVERDUE').items.map((item) => item.title);
    const todayLink = groupOf(model, 'DUE_TODAY').registerLinks.find(
      (link) => link.sourceKey === 'tasks-due-today',
    )!;
    const overdueLink = groupOf(model, 'OVERDUE').registerLinks.find(
      (link) => link.sourceKey === 'tasks-overdue',
    )!;
    // Midnight today is due today; one millisecond before it is overdue; the
    // next midnight is in neither group.
    expect(dueTitles).toContain(`MYW-${RUN}-boundary-midnight`);
    expect(dueTitles).not.toContain(`MYW-${RUN}-boundary-before`);
    expect(dueTitles).not.toContain(`MYW-${RUN}-boundary-next`);
    expect(overdueTitles).toContain(`MYW-${RUN}-boundary-before`);
    expect(overdueTitles).not.toContain(`MYW-${RUN}-boundary-midnight`);
    expect(overdueTitles).not.toContain(`MYW-${RUN}-boundary-next`);
    // The register's own totals agree with the boundary the queue used.
    expect(todayLink.count).toBe(1);
    expect(overdueLink.count).toBe(1);
    const today = await new ListTasksUseCase(new PostgresTaskRepository(db)).execute({
      actor: FULL_ACTOR,
      filter: { assigneeId: MINE, due: 'today' },
      page: parsePageInput({ pageSize: 25 }),
    });
    expect(today.total).toBe(todayLink.count);
  });

  it('lists a record assigned more than once exactly once', async () => {
    const model = await myWorkOver(db).execute(FULL_ACTOR);
    const title = `MYW-${RUN}-duplicate-assignment`;
    const groups = model.groups.filter((group) => group.items.some((item) => item.title === title));
    // Assigned and overdue are different questions, but the record is claimed
    // by one group only; its three assignment rows never multiply it.
    expect(groups).toHaveLength(1);
    const occurrences = model.groups.flatMap((group) =>
      group.items.filter((item) => item.href === `/tasks/${duplicatedTaskId}`),
    );
    expect(occurrences).toHaveLength(1);
  });

  it('returns an identical order on a second read of unchanged data', async () => {
    const first = await myWorkOver(db).execute(FULL_ACTOR);
    const second = await myWorkOver(db).execute(FULL_ACTOR);
    for (const group of first.groups) {
      expect(
        groupOf(second, group.definition.category).items.map((item) => item.key),
        group.definition.category,
      ).toEqual(group.items.map((item) => item.key));
    }
  });

  it('never shows another account’s rows and never turns an unreadable register into zero', async () => {
    const full = await myWorkOver(db).execute(FULL_ACTOR);
    // The other account has identical rows in every personal register; none of
    // them may appear in this queue.
    for (const group of full.groups) {
      for (const item of group.items) {
        expect(item.href, group.definition.category).not.toContain(OTHER);
      }
    }
    // Blocks recorded by the other account are excluded from the personal count.
    const blockedLink = groupOf(full, 'BLOCKED').registerLinks.find(
      (link) => link.sourceKey === 'hold-items',
    )!;
    expect(blockedLink.count).toBe(1);

    // The tasks-only account cannot read the quarantine, inspection or
    // laboratory registers, so every group that depends on them is unreadable
    // and carries no total rather than an understated one.
    const limited = await myWorkOver(db).execute(TASKS_ONLY_ACTOR);
    for (const category of ['BLOCKED', 'ASSIGNED'] as const) {
      const group = groupOf(limited, category);
      expect(group.state, category).toBe('NOT_AUTHORIZED');
      expect(group.count, category).toBeNull();
      expect(group.message, category).toContain('does not have permission to read');
      // Only readable registers are offered as links, so no drill-down here
      // points into a register this account may not read.
      const deniedKeys = group.registerLinks.filter((link) =>
        ['hold-items', 'returned-inspections', 'lab-tests-returned'].includes(link.sourceKey),
      );
      expect(deniedKeys, category).toEqual([]);
    }
    // The groups read from the tasks register alone stay fully answerable.
    expect(groupOf(limited, 'DUE_TODAY').state).toBe('AVAILABLE');
    expect(groupOf(limited, 'DUE_TODAY').count).toBe(1);
    expect(groupOf(limited, 'OVERDUE').state).toBe('AVAILABLE');
    expect(groupOf(limited, 'OVERDUE').count).toBe(1);
  });

  it('keeps a bounded query count and payload as the registers grow', async () => {
    const first = countingDatabase();
    const baselineModel = await myWorkOver(first.db).execute(FULL_ACTOR);
    const baselineStatements = first.statements.length;
    expect(baselineStatements).toBeGreaterThan(0);
    expect(baselineStatements).toBeLessThanOrEqual(STATEMENT_CEILING);
    const payloadBytes = Buffer.byteLength(JSON.stringify(baselineModel), 'utf8');
    expect(payloadBytes).toBeLessThan(PAYLOAD_CEILING);

    // Unrelated growth in every register the queue reads: another account's
    // rows and closed work for this one. Neither may add a query or an item.
    for (let index = 0; index < 8; index += 1) {
      await seedTask(`filler-other-${index}`, OTHER, 'OPEN', new Date(Date.now() - 3 * DAY));
      await seedTask(`filler-closed-${index}`, MINE, 'COMPLETED', new Date(Date.now() - 3 * DAY));
    }
    const second = countingDatabase();
    const grownModel = await myWorkOver(second.db).execute(FULL_ACTOR);
    expect(second.statements.length).toBe(baselineStatements);
    expect(Buffer.byteLength(JSON.stringify(grownModel), 'utf8')).toBeLessThan(PAYLOAD_CEILING);
    expect(
      groupOf(grownModel, 'OVERDUE').registerLinks.find((l) => l.sourceKey === 'tasks-overdue')!
        .count,
    ).toBe(
      groupOf(baselineModel, 'OVERDUE').registerLinks.find((l) => l.sourceKey === 'tasks-overdue')!
        .count,
    );
  });

  it('rejects an account that is not active', async () => {
    await expect(
      myWorkOver(db).execute({ ...FULL_ACTOR, accountState: 'DISABLED' }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('builds the queue from the same read model the workspace renders', async () => {
    // `buildMyWork` is the port used by the use case; this asserts the wiring
    // rather than a second path, so no page-local business SQL can appear.
    const model = await buildMyWork(
      dashboardMetricSources(sourceDependencies(db)),
      FULL_ACTOR,
      read,
      new Date(),
    );
    expect(model.groups.map((group) => group.definition.category)).toEqual([
      'BLOCKED',
      'OVERDUE',
      'DUE_TODAY',
      'ASSIGNED',
    ]);
    expect(model.unresolvedSources.length).toBeGreaterThan(0);
  });
});

/** UTC midnight of a moment, so a due window never depends on the host zone. */
function utcDayStart(moment: Date): Date {
  return new Date(
    Date.UTC(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate(), 0, 0, 0, 0),
  );
}

let duplicatedTaskId = '';

async function seedTask(
  tag: string,
  actorId: string,
  state: 'OPEN' | 'ON_HOLD' | 'COMPLETED',
  dueAt: Date,
): Promise<string> {
  const id = randomUUID();
  await pool!.query(
    `INSERT INTO qc.tasks
       (id, task_no, title, priority, state, due_at, current_assignee_id, completed_at, created_by, updated_by)
     VALUES ($1, $2, 'My work task', 'HIGH', $3, $4, $5, $6, $5, $5)`,
    [id, `MYW-${RUN}-${tag}`, state, dueAt, actorId, state === 'COMPLETED' ? dueAt : null],
  );
  if (tag === 'duplicate-assignment') duplicatedTaskId = id;
  return id;
}

async function seedReceiving(
  tag: string,
  actorId: string,
  inspectionResult: 'HOLD',
): Promise<void> {
  await pool!.query(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, supplier_name, doc_no, item_code, description, lot, qty,
        receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES (gen_random_uuid(), $1, 'My work supplier', $2, $3, 'My work item', $4, 10,
             CURRENT_DATE, $5, $6, FALSE, $7, $7)`,
    [
      `MYW-${RUN}-${tag}`,
      `DOC-${RUN}`,
      `ITEM-${tag}`,
      `LOT-${tag}`,
      inspectionResult,
      inspectionResult,
      actorId,
    ],
  );
}

async function seedInspection(tag: string, authorId: string, state: 'RETURNED'): Promise<void> {
  const receiving = await pool!.query<{ id: string }>(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, supplier_name, doc_no, item_code, description, lot, qty,
        receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES (gen_random_uuid(), $1, 'My work supplier', $2, $3, 'My work item', $4, 10,
             CURRENT_DATE, 'UNDER_INSPECTION', 'NOT_STARTED', FALSE, $5, $5)
     RETURNING id`,
    [`MYW-${RUN}-insp-${tag}`, `DOC-${RUN}`, `ITEM-insp-${tag}`, `LOT-insp-${tag}`, authorId],
  );
  const template = await pool!.query<{ id: string }>(
    `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
     VALUES (gen_random_uuid(), $1, 'My work template', TRUE, $2)
     ON CONFLICT (template_code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [`MYW-${RUN}`, authorId],
  );
  const version = await pool!.query<{ id: string }>(
    `INSERT INTO qc.inspection_template_versions
       (id, template_id, version_no, state, name, created_by)
     VALUES (gen_random_uuid(), $1, $2, 'APPROVED', 'My work template', $3)
     ON CONFLICT (template_id, version_no) DO UPDATE SET state = 'APPROVED'
     RETURNING id`,
    [template.rows[0]!.id, `MYW-${RUN}-v1`, authorId],
  );
  await pool!.query(
    `INSERT INTO qc.inspection_reports
       (id, inspection_no, receiving_item_id, template_version_id, state, final_result,
        author_id, assigned_user_id, created_by, updated_by)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, NULL, $5, $5, $5, $5)`,
    [`INSP-MYW-${RUN}-${tag}`, receiving.rows[0]!.id, version.rows[0]!.id, state, authorId],
  );
}
