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

import { ncrReadDependencies } from '../../ncr/application/dependencies.js';
import { CreateRcaUseCase } from './create-rca.js';
import { UpdateRcaUseCase } from './update-rca.js';
import { TransitionRcaUseCase } from './transition-rca.js';
export function rcaActionDependencies() {
  const repository = new PostgresRcaRepository(getDatabase());
  return {
    create: new CreateRcaUseCase(repository, {
      get: (input) => ncrReadDependencies().get.execute(input),
    }),
    update: new UpdateRcaUseCase(repository),
    transition: new TransitionRcaUseCase(repository),
  };
}
