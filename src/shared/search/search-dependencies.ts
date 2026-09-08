import { getDatabase } from '../database/database.js';
import { PostgresSearch } from './postgres-search.js';
import { SearchService } from './search-service.js';

export function searchDependencies(authorizeAccess: (actorId: string) => Promise<void>) {
  return { search: new SearchService(new PostgresSearch(getDatabase()), authorizeAccess) };
}
