import { getDatabase } from '../../../shared/database/database.js';
import { PostgresTaskRepository } from '../infrastructure/postgres-repository.js';
import { GetTaskUseCase } from './get.js';
import { ListTasksUseCase } from './list.js';
export function taskReadDependencies() {
  const repository = new PostgresTaskRepository(getDatabase());
  return { get: new GetTaskUseCase(repository), list: new ListTasksUseCase(repository) };
}
