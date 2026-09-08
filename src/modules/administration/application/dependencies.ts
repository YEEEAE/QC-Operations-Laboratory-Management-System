import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresAuthorizationRepository } from '../infrastructure/postgres-authorization-repository.js';
import { GetRoleUseCase } from './get-role.js';
import { ListPermissionsUseCase } from './list-permissions.js';
import { ListRolesUseCase } from './list-roles.js';
import { ManageUserScopesUseCase } from './manage-user-scopes.js';
import { UpdateRolePermissionsUseCase } from './update-role-permissions.js';

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
    updateRolePermissions: new UpdateRolePermissionsUseCase(repository),
    manageUserScopes: new ManageUserScopesUseCase(repository),
  };
}
