import { getDatabase } from '../../../../shared/database/database.js';
import { PostgresFindingRepository } from '../infrastructure/postgres-repository.js';
import { CreateFindingUseCase } from './create-finding.js';
import { GetFindingUseCase } from './get-finding.js';
import { ListFindingsUseCase } from './list-findings.js';
import { TransitionFindingUseCase } from './transition-finding.js';

export function findingsReadDependencies() {
  const repository = new PostgresFindingRepository(getDatabase());
  return {
    get: new GetFindingUseCase(repository),
    list: new ListFindingsUseCase(repository),
  };
}

export function findingsActionDependencies() {
  const repository = new PostgresFindingRepository(getDatabase());
  return {
    create: new CreateFindingUseCase(repository),
    transition: new TransitionFindingUseCase(repository),
  };
}
