import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ReceivingItem } from '../domain/receiving-item.js';
import type { ReceivingRepository } from '../ports/repository.js';
import { isP05Authority } from '../../../../shared/authorization/p05-authority.js';

export interface ReleasePolicy {
  canRelease(input: { item: ReceivingItem; actor: ActorContext }): boolean | Promise<boolean>;
}
const p05ReleasePolicy: ReleasePolicy = { canRelease: () => true };

export class ReleaseReceivingUseCase {
  constructor(
    private readonly repository: ReceivingRepository,
    private readonly policy: ReleasePolicy = p05ReleasePolicy,
  ) {}
  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    requestId: string;
  }) {
    const item = await this.repository.get(input.id, input.actor);
    if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isP05Authority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const policyApproved = await this.policy.canRelease({ item, actor: input.actor });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-QUAR-RELEASE',
        action: 'RELEASE',
        entity: {
          type: 'RECEIVING_ITEM',
          id: item.id,
          state: item.workflowState,
          ownerId: item.createdBy,
        },
        scope: { ownerId: item.createdBy },
        currentVersion: item.version,
        expectedVersion: input.expectedVersion,
        businessCondition:
          item.workflowState === 'RELEASE_PENDING' &&
          item.inspectionResult === 'PASS' &&
          !item.releaseSystem &&
          policyApproved,
      },
      { throwOnDeny: true },
    );
    return this.repository.transition({
      id: item.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'RELEASE',
      requestId: input.requestId,
    });
  }
}
