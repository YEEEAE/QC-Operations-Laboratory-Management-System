import { getDatabase } from '../../../../shared/database/database.js';
import { PostgresRcaRepository } from '../infrastructure/postgres-repository.js';
import { GetRcaUseCase } from './get-rca.js';
import { ListRcaUseCase } from './list-rca.js';

export function rcaReadDependencies() {
  const repository = new PostgresRcaRepository(getDatabase());
  return {
    get: new GetRcaUseCase(repository),
    list: new ListRcaUseCase(repository),
  };
}
