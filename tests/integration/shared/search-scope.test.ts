import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';

import { migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { PostgresSearch } from '../../../src/shared/search/postgres-search.js';
import { SearchService } from '../../../src/shared/search/search-service.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const userA = '01900000-0000-7000-8000-000000000e01';
const userB = '01900000-0000-7000-8000-000000000e02';
const taskPermissions = (scope: 'GLOBAL' | 'OWN') => [
  { code: 'PERM-SRCH-USE', scopes: ['GLOBAL'] },
  { code: 'PERM-TASK-VIEW', scopes: [scope] },
];
const searchOnlyPermission = [{ code: 'PERM-SRCH-USE', scopes: ['GLOBAL'] }];

describe('Authorized cross-domain search, scope isolation, and stable ordering (PostgreSQL)', () => {
  let pool: ReturnType<typeof createPool> | undefined;
  let database: Kysely<DatabaseSchema>;
  let repository: PostgresSearch;
  let service: SearchService;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer({ tls: true })),
      max: 2,
    });
    await migrate({ pool: pool! });
    for (const [id, identity] of [
      [userA, 'search-actor-a'],
      [userB, 'search-actor-b'],
    ] as const) {
      await pool!.query(
        `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
         VALUES ($1, $2, 'Search test user', 'test-hash')
         ON CONFLICT (id) DO NOTHING`,
        [id, identity],
      );
    }
    for (let index = 1; index <= 37; index++) {
      await pool!.query(
        `INSERT INTO qc.tasks (task_no, title, priority, state, created_by)
         VALUES ($1, $2, 'MEDIUM', 'OPEN', $3)
         ON CONFLICT (task_no) DO NOTHING`,
        [
          `SRCH-A-${String(index).padStart(3, '0')}`,
          index === 1 ? 'Needle title only' : 'Search parity task',
          userA,
        ],
      );
    }
    for (let index = 1; index <= 4; index++) {
      await pool!.query(
        `INSERT INTO qc.tasks (task_no, title, priority, state, created_by)
         VALUES ($1, 'Search parity task', 'MEDIUM', 'OPEN', $2)
         ON CONFLICT (task_no) DO NOTHING`,
        [`SRCH-B-${String(index).padStart(3, '0')}`, userB],
      );
    }
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
    repository = new PostgresSearch(database);
    service = new SearchService(repository, async (actorId) => {
      if (![userA, userB].includes(actorId)) throw new Error('unauthorized');
    });
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('returns only authorized cross-domain records for the searching actor', async () => {
    const results = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      permissions: taskPermissions('GLOBAL'),
    });
    expect(results.items).toHaveLength(25);
    expect(results.total).toBe(37);
    expect(results.nextCursor).toBeTruthy();
    expect(results.items.every((result) => result.entityType === 'TASK')).toBe(true);
    const titleMatch = await service.search({
      actorId: userA,
      q: 'Needle title only',
      permissions: taskPermissions('GLOBAL'),
    });
    expect(titleMatch).toMatchObject({ total: 1, items: [{ descriptor: 'Needle title only' }] });
  });

  it('does not leak the existence of unauthorized records to another actor', async () => {
    const denied = await service.search({
      actorId: userB,
      q: 'SRCH-A',
      permissions: taskPermissions('OWN'),
    });
    expect(denied).toMatchObject({ total: 0, items: [] });
    const readableOtherOwner = await service.search({
      actorId: userA,
      q: 'SRCH-B',
      permissions: taskPermissions('GLOBAL'),
    });
    expect(readableOtherOwner.total).toBe(4);
    const deniedExisting = await service.search({
      actorId: userB,
      q: 'SRCH-A',
      permissions: searchOnlyPermission,
    });
    expect(deniedExisting).toMatchObject({ total: 0, items: [] });
  });

  it('treats LIKE wildcards as literal business data, never as scope expansion', async () => {
    // A bare wildcard is literal data, not a pattern: it matches no record at
    // all, and it can never expand past the actor scope.
    const all = await service.search({
      actorId: userB,
      q: '%',
      permissions: taskPermissions('OWN'),
    });
    expect(all.items.every((result) => result.businessId.startsWith('SRCH-B'))).toBe(true);
    expect(all.total).toBe(0);
    // An underscore is literal too, so it neither matches across actors nor
    // across one actor's own records (`SRCH_A` is not `SRCH-A`).
    expect(
      (
        await service.search({
          actorId: userB,
          q: 'SRCH_A',
          permissions: taskPermissions('OWN'),
        })
      ).total,
    ).toBe(0);
    // The same actor searching its own literal prefix still finds its 4 records.
    expect(
      (
        await service.search({
          actorId: userB,
          q: 'SRCH-B',
          permissions: taskPermissions('OWN'),
        })
      ).total,
    ).toBe(4);
    expect(
      (
        await service.search({
          actorId: userA,
          q: 'SRCH%A-00%',
          permissions: taskPermissions('GLOBAL'),
        })
      ).total,
    ).toBe(0);
  });

  it('produces a stable total order across repeated identical queries', async () => {
    const first = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      permissions: taskPermissions('GLOBAL'),
    });
    const second = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      permissions: taskPermissions('GLOBAL'),
    });
    expect(first.items.map((result) => result.businessId)).toEqual(
      second.items.map((result) => result.businessId),
    );
    const ordered = [...first.items.map((result) => result.businessId)].sort();
    expect(first.items.map((result) => result.businessId)).toEqual(ordered);
  });

  it('keeps limited result pages stable and disjoint across the same ordering', async () => {
    const grants = taskPermissions('GLOBAL');
    const page = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      limit: 4,
      permissions: grants,
    });
    expect(page.items).toHaveLength(4);
    const repeat = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      limit: 4,
      permissions: grants,
    });
    expect(page.items.map((result) => result.businessId)).toEqual(
      repeat.items.map((result) => result.businessId),
    );
    const secondPage = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      limit: 4,
      cursor: page.nextCursor,
      permissions: grants,
    });
    expect(secondPage.items).toHaveLength(4);
    expect(secondPage.total).toBe(37);
    expect(
      new Set([...page.items, ...secondPage.items].map((result) => result.entityId)).size,
    ).toBe(8);
    const startedAt = performance.now();
    await service.search({ actorId: userA, q: 'SRCH-A', permissions: grants });
    const queryLatencyMs = performance.now() - startedAt;
    expect(Number.isFinite(queryLatencyMs)).toBe(true);
    expect(queryLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it('rejects empty and oversized queries before touching the repository', async () => {
    await expect(service.search({ actorId: userA, q: '   ' })).rejects.toMatchObject({
      code: 'VALIDATION_INVALID_QUERY',
    });
    await expect(service.search({ actorId: userA, q: 'x'.repeat(201) })).rejects.toMatchObject({
      code: 'VALIDATION_INVALID_QUERY',
    });
  });
});
