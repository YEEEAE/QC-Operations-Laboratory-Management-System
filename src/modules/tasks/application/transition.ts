import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { transitionTask, type TaskAction } from '../domain/state.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { TaskRepository } from '../ports/repository.js';
const permission: Record<TaskAction, 'PERM-TASK-CREATE' | 'PERM-TASK-EDIT' | 'PERM-TASK-BLOCK' | 'PERM-TASK-COMPLETE' | 'PERM-TASK-REOPEN'> = { ACTIVATE: 'PERM-TASK-CREATE', START: 'PERM-TASK-EDIT', HOLD: 'PERM-TASK-BLOCK', RESUME: 'PERM-TASK-EDIT', COMPLETE: 'PERM-TASK-COMPLETE', CANCEL: 'PERM-TASK-EDIT', REOPEN: 'PERM-TASK-REOPEN' };
const actionName: Record<TaskAction, string> = { ACTIVATE: 'ACTIVATE', START: 'START', HOLD: 'HOLD', RESUME: 'RESUME', COMPLETE: 'COMPLETE', CANCEL: 'CANCEL', REOPEN: 'REOPEN' };
export class TransitionTaskUseCase {
  constructor(private readonly repository: TaskRepository, private readonly now = () => new Date()) {}
  async execute(input: { actor: ActorContext; taskId: string; expectedVersion: bigint; action: TaskAction; reason?: string; requestId: string }) {
    const task = await this.repository.get(input.taskId, input.actor);
    if (!task) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (input.action === 'CANCEL') throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorize({ actor: input.actor, permission: permission[input.action], action: actionName[input.action], entity: { type: 'TASK', id: task.id, state: task.state, ownerId: task.createdBy, assigneeId: task.currentAssigneeId }, scope: { ownerId: task.createdBy, assigneeId: task.currentAssigneeId }, currentVersion: task.version, expectedVersion: input.expectedVersion, businessCondition: true }, { throwOnDeny: true });
    transitionTask(task, input.action, this.now(), input.reason);
    return this.repository.transition({ ...input, id: input.taskId });
  }
}
