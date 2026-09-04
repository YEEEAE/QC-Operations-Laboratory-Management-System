import { describe, expect, it } from 'vitest';
import { SearchService, type SearchRepository } from '../../../src/shared/search/search-service';
import type { SearchQuery, SearchResult } from '../../../src/shared/search/search-result';

class MemorySearch implements SearchRepository {
  last?: SearchQuery;
  async search(query: SearchQuery): Promise<SearchResult[]> {
    this.last = query;
    return [
      {
        entityType: 'TASK',
        entityId: 't1',
        businessId: 'TASK-1',
        descriptor: 'visible',
        state: 'OPEN',
      },
    ];
  }
}

describe('authorized search boundary', () => {
  it('normalizes and bounds q before the repository, without interpolating SQL', async () => {
    const repository = new MemorySearch();
    const service = new SearchService(repository, async (actorId) => {
      if (actorId !== 'u1') throw new Error('unauthorized');
    });
    await expect(
      service.search({ actorId: 'u1', q: '  TASK-1  ', limit: 999 }),
    ).resolves.toHaveLength(1);
    expect(repository.last).toMatchObject({ actorId: 'u1', q: 'TASK-1', limit: 100 });
    await expect(service.search({ actorId: 'u1', q: "' OR 1=1 --" })).resolves.toHaveLength(1);
    expect(repository.last?.q).toBe("' OR 1=1 --");
    await expect(service.search({ actorId: 'u1', q: 'x'.repeat(201) })).rejects.toMatchObject({
      code: 'VALIDATION_INVALID_QUERY',
    });
    await expect(service.search({ actorId: 'u2', q: 'TASK-1' })).rejects.toThrow('unauthorized');
  });
});
