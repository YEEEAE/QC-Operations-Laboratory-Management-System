import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { createDraftTask } from '../domain/model.js';
import type { TaskRepository } from '../ports/repository.js';

export class CreateTaskUseCase {
  constructor(private readonly repository: TaskRepository, private readonly now = () => new Date()) {}
  execute(input: { actor: ActorContext; taskNo: string; title: string; description?: string; priority: string; dueAt?: Date; currentAssigneeId?: string; requestId: string }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorize({ actor: input.actor, permission: 'PERM-TASK-CREATE', action: 'CREATE', entity: { type: 'TASK', id: 'new', state: 'DRAFT', ownerId: input.actor.id, assigneeId: input.currentAssigneeId }, scope: { ownerId: input.actor.id, assigneeId: input.currentAssigneeId }, currentVersion: 1n, expectedVersion: 1n, businessCondition: true }, { throwOnDeny: true });
    if (input.currentAssigneeId) authorize({ actor: input.actor, permission: 'PERM-TASK-ASSIGN', action: 'ASSIGN', entity: { type: 'TASK', id: 'new', state: 'DRAFT', ownerId: input.actor.id, assigneeId: input.currentAssigneeId }, scope: { ownerId: input.actor.id, assigneeId: input.currentAssigneeId }, currentVersion: 1n, expectedVersion: 1n, businessCondition: true }, { throwOnDeny: true });
    const task = createDraftTask({ ...input, id: uuidv7(), createdBy: input.actor.id, now: this.now() });
    return this.repository.create({ task, actor: input.actor, requestId: input.requestId });
  }
}
