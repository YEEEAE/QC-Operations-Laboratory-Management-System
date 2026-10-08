import { AppError } from '../../../../shared/errors/app-error.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { transitionRca, type RcaAction } from '../domain/rca.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../../shared/authorization/permissions.js';
import type { RcaRepository } from '../ports/repository.js';
const p: Record<RcaAction, PermissionCode> = {
  START: 'PERM-RCA-EDIT',
  SUBMIT: 'PERM-RCA-SUBMIT',
  RETURN: 'PERM-RCA-REVIEW',
  APPROVE: 'PERM-RCA-APPROVE',
  VOID: 'PERM-RCA-EDIT',
};
export class TransitionRcaUseCase {
  constructor(
    private repo: RcaRepository,
    private now = () => new Date(),
  ) {}
  async execute(i: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    action: RcaAction;
    reason?: string;
    requestId: string;
  }) {
    if (!['START', 'SUBMIT'].includes(i.action))
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        messageKey: 'errors.policy_source_required',
      });
    const r = await this.repo.get(i.id, i.actor);
    if (!r) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize(
      {
        actor: i.actor,
        permission: p[i.action],
        action: i.action,
        entity: { type: 'RCA', id: r.id, state: r.state },
        scope: { ownerId: r.createdBy },
        currentVersion: r.version,
        expectedVersion: i.expectedVersion,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    transitionRca(r, i.action, this.now(), i.reason);
    return this.repo.transition(i);
  }
}
