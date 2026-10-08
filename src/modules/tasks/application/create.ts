import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { taskOccurrence } from './occurrence.js';
import type { TaskRecordSource } from './ports/record-source.js';
import type { TaskRecordReference } from '../domain/model.js';
import { createDraftTask } from '../domain/model.js';
import type { TaskRepository } from '../ports/repository.js';

export class CreateTaskUseCase {
  constructor(
    private readonly repository: TaskRepository,
    private readonly now = () => new Date(),
    private readonly recordSource?: TaskRecordSource,
  ) {}
  async execute(input: {
    specializedRecord?: TaskRecordReference;
    recurrenceRuleId?: string;
    occurrenceKey?: string;
    actor: ActorContext;
    taskNo: string;
    title: string;
    description?: string;
    priority: string;
    dueAt?: Date;
    currentAssigneeId?: string;
    requestId: string;
  }) {
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-TASK-CREATE',
        action: 'CREATE',
        entity: {
          type: 'TASK',
          id: 'new',
          state: 'DRAFT',
          ownerId: input.actor.id,
          assigneeId: input.currentAssigneeId,
        },
        scope: { ownerId: input.actor.id, assigneeId: input.currentAssigneeId },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    if (input.currentAssigneeId)
      authorize(
        {
          actor: input.actor,
          permission: 'PERM-TASK-ASSIGN',
          action: 'ASSIGN',
          entity: {
            type: 'TASK',
            id: 'new',
            state: 'DRAFT',
            ownerId: input.actor.id,
            assigneeId: input.currentAssigneeId,
          },
          scope: { ownerId: input.actor.id, assigneeId: input.currentAssigneeId },
          currentVersion: 1n,
          expectedVersion: 1n,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
    if (input.specializedRecord) {
      if (!this.recordSource) throw new AppError('AUTHZ_DENIED', { userSafe: true });
      await this.recordSource.assertVisible({
        actor: input.actor,
        reference: input.specializedRecord,
      });
    }
    const recurrence = taskOccurrence({
      ...input,
      ruleId: input.recurrenceRuleId,
      ownerId: input.actor.id,
    });
    const task = createDraftTask({
      recurrence,
      ...input,
      id: uuidv7(),
      createdBy: input.actor.id,
      now: this.now(),
    });
    return this.repository.create({ task, actor: input.actor, requestId: input.requestId });
  }
}
