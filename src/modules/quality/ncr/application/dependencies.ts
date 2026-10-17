import { getDatabase } from '../../../../shared/database/database.js';
import { PostgresNcrRepository } from '../infrastructure/postgres-repository.js';
import { GetNcrUseCase } from './get-ncr.js';
import { ListNcrUseCase } from './list-ncr.js';
import { CreateNcrUseCase } from './create-ncr.js';

export function ncrActionDependencies(database = getDatabase()) {
  return { create: new CreateNcrUseCase(new PostgresNcrRepository(database)) };
}

export function ncrReadDependencies(database = getDatabase(), lockForShare = false) {
  const repository = new PostgresNcrRepository(database, lockForShare);
  return {
    get: new GetNcrUseCase(repository),
    list: new ListNcrUseCase(repository),
  };
}
