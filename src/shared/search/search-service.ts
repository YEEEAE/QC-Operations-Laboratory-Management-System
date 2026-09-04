import { AppError } from '../errors/app-error';
import type { SearchQuery, SearchResult } from './search-result';

export interface SearchRepository {
  search(query: SearchQuery): Promise<SearchResult[]>;
}
export type SearchAuthorizer = (actorId: string) => Promise<void>;
export class SearchService {
  constructor(
    private readonly repository: SearchRepository,
    private readonly authorizeAccess: SearchAuthorizer,
  ) {}
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const q = query.q.trim();
    if (!q || q.length > 200 || q.includes('\0')) throw new AppError('VALIDATION_INVALID_QUERY');
    await this.authorizeAccess(query.actorId);
    return this.repository.search({
      ...query,
      q,
      limit: Math.min(100, Math.max(1, query.limit ?? 25)),
    });
  }
}
