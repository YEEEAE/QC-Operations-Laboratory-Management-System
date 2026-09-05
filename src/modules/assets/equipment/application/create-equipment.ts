import { authorize } from '../../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import { createDraftEquipment } from '../domain/equipment.js';
import type { EquipmentRepository } from '../ports/repository.js';
export class CreateEquipmentUseCase { constructor(private readonly repository: EquipmentRepository, private readonly now = () => new Date()) {} execute(input: { actor: ActorContext; equipmentNo: string; name: string; manufacturer?: string; model?: string; serialNo?: string; location?: string; requestId: string }) { authorize({ actor: input.actor, permission: 'PERM-EQP-CREATE', action: 'CREATE', entity: { type: 'EQUIPMENT', id: 'new', state: 'DRAFT', ownerId: input.actor.id }, scope: { ownerId: input.actor.id }, currentVersion: 1n, expectedVersion: 1n, businessCondition: true }, { throwOnDeny: true }); return this.repository.create({ equipment: createDraftEquipment({ ...input, id: uuidv7(), createdBy: input.actor.id, now: this.now() }), actor: input.actor, requestId: input.requestId }); } }
