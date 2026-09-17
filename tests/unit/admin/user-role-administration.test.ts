import { describe, expect, it, vi } from 'vitest';
import { ManageUserRoleUseCase } from '../../../src/modules/administration/application/manage-user-role.js';
import { ListUserRolesUseCase } from '../../../src/modules/administration/application/list-user-roles.js';
import type {
  AuthorizationRepository,
  RoleRecord,
} from '../../../src/modules/administration/ports/authorization-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const role = (code: string): RoleRecord => ({
  id: `role-${code}`,
  code,
  name: code,
  description: null,
  isSystemRole: true,
  active: true,
  version: 1n,
});

const actor = (overrides: Partial<ActorContext> = {}): ActorContext => ({
  id: 'actor-1',
  loginIdentity: 'operator',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions: [{ code: 'PERM-ADM-ROLE-ASSIGN', scopes: ['GLOBAL'] }],
  ...overrides,
});

const repository = (overrides: Partial<AuthorizationRepository> = {}): AuthorizationRepository =>
  ({
    listRoles: vi.fn(),
    getRole: vi.fn(),
    listPermissions: vi.fn(),
    listRolePermissions: vi.fn(),
    replaceRolePermissions: vi.fn(),
    listUserScopes: vi.fn().mockResolvedValue([]),
    listUserRoles: vi.fn().mockResolvedValue([]),
    assignUserRole: vi.fn().mockResolvedValue(undefined),
    removeUserRole: vi.fn().mockResolvedValue(undefined),
    replaceUserScopes: vi.fn(),
    assignUserScope: vi.fn(),
    removeUserScope: vi.fn(),
    ...overrides,
  }) as AuthorizationRepository;

describe('role administration use cases', () => {
  it('assigns one role through the repository with actor and request evidence', async () => {
    const repo = repository();
    await new ManageUserRoleUseCase(repo).assign({
      actor: actor(),
      userId: 'member-1',
      roleId: 'role-QUALITY',
      requestId: 'req-role',
      reason: 'Coverage',
    });
    expect(repo.assignUserRole).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'actor-1',
        userId: 'member-1',
        roleId: 'role-QUALITY',
        requestId: 'req-role',
        reason: 'Coverage',
      }),
    );
  });

  it('denies role assignment without the explicit role-assignment permission', async () => {
    const repo = repository();
    await expect(
      new ManageUserRoleUseCase(repo).assign({
        actor: actor({ permissions: [], roles: ['ADMIN', 'MANAGER'] }),
        userId: 'member-1',
        roleId: 'role-QUALITY',
        requestId: 'req-role',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(repo.assignUserRole).not.toHaveBeenCalled();
  });

  it('denies self role assignment even with the permission', async () => {
    const repo = repository();
    await expect(
      new ManageUserRoleUseCase(repo).assign({
        actor: actor({ id: 'member-1' }),
        userId: 'member-1',
        roleId: 'role-QUALITY',
        requestId: 'req-role',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repo.assignUserRole).not.toHaveBeenCalled();
  });

  it('blocks a named owner from removing their own role', async () => {
    const repo = repository();
    // Self-administration is denied by the business condition before the
    // separation-of-duties layer, so the denial code is AUTHZ_DENIED.
    await expect(
      new ManageUserRoleUseCase(repo).remove({
        actor: actor({ id: 'owner-1', loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'] }),
        userId: 'owner-1',
        roleId: 'role-SYSTEM_OWNER',
        requestId: 'req-role',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repo.removeUserRole).not.toHaveBeenCalled();
  });

  it('removes one role for another member and delegates to persistence', async () => {
    const repo = repository();
    await new ManageUserRoleUseCase(repo).remove({
      actor: actor(),
      userId: 'member-1',
      roleId: 'role-QUALITY',
      requestId: 'req-role',
    });
    expect(repo.removeUserRole).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'actor-1',
        userId: 'member-1',
        roleId: 'role-QUALITY',
        requestId: 'req-role',
      }),
    );
  });

  it('reads role membership only with the explicit role-view grant', async () => {
    const repo = repository({ listUserRoles: vi.fn().mockResolvedValue([role('QUALITY')]) });
    const roles = await new ListUserRolesUseCase(repo).execute({
      actor: actor({ permissions: [{ code: 'PERM-ADM-ROLE-VIEW', scopes: ['GLOBAL'] }] }),
      userId: 'member-1',
    });
    expect(roles.map((entry) => entry.code)).toEqual(['QUALITY']);
    await expect(
      new ListUserRolesUseCase(repository()).execute({
        actor: actor({ permissions: [{ code: 'PERM-ADM-ROLE-ASSIGN', scopes: ['GLOBAL'] }] }),
        userId: 'member-1',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });
});
