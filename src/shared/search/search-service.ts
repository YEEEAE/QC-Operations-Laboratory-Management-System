import { AppError } from '../errors/app-error';
import { safeTrack, type ProductAnalyticsTracker } from '../analytics/product-analytics';
import type { SearchQuery, SearchResult } from './search-result';

export interface SearchRepository {
  search(query: SearchQuery): Promise<SearchResult[]>;
}
export type SearchAuthorizer = (actorId: string) => Promise<void>;
export class SearchService {
  constructor(
    private readonly repository: SearchRepository,
    private readonly authorizeAccess: SearchAuthorizer,
    private readonly analytics?: ProductAnalyticsTracker,
  ) {}
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const q = query.q.trim();
    if (!q || q.length > 200 || q.includes('\0')) {
      await safeTrack(this.analytics, {
        name: 'form.validation_failed',
        occurredAt: new Date().toISOString(),
        environment: 'production',
        domain: 'search',
        operation: 'search',
        outcome: 'failed',
        attributes: {
          form_key: 'global-search',
          field_group: 'query',
          error_family: 'invalid_query',
        },
      });
      throw new AppError('VALIDATION_INVALID_QUERY');
    }
    await this.authorizeAccess(query.actorId);
    const results = await this.repository.search({
      ...query,
      q,
      limit: Math.min(100, Math.max(1, query.limit ?? 25)),
    });
    const common = {
      occurredAt: new Date().toISOString(),
      environment: 'production' as const,
      domain: 'search',
      operation: 'search',
    };
    await safeTrack(this.analytics, {
      ...common,
      name: 'search.submitted',
      outcome: 'completed',
      attributes: {
        search_surface: 'global',
        query_length_bucket: q.length <= 3 ? '0-3' : q.length <= 20 ? '4-20' : '21-200',
        result_count_bucket: results.length === 0 ? '0' : results.length < 10 ? '1-9' : '10+',
        resolution: results.length === 0 ? 'unresolved' : 'results_available',
      },
    });
    if (results.length === 0)
      await safeTrack(this.analytics, {
        ...common,
        name: 'search.zero_result',
        outcome: 'completed',
        attributes: {
          search_surface: 'global',
          query_length_bucket: q.length <= 3 ? '0-3' : q.length <= 20 ? '4-20' : '21-200',
          result_count_bucket: '0',
          suggestion_shown: false,
          suggestion_used: false,
        },
      });
    return results;
  }
}
