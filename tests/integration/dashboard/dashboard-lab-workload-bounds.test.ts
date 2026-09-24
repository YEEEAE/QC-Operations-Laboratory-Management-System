/**
 * QC-100-FINAL-017 — bounded laboratory workload vs full-population totals.
 *
 * The dashboard contract this suite repairs is the one that made a count and
 * its own drill-down disagree: a bounded register must display its *full*
 * filtered population while its queue samples a bounded page, so a count can
 * never be the length of the page that happened to be loaded.
 *
 * It therefore seeds more than one page of laboratory records and proves:
 *   - the workload read returns the register's own count for the filter and a
 *     bounded newest-first page (count ≠ page length);
 *   - the dashboard counter equals that population, and opening its link
 *     reproduces the same filtered population across more than one page;
 *   - the readable population is scope-dependent and is never a zero for an
 *     account that may not read the register at all;
 *   - a filter with no matches is a real zero, distinct from a denial;
 *   - the read stays at a constant query count as the table grows (no N+1, no
 *     per-row loads);
 *   - a missing timestamp says the age is not recorded instead of inventing one.
 *
 * Every identity and business identifier is generated per run and every count
 * is read through the same owner filter the assertions use, because controlled
 * laboratory history is append-only by database trigger: rows are never deleted
 * (nor can they be), so a shared disposable cluster must not be able to change
 * this run's numbers.
 */
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { GetLabWorkloadUseCase } from '../../../src/modules/laboratory/application/get-lab-workload.js';
import { ListLabTestsUseCase } from '../../../src/modules/laboratory/application/list-lab-tests.js';
import { PostgresLabRepository } from '../../../src/modules/laboratory/infrastructure/postgres-repository.js';
import { PostgresDashboardQuery } from '../../../src/modules/dashboard/infrastructure/postgres-dashboard-query.js';
import {
  dashboardMetricSources,
  type DashboardSourceDependencies,
} from '../../../src/modules/dashboard/application/dashboard-sources.js';
import {
  AGE_NOT_RECORDED,
  attentionAgeLabel,
} from '../../../src/modules/dashboard/application/dashboard-attention.js';
import { quarantineFlowNotAuthorized } from '../../../src/modules/dashboard/application/dashboard-flow.js';
import { seriesNotSupplied } from '../../../src/modules/dashboard/application/dashboard-series.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../../src/config/constants.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

// Per-run identities: identical numbers on a shared disposable cluster, whatever
// an earlier run left behind (controlled history cannot be deleted).
const MINE = randomUUID();
const OTHER = randomUUID();
const RUN = randomUUID().slice(0, 8);
const DAY = 24 * 60 * 60 * 1000;

/** More than one register page of returned laboratory tests. */
const RETURNED_MINE = 30;
const RETURNED_OTHER = 4;

let pool: Pool | undefined;
let databaseUrl: string;
let db: Kysely<DatabaseSchema>;
let list: ListLabTestsUseCase;
let workload: GetLabWorkloadUseCase;
let templateVersionId: string;

function actor(
  id: string,
  scopes: ActorContext['permissions'][number]['scopes'],
  code: 'PERM-LAB-VIEW' = 'PERM-LAB-VIEW',
): ActorContext {
  return {
    id,
    loginIdentity: `lab-bounds-${id.slice(0, 8)}`,
    accountState: 'ACTIVE',
    roles: ['INSPECTOR'],
    permissions: [{ code: code as never, scopes }],
  };
}

const globalMine = () => actor(MINE, ['GLOBAL']);
const ownMine = () => actor(MINE, ['OWN']);
const teamMine = () => actor(MINE, ['TEAM']);
/** An account that may open the dashboard but may not read the laboratory register. */
const noLabPermission = (): ActorContext => ({
  ...actor(MINE, ['GLOBAL']),
  permissions: [{ code: 'PERM-DASH-VIEW' as never, scopes: ['GLOBAL'] }],
});

const repository = (target: Kysely<DatabaseSchema>) => new PostgresLabRepository(target);

/** A Kysely instance that records every statement it executes. */
function countingDatabase(): { db: Kysely<DatabaseSchema>; statements: string[] } {
  const statements: string[] = [];
  return {
    statements,
    db: new Kysely<DatabaseSchema>({
      dialect: new PostgresDialect({ pool: createPool({ connectionString: databaseUrl, max: 3 }) }),
      log(event) {
        if (event.level === 'query') statements.push(event.query.sql);
      },
    }),
  };
}

/** The dashboard, with the laboratory counter reading the real register. */
function dashboard(target: Kysely<DatabaseSchema>) {
  const labRepository = repository(target);
  const empty = { execute: async () => [] as never[] };
  const dependencies: DashboardSourceDependencies = {
    approvals: empty,
    notifications: { listOwn: async () => [] },
    receiving: empty,
    inspections: empty,
    tasks: { execute: async () => ({ items: [], total: 0 }) },
    calibrations: empty,
    laboratory: {
      execute: (input) => new GetLabWorkloadUseCase(labRepository).execute(input),
    },
    documentReview: { execute: async () => ({ total: 0, items: [] }) },
  };
  return new PostgresDashboardQuery(
    target,
    dashboardMetricSources(dependencies),
    { get: async () => quarantineFlowNotAuthorized() },
    { get: async () => seriesNotSupplied('PROVIDER_NOT_COMPOSED') },
    [],
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
  list = new ListLabTestsUseCase(repository(db));
  workload = new GetLabWorkloadUseCase(repository(db));
  await pool.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
     VALUES ($1, $2, 'Lab bounds mine', 'test-only-placeholder'),
            ($3, $4, 'Lab bounds other', 'test-only-placeholder')
     ON CONFLICT (id) DO NOTHING`,
    [MINE, `lab-bounds-mine-${RUN}`, OTHER, `lab-bounds-other-${RUN}`],
  );
  const template = await pool.query<{ id: string }>(
    `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by)
     VALUES ($1, $2, 'Lab bounds template', TRUE, $3)
     ON CONFLICT (test_code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [randomUUID(), `LAB-BND-${RUN}`, MINE],
  );
  const version = await pool.query<{ id: string }>(
    `INSERT INTO qc.lab_test_template_versions (id, template_id, version_no, state, created_by)
     VALUES ($1, $2, $3, 'APPROVED', $4)
     ON CONFLICT (template_id, version_no) DO UPDATE SET state = 'APPROVED'
     RETURNING id`,
    [randomUUID(), template.rows[0]!.id, `LAB-BND-${RUN}-v1`, MINE],
  );
  templateVersionId = version.rows[0]!.id;

  for (let index = 0; index < RETURNED_MINE; index += 1)
    await seedLabTest({
      tag: `returned-mine-${index}`,
      authorId: MINE,
      state: 'RETURNED',
      updatedAt: new Date(Date.now() - (index + 1) * DAY),
    });
  for (let index = 0; index < RETURNED_OTHER; index += 1)
    await seedLabTest({
      tag: `returned-other-${index}`,
      authorId: OTHER,
      state: 'RETURNED',
      updatedAt: new Date(Date.now() - 2 * DAY),
    });
  // Rows in another state, so a state filter is proven to filter.
  await seedLabTest({
    tag: 'draft-mine',
    authorId: MINE,
    state: 'DRAFT',
    updatedAt: new Date(Date.now() - DAY),
  });
});

afterAll(async () => {
  // No row deletion: qc.lab_test_snapshots (and the controlled history behind
  // it) is append-only by database trigger, and its RESTRICT reference keeps the
  // seeded tests in place. The cluster is disposable and every identifier above
  // is per-run, so nothing here can change another run's numbers.
  await db?.destroy();
  await pool?.end();
  await stopPostgresContainer();
});

describe('bounded laboratory workload read', () => {
  it('returns the register’s full filtered population while the page stays bounded', async () => {
    const read = await workload.execute({
      actor: globalMine(),
      filter: { state: 'RETURNED', ownership: 'mine' },
      limit: DEFAULT_PAGE_SIZE,
    });
    // The count is the register's own, well past one page.
    expect(read.total).toBe(RETURNED_MINE);
    expect(read.total).toBeGreaterThan(DEFAULT_PAGE_SIZE);
    // ...while the queue samples a bounded newest-first page.
    expect(read.rows).toHaveLength(DEFAULT_PAGE_SIZE);
    expect(read.rows.length).toBeLessThan(read.total);
    const ages = read.rows.map((row) => row.updatedAt.getTime());
    expect([...ages].sort((left, right) => right - left)).toEqual(ages);
    expect(read.rows.every((row) => row.state === 'RETURNED')).toBe(true);

    // The same read at the hard page ceiling keeps the count identical: the
    // number never follows the caller's page size.
    const wider = await workload.execute({
      actor: globalMine(),
      filter: { state: 'RETURNED', ownership: 'mine' },
      limit: MAX_PAGE_SIZE,
    });
    expect(wider.total).toBe(read.total);
  });

  it('counts the same population the register page lists, across more than one page', async () => {
    const filter = { state: 'RETURNED', ownership: 'mine' } as const;
    const firstPage = await list.execute({
      actor: globalMine(),
      filter,
      limit: DEFAULT_PAGE_SIZE,
    });
    expect(firstPage.items).toHaveLength(DEFAULT_PAGE_SIZE);
    expect(firstPage.total).toBe(RETURNED_MINE);
    // Opening the register wider reproduces the whole filtered population: the
    // count is the register's set, not the length of the displayed page.
    const wholePopulation = await list.execute({
      actor: globalMine(),
      filter,
      limit: MAX_PAGE_SIZE,
    });
    expect(wholePopulation.items).toHaveLength(RETURNED_MINE);
    expect(wholePopulation.items.length).toBeGreaterThan(firstPage.items.length);
    // The bounded page is the newest-first head of that same population, so
    // widening the read adds rows behind the page rather than replacing it.
    expect(wholePopulation.items.slice(0, DEFAULT_PAGE_SIZE).map((test) => test.id)).toEqual(
      firstPage.items.map((test) => test.id),
    );
    expect(wholePopulation.total).toBe(firstPage.total);
    // The state filter really filters: the DRAFT row is in neither read.
    expect(wholePopulation.items.every((test) => test.state === 'RETURNED')).toBe(true);
    const drafts = await list.execute({
      actor: globalMine(),
      filter: { state: 'DRAFT', ownership: 'mine' },
      limit: DEFAULT_PAGE_SIZE,
    });
    expect(drafts.total).toBe(1);
  });

  it('scopes the readable population to the actor and never counts another account’s rows', async () => {
    const returned = { state: 'RETURNED' } as const;
    // An OWN grant reaches only this actor's rows.
    const own = await workload.execute({ actor: ownMine(), filter: returned, limit: 25 });
    expect(own.total).toBe(RETURNED_MINE);
    expect(own.rows.every((row) => row.labTestNo.includes('returned-mine'))).toBe(true);
    // The other author's population is counted only under its own identity, so
    // the two never bleed into one another.
    const other = await workload.execute({
      actor: actor(OTHER, ['GLOBAL']),
      filter: { state: 'RETURNED', ownership: 'mine' },
      limit: 25,
    });
    expect(other.total).toBe(RETURNED_OTHER);
    expect(other.rows.every((row) => row.labTestNo.includes('returned-other'))).toBe(true);
    // A GLOBAL grant reaches both populations: this actor's rows are a strict
    // subset of everything the register authorizes.
    const global = await workload.execute({
      actor: globalMine(),
      filter: { state: 'RETURNED', ownership: 'mine' },
      limit: 25,
    });
    expect(global.total).toBe(own.total);
    // A TEAM grant cannot match a laboratory-test row, so the register hides
    // everything for it rather than silently presenting a zero-workload claim
    // from a population it cannot read.
    const teamPage = await list.execute({ actor: teamMine(), filter: returned, limit: 25 });
    expect(teamPage).toEqual({ items: [], total: 0 });
  });

  it('reports a missing permission as a denial instead of a zero', async () => {
    await expect(
      workload.execute({ actor: noLabPermission(), filter: { state: 'RETURNED' }, limit: 25 }),
    ).rejects.toMatchObject({ category: 'AUTHORIZATION' });
    await expect(
      workload.execute({ actor: teamMine(), filter: { state: 'RETURNED' }, limit: 25 }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SCOPE_DENIED' });
    // A real empty filter is a different fact: it is a confirmed zero, not a
    // denied read.
    const empty = await workload.execute({
      actor: globalMine(),
      filter: { state: 'VOID', ownership: 'mine' },
      limit: 25,
    });
    expect(empty).toEqual({ total: 0, rows: [] });
  });

  it('keeps a constant query count as the register grows (no per-row loads)', async () => {
    const first = countingDatabase();
    await new GetLabWorkloadUseCase(repository(first.db)).execute({
      actor: globalMine(),
      filter: { state: 'RETURNED', ownership: 'mine' },
      limit: DEFAULT_PAGE_SIZE,
    });
    const baseline = first.statements.length;
    await first.db.destroy();
    const baselinePage = countingDatabase();
    const baselinePageRead = await new ListLabTestsUseCase(repository(baselinePage.db)).execute({
      actor: globalMine(),
      filter: { state: 'RETURNED', ownership: 'mine' },
      limit: DEFAULT_PAGE_SIZE,
    });
    expect(baselinePageRead.items.length).toBeGreaterThan(1);
    const pageQueryBaseline = baselinePage.statements.length;
    await baselinePage.db.destroy();
    // A bounded workload read is a count plus one page, never one query per row.
    expect(baseline).toBeLessThanOrEqual(4);
    for (let index = 0; index < 12; index += 1)
      await seedLabTest({
        tag: `later-${index}`,
        authorId: MINE,
        state: 'RETURNED',
        updatedAt: new Date(Date.now() - DAY),
      });
    const second = countingDatabase();
    const after = await new GetLabWorkloadUseCase(repository(second.db)).execute({
      actor: globalMine(),
      filter: { state: 'RETURNED', ownership: 'mine' },
      limit: DEFAULT_PAGE_SIZE,
    });
    expect(after.total).toBe(RETURNED_MINE + 12);
    expect(second.statements.length).toBe(baseline);
    await second.db.destroy();

    // The register page hydrates a bounded page in a constant number of reads:
    // batched statements, not one `get()` per listed test.
    const page = countingDatabase();
    const pageRead = await new ListLabTestsUseCase(repository(page.db)).execute({
      actor: globalMine(),
      filter: { state: 'RETURNED', ownership: 'mine' },
      limit: DEFAULT_PAGE_SIZE,
    });
    expect(pageRead.items.length).toBeGreaterThan(1);
    expect(page.statements.length).toBe(pageQueryBaseline);
    await page.db.destroy();
  });

  it('feeds the dashboard counter the register’s population, not its page length', async () => {
    const model = await dashboard(db).get(globalMine());
    const card = model.metrics.find((metric) => metric.key === 'lab-tests-returned');
    expect(card?.value).toBe(RETURNED_MINE + 12);
    // The link carries exactly the predicate the count used.
    expect(card?.href).toBe('/laboratory/tests?state=RETURNED&ownership=mine');
    expect(card?.state).toBe('workflow state = RETURNED');
    expect(card?.actorScope).toBe('Authored by you');
    expect(card?.denominator).toBe('Every laboratory test you authored');
    expect(card?.grain).toBe('One laboratory test');
    expect(card?.timezone).toBe('UTC');

    // Opening the KPI reproduces the same filtered population, and that
    // population is larger than the page the register renders (the defect this
    // contract exists to prevent).
    const filter = { state: 'RETURNED', ownership: 'mine' } as const;
    const kpiPopulation = await workload.execute({
      actor: globalMine(),
      filter,
      limit: DEFAULT_PAGE_SIZE,
    });
    expect(kpiPopulation.total).toBe(card?.value);
    const registerPage = await list.execute({
      actor: globalMine(),
      filter,
      limit: DEFAULT_PAGE_SIZE,
    });
    expect(registerPage.total).toBe(card?.value);
    expect(registerPage.items.length).toBeLessThan(registerPage.total);

    // The queue carries the reason, the state, an age from a real timestamp and
    // a direct link to the record.
    const labItems = model.attention.filter((item) => item.href.startsWith('/laboratory/tests/'));
    expect(labItems.length).toBeGreaterThan(0);
    expect(labItems[0]?.reason).toBe('Laboratory test was returned to you for rework');
    expect(labItems[0]?.state).toBe('RETURNED');
    expect(labItems[0]?.ageLabel).toMatch(/^Waiting \d+ days?$|^Waiting since today$/);
  });

  it('reports an unavailable counter (never a zero) when the register may not be read', async () => {
    const model = await dashboard(db).get(noLabPermission());
    const card = model.metrics.find((metric) => metric.key === 'lab-tests-returned');
    expect(card?.value).toBeNull();
    expect(card?.unavailable?.reason).toBe('NOT_AUTHORIZED');
    expect(
      model.attentionSources.find((source) => source.key === 'lab-tests-returned')?.state,
    ).toBe('NOT_AUTHORIZED');
    // The readable counters are unaffected and stay real values.
    expect(model.metrics.find((metric) => metric.key === 'tasks-overdue')?.value).toBe(0);
  });

  it('says the age is unknown when the record carries no timestamp', () => {
    expect(
      attentionAgeLabel(
        { id: 'x', title: 'y', state: 'RETURNED', href: '/z', anchor: 'waiting' },
        new Date(),
      ),
    ).toBe(AGE_NOT_RECORDED);
  });
});

// The suite must fail loudly rather than silently pass if a denial ever becomes
// a zero again.
describe('laboratory denial is never a zero', () => {
  it('keeps AppError denials distinguishable from an empty read', () => {
    const denied = new AppError('AUTHZ_SCOPE_DENIED');
    expect(denied.category).toBe('AUTHORIZATION');
  });
});

async function seedLabTest(input: {
  tag: string;
  authorId: string;
  state: 'RETURNED' | 'DRAFT';
  updatedAt: Date;
}): Promise<void> {
  const id = randomUUID();
  const labTestNo = `LAB-BND-${RUN}-${input.tag}`;
  await pool!.query(
    `INSERT INTO qc.lab_tests
       (id, lab_test_no, template_version_id, state, scientific_result, author_id,
        created_by, updated_by, updated_at, version)
     VALUES ($1, $2, $3, $4, NULL, $5, $5, $5, $6, 1)`,
    [id, labTestNo, templateVersionId, input.state, input.authorId, input.updatedAt],
  );
  // The register hydrates each listed test from its controlled snapshot, so a
  // seeded record carries one. The workload read (the dashboard's bounded
  // source) never touches it, which is why it stays a two-statement read.
  await pool!.query(
    `INSERT INTO qc.lab_test_snapshots
       (id, lab_test_id, snapshot_version, snapshot_stage, template_snapshot, snapshot_hash)
     VALUES ($1, $2, 1, 'SAVE', $3::jsonb, $4)`,
    [
      randomUUID(),
      id,
      JSON.stringify({
        test: {
          id,
          labTestNo,
          state: input.state,
          authorId: input.authorId,
          createdBy: input.authorId,
          version: 1,
          originalTestId: null,
          retestSequence: 0,
          retestReason: null,
          createdAt: input.updatedAt.toISOString(),
          updatedAt: input.updatedAt.toISOString(),
        },
        context: { templateVersionId, versionNo: 'v1', methodReference: 'LAB-BND-METHOD' },
      }),
      `LAB-BND-${RUN}-${input.tag}-hash`,
    ],
  );
}
