import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { transitionCapa, type CapaActionType } from '../domain/capa.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../../shared/authorization/permissions.js';
import type { CapaRepository } from '../ports/repository.js';
const p: Record<CapaActionType, PermissionCode> = {
  OPEN: 'PERM-CAPA-EDIT',
  START: 'PERM-CAPA-EDIT',
  ACTIONS_COMPLETE: 'PERM-CAPA-EDIT',
  START_EFFECTIVENESS: 'PERM-CAPA-VERIFY',
  READY_FOR_CLOSURE: 'PERM-CAPA-VERIFY',
  CLOSE: 'PERM-CAPA-CLOSE',
  VOID: 'PERM-CAPA-VOID',
};
export class TransitionCapaUseCase {
  constructor(
    private repo: CapaRepository,
    private now = () => new Date(),
  ) {}
  async execute(i: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    action: CapaActionType;
    reason?: string;
    requestId: string;
    conditions?: { verified: boolean; effectivenessAccepted: boolean };
  }) {
    if (i.action === 'CLOSE') throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const c = await this.repo.get(i.id, i.actor);
    if (!c) throw new Error('not found');
    authorize(
      {
        actor: i.actor,
        permission: p[i.action],
        action: i.action,
        entity: { type: 'CAPA', id: c.id, state: c.state, ownerId: c.ownerId ?? c.createdBy },
        scope: { ownerId: c.ownerId ?? c.createdBy },
        currentVersion: c.version,
        expectedVersion: i.expectedVersion,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    transitionCapa(c, i.action, this.now(), i.reason, i.conditions);
    return this.repo.transition(i);
  }
}
