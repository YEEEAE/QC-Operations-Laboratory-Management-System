import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_ROUTE_PERMISSIONS,
  ADMIN_WORKSPACE_PERMISSIONS,
  canAccessAdminRoute,
  type AdminRouteId,
} from '../../../src/shared/authorization/admin-workspace.js';
import { isPermissionCode } from '../../../src/shared/authorization/permissions.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { APPROVED_PERMISSION_CODES } from '../../../db/seeds/common.js';

const ADMIN_ROUTE_FILES: Record<AdminRouteId, string> = {
  admin: 'src/pages/admin/index.astro',
  users: 'src/pages/admin/users/index.astro',
  usersNew: 'src/pages/admin/users/new.astro',
  userDetail: 'src/pages/admin/users/[userId].astro',
  roles: 'src/pages/admin/roles/index.astro',
  roleDetail: 'src/pages/admin/roles/[roleId].astro',
  permissions: 'src/pages/admin/permissions/index.astro',
  scopes: 'src/pages/admin/scopes/index.astro',
};

const actor = (
  overrides: Partial<ActorContext> & { permissions: ActorContext['permissions'] },
): ActorContext => ({
  id: 'actor-1',
  accountState: 'ACTIVE',
  roles: [],
  ...overrides,
});

const grant = (code: ActorContext['permissions'][number]['code']) => ({
  code,
  scopes: ['GLOBAL'] as const,
});

describe('administration workspace guard', () => {
  it('binds every workspace route to an implemented page file', () => {
    for (const file of Object.values(ADMIN_ROUTE_FILES)) {
      expect(existsSync(new URL(`../../../${file}`, import.meta.url)), file).toBe(true);
    }
  });

  it('uses only canonical permission codes', () => {
    for (const code of ADMIN_WORKSPACE_PERMISSIONS) {
      expect(isPermissionCode(code), code).toBe(true);
    }
    for (const codes of Object.values(ADMIN_ROUTE_PERMISSIONS)) {
      for (const code of codes) {
        expect(isPermissionCode(code), code).toBe(true);
      }
    }
  });

  it('denies anonymous, inactive, and permission-less actors on every route', () => {
    const routes = Object.keys(ADMIN_ROUTE_FILES) as AdminRouteId[];
    for (const route of routes) {
      expect(canAccessAdminRoute(undefined, route)).toBe(false);
      expect(
        canAccessAdminRoute(
          actor({ accountState: 'DISABLED', permissions: [grant('PERM-ADM-USERS')] }),
          route,
        ),
      ).toBe(false);
      expect(canAccessAdminRoute(actor({ permissions: [] }), route)).toBe(false);
    }
  });

  it('denies an Admin role without explicit permission grants', () => {
    const adminWithoutGrants = actor({ roles: ['ADMIN'], permissions: [] });
    for (const route of Object.keys(ADMIN_ROUTE_FILES) as AdminRouteId[]) {
      expect(canAccessAdminRoute(adminWithoutGrants, route), route).toBe(false);
    }
  });

  it('ignores revoked grants', () => {
    const revoked = actor({
      roles: ['ADMIN'],
      permissions: [{ code: 'PERM-ADM-USERS', scopes: ['GLOBAL'], active: false }],
    });
    expect(canAccessAdminRoute(revoked, 'users')).toBe(false);
    expect(canAccessAdminRoute(revoked, 'admin')).toBe(false);
  });

  it('scopes each section to its explicit permission', () => {
    const usersOnly = actor({ permissions: [grant('PERM-ADM-USERS')] });
    expect(canAccessAdminRoute(usersOnly, 'admin')).toBe(true);
    expect(canAccessAdminRoute(usersOnly, 'users')).toBe(true);
    expect(canAccessAdminRoute(usersOnly, 'userDetail')).toBe(true);
    expect(canAccessAdminRoute(usersOnly, 'usersNew')).toBe(false);
    expect(canAccessAdminRoute(usersOnly, 'roles')).toBe(false);
    expect(canAccessAdminRoute(usersOnly, 'permissions')).toBe(false);
    expect(canAccessAdminRoute(usersOnly, 'scopes')).toBe(false);
  });

  it('keeps user creation on the explicit management permission', () => {
    const creator = actor({ permissions: [grant('PERM-IDN-MANAGE-USERS')] });
    expect(canAccessAdminRoute(creator, 'usersNew')).toBe(true);
    expect(canAccessAdminRoute(creator, 'users')).toBe(true);
    expect(canAccessAdminRoute(creator, 'roleDetail')).toBe(false);
  });

  it('grants SYSTEM_OWNER visibility across the whole workspace', () => {
    const owner = actor({
      roles: ['SYSTEM_OWNER'],
      permissions: APPROVED_PERMISSION_CODES.map((code) => ({
        code,
        scopes: ['GLOBAL'] as const,
      })),
    });
    for (const route of Object.keys(ADMIN_ROUTE_FILES) as AdminRouteId[]) {
      expect(canAccessAdminRoute(owner, route), route).toBe(true);
    }
  });
});
