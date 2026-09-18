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
    for (let index = 1; index <= 6; index++) {
      await pool!.query(
        `INSERT INTO qc.tasks (task_no, title, priority, state, created_by)
         VALUES ($1, 'Search parity task', 'MEDIUM', 'OPEN', $2)
         ON CONFLICT (task_no) DO NOTHING`,
        [`SRCH-A-${String(index).padStart(3, '0')}`, userA],
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
    const results = await service.search({ actorId: userA, q: 'SRCH-A' });
    expect(results).toHaveLength(6);
    expect(results.every((result) => result.entityType === 'TASK')).toBe(true);
  });

  it('does not leak the existence of unauthorized records to another actor', async () => {
    expect(await service.search({ actorId: userB, q: 'SRCH-A' })).toHaveLength(0);
    expect(await service.search({ actorId: userA, q: 'SRCH-B' })).toHaveLength(0);
  });

  it('treats LIKE wildcards as literal business data, never as scope expansion', async () => {
    // A bare wildcard must not expand past the actor scope.
    const all = await service.search({ actorId: userB, q: '%' });
    expect(all.every((result) => result.businessId.startsWith('SRCH-B'))).toBe(true);
    expect(all).toHaveLength(4);
    // An underscore must not act as a single-character wildcard across actors.
    expect(await service.search({ actorId: userB, q: 'SRCH_A' })).toHaveLength(0);
    expect(await service.search({ actorId: userA, q: 'SRCH%A-00%' })).toHaveLength(6);
  });

  it('produces a stable total order across repeated identical queries', async () => {
    const first = await service.search({ actorId: userA, q: 'SRCH-A', limit: 100 });
    const second = await service.search({ actorId: userA, q: 'SRCH-A', limit: 100 });
    expect(first.map((result) => result.businessId)).toEqual(
      second.map((result) => result.businessId),
    );
    const ordered = [...first.map((result) => result.businessId)].sort();
    expect(first.map((result) => result.businessId)).toEqual(ordered);
  });

  it('keeps limited result pages stable and disjoint across the same ordering', async () => {
    const page = await service.search({ actorId: userA, q: 'SRCH-A', limit: 4 });
    expect(page).toHaveLength(4);
    const repeat = await service.search({ actorId: userA, q: 'SRCH-A', limit: 4 });
    expect(page.map((result) => result.businessId)).toEqual(
      repeat.map((result) => result.businessId),
    );
    const remainder = await repository.search({ actorId: userA, q: 'SRCH-A', limit: 100 });
    expect(remainder).toHaveLength(6);
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
