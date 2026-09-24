/**
 * QC-100-FINAL-017 — read-model query bounds for the dashboard registers.
 *
 * The dashboard answers from registers that already existed; this suite proves
 * the two things an operational surface cannot afford to regress:
 *   - a register read does not scale its query count with the size of the
 *     table it filters (no per-row loads, no N+1), and
 *   - the whole dashboard snapshot keeps a bounded, constant query count as
 *     unrelated rows accumulate, so opening the dashboard cannot become a
 *     hidden heavy job.
 *
 * Statements are counted by a Kysely logging plugin over the same pool the
 * repositories use, so the numbers are the real SQL the server issues.
 */
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { ListInspectionsUseCase } from '../../../src/modules/quarantine/inspection/application/list-inspections.js';
import { PostgresInspectionRepository } from '../../../src/modules/quarantine/inspection/infrastructure/postgres-repository.js';
import { ListReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/list-receiving.js';
import { PostgresReceivingRepository } from '../../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import { GetQuarantineOverviewUseCase } from '../../../src/modules/quarantine/application/get-quarantine-overview.js';
import { ListCalibrationsUseCase } from '../../../src/modules/assets/calibration/application/list-calibrations.js';
import { PostgresCalibrationRepository } from '../../../src/modules/assets/calibration/infrastructure/postgres-repository.js';
import { ListTasksUseCase } from '../../../src/modules/tasks/application/list.js';
import { PostgresTaskRepository } from '../../../src/modules/tasks/infrastructure/postgres-repository.js';
import { GetLabWorkloadUseCase } from '../../../src/modules/laboratory/application/get-lab-workload.js';
import { PostgresLabRepository } from '../../../src/modules/laboratory/infrastructure/postgres-repository.js';
import { PostgresDashboardQuery } from '../../../src/modules/dashboard/infrastructure/postgres-dashboard-query.js';
import type { DashboardSeriesProvider } from '../../../src/modules/dashboard/ports/dashboard-query.js';
import {
  DASHBOARD_COVERAGE,
  dashboardFlowSource,
  dashboardMetricSources,
} from '../../../src/modules/dashboard/application/dashboard-sources.js';
import { seriesNotSupplied } from '../../../src/modules/dashboard/application/dashboard-series.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';
import { parsePageInput } from '../../../src/shared/pagination/page.js';

const MINE = '01900000-0000-7000-8000-00000000d701';
const OTHER = '01900000-0000-7000-8000-00000000d702';
const RUN = randomUUID().slice(0, 8);
const DAY = 24 * 60 * 60 * 1000;

/** A snapshot ceiling: far above the real count, far below a quadratic blowup. */
const DASHBOARD_STATEMENT_CEILING = 30;

const mine = (): ActorContext => ({
  id: MINE,
  loginIdentity: 'bounds-mine',
  accountState: 'ACTIVE',
  roles: ['INSPECTOR'],
  permissions: ['PERM-DASH-VIEW', 'PERM-QUAR-VIEW', 'PERM-INSP-VIEW', 'PERM-CAL-VIEW'].map(
    (code) => ({ code: code as never, scopes: ['GLOBAL'] as const }),
  ),
});

let pool: Pool | undefined;
let databaseUrl: string;
let db: Kysely<DatabaseSchema>;
const countingDatabases = new Set<Kysely<DatabaseSchema>>();

/** A Kysely instance that records every statement it executes. */
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

const noSeries: DashboardSeriesProvider = {
  get: async () => seriesNotSupplied('PROVIDER_NOT_COMPOSED'),
};

const emptyApprovals = { execute: async () => [] };

function dashboardOver(db: Kysely<DatabaseSchema>) {
  const receiving = new ListReceivingUseCase(new PostgresReceivingRepository(db));
  return new PostgresDashboardQuery(
    db,
    dashboardMetricSources({
      approvals: emptyApprovals,
      notifications: { listOwn: async () => [] },
      receiving: { execute: (input) => receiving.execute(input) },
      inspections: {
        execute: (input) =>
          new ListInspectionsUseCase(new PostgresInspectionRepository(db)).execute(input),
      },
      tasks: {
        execute: (input) =>
          new ListTasksUseCase(new PostgresTaskRepository(db)).execute({
            ...input,
            page: parsePageInput({ pageSize: 25 }),
          }),
      },
      calibrations: {
        execute: (input) =>
          new ListCalibrationsUseCase(new PostgresCalibrationRepository(db)).execute(input),
      },
      // The laboratory counter reads the owning register's bounded workload
      // read, so the snapshot's query count stays constant as the table grows.
      laboratory: {
        execute: (input) => new GetLabWorkloadUseCase(new PostgresLabRepository(db)).execute(input),
      },
      documentReview: { execute: async () => ({ total: 0, items: [] }) },
    }),
    dashboardFlowSource({
      execute: (input) =>
        new GetQuarantineOverviewUseCase({
          list: (listInput) => receiving.execute(listInput),
        }).execute(input),
    }),
    noSeries,
    DASHBOARD_COVERAGE,
  );
}

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
     VALUES ($1, $2, 'Bounds mine', 'test-only-placeholder'),
            ($3, $4, 'Bounds other', 'test-only-placeholder')
     ON CONFLICT (id) DO NOTHING`,
    [MINE, `bounds-mine-${RUN}`, OTHER, `bounds-other-${RUN}`],
  );
  await seedTask('overdue-open', MINE, 'OPEN', new Date(Date.now() - 3 * DAY));
  await seedTask('overdue-closed', MINE, 'COMPLETED', new Date(Date.now() - 3 * DAY));
  await seedTask('overdue-other', OTHER, 'OPEN', new Date(Date.now() - 3 * DAY));
  await seedReceiving('mine-hold', MINE, 'HOLD', 'HOLD');
  await seedReceiving('other-hold', OTHER, 'HOLD', 'HOLD');
  await seedInspection('mine-returned', MINE, 'RETURNED');
  await seedInspection('other-returned', OTHER, 'RETURNED');
});

afterAll(async () => {
  await Promise.all([...countingDatabases].map((countedDb) => countedDb.destroy()));
  await pool?.query('DELETE FROM qc.calibration_records WHERE calibration_no LIKE $1', [
    `BND-${RUN}%`,
  ]);
  await pool?.query('DELETE FROM qc.equipment WHERE equipment_no LIKE $1', [`BND-${RUN}%`]);
  await pool?.query('DELETE FROM qc.tasks WHERE task_no LIKE $1', [`BND-${RUN}%`]);
  await pool?.query('DELETE FROM qc.inspection_reports WHERE inspection_no LIKE $1', [
    `INSP-BND-${RUN}%`,
  ]);
  await pool?.query('DELETE FROM qc.receiving_items WHERE receiving_no LIKE $1', [`BND-${RUN}%`]);
  await pool?.query('DELETE FROM qc.inspection_template_versions WHERE version_no = $1', [
    `BND-${RUN}-v1`,
  ]);
  await pool?.query('DELETE FROM qc.inspection_templates WHERE template_code = $1', [`BND-${RUN}`]);
  await pool?.query('DELETE FROM qc.users WHERE id IN ($1, $2)', [MINE, OTHER]);
  await db?.destroy();
  await pool?.end();
  await stopPostgresContainer();
});

describe('dashboard register query bounds', () => {
  it('answers the due-date filters with the same query count as the table grows', async () => {
    const first = countingDatabase();
    const tasks = new ListTasksUseCase(new PostgresTaskRepository(first.db));
    const overdue = await tasks.execute({
      actor: mine(),
      filter: { assigneeId: MINE, due: 'overdue' },
      page: parsePageInput({ pageSize: 25 }),
    });
    // Only this actor's open overdue task counts: the completed task and the
    // other account's task are excluded by the same predicate the link uses.
    // The count is the register's own total, not the sampled page length.
    expect(overdue.items.map((task) => task.taskNo)).toEqual([`BND-${RUN}-overdue-open`]);
    expect(overdue.total).toBe(1);
    const baseline = first.statements.length;

    for (let index = 0; index < 6; index += 1) {
      await seedTask(`filler-${index}`, MINE, 'COMPLETED', new Date(Date.now() - 2 * DAY));
    }
    const second = countingDatabase();
    const after = await new ListTasksUseCase(new PostgresTaskRepository(second.db)).execute({
      actor: mine(),
      filter: { assigneeId: MINE, due: 'overdue' },
      page: parsePageInput({ pageSize: 25 }),
    });
    expect(after.total).toBe(overdue.total);
    expect(after.items).toHaveLength(overdue.items.length);
    expect(second.statements.length).toBe(baseline);
  });

  it('loads the inspection register at a constant query count as the table grows', async () => {
    const first = countingDatabase();
    const list = new ListInspectionsUseCase(new PostgresInspectionRepository(first.db));
    const returned = await list.execute({ actor: mine(), state: 'RETURNED', ownership: 'mine' });
    expect(returned.map((inspection) => inspection.inspectionNo)).toEqual([
      `INSP-BND-${RUN}-mine-returned`,
    ]);
    const baseline = first.statements.length;
    expect(baseline).toBeLessThanOrEqual(12);

    for (let index = 0; index < 4; index += 1) {
      await seedInspection(`filler-${index}`, MINE, 'APPROVED');
      await seedInspection(`other-filler-${index}`, OTHER, 'APPROVED');
    }
    const second = countingDatabase();
    const after = await new ListInspectionsUseCase(new PostgresInspectionRepository(second.db))
      .execute({ actor: mine(), state: 'RETURNED', ownership: 'mine' })
      .then((rows) => rows.map((inspection) => inspection.inspectionNo));
    expect(after).toEqual([`INSP-BND-${RUN}-mine-returned`]);
    expect(second.statements.length).toBe(baseline);
  });

  it('keeps the whole dashboard snapshot inside a bounded, constant query count', async () => {
    const first = countingDatabase();
    const model = await dashboardOver(first.db).get(mine());
    // QC-100-FINAL-022 added the still-open "assigned to me" counter and the
    // recorded "on hold" counter, so the shared registry grew from 8 to 10.
    expect(model.metrics).toHaveLength(10);
    const baseline = first.statements.length;
    expect(baseline).toBeGreaterThan(0);
    expect(baseline).toBeLessThanOrEqual(DASHBOARD_STATEMENT_CEILING);

    // Unrelated rows in every register the snapshot reads must not add queries.
    await seedReceiving('filler', MINE, 'PENDING', 'NOT_STARTED');
    await seedInspection('filler-late', MINE, 'DRAFT');
    await seedTask('filler-late', MINE, 'OPEN', new Date(Date.now() + DAY));
    const second = countingDatabase();
    await dashboardOver(second.db).get(mine());
    expect(second.statements.length).toBe(baseline);
  });
});

async function seedReceiving(
  tag: string,
  actorId: string,
  workflowState: 'HOLD' | 'PENDING',
  inspectionResult: 'HOLD' | 'NOT_STARTED',
): Promise<void> {
  await pool!.query(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, supplier_name, doc_no, item_code, description, lot, qty,
        receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES ($1, $2, 'Bounds supplier', $3, $4, 'Bounds item', $5, 10,
             CURRENT_DATE, $6, $7, FALSE, $8, $8)`,
    [
      randomUUID(),
      `BND-${RUN}-${tag}`,
      `DOC-${RUN}`,
      `ITEM-${tag}`,
      `LOT-${tag}`,
      workflowState,
      inspectionResult,
      actorId,
    ],
  );
}

async function seedInspection(
  tag: string,
  authorId: string,
  state: 'RETURNED' | 'APPROVED' | 'DRAFT',
): Promise<void> {
  const receiving = await pool!.query<{ id: string }>(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, supplier_name, doc_no, item_code, description, lot, qty,
        receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES ($1, $2, 'Bounds supplier', $3, $4, 'Bounds item', $5, 10,
             CURRENT_DATE, 'UNDER_INSPECTION', 'NOT_STARTED', FALSE, $6, $6)
     RETURNING id`,
    [
      randomUUID(),
      `BND-${RUN}-insp-${tag}`,
      `DOC-${RUN}`,
      `ITEM-insp-${tag}`,
      `LOT-insp-${tag}`,
      authorId,
    ],
  );
  const template = await pool!.query<{ id: string }>(
    `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
     VALUES ($1, $2, 'Bounds template', TRUE, $3)
     ON CONFLICT (template_code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [randomUUID(), `BND-${RUN}`, authorId],
  );
  const version = await pool!.query<{ id: string }>(
    `INSERT INTO qc.inspection_template_versions
       (id, template_id, version_no, state, name, created_by)
     VALUES ($1, $2, $3, 'APPROVED', 'Bounds template', $4)
     ON CONFLICT (template_id, version_no) DO UPDATE SET state = 'APPROVED'
     RETURNING id`,
    [randomUUID(), template.rows[0].id, `BND-${RUN}-v1`, authorId],
  );
  await pool!.query(
    `INSERT INTO qc.inspection_reports
       (id, inspection_no, receiving_item_id, template_version_id, state, final_result,
        author_id, assigned_user_id, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, NULL, $6, $6, $6, $6)`,
    [
      randomUUID(),
      `INSP-BND-${RUN}-${tag}`,
      receiving.rows[0].id,
      version.rows[0].id,
      state,
      authorId,
    ],
  );
}

async function seedTask(
  tag: string,
  actorId: string,
  state: 'OPEN' | 'COMPLETED',
  dueAt: Date,
): Promise<void> {
  await pool!.query(
    `INSERT INTO qc.tasks
       (id, task_no, title, priority, state, due_at, current_assignee_id, created_by, updated_by, completed_at)
     VALUES ($1, $2, 'Bounds task', 'HIGH', $3, $4, $5, $5, $5, $6)`,
    [
      randomUUID(),
      `BND-${RUN}-${tag}`,
      state,
      dueAt,
      actorId,
      state === 'COMPLETED' ? dueAt : null,
    ],
  );
}
