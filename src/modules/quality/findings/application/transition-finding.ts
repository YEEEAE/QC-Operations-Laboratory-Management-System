import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { transitionFinding, type FindingAction } from '../domain/finding.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../../shared/authorization/permissions.js';
import { isP05Authority } from '../../../../shared/authorization/p05-authority.js';
import type { FindingRepository } from '../ports/repository.js';
const p: Record<FindingAction, PermissionCode> = {
  OPEN: 'PERM-FIND-SUBMIT',
  SUBMIT_REVIEW: 'PERM-FIND-REVIEW',
  RETURN: 'PERM-FIND-REVIEW',
  CLOSE: 'PERM-FIND-CLOSE',
  VOID: 'PERM-FIND-VOID',
};
export class TransitionFindingUseCase {
  constructor(
    private repo: FindingRepository,
    private now = () => new Date(),
  ) {}
  async execute(i: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    action: FindingAction;
    reason?: string;
    requestId: string;
  }) {
    const f = await this.repo.get(i.id, i.actor);
    if (!f) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (i.action === 'VOID' && !isP05Authority(i.actor))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorize(
      {
        actor: i.actor,
        permission: p[i.action],
        action: i.action,
        entity: { type: 'FINDING', id: f.id, state: f.state, ownerId: f.ownerId ?? f.createdBy },
        scope: { ownerId: f.ownerId ?? f.createdBy },
        currentVersion: f.version,
        expectedVersion: i.expectedVersion,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    transitionFinding(f, i.action, this.now(), i.reason);
    return this.repo.transition(i);
  }
}
