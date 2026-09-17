import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresAuthorizationRepository } from '../infrastructure/postgres-authorization-repository.js';
import { GetRoleUseCase } from './get-role.js';
import { ListPermissionsUseCase } from './list-permissions.js';
import { ListRolePermissionsUseCase } from './list-role-permissions.js';
import { ListRolesUseCase } from './list-roles.js';
import { ListUserScopesUseCase } from './list-user-scopes.js';
import { ManageUserScopesUseCase } from './manage-user-scopes.js';
import { UpdateRolePermissionsUseCase } from './update-role-permissions.js';
import { ListUserRolesUseCase } from './list-user-roles.js';
import { ManageUserRoleUseCase } from './manage-user-role.js';
import { AssignUserScopeUseCase } from './assign-user-scope.js';
import { RemoveUserScopeUseCase } from './remove-user-scope.js';

export function administrationDependencies() {
  const database = getDatabase();
  const repository = new PostgresAuthorizationRepository(
    database,
    new PostgresAuditRepository(database),
  );
  return {
    listRoles: new ListRolesUseCase(repository),
    getRole: new GetRoleUseCase(repository),
    listPermissions: new ListPermissionsUseCase(repository),
    listRolePermissions: new ListRolePermissionsUseCase(repository),
    listUserScopes: new ListUserScopesUseCase(repository),
    updateRolePermissions: new UpdateRolePermissionsUseCase(repository),
    manageUserScopes: new ManageUserScopesUseCase(repository),
    listUserRoles: new ListUserRolesUseCase(repository),
    manageUserRole: new ManageUserRoleUseCase(repository),
    assignUserScope: new AssignUserScopeUseCase(repository),
    removeUserScope: new RemoveUserScopeUseCase(repository),
  };
}
