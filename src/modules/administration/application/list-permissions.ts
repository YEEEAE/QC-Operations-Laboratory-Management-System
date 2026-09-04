import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';
export class ListPermissionsUseCase { constructor(private readonly repository: AuthorizationRepository) {} async execute(input: { actor: ActorContext }) { authorize({ actor: input.actor, permission: 'PERM-ADM-PERMISSION-VIEW', action: 'VIEW', entity: { type: 'PERMISSION', id: 'permissions', state: 'ACTIVE' }, scope: {}, currentVersion: 1, expectedVersion: 1, businessCondition: true }, { throwOnDeny: true }); return this.repository.listPermissions(); } }
