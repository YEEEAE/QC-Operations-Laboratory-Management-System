import { AppError } from '../errors/app-error';
import { safeTrack, type ProductAnalyticsTracker } from '../analytics/product-analytics';
import { SEARCHABLE_ENTITY_TYPES, type SearchPage, type SearchQuery } from './search-result';

export interface SearchRepository {
  search(query: SearchQuery): Promise<SearchPage>;
}
export type SearchAuthorizer = (actorId: string) => Promise<void>;
function durationBucket(durationMs: number): string {
  if (durationMs < 50) return 'under-50ms';
  if (durationMs < 200) return '50-199ms';
  if (durationMs < 1000) return '200-999ms';
  return '1000ms-or-more';
}

export class SearchService {
  constructor(
    private readonly repository: SearchRepository,
    private readonly authorizeAccess: SearchAuthorizer,
    private readonly analytics?: ProductAnalyticsTracker,
  ) {}
  async search(query: SearchQuery): Promise<SearchPage> {
    const q = query.q.trim();
    if (
      !q ||
      q.length > 200 ||
      q.includes('\0') ||
      (query.limit !== undefined &&
        (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 25))
    ) {
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
    if (query.cursor) {
      try {
        if (query.cursor.length > 2048) throw new Error('invalid cursor');
        const cursor = JSON.parse(
          Buffer.from(query.cursor, 'base64url').toString('utf8'),
        ) as Record<string, unknown>;
        if (
          cursor.q !== q ||
          typeof cursor.businessId !== 'string' ||
          cursor.businessId.length > 200 ||
          typeof cursor.entityId !== 'string' ||
          cursor.entityId.length > 100 ||
          typeof cursor.entityType !== 'string' ||
          !SEARCHABLE_ENTITY_TYPES.includes(
            cursor.entityType as (typeof SEARCHABLE_ENTITY_TYPES)[number],
          )
        )
          throw new Error('invalid cursor');
      } catch {
        throw new AppError('VALIDATION_INVALID_QUERY');
      }
    }
    if (
      !query.permissions?.some(
        (permission) => permission.code === 'PERM-SRCH-USE' && permission.active !== false,
      )
    )
      throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    await this.authorizeAccess(query.actorId);
    const queryStartedAt = performance.now();
    let page: SearchPage;
    try {
      page = await this.repository.search({
        ...query,
        q,
        limit: Math.min(25, Math.max(1, query.limit ?? 25)),
      });
    } catch (error) {
      await safeTrack(this.analytics, {
        occurredAt: new Date().toISOString(),
        environment: 'production',
        domain: 'search',
        operation: 'search',
        name: 'search.submitted',
        outcome: 'unavailable',
        attributes: {
          search_surface: 'global',
          query_length_bucket: q.length <= 3 ? '0-3' : q.length <= 20 ? '4-20' : '21-200',
          duration_bucket: durationBucket(Math.max(0, performance.now() - queryStartedAt)),
        },
      });
      throw error;
    }
    const measuredDuration = durationBucket(Math.max(0, performance.now() - queryStartedAt));
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
        result_count_bucket: page.total === 0 ? '0' : page.total < 10 ? '1-9' : '10+',
        duration_bucket: measuredDuration,
      },
    });
    if (page.total === 0)
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
    return page;
  }
}
