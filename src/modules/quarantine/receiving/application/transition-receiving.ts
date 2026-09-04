import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ReceivingAction } from '../domain/receiving-state.js';
import { applyReceivingAction } from '../domain/receiving-item.js';
import type { ReceivingRepository } from '../ports/repository.js';

const permissions: Record<ReceivingAction, string> = {
  MARK_READY: 'PERM-QUAR-EDIT', START_INSPECTION: 'PERM-QUAR-START-INSPECTION',
  COMPLETE_INSPECTION: 'PERM-QUAR-EDIT', MOVE_TO_RELEASE_PENDING: 'PERM-QUAR-EDIT',
  RELEASE: 'PERM-QUAR-RELEASE', HOLD: 'PERM-QUAR-HOLD', REMOVE_HOLD: 'PERM-QUAR-HOLD',
  MARK_EXPIRED: 'PERM-QUAR-EDIT', CANCEL: 'PERM-QUAR-EDIT',
};

export interface TransitionReceivingInput { actor: ActorContext; id: string; expectedVersion: bigint; action: ReceivingAction; reason?: string; requestId: string; }

export class TransitionReceivingUseCase {
  constructor(private readonly repo: ReceivingRepository) {}
  async execute(input: TransitionReceivingInput) {
    const item = await this.repo.get(input.id, input.actor);
    if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize({ actor: input.actor, permission: permissions[input.action] as never, action: input.action,
      entity: { type: 'RECEIVING_ITEM', id: item.id, state: item.workflowState, ownerId: item.createdBy },
      scope: { ownerId: item.createdBy }, currentVersion: item.version,
      expectedVersion: input.expectedVersion, businessCondition: true }, { throwOnDeny: true });
    applyReceivingAction(item, input.action, input.reason);
    return this.repo.transition(input);
  }
}
