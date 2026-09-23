import { getDatabase } from '../../../../shared/database/database.js';
import { PostgresNcrRepository } from '../infrastructure/postgres-repository.js';
import { GetNcrUseCase } from './get-ncr.js';
import { ListNcrUseCase } from './list-ncr.js';

export function ncrReadDependencies() {
  const repository = new PostgresNcrRepository(getDatabase());
  return {
    get: new GetNcrUseCase(repository),
    list: new ListNcrUseCase(repository),
  };
}
