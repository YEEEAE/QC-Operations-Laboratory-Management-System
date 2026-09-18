/**
 * QC-100-FINAL-005 — dashboard decision rollup on populated PostgreSQL.
 *
 * Proves the acceptance clause "dashboard values and drill-downs agree" with
 * real rows rather than a memory double:
 *   - every KPI carries an explicit numerator/state/actorScope/time window;
 *   - the personal counters exclude another actor's identical rows;
 *   - each KPI's `href` filter, executed against the same register the link
 *     opens, returns exactly the number the KPI displayed;
 *   - the decision queue is fed by the same rollup (approvals + own HOLD) with
 *     a real severity, and an unavailable approval provider fails closed
 *     instead of rendering a zero.
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
import { PostgresDashboardQuery } from '../../../src/modules/dashboard/infrastructure/postgres-dashboard-query.js';
import type {
  DashboardApprovalItem,
  DashboardApprovalQueue,
} from '../../../src/modules/dashboard/ports/dashboard-query.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const MINE = '01900000-0000-7000-8000-00000000d501';
const OTHER = '01900000-0000-7000-8000-00000000d502';
const RUN = randomUUID().slice(0, 8);

const mine = (): ActorContext => ({
  id: MINE,
  loginIdentity: 'rollup-mine',
  accountState: 'ACTIVE',
  roles: ['INSPECTOR'],
  permissions: [
    { code: 'PERM-DASH-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-QUAR-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-INSP-VIEW', scopes: ['GLOBAL'] },
  ],
});

const APPROVALS: DashboardApprovalItem[] = [
  { id: '01900000-0000-7000-8000-00000000a501', title: 'INSP-ROLLUP-1', state: 'PENDING' },
  { id: '01900000-0000-7000-8000-00000000a502', title: 'DOC-ROLLUP-2', state: 'IN_PROGRESS' },
];

const approvalQueue = (items: DashboardApprovalItem[] = APPROVALS): DashboardApprovalQueue => ({
  list: async () => items,
});

let pool: Pool | undefined;
let db: Kysely<DatabaseSchema>;

/** Reads the register the KPI links to and applies exactly its query string. */
function filtersFromHref(href: string) {
  const params = new URL(href, 'http://localhost').searchParams;
  return {
    state: (params.get('state') ?? params.get('workflowState') ?? undefined) as
      | 'PENDING'
      | 'READY_FOR_INSPECTION'
      | 'UNDER_INSPECTION'
      | 'INSPECTION_COMPLETE'
      | 'RELEASE_PENDING'
      | 'RELEASED'
      | 'HOLD'
      | 'EXPIRED'
      | 'CANCELLED'
      | undefined,
    inspectionResult: (params.get('inspectionResult') ?? undefined) as
      'NOT_STARTED' | 'PASS' | 'FAIL' | 'HOLD' | undefined,
    releaseState: (params.get('releaseState') ?? undefined) as
      'RELEASED' | 'NOT_RELEASED' | undefined,
    finalResult: (params.get('finalResult') ?? undefined) as 'PASS' | 'FAIL' | 'HOLD' | undefined,
    ownership: (params.get('ownership') ?? undefined) as 'mine' | undefined,
  };
}

describe('dashboard decision rollup agrees with its drill-downs', () => {
  beforeAll(async () => {
    const databaseUrl = getTestDatabaseUrl(await startPostgresContainer({ tls: true }));
    pool = createPool({ connectionString: databaseUrl, max: 5 });
    await migrate({ pool });
    db = new Kysely<DatabaseSchema>({
      dialect: new PostgresDialect({
        pool: createPool({ connectionString: databaseUrl, max: 5 }),
      }),
    });
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, $2, 'Rollup mine', 'test-only-placeholder'),
              ($3, $4, 'Rollup other', 'test-only-placeholder')
       ON CONFLICT (id) DO NOTHING`,
      [MINE, `rollup-mine-${RUN}`, OTHER, `rollup-other-${RUN}`],
    );
    // Both actors get identical HOLD / PASS / released rows so the suite can
    // prove the personal actor scope actually filters.
    await seedReceiving('mine-hold', MINE, 'HOLD', 'HOLD', false);
    await seedReceiving('mine-hold-2', MINE, 'PENDING', 'HOLD', false);
    await seedReceiving('other-hold', OTHER, 'HOLD', 'HOLD', false);
    await seedReceiving('mine-released', MINE, 'RELEASED', 'PASS', true);
    await seedReceiving('other-released', OTHER, 'RELEASED', 'PASS', true);
    await seedReceiving('mine-pass-open', MINE, 'RELEASE_PENDING', 'PASS', false);
    await seedReceiving('other-pass-open', OTHER, 'RELEASE_PENDING', 'PASS', false);
    await seedInspection('mine-pass', MINE, 'APPROVED', 'PASS');
    await seedInspection('other-pass', OTHER, 'APPROVED', 'PASS');
    await seedInspection('mine-open', MINE, 'SUBMITTED', null);
  });

  afterAll(async () => {
    await pool?.query('DELETE FROM qc.inspection_reports WHERE inspection_no LIKE $1', [
      `INSP-RLL-${RUN}%`,
    ]);
    await pool?.query('DELETE FROM qc.receiving_items WHERE receiving_no LIKE $1', [`RLL-${RUN}%`]);
    await pool?.query('DELETE FROM qc.inspection_template_versions WHERE version_no = $1', [
      `RLL-${RUN}-v1`,
    ]);
    await pool?.query('DELETE FROM qc.inspection_templates WHERE template_code = $1', [
      `RLL-${RUN}`,
    ]);
    await pool?.query('DELETE FROM qc.users WHERE id IN ($1, $2)', [MINE, OTHER]);
    await db?.destroy();
    await pool?.end();
    await stopPostgresContainer();
  });

  it('defines numerator, state, actor scope and time window for every KPI', async () => {
    const dashboard = await new PostgresDashboardQuery(db, approvalQueue()).get(mine());
    expect(dashboard.metrics.length).toBe(4);
    for (const metric of dashboard.metrics) {
      expect(metric.numerator.length, metric.key).toBeGreaterThan(0);
      expect(metric.state.length, metric.key).toBeGreaterThan(0);
      expect(metric.actorScope.length, metric.key).toBeGreaterThan(0);
      expect(metric.timeRange).toBe('current snapshot');
      expect(metric.href, metric.key).toBeTruthy();
    }
  });

  it('makes the Pending review counter, queue and destination agree', async () => {
    const dashboard = await new PostgresDashboardQuery(db, approvalQueue()).get(mine());
    const pending = dashboard.metrics.find((metric) => metric.key === 'pending-review');
    expect(pending?.value).toBe(APPROVALS.length);
    expect(pending?.href).toBe('/approvals');
    const approvalAttention = dashboard.attention.filter((item) =>
      item.href.startsWith('/approvals/'),
    );
    expect(approvalAttention.map((item) => item.title).sort()).toEqual(
      APPROVALS.map((item) => item.title).sort(),
    );
    expect(approvalAttention.every((item) => item.severity === 'WARNING')).toBe(true);
  });

  it('scopes the personal counters and reproduces them from the linked register', async () => {
    const dashboard = await new PostgresDashboardQuery(db, approvalQueue()).get(mine());
    const list = new ListReceivingUseCase(new PostgresReceivingRepository(db));

    const hold = dashboard.metrics.find((metric) => metric.key === 'hold-items');
    const released = dashboard.metrics.find((metric) => metric.key === 'released-items');
    // Two HOLD rows belong to this actor; the identical third row belongs to
    // another account and must not be counted or listed.
    expect(hold?.value).toBe(2);
    expect(released?.value).toBe(1);

    const holdRows = await list.execute({ actor: mine(), ...filtersFromHref(hold!.href!) });
    const releasedRows = await list.execute({
      actor: mine(),
      ...filtersFromHref(released!.href!),
    });
    expect(holdRows.length).toBe(hold?.value);
    expect(releasedRows.length).toBe(released?.value);
    expect(holdRows.every((row) => row.createdBy === MINE)).toBe(true);
    expect(holdRows.every((row) => row.inspectionResult === 'HOLD')).toBe(true);
    expect(releasedRows.every((row) => row.releaseSystem)).toBe(true);
  });

  it('agrees the PASS counter with the inspections register it links to', async () => {
    const dashboard = await new PostgresDashboardQuery(db, approvalQueue()).get(mine());
    const pass = dashboard.metrics.find((metric) => metric.key === 'pass-inspections');
    expect(pass?.value).toBe(1);
    const rows = await new ListInspectionsUseCase(new PostgresInspectionRepository(db)).execute({
      actor: mine(),
      finalResult: filtersFromHref(pass!.href!).finalResult,
      ownership: filtersFromHref(pass!.href!).ownership,
    });
    expect(rows.length).toBe(pass?.value);
    expect(rows.every((row) => row.authorId === MINE)).toBe(true);
  });

  it('orders the decision queue by real severity with the most urgent first', async () => {
    const dashboard = await new PostgresDashboardQuery(db, approvalQueue()).get(mine());
    expect(dashboard.attention[0]?.severity).toBe('CRITICAL');
    expect(dashboard.attention.some((item) => item.severity === 'WARNING')).toBe(true);
    const ranks = dashboard.attention.map((item) =>
      item.severity === 'CRITICAL' ? 0 : item.severity === 'WARNING' ? 1 : 2,
    );
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    // Nothing from the other actor leaks into the queue.
    expect(dashboard.attention.every((item) => !item.title.includes('other'))).toBe(true);
  });

  it('fails closed when the approval queue is unavailable instead of showing zero', async () => {
    const failing: DashboardApprovalQueue = {
      list: async () => {
        throw new Error('approvals provider unavailable');
      },
    };
    await expect(new PostgresDashboardQuery(db, failing).get(mine())).rejects.toThrow();
  });
});

async function seedReceiving(
  tag: string,
  actorId: string,
  workflowState: 'PENDING' | 'HOLD' | 'RELEASED' | 'RELEASE_PENDING',
  inspectionResult: 'PASS' | 'HOLD',
  releaseSystem: boolean,
): Promise<void> {
  await pool!.query(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, supplier_name, doc_no, item_code, description, lot, qty,
        receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES ($1, $2, 'Rollup supplier', $3, $4, 'Rollup item', $5, 10,
             CURRENT_DATE, $6, $7, $8, $9, $9)`,
    [
      randomUUID(),
      `RLL-${RUN}-${tag}`,
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
  state: 'SUBMITTED' | 'APPROVED',
  finalResult: 'PASS' | null,
): Promise<void> {
  const receiving = await pool!.query<{ id: string }>(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, supplier_name, doc_no, item_code, description, lot, qty,
        receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES ($1, $2, 'Rollup supplier', $3, $4, 'Rollup item', $5, 10,
             CURRENT_DATE, 'UNDER_INSPECTION', 'NOT_STARTED', FALSE, $6, $6)
     RETURNING id`,
    [
      randomUUID(),
      `RLL-${RUN}-insp-${tag}`,
      `DOC-${RUN}`,
      `ITEM-insp-${tag}`,
      `LOT-insp-${tag}`,
      authorId,
    ],
  );
  const template = await pool!.query<{ id: string }>(
    `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
     VALUES ($1, $2, 'Rollup template', TRUE, $3)
     ON CONFLICT (template_code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [randomUUID(), `RLL-${RUN}`, authorId],
  );
  const version = await pool!.query<{ id: string }>(
    `INSERT INTO qc.inspection_template_versions
       (id, template_id, version_no, state, name, created_by)
     VALUES ($1, $2, $3, 'APPROVED', 'Rollup template', $4)
     ON CONFLICT (template_id, version_no) DO UPDATE SET state = 'APPROVED'
     RETURNING id`,
    [randomUUID(), template.rows[0].id, `RLL-${RUN}-v1`, authorId],
  );
  await pool!.query(
    `INSERT INTO qc.inspection_reports
       (id, inspection_no, receiving_item_id, template_version_id, state, final_result,
        author_id, assigned_user_id, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $7, $7)`,
    [
      randomUUID(),
      `INSP-RLL-${RUN}-${tag}`,
      receiving.rows[0].id,
      version.rows[0].id,
      state,
      finalResult,
      authorId,
    ],
  );
}
