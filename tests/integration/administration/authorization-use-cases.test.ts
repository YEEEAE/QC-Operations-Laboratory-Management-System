import { describe, expect, it, vi } from 'vitest';
import { UpdateRolePermissionsUseCase } from '../../../src/modules/administration/application/update-role-permissions.js';
import { ManageUserScopesUseCase } from '../../../src/modules/administration/application/manage-user-scopes.js';
import type { AuthorizationRepository, RoleRecord } from '../../../src/modules/administration/ports/authorization-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const role: RoleRecord = { id: 'role-1', code: 'ADMIN', name: 'Admin', description: null, isSystemRole: true, active: true, version: 2n };
const actor = (permissions: ActorContext['permissions']): ActorContext => ({ id: 'actor', accountState: 'ACTIVE', roles: ['ADMIN'], permissions });
const repository = (overrides: Partial<AuthorizationRepository> = {}): AuthorizationRepository => ({ listRoles: vi.fn(), getRole: vi.fn().mockResolvedValue(role), listPermissions: vi.fn(), replaceRolePermissions: vi.fn().mockResolvedValue({ ...role, version: 3n }), listUserScopes: vi.fn(), replaceUserScopes: vi.fn().mockResolvedValue([]), ...overrides } as AuthorizationRepository);

describe('authorization administration use cases', () => {
  it('denies an ADMIN role without the explicit permission and scope', async () => {
    await expect(new UpdateRolePermissionsUseCase(repository()).execute({ actor: actor([]), roleId: 'role-1', permissionCodes: [], expectedVersion: 2n, requestId: 'r1' })).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });
  it('rejects stale role permission changes before repository mutation', async () => {
    const repo = repository();
    await expect(new UpdateRolePermissionsUseCase(repo).execute({ actor: actor([{ code: 'PERM-ADM-PERMISSION-ASSIGN', scopes: ['GLOBAL'] }]), roleId: 'role-1', permissionCodes: [], expectedVersion: 1n, requestId: 'r1' })).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(repo.replaceRolePermissions).not.toHaveBeenCalled();
  });
  it('blocks self scope grant even with explicit permission', async () => {
    await expect(new ManageUserScopesUseCase(repository()).execute({ actor: actor([{ code: 'PERM-ADM-SCOPE-ASSIGN', scopes: ['GLOBAL'] }]), userId: 'actor', scopes: [{ kind: 'SITE', value: 'site-1' }], requestId: 'r1' })).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
  });
});
