import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';
export class UpdateRolePermissionsUseCase { constructor(private readonly repository: AuthorizationRepository) {} async execute(input: { actor: ActorContext; roleId: string; permissionCodes: readonly PermissionCode[]; expectedVersion: bigint; requestId: string }) { const role = await this.repository.getRole(input.roleId); if (!role) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true }); authorize({ actor: input.actor, permission: 'PERM-ADM-PERMISSION-ASSIGN', action: 'ASSIGN', entity: { type: 'ROLE', id: role.id, state: role.active ? 'ACTIVE' : 'INACTIVE' }, scope: {}, currentVersion: role.version, expectedVersion: input.expectedVersion, businessCondition: role.active }, { throwOnDeny: true }); return this.repository.replaceRolePermissions({ ...input, actorId: input.actor.id }); } }
