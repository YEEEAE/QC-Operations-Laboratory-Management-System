import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { assertDistinctShifts, transitionHandover, type HandoverAction, type ShiftHandover } from '../domain/shift-handover.js';

const permission: Record<HandoverAction, PermissionCode> = {
  PREPARE: 'PERM-TASK-HANDOVER-PREPARE', REVIEW: 'PERM-TASK-HANDOVER-REVIEW',
  ACCEPT: 'PERM-TASK-HANDOVER-ACCEPT', RETURN: 'PERM-TASK-HANDOVER-RETURN',
  ACKNOWLEDGE: 'PERM-TASK-HANDOVER-ACK',
};
const action = { PREPARE: 'PREPARE', REVIEW: 'REVIEW', ACCEPT: 'ACCEPT', RETURN: 'RETURN', ACKNOWLEDGE: 'ACKNOWLEDGE' } as const;

export interface ShiftHandoverRepository {
  get(id: string): Promise<ShiftHandover | undefined>;
  listForActor(actor: ActorContext): Promise<readonly ShiftHandover[]>;
  create(input: { actor: ActorContext; requestId: string; fromShift: string; toShift: string; areaCode: string; lineCode: string; linkedItems: ShiftHandover['linkedItems']; snapshot: ShiftHandover['snapshot'] }): Promise<ShiftHandover>;
  transition(input: { actor: ActorContext; requestId: string; id: string; expectedVersion: bigint; action: HandoverAction; reason?: string }): Promise<ShiftHandover>;
}

function authorizeHandover(actorContext: ActorContext, item: ShiftHandover, step: HandoverAction) {
  authorize({
    actor: actorContext, permission: permission[step], action: action[step],
    entity: { type: 'SHIFT_HANDOVER', id: item.id, state: item.state, ownerId: item.initiatedBy, areaId: item.areaCode, shiftId: step === 'ACCEPT' || step === 'ACKNOWLEDGE' ? item.toShift : item.fromShift },
    scope: { ownerId: item.initiatedBy, areaId: item.areaCode, shiftId: step === 'ACCEPT' || step === 'ACKNOWLEDGE' ? item.toShift : item.fromShift },
    currentVersion: item.version, expectedVersion: item.version, businessCondition: true,
  }, { throwOnDeny: true });
}

export class ShiftHandoverUseCases {
  constructor(private readonly repository: ShiftHandoverRepository) {}
  list(actor: ActorContext) {
    if (actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const grant = actor.permissions.find((item) => item.code === 'PERM-TASK-VIEW' && item.active !== false);
    if (!grant) throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    return this.repository.listForActor(actor);
  }
  async prepare(input: Parameters<ShiftHandoverRepository['create']>[0]) {
    assertDistinctShifts(input.fromShift, input.toShift);
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorize({ actor: input.actor, permission: 'PERM-TASK-HANDOVER-PREPARE', action: 'PREPARE', entity: { type: 'SHIFT_HANDOVER', id: 'new', state: 'DRAFT', ownerId: input.actor.id, areaId: input.areaCode, shiftId: input.fromShift }, scope: { ownerId: input.actor.id, areaId: input.areaCode, shiftId: input.fromShift }, currentVersion: 1n, expectedVersion: 1n, businessCondition: true }, { throwOnDeny: true });
    return this.repository.create(input);
  }
  async transition(input: { actor: ActorContext; requestId: string; id: string; expectedVersion: bigint; action: HandoverAction; reason?: string }) {
    const item = await this.repository.get(input.id);
    if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if ((input.action === 'ACCEPT' || input.action === 'ACKNOWLEDGE') && item.initiatedBy === input.actor.id)
      throw new AppError('AUTHZ_SOD_VIOLATION', { userSafe: true });
    authorizeHandover(input.actor, item, input.action);
    transitionHandover(item.state, input.action, input.reason);
    return this.repository.transition(input);
  }
}
