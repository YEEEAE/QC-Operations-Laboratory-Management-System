import { describe, expect, it, vi } from 'vitest';
import { ListRolePermissionsUseCase } from '../../../src/modules/administration/application/list-role-permissions.js';
import { ListUserScopesUseCase } from '../../../src/modules/administration/application/list-user-scopes.js';
import { UpdateRolePermissionsUseCase } from '../../../src/modules/administration/application/update-role-permissions.js';
import type {
  AuthorizationRepository,
  RoleRecord,
} from '../../../src/modules/administration/ports/authorization-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const role: RoleRecord = {
  id: 'role-admin',
  code: 'ADMIN',
  name: 'Admin',
  description: null,
  isSystemRole: true,
  active: true,
  version: 5n,
};

const actor = (permissions: ActorContext['permissions']): ActorContext => ({
  id: 'actor-1',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions,
});

const repository = (overrides: Partial<AuthorizationRepository> = {}): AuthorizationRepository =>
  ({
    listRoles: vi.fn(),
    getRole: vi.fn().mockResolvedValue(role),
    listPermissions: vi.fn(),
    listRolePermissions: vi.fn().mockResolvedValue(['PERM-ADM-USERS']),
    replaceRolePermissions: vi.fn().mockResolvedValue({ ...role, version: 6n }),
    listUserScopes: vi.fn().mockResolvedValue([]),
    replaceUserScopes: vi.fn().mockResolvedValue([]),
    ...overrides,
  }) as AuthorizationRepository;

describe('administration read use cases', () => {
  it('reads member scopes with the explicit assignment authority', async () => {
    const repo = repository({
      listUserScopes: vi.fn().mockResolvedValue([
        {
          id: 's1',
          userId: 'member-1',
          kind: 'SITE',
          value: 'site-1',
          assignedBy: 'actor-1',
          assignedAt: new Date(),
          revokedAt: null,
        },
      ]),
    });
    const scopes = await new ListUserScopesUseCase(repo).execute({
      actor: actor([{ code: 'PERM-ADM-SCOPE-ASSIGN', scopes: ['GLOBAL'] }]),
      userId: 'member-1',
    });
    expect(scopes).toHaveLength(1);
    expect(repo.listUserScopes).toHaveBeenCalledWith('member-1');
  });

  it('denies scope reads to an Admin role without the assignment grant', async () => {
    const repo = repository();
    await expect(
      new ListUserScopesUseCase(repo).execute({ actor: actor([]), userId: 'member-1' }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(repo.listUserScopes).not.toHaveBeenCalled();
  });

  it('reads role grants and reports missing roles as not found', async () => {
    const repo = repository();
    const grants = await new ListRolePermissionsUseCase(repo).execute({
      actor: actor([{ code: 'PERM-ADM-PERMISSION-VIEW', scopes: ['GLOBAL'] }]),
      roleId: 'role-admin',
    });
    expect(grants).toEqual(['PERM-ADM-USERS']);
    const missing = repository({ getRole: vi.fn().mockResolvedValue(undefined) });
    await expect(
      new ListRolePermissionsUseCase(missing).execute({
        actor: actor([{ code: 'PERM-ADM-PERMISSION-VIEW', scopes: ['GLOBAL'] }]),
        roleId: 'nope',
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  it('denies role grant reads without the explicit view grant', async () => {
    const repo = repository();
    await expect(
      new ListRolePermissionsUseCase(repo).execute({ actor: actor([]), roleId: 'role-admin' }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(repo.listRolePermissions).not.toHaveBeenCalled();
  });

  it('replaces role grants with version, actor, and audit through the repository', async () => {
    const repo = repository();
    const updated = await new UpdateRolePermissionsUseCase(repo).execute({
      actor: actor([{ code: 'PERM-ADM-PERMISSION-ASSIGN', scopes: ['GLOBAL'] }]),
      roleId: 'role-admin',
      permissionCodes: ['PERM-ADM-USERS'],
      expectedVersion: 5n,
      requestId: 'req-1',
    });
    expect(updated.version).toBe(6n);
    expect(repo.replaceRolePermissions).toHaveBeenCalledWith(
      expect.objectContaining({
        roleId: 'role-admin',
        actorId: 'actor-1',
        expectedVersion: 5n,
        requestId: 'req-1',
      }),
    );
  });

  it('refuses grant changes on inactive roles', async () => {
    const repo = repository({
      getRole: vi.fn().mockResolvedValue({ ...role, active: false }),
    });
    await expect(
      new UpdateRolePermissionsUseCase(repo).execute({
        actor: actor([{ code: 'PERM-ADM-PERMISSION-ASSIGN', scopes: ['GLOBAL'] }]),
        roleId: 'role-admin',
        permissionCodes: [],
        expectedVersion: 5n,
        requestId: 'req-1',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repo.replaceRolePermissions).not.toHaveBeenCalled();
  });
});
