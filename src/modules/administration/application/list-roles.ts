import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';
export class ListRolesUseCase { constructor(private readonly repository: AuthorizationRepository) {} async execute(input: { actor: ActorContext }) { authorize({ actor: input.actor, permission: 'PERM-ADM-ROLE-VIEW', action: 'VIEW', entity: { type: 'ROLE', id: 'roles', state: 'ACTIVE' }, scope: {}, currentVersion: 1, expectedVersion: 1, businessCondition: true }, { throwOnDeny: true }); return this.repository.listRoles(); } }
