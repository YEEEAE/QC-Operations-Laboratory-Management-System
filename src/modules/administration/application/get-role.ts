import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';
export class GetRoleUseCase { constructor(private readonly repository: AuthorizationRepository) {} async execute(input: { actor: ActorContext; roleId: string }) { const role = await this.repository.getRole(input.roleId); if (!role) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true }); authorize({ actor: input.actor, permission: 'PERM-ADM-ROLE-VIEW', action: 'VIEW', entity: { type: 'ROLE', id: role.id, state: role.active ? 'ACTIVE' : 'INACTIVE' }, scope: {}, currentVersion: role.version, expectedVersion: role.version, businessCondition: true }, { throwOnDeny: true }); return role; } }
