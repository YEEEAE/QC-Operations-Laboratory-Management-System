import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { PostgresChangeRequestRepository } from '../infrastructure/postgres-repository.js';
import { CreateChangeRequestUseCase } from './create-change-request.js';
import { GetChangeRequestUseCase } from './get-change-request.js';
import { ListChangeRequestsUseCase } from './list-change-requests.js';
import { TransitionChangeRequestUseCase } from './transition-change-request.js';

export function changeRequestsReadDependencies() {
  const repository = new PostgresChangeRequestRepository(getDatabase());
  return { get: new GetChangeRequestUseCase(repository), list: new ListChangeRequestsUseCase(repository) };
}

export function changeRequestsActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresChangeRequestRepository(
    database,
    new PostgresAuditRepository(database),
    new PostgresOutboxRepository(database),
  );
  return {
    create: new CreateChangeRequestUseCase(repository),
    transition: new TransitionChangeRequestUseCase(repository),
  };
}
