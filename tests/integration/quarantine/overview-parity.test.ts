/**
 * QC-100-FINAL-005 follow-up — Quarantine KPI / drill-down / trend parity on
 * populated PostgreSQL.
 *
 * Acceptance clause: "dashboard values and drill-downs agree". The Quarantine
 * overview used to run its own `created_by` counters and link to
 * authorized-scope registers, so a counter and its destination disagreed by
 * construction, and one counter spanned two workflow states behind a single
 * link. This suite executes the real register for every counter's own `href`
 * on the same candidate and requires an exact match.
 */
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import {
  GetQuarantineOverviewUseCase,
  type ReceivingOverviewSource,
} from '../../../src/modules/quarantine/application/get-quarantine-overview.js';
import { GetReceivingTrendUseCase } from '../../../src/modules/quarantine/application/get-receiving-trend.js';
import { ListReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/list-receiving.js';
import { PostgresReceivingRepository } from '../../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import { PostgresQuarantineReadModel } from '../../../src/modules/quarantine/infrastructure/postgres-quarantine-read-model.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const MINE = '01900000-0000-7000-8000-000000000601';
const OTHER = '01900000-0000-7000-8000-000000000602';
const RUN = randomUUID().slice(0, 8);

const actor: ActorContext = {
  id: MINE,
  loginIdentity: 'quar-overview',
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: [{ code: 'PERM-QUAR-VIEW', scopes: ['GLOBAL'] }],
};

let pool: Pool | undefined;
let db: Kysely<DatabaseSchema>;

/** Reads the register a counter links to and applies exactly its query string. */
function filtersFromHref(href: string) {
  const params = new URL(href, 'http://localhost').searchParams;
  return {
    state: (params.get('state') ?? params.get('workflowState') ?? undefined) as never,
    inspectionResult: (params.get('inspectionResult') ?? undefined) as never,
    releaseState: (params.get('releaseState') ?? undefined) as never,
    ownership: (params.get('ownership') ?? undefined) as never,
    receivedOn: (params.get('receivedOn') ?? undefined) as never,
  };
}

/** The production composition: the overview projects the real register. */
function overviewSource(): ReceivingOverviewSource {
  const list = new ListReceivingUseCase(new PostgresReceivingRepository(db));
  return { list: (input) => list.execute(input) };
}

describe('Quarantine counters agree with the registers they link to', () => {
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
       VALUES ($1, $2, 'Quar overview', 'test-only-placeholder'),
              ($3, $4, 'Quar other', 'test-only-placeholder')
       ON CONFLICT (id) DO NOTHING`,
      [MINE, `quar-overview-${RUN}`, OTHER, `quar-other-${RUN}`],
    );
    // Two creators, identical shapes: the counters cover the authorized scope
    // (any creator), so the other account's rows are counted and listed too.
    await seedReceiving('mine-pending', MINE, 'PENDING', 'NOT_STARTED', false);
    await seedReceiving('other-pending', OTHER, 'PENDING', 'NOT_STARTED', false);
    await seedReceiving('mine-ready', MINE, 'READY_FOR_INSPECTION', 'NOT_STARTED', false);
    await seedReceiving('other-ready', OTHER, 'READY_FOR_INSPECTION', 'NOT_STARTED', false);
    await seedReceiving('mine-under', MINE, 'UNDER_INSPECTION', 'NOT_STARTED', false);
    await seedReceiving('mine-receiving-hold', MINE, 'HOLD', 'NOT_STARTED', false);
    await seedReceiving('other-inspection-hold', OTHER, 'READY_FOR_INSPECTION', 'HOLD', false);
    await seedReceiving('mine-pass-open', MINE, 'RELEASE_PENDING', 'PASS', false);
    await seedReceiving('mine-released', MINE, 'RELEASED', 'PASS', true);
    await seedReceiving('other-released', OTHER, 'RELEASED', 'PASS', true);
  });

  afterAll(async () => {
    await pool?.query('DELETE FROM qc.receiving_items WHERE receiving_no LIKE $1', [`QRP-${RUN}%`]);
    await pool?.query('DELETE FROM qc.users WHERE id IN ($1, $2)', [MINE, OTHER]);
    await db?.destroy();
    await pool?.end();
    await stopPostgresContainer();
  });

  it('reproduces every counter exactly from the register its link opens', async () => {
    const overview = await new GetQuarantineOverviewUseCase(overviewSource()).execute({ actor });
    const list = new ListReceivingUseCase(new PostgresReceivingRepository(db));
    expect(overview.metrics.length).toBe(8);
    for (const metric of overview.metrics) {
      const rows = await list.execute({ actor, ...filtersFromHref(metric.href) });
      expect(rows.length, `${metric.key} → ${metric.href}`).toBe(metric.value);
    }
    // Non-zero coverage: the suite would pass vacuously if every counter were 0.
    const nonZero = overview.metrics.filter((metric) => metric.value > 0);
    expect(nonZero.length).toBeGreaterThanOrEqual(5);
    // Every supported filter is exercised by at least one counter, so no
    // counter can silently regress to an inert link.
    const hrefs = overview.metrics.map((metric) => metric.href).join(' ');
    for (const filter of ['state=HOLD', 'inspectionResult=HOLD', 'releaseState=RELEASED']) {
      expect(hrefs, filter).toContain(filter);
    }
  });

  it('counts the authorized scope, not only the actor’s own rows', async () => {
    const overview = await new GetQuarantineOverviewUseCase(overviewSource()).execute({ actor });
    const released = overview.metrics.find((metric) => metric.key === 'released');
    const list = new ListReceivingUseCase(new PostgresReceivingRepository(db));
    const rows = await list.execute({ actor, ...filtersFromHref(released!.href) });
    // Parity holds against the register's own set…
    expect(released?.value).toBe(rows.length);
    // …and the rows seeded for both creators are all inside that set: the old
    // `created_by` counter would have hidden the other account's row.
    const seeded = rows.filter((row) => row.receivingNo.startsWith(`QRP-${RUN}`));
    expect(seeded.length).toBe(2);
    expect(new Set(seeded.map((row) => row.createdBy)).size).toBe(2);
  });

  it('keeps PASS separate from the release system state', async () => {
    const overview = await new GetQuarantineOverviewUseCase(overviewSource()).execute({ actor });
    const passNotReleased = overview.metrics.find((metric) => metric.key === 'pass-not-released');
    const released = overview.metrics.find((metric) => metric.key === 'released');
    expect(passNotReleased?.value).toBe(1);
    expect(released?.value).toBe(2);
    expect(passNotReleased?.state).toContain('release system state = false');
  });

  it('resolves the today-window counter with the register’s own today filter', async () => {
    const overview = await new GetQuarantineOverviewUseCase(overviewSource()).execute({ actor });
    const list = new ListReceivingUseCase(new PostgresReceivingRepository(db));
    const today = overview.metrics.find((metric) => metric.key === 'received-today');
    const rows = await list.execute({ actor, ownership: undefined, receivedOn: 'today' });
    expect(today?.value).toBe(rows.length);
    expect(rows.filter((row) => row.receivingNo.startsWith(`QRP-${RUN}`)).length).toBe(10);
  });

  it('supplies the trend and reconciles it with the register it points at', async () => {
    const trend = await new GetReceivingTrendUseCase(new PostgresQuarantineReadModel(db)).execute({
      actor,
    });
    const list = new ListReceivingUseCase(new PostgresReceivingRepository(db));
    // A complete trailing window: one point per day, no gaps.
    expect(trend.points.length).toBe(14);
    expect(trend.points[trend.points.length - 1]?.date).toBe(new Date().toISOString().slice(0, 10));
    // The last point is today's counter, computed by the register itself.
    const today = await list.execute({ actor, receivedOn: 'today' });
    expect(trend.points[trend.points.length - 1]?.value).toBe(today.length);
    // The whole authorized window accounts for exactly the register rows.
    const authorized = await list.execute({ actor });
    expect(trend.points.reduce((sum, point) => sum + point.value, 0)).toBe(authorized.length);
    // The window never claims more than the register can show.
    expect(trend.points.every((point, index) => trend.points[index - 1]?.date !== point.date)).toBe(
      true,
    );
  });

  it('narrows the trend to the actor’s own records when asked, without leaking another creator', async () => {
    const reader = new PostgresQuarantineReadModel(db);
    const mine = await new GetReceivingTrendUseCase(reader).execute({ actor, ownership: 'mine' });
    const all = await new GetReceivingTrendUseCase(reader).execute({ actor });
    const sum = (points: readonly { value: number }[]) =>
      points.reduce((total, point) => total + point.value, 0);
    const list = new ListReceivingUseCase(new PostgresReceivingRepository(db));
    const own = await list.execute({ actor, ownership: 'mine' });
    expect(sum(mine.points)).toBe(own.length);
    expect(sum(mine.points)).toBeLessThan(sum(all.points));
    expect(mine.actorScope).toContain('Records you created');
    expect(all.actorScope).toContain('authorized scope');
  });
});

async function seedReceiving(
  tag: string,
  createdBy: string,
  workflowState:
    | 'PENDING'
    | 'READY_FOR_INSPECTION'
    | 'UNDER_INSPECTION'
    | 'HOLD'
    | 'RELEASE_PENDING'
    | 'RELEASED',
  inspectionResult: 'NOT_STARTED' | 'PASS' | 'HOLD',
  releaseSystem: boolean,
): Promise<void> {
  await pool!.query(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, supplier_name, doc_no, item_code, description, lot, qty,
        receiving_date, workflow_state, inspection_result, release_system, created_by, updated_by)
     VALUES ($1, $2, 'Quar supplier', $3, $4, 'Quar item', $5, 10,
             CURRENT_DATE, $6, $7, $8, $9, $9)`,
    [
      randomUUID(),
      `QRP-${RUN}-${tag}`,
      `DOC-${RUN}`,
      `ITEM-${tag}`,
      `LOT-${tag}`,
      workflowState,
      inspectionResult,
      releaseSystem,
      createdBy,
    ],
  );
}
