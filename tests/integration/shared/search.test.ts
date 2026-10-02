import { describe, expect, it } from 'vitest';
import { SearchService, type SearchRepository } from '../../../src/shared/search/search-service';
import type { SearchPage, SearchQuery } from '../../../src/shared/search/search-result';
import { searchResultDestination } from '../../../src/shared/search/search-result-destination';
import { searchTypeLabel } from '../../../src/shared/copy/ux-vocabulary';
import type { ProductAnalyticsEvent } from '../../../src/shared/analytics/product-analytics';

const searchPermission = { code: 'PERM-SRCH-USE', scopes: ['GLOBAL'] };

class MemorySearch implements SearchRepository {
  last?: SearchQuery;
  failure?: Error;
  async search(query: SearchQuery): Promise<SearchPage> {
    this.last = query;
    if (this.failure) throw this.failure;
    return {
      items: [
        {
          entityType: 'TASK',
          entityId: 't1',
          businessId: 'TASK-1',
          descriptor: 'visible',
          state: 'OPEN',
        },
      ],
      total: 1,
    };
  }
}

describe('authorized search boundary', () => {
  it('normalizes and bounds q before the repository, without interpolating SQL', async () => {
    const repository = new MemorySearch();
    const analyticsEvents: ProductAnalyticsEvent[] = [];
    const service = new SearchService(
      repository,
      async (actorId) => {
        if (actorId !== 'u1') throw new Error('unauthorized');
      },
      {
        track: async (event) => {
          analyticsEvents.push(event);
        },
      },
    );
    await expect(
      service.search({
        actorId: 'u1',
        q: '  TASK-1  ',
        limit: 25,
        permissions: [searchPermission],
      }),
    ).resolves.toMatchObject({ total: 1, items: [{ businessId: 'TASK-1' }] });
    expect(repository.last).toMatchObject({ actorId: 'u1', q: 'TASK-1', limit: 25 });
    await expect(
      service.search({ actorId: 'u1', q: "' OR 1=1 --", permissions: [searchPermission] }),
    ).resolves.toMatchObject({
      total: 1,
    });
    expect(repository.last?.q).toBe("' OR 1=1 --");
    await expect(service.search({ actorId: 'u1', q: 'x'.repeat(201) })).rejects.toMatchObject({
      code: 'VALIDATION_INVALID_QUERY',
    });
    await expect(service.search({ actorId: 'u1', q: 'term', limit: 26 })).rejects.toMatchObject({
      code: 'VALIDATION_INVALID_QUERY',
    });
    await expect(
      service.search({ actorId: 'u1', q: 'term', cursor: 'not-a-cursor' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_INVALID_QUERY' });
    await expect(
      service.search({ actorId: 'u2', q: 'TASK-1', permissions: [searchPermission] }),
    ).rejects.toThrow('unauthorized');
    await expect(service.search({ actorId: 'u1', q: 'TASK-1' })).rejects.toMatchObject({
      code: 'AUTHZ_PERMISSION_MISSING',
    });
    repository.failure = new Error('search source unavailable');
    await expect(
      service.search({ actorId: 'u1', q: 'TASK-1', permissions: [searchPermission] }),
    ).rejects.toThrow('search source unavailable');
    expect(analyticsEvents.at(-1)).toMatchObject({
      outcome: 'unavailable',
      attributes: { duration_bucket: expect.any(String) },
    });
    expect(JSON.stringify(analyticsEvents)).not.toContain('TASK-1');
  });

  it('uses human-readable labels for every registered search result type', () => {
    expect(searchTypeLabel('TASK')).toBe('Task');
    expect(searchTypeLabel('INSPECTION_REPORT')).toBe('Inspection report');
    expect(searchTypeLabel('RCA')).toBe('RCA');
    expect(searchTypeLabel('UNKNOWN_PRIVATE_ENUM')).toBe('Record');
  });

  it('opens RCA results at their authorized detail route', () => {
    expect(
      searchResultDestination({
        entityType: 'RCA',
        entityId: 'rca-id',
        businessId: 'RCA-001',
        descriptor: 'Root cause analysis',
        state: 'IN_PROGRESS',
      }),
    ).toBe('/quality/rca/rca-id');
  });
});
