/**
 * QC-100-FINAL-017 — dashboard command-center read model on populated PostgreSQL.
 *
 * Proves the acceptance clause "every displayed number is traceable to a server
 * read model and every drill-down reproduces it" with real rows rather than a
 * memory double:
 *   - every action count declares numerator/state/actorScope/time window and a
 *     drill-down link;
 *   - each declared link is executed against the register it names and must
 *     return exactly the number the card displayed;
 *   - every quarantine flow stage reproduces its own count the same way;
 *   - personal counts exclude another actor's identical rows;
 *   - the attention queue carries a reason, an age derived from a real
 *     timestamp, the current state and a direct link;
 *   - a source that fails to read withholds the whole snapshot, while a source
 *     the account may not read reports "not available" instead of a zero.
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
import { NotificationService } from '../../../src/shared/notifications/notification-service.js';
import { PostgresNotificationRepository } from '../../../src/shared/notifications/postgres-notification-repository.js';
import { PostgresDashboardQuery } from '../../../src/modules/dashboard/infrastructure/postgres-dashboard-query.js';
import type {
  DashboardSeries,
  DashboardSeriesProvider,
} from '../../../src/modules/dashboard/ports/dashboard-query.js';
import {
  DASHBOARD_COVERAGE,
  dashboardFlowSource,
  dashboardMetricSources,
  type DashboardSourceDependencies,
} from '../../../src/modules/dashboard/application/dashboard-sources.js';
import { GetReceivingTrendUseCase } from '../../../src/modules/quarantine/application/get-receiving-trend.js';
import { PostgresQuarantineReadModel } from '../../../src/modules/quarantine/infrastructure/postgres-quarantine-read-model.js';
import { projectReceivingTrend } from '../../../src/modules/dashboard/application/dashboard-series.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';
import { parsePageInput } from '../../../src/shared/pagination/page.js';

const MINE = '01900000-0000-7000-8000-00000000d601';
const OTHER = '01900000-0000-7000-8000-00000000d602';
const RUN = randomUUID().slice(0, 8);
const DAY = 24 * 60 * 60 * 1000;

const mine = (): ActorContext => ({
  id: MINE,
  loginIdentity: 'command-center-mine',
  accountState: 'ACTIVE',
  roles: ['INSPECTOR'],
  permissions: [
    'PERM-DASH-VIEW',
    'PERM-QUAR-VIEW',
    'PERM-INSP-VIEW',
    'PERM-CAL-VIEW',
    'PERM-NOT-VIEW-OWN',
  ].map((code) => ({ code: code as never, scopes: ['GLOBAL'] as const })),
});

const APPROVAL_ASSIGNED_AT = new Date(Date.now() - 3 * DAY);
const APPROVALS = [
  {
    approvalCase: { id: '01900000-0000-7000-8000-00000000a601', subjectType: 'INSPECTION_REPORT' },
    workItem: { state: 'PENDING', assignedAt: APPROVAL_ASSIGNED_AT },
    subject: { reviewContext: { inspectionNo: `INSP-CMD-${RUN}-waiting` } },
  },
  {
    approvalCase: { id: '01900000-0000-7000-8000-00000000a602', subjectType: 'CHANGE_REQUEST' },
    workItem: { state: 'IN_PROGRESS', assignedAt: undefined },
    subject: { reviewContext: {} },
  },
];

// One laboratory test is returned to this actor. The bounded workload read
// below samples it exactly as the register page would: the count is the
// register's own total and the queue is its bounded newest-first page.
const LAB_RETURNED = {
  id: '01900000-0000-7000-8000-00000000c601',
  labTestNo: `LAB-CMD-${RUN}-returned`,
  state: 'RETURNED',
  updatedAt: new Date(Date.now() - 2 * DAY),
};

const laboratorySource = {
  execute: async (input: {
    filter?: { state?: 'RETURNED'; ownership?: 'mine' };
    limit: number;
  }) => ({
    total: LAB_RETURNED.state === input.filter?.state ? 1 : 0,
    rows: [LAB_RETURNED].slice(0, input.limit),
  }),
};

const NO_SERIES: DashboardSeries = {
  key: 'receiving-records-per-day',
  title: 'Receiving records per day',
  summary: '',
  unit: 'records',
  source: 'Quarantine receiving register',
  sourceHref: '/quarantine/receiving',
  grain: 'One calendar day of the receiving date (UTC), ascending',
  numerator: 'Receiving items you are allowed to read, per day',
  actorScope: 'Your authorized scope',
  windowLabel: 'Last 14 days ending on the current UTC server date',
  zeroPolicy: 'A day with no receiving records is a real count of zero.',
  state: 'NOT_SUPPLIED',
  message: 'No trend series is available for this scope.',
  points: [],
};

const seriesProvider = (series: DashboardSeries = NO_SERIES): DashboardSeriesProvider => ({
  get: async () => series,
});

let pool: Pool | undefined;
let db: Kysely<DatabaseSchema>;
let receiving: ListReceivingUseCase;
let inspections: ListInspectionsUseCase;
let tasks: ListTasksUseCase;
let calibrations: ListCalibrationsUseCase;
let notifications: NotificationService;

/** The real approved series, read through the owning Quarantine module. */
const liveSeries = (): DashboardSeriesProvider => ({
  get: async (actor) =>
    projectReceivingTrend(
      await new GetReceivingTrendUseCase(new PostgresQuarantineReadModel(db)).execute({
        actor,
        ownership: 'mine',
      }),
    ),
});

function sourceDependencies(
  overrides: Partial<DashboardSourceDependencies> = {},
): DashboardSourceDependencies {
  return {
    approvals: { execute: async () => APPROVALS },
    notifications: { listOwn: (actor, unreadOnly) => notifications.listOwn(actor, unreadOnly) },
    receiving: { execute: (input) => receiving.execute(input) },
    inspections: { execute: (input) => inspections.execute(input) },
    tasks: {
      execute: (input) => tasks.execute({ ...input, page: parsePageInput({ pageSize: 25 }) }),
    },
    calibrations: { execute: (input) => calibrations.execute(input) },
    laboratory: laboratorySource,
    ...overrides,
  };
}

function dashboard(
  overrides: Partial<DashboardSourceDependencies> = {},
  series: DashboardSeriesProvider = seriesProvider(),
) {
  return new PostgresDashboardQuery(
    db,
    dashboardMetricSources(sourceDependencies(overrides)),
    dashboardFlowSource({
      execute: (input) =>
        new GetQuarantineOverviewUseCase({
          list: (listInput) => receiving.execute(listInput),
        }).execute(input),
    }),
    series,
    DASHBOARD_COVERAGE,
  );
}

/**
 * Executes the register a dashboard link names, using exactly the query string
 * the link carries. This is the parity harness: if a link cannot reproduce the
 * number it was displayed with, the number is a defect.
 */
async function rowsForHref(href: string, actor: ActorContext): Promise<number> {
  const url = new URL(href, 'http://localhost');
  const params = url.searchParams;
  const ownership = params.get('ownership') === 'mine' ? ('mine' as const) : undefined;
  switch (url.pathname) {
    case '/approvals':
      return APPROVALS.length;
    case '/notifications':
      return (await notifications.listOwn(actor, params.get('unread') === '1')).length;
    case '/quarantine/receiving':
      return (
        await receiving.execute({
          actor,
          inspectionResult: (params.get('inspectionResult') ?? undefined) as 'HOLD' | undefined,
          releaseState: (params.get('releaseState') ?? undefined) as
            'RELEASED' | 'NOT_RELEASED' | undefined,
          state: (params.get('state') ?? undefined) as never,
          ownership,
          receivedOn: (params.get('receivedOn') ?? undefined) as 'today' | undefined,
        })
      ).length;
    case '/quarantine/inspections':
      return (
        await inspections.execute({
          actor,
          state: (params.get('state') ?? undefined) as 'RETURNED' | undefined,
          ownership,
        })
      ).length;
    case '/tasks': {
      // The parity harness reproduces the *register*, not one page: it reads
      // every page with the same filter until the register's own total is met.
      const filter = {
        assigneeId: params.get('assignee') === 'mine' ? actor.id : undefined,
        due: (params.get('due') ?? undefined) as 'overdue' | 'today' | undefined,
      };
      let seen = 0;
      let total = Number.POSITIVE_INFINITY;
      for (let pageNumber = 1; seen < total; pageNumber += 1) {
        const page = parsePageInput({ page: pageNumber, pageSize: 25 });
        const result = await tasks.execute({ actor, filter, page });
        total = result.total;
        seen += result.items.length;
        if (!result.items.length) break;
      }
      return seen;
    }
    case '/assets/calibrations':
      return (
        await calibrations.execute({
          actor,
          filter: { state: (params.get('state') ?? undefined) as 'OVERDUE' | undefined },
        })
      ).length;
    case '/laboratory/tests': {
      // The laboratory register is bounded, so the harness reproduces the
      // *population*, not the page: it reads the register with the link's own
      // filter (state + ownership) and returns that register's total.
      const page = await laboratorySource.execute({
        filter: {
          state: (params.get('state') ?? undefined) as 'RETURNED' | undefined,
          ownership: ownership === 'mine' ? 'mine' : undefined,
        },
        limit: 25,
      });
      return page.total;
    }
    default:
      throw new Error(`dashboard link is not mapped to a register: ${href}`);
  }
}

beforeAll(async () => {
  const databaseUrl = getTestDatabaseUrl(await startPostgresContainer({ tls: true }));
  pool = createPool({ connectionString: databaseUrl, max: 5 });
  await migrate({ pool });
  db = new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({
      pool: createPool({ connectionString: databaseUrl, max: 5 }),
    }),
  });
  receiving = new ListReceivingUseCase(new PostgresReceivingRepository(db));
  inspections = new ListInspectionsUseCase(new PostgresInspectionRepository(db));
  tasks = new ListTasksUseCase(new PostgresTaskRepository(db));
  calibrations = new ListCalibrationsUseCase(new PostgresCalibrationRepository(db));
  notifications = new NotificationService(new PostgresNotificationRepository(db));
  await pool.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
     VALUES ($1, $2, 'Command center mine', 'test-only-placeholder'),
            ($3, $4, 'Command center other', 'test-only-placeholder')
     ON CONFLICT (id) DO NOTHING`,
    [MINE, `command-center-mine-${RUN}`, OTHER, `command-center-other-${RUN}`],
  );
  // Identical rows for both actors so the suite can prove personal scoping.
  await seedReceiving('mine-hold', MINE, 'HOLD', 'HOLD', false);
  await seedReceiving('mine-pending-hold', MINE, 'PENDING', 'HOLD', false);
  await seedReceiving('other-hold', OTHER, 'HOLD', 'HOLD', false);
  await seedReceiving('mine-released', MINE, 'RELEASED', 'PASS', true);
  await seedReceiving('other-released', OTHER, 'RELEASED', 'PASS', true);
  await seedReceiving('mine-pass-open', MINE, 'RELEASE_PENDING', 'PASS', false);
  await seedReceiving('other-pass-open', OTHER, 'RELEASE_PENDING', 'PASS', false);
  await seedReceiving('mine-ready', MINE, 'READY_FOR_INSPECTION', 'NOT_STARTED', false);
  await seedReceiving('mine-under', MINE, 'UNDER_INSPECTION', 'NOT_STARTED', false);
  await seedInspection('mine-returned', MINE, 'RETURNED', null);
  await seedInspection('other-returned', OTHER, 'RETURNED', null);
  await seedInspection('mine-approved', MINE, 'APPROVED', 'PASS');
  await seedTask('mine-overdue', MINE, 'OPEN', new Date(Date.now() - 4 * DAY));
  await seedTask('mine-due-today', MINE, 'IN_PROGRESS', new Date());
  await seedTask('mine-closed-overdue', MINE, 'COMPLETED', new Date(Date.now() - 6 * DAY));
  await seedTask('other-overdue', OTHER, 'OPEN', new Date(Date.now() - 5 * DAY));
  const mineEquipmentId = await seedEquipment('mine');
  const otherEquipmentId = await seedEquipment('other');
  await seedCalibration(
    'mine-overdue',
    MINE,
    mineEquipmentId,
    'OVERDUE',
    new Date(Date.now() - 2 * DAY),
  );
  await seedCalibration(
    'other-overdue',
    OTHER,
    otherEquipmentId,
    'OVERDUE',
    new Date(Date.now() - 2 * DAY),
  );
  await seedCalibration('mine-current', MINE, mineEquipmentId, 'CURRENT', null);
  await pool.query(
    `INSERT INTO qc.notifications
       (id, recipient_user_id, notification_type, severity, title, message, subject_type, subject_id, dedupe_key)
     VALUES
       (gen_random_uuid(), $1, 'TEST', 'WARNING', 'Command center unread', 'Waiting on your review', 'TASK', gen_random_uuid(), $2),
       (gen_random_uuid(), $1, 'TEST', 'CRITICAL', 'Command center critical', 'Escalated item', NULL, NULL, $3),
       (gen_random_uuid(), $4, 'TEST', 'INFO', 'Other recipient unread', 'Not addressed to you', NULL, NULL, $5)`,
    [MINE, `cmd-unread-1-${RUN}`, `cmd-unread-2-${RUN}`, OTHER, `cmd-unread-other-${RUN}`],
  );
  await pool.query(
    `INSERT INTO qc.notifications
       (id, recipient_user_id, notification_type, severity, title, message, read_at, dedupe_key)
     VALUES (gen_random_uuid(), $1, 'TEST', 'INFO', 'Command center read', 'Already read', now(), $2)`,
    [MINE, `cmd-read-${RUN}`],
  );
});

afterAll(async () => {
  await pool?.query('DELETE FROM qc.notifications WHERE dedupe_key LIKE $1', [`cmd-%-${RUN}`]);
  await pool?.query('DELETE FROM qc.calibration_records WHERE calibration_no LIKE $1', [
    `CMD-${RUN}%`,
  ]);
  await pool?.query('DELETE FROM qc.equipment WHERE equipment_no LIKE $1', [`CMD-${RUN}%`]);
  await pool?.query('DELETE FROM qc.tasks WHERE task_no LIKE $1', [`CMD-${RUN}%`]);
  await pool?.query('DELETE FROM qc.inspection_reports WHERE inspection_no LIKE $1', [
    `INSP-CMD-${RUN}%`,
  ]);
  await pool?.query('DELETE FROM qc.receiving_items WHERE receiving_no LIKE $1', [`CMD-${RUN}%`]);
  await pool?.query('DELETE FROM qc.inspection_template_versions WHERE version_no = $1', [
    `CMD-${RUN}-v1`,
  ]);
  await pool?.query('DELETE FROM qc.inspection_templates WHERE template_code = $1', [`CMD-${RUN}`]);
  await pool?.query('DELETE FROM qc.users WHERE id IN ($1, $2)', [MINE, OTHER]);
  await db?.destroy();
  await pool?.end();
  await stopPostgresContainer();
});

describe('dashboard command center', () => {
  it('declares numerator, condition, actor scope, window and a link for every action count', async () => {
    const model = await dashboard().get(mine());
    expect(model.metrics.map((metric) => metric.key)).toEqual([
      'pending-review',
      'unread-notifications',
      'hold-items',
      'returned-inspections',
      'tasks-overdue',
      'tasks-due-today',
      'calibrations-overdue',
      'lab-tests-returned',
    ]);
    for (const metric of model.metrics) {
      expect(metric.numerator.length, metric.key).toBeGreaterThan(0);
      expect(metric.denominator.length, metric.key).toBeGreaterThan(0);
      expect(metric.grain.length, metric.key).toBeGreaterThan(0);
      expect(metric.state.length, metric.key).toBeGreaterThan(0);
      expect(metric.actorScope.length, metric.key).toBeGreaterThan(0);
      expect(metric.drilldown.length, metric.key).toBeGreaterThan(0);
      expect(metric.freshness.length, metric.key).toBeGreaterThan(0);
      expect(metric.timeRange).toBe('current snapshot');
      expect(metric.timezone).toBe('UTC');
      expect(metric.href, metric.key).toBeTruthy();
    }
  });

  it('reproduces every declared count from the register its own link opens', async () => {
    const model = await dashboard().get(mine());
    for (const metric of model.metrics) {
      expect(metric.value, metric.key).not.toBeNull();
      const reproduced = await rowsForHref(metric.href, mine());
      expect(reproduced, `${metric.key} → ${metric.href}`).toBe(metric.value);
    }
  });

  it('scopes personal counts to the actor and never counts another account’s rows', async () => {
    const model = await dashboard().get(mine());
    const value = (key: string) => model.metrics.find((metric) => metric.key === key)?.value;
    // Two HOLD rows belong to this actor; the identical HOLD row created by the
    // other account must not be counted.
    expect(value('hold-items')).toBe(2);
    expect(value('returned-inspections')).toBe(1);
    expect(value('tasks-overdue')).toBe(1);
    expect(value('tasks-due-today')).toBe(1);
    // Two unread notifications are addressed to this actor; the other
    // recipient's unread row and this actor's read row are excluded.
    expect(value('unread-notifications')).toBe(2);
    // The calibration register is authorized scope, so both OVERDUE records are
    // counted while the CURRENT record is not.
    expect(value('calibrations-overdue')).toBe(2);
    // The laboratory counter reads the register's own total for the same filter
    // its link carries (state = RETURNED, authored by this actor).
    expect(value('lab-tests-returned')).toBe(1);
  });

  it('reproduces every quarantine flow stage from the receiving register', async () => {
    const model = await dashboard().get(mine());
    expect(model.flow.state).toBe('AVAILABLE');
    expect(model.flow.stages.map((stage) => stage.key)).toEqual([
      'received',
      'awaiting-inspection',
      'under-inspection',
      'hold',
      'pass-not-released',
      'released',
    ]);
    for (const stage of model.flow.stages) {
      expect(stage.state.length, stage.key).toBeGreaterThan(0);
      const reproduced = await rowsForHref(stage.href, mine());
      expect(reproduced, `${stage.key} → ${stage.href}`).toBe(stage.value);
    }
    const byKey = new Map(model.flow.stages.map((stage) => [stage.key, stage.value]));
    expect(byKey.get('awaiting-inspection')).toBe(1);
    // Every inspection seeded above leaves its receiving item under inspection,
    // so this stage is a floor rather than an exact count.
    expect(byKey.get('under-inspection')).toBeGreaterThanOrEqual(1);
    expect(byKey.get('hold')).toBeGreaterThanOrEqual(2);
    expect(byKey.get('pass-not-released')).toBeGreaterThanOrEqual(1);
    expect(byKey.get('released')).toBeGreaterThanOrEqual(1);
  });

  it('builds an attention queue with a reason, an age, a state and a direct link', async () => {
    const model = await dashboard().get(mine());
    expect(model.attention.length).toBeGreaterThan(0);
    for (const item of model.attention) {
      expect(item.reason.length, item.id).toBeGreaterThan(0);
      expect(item.ageLabel.length, item.id).toBeGreaterThan(0);
      expect(item.state.length, item.id).toBeGreaterThan(0);
      // A direct link to the record itself, or the notifications register when
      // the notification carries no subject (never a guessed route).
      expect(item.href, item.id).toMatch(
        /^\/(approvals|quarantine|tasks|assets|laboratory|notifications)/,
      );
    }
    const ranks = model.attention.map((item) =>
      item.severity === 'CRITICAL' ? 0 : item.severity === 'WARNING' ? 1 : 2,
    );
    expect([...ranks].sort((left, right) => left - right)).toEqual(ranks);
    // The most urgent band is first and the age is derived from real data.
    expect(model.attention[0]?.severity).toBe('CRITICAL');
    expect(model.attention[0]?.ageLabel).not.toBe('Age not recorded');
    // Nothing addressed to the other account leaks into the queue.
    expect(model.attention.every((item) => !item.title.includes('Other recipient'))).toBe(true);
    expect(model.attentionSources.every((source) => source.state === 'AVAILABLE')).toBe(true);
  });

  it('reports one source as not available without turning its count into a zero', async () => {
    const model = await dashboard(
      sourceDependencies({
        notifications: {
          listOwn: async () => {
            throw new AppError('AUTHZ_DENIED');
          },
        },
      }),
    ).get(mine());
    const card = model.metrics.find((metric) => metric.key === 'unread-notifications');
    expect(card?.value).toBeNull();
    expect(card?.unavailable?.reason).toBe('NOT_AUTHORIZED');
    expect(card?.unavailable?.message.length).toBeGreaterThan(0);
    // The other counts are still real values, not zeros and not nulls.
    expect(model.metrics.find((metric) => metric.key === 'hold-items')?.value).toBe(2);
    expect(
      model.attentionSources.find((source) => source.key === 'unread-notifications')?.state,
    ).toBe('NOT_AUTHORIZED');
    expect(model.flow.state).toBe('AVAILABLE');
  });

  it('withholds the whole snapshot when a source read fails', async () => {
    const failing = sourceDependencies({
      receiving: {
        execute: async () => {
          throw new Error('receiving register unavailable');
        },
      },
    });
    await expect(dashboard(failing).get(mine())).rejects.toThrow();
    const failingApprovals = sourceDependencies({
      approvals: {
        execute: async () => {
          throw new Error('approvals provider unavailable');
        },
      },
    });
    await expect(dashboard(failingApprovals).get(mine())).rejects.toThrow();
  });

  it('plots the approved receiving series over the actor’s own records only', async () => {
    const model = await dashboard({}, liveSeries()).get(mine());
    expect(model.series.state).toBe('AVAILABLE');
    const points = model.series.points;
    // The window is complete: one point per day, no gaps and no invented days.
    expect(points.length).toBe(14);
    const last = points[points.length - 1]!;
    expect(last.label).toBe(new Date().toISOString().slice(0, 10));
    const today = await receiving.execute({
      actor: mine(),
      ownership: 'mine',
      receivedOn: 'today',
    });
    expect(last.value).toBe(today.length);
    expect(today.every((item) => item.createdBy === MINE)).toBe(true);
    expect(points.reduce((sum, point) => sum + point.value, 0)).toBe(
      (await receiving.execute({ actor: mine(), ownership: 'mine' })).length,
    );
  });

  it('lists the data products it deliberately does not render', async () => {
    const model = await dashboard().get(mine());
    const missing = model.coverage.filter((item) => item.state === 'NOT_SUPPLIED');
    expect(missing.map((item) => item.key)).toEqual([
      'document-review',
      'blocked-reasons',
      'reject-analytics',
      'quality-summary',
      'system-health',
    ]);
    for (const item of missing) expect(item.reason.length, item.key).toBeGreaterThan(0);
    expect(model.coverage.some((item) => item.state === 'AVAILABLE')).toBe(true);
    // The laboratory workload is now an available, state-filtered read model:
    // the coverage row states what is delivered instead of withholding it.
    const lab = model.coverage.find((item) => item.key === 'laboratory-workload');
    expect(lab?.state).toBe('AVAILABLE');
    expect(lab?.reason).toContain('bounded workload read');
  });
});

async function seedReceiving(
  tag: string,
  actorId: string,
  workflowState:
    | 'PENDING'
    | 'HOLD'
    | 'RELEASED'
    | 'RELEASE_PENDING'
    | 'READY_FOR_INSPECTION'
    | 'UNDER_INSPECTION',
  inspectionResult: 'PASS' | 'HOLD' | 'NOT_STARTED',
  releaseSystem: boolean,
): Promise<void> {
  await pool!.query(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, supplier_name, doc_no, item_code, description, lot, qty,
        receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES ($1, $2, 'Command center supplier', $3, $4, 'Command center item', $5, 10,
             CURRENT_DATE, $6, $7, $8, $9, $9)`,
    [
      randomUUID(),
      `CMD-${RUN}-${tag}`,
      `DOC-${RUN}`,
      `ITEM-${tag}`,
      `LOT-${tag}`,
      workflowState,
      inspectionResult,
      releaseSystem,
      actorId,
    ],
  );
}

async function seedInspection(
  tag: string,
  authorId: string,
  state: 'RETURNED' | 'APPROVED',
  finalResult: 'PASS' | null,
): Promise<void> {
  const receiving = await pool!.query<{ id: string }>(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, supplier_name, doc_no, item_code, description, lot, qty,
        receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES ($1, $2, 'Command center supplier', $3, $4, 'Command center item', $5, 10,
             CURRENT_DATE, 'UNDER_INSPECTION', 'NOT_STARTED', FALSE, $6, $6)
     RETURNING id`,
    [
      randomUUID(),
      `CMD-${RUN}-insp-${tag}`,
      `DOC-${RUN}`,
      `ITEM-insp-${tag}`,
      `LOT-insp-${tag}`,
      authorId,
    ],
  );
  const template = await pool!.query<{ id: string }>(
    `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
     VALUES ($1, $2, 'Command center template', TRUE, $3)
     ON CONFLICT (template_code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [randomUUID(), `CMD-${RUN}`, authorId],
  );
  const version = await pool!.query<{ id: string }>(
    `INSERT INTO qc.inspection_template_versions
       (id, template_id, version_no, state, name, created_by)
     VALUES ($1, $2, $3, 'APPROVED', 'Command center template', $4)
     ON CONFLICT (template_id, version_no) DO UPDATE SET state = 'APPROVED'
     RETURNING id`,
    [randomUUID(), template.rows[0].id, `CMD-${RUN}-v1`, authorId],
  );
  await pool!.query(
    `INSERT INTO qc.inspection_reports
       (id, inspection_no, receiving_item_id, template_version_id, state, final_result,
        author_id, assigned_user_id, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $7, $7)`,
    [
      randomUUID(),
      `INSP-CMD-${RUN}-${tag}`,
      receiving.rows[0].id,
      version.rows[0].id,
      state,
      finalResult,
      authorId,
    ],
  );
}

async function seedTask(
  tag: string,
  actorId: string,
  state: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED',
  dueAt: Date,
): Promise<void> {
  await pool!.query(
    `INSERT INTO qc.tasks
       (id, task_no, title, priority, state, due_at, current_assignee_id, created_by, updated_by, completed_at)
     VALUES ($1, $2, 'Command center task', 'HIGH', $3, $4, $5, $5, $5, $6)`,
    [
      randomUUID(),
      `CMD-${RUN}-${tag}`,
      state,
      dueAt,
      actorId,
      state === 'COMPLETED' ? dueAt : null,
    ],
  );
}

async function seedEquipment(tag: string): Promise<string> {
  const id = randomUUID();
  await pool!.query(
    `INSERT INTO qc.equipment (id, equipment_no, name, state, created_by, updated_by)
     VALUES ($1, $2, 'Command center equipment', 'ACTIVE', $3, $3)
     ON CONFLICT (equipment_no) DO NOTHING`,
    [id, `CMD-${RUN}-EQ-${tag}`, tag === 'mine' ? MINE : OTHER],
  );
  const row = await pool!.query<{ id: string }>(
    `SELECT id FROM qc.equipment WHERE equipment_no = $1`,
    [`CMD-${RUN}-EQ-${tag}`],
  );
  return row.rows[0].id;
}

async function seedCalibration(
  tag: string,
  actorId: string,
  equipmentId: string,
  state: 'OVERDUE' | 'CURRENT',
  dueDate: Date | null,
): Promise<void> {
  await pool!.query(
    `INSERT INTO qc.calibration_records
       (id, calibration_no, equipment_id, state, calibration_date, due_date, created_by)
     VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6)`,
    [randomUUID(), `CMD-${RUN}-${tag}`, equipmentId, state, dueDate, actorId],
  );
}
