import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { PostgresTaskRepository } from '../infrastructure/postgres-repository.js';
import { CreateTaskUseCase } from './create.js';
import { GetTaskUseCase } from './get.js';
import { ListTasksUseCase } from './list.js';
import { TransitionTaskUseCase } from './transition.js';
import { UpdateDraftTaskUseCase } from './update-draft.js';
export function taskReadDependencies() {
  const repository = new PostgresTaskRepository(getDatabase());
  return { get: new GetTaskUseCase(repository), list: new ListTasksUseCase(repository) };
}

export function tasksActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresTaskRepository(
    database,
    new PostgresAuditRepository(database),
    new PostgresOutboxRepository(database),
  );
  return {
    create: new CreateTaskUseCase(repository),
    updateDraft: new UpdateDraftTaskUseCase(repository),
    transition: new TransitionTaskUseCase(repository),
  };
}
