import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_ACTION_CAPABILITIES,
  hasAdminCapability,
  type AdminActionCapability,
} from '../../../src/shared/authorization/admin-workspace.js';
import { isPermissionCode } from '../../../src/shared/authorization/permissions.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { APPROVED_PERMISSION_CODES } from '../../../db/seeds/common.js';
import { pageAccessDecision } from '../../../src/shared/routing/page-access.js';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

const actor = (
  permissions: ActorContext['permissions'],
  overrides: Partial<ActorContext> = {},
): ActorContext => ({
  id: 'actor-1',
  accountState: 'ACTIVE',
  roles: [],
  permissions,
  ...overrides,
});

const grant = (
  code: ActorContext['permissions'][number]['code'],
  scopes: ActorContext['permissions'][number]['scopes'] = ['GLOBAL'],
  active = true,
) => ({ code, scopes, active });

describe('administration action affordances', () => {
  it('maps every visible mutation to a canonical permission and explicit global scope', () => {
    for (const [capability, requirement] of Object.entries(ADMIN_ACTION_CAPABILITIES)) {
      expect(isPermissionCode(requirement.permission), capability).toBe(true);
      expect(requirement.scope, capability).toBe('GLOBAL');
    }
  });

  it('requires an ACTIVE actor, matching active grant, and required scope', () => {
    expect(hasAdminCapability(undefined, 'createUser')).toBe(false);
    expect(
      hasAdminCapability(
        actor([grant('PERM-IDN-MANAGE-USERS')], { accountState: 'DISABLED' }),
        'createUser',
      ),
    ).toBe(false);
    expect(hasAdminCapability(actor([]), 'createUser')).toBe(false);
    expect(
      hasAdminCapability(actor([grant('PERM-IDN-MANAGE-USERS', ['GLOBAL'], false)]), 'createUser'),
    ).toBe(false);
    expect(
      hasAdminCapability(actor([grant('PERM-IDN-MANAGE-USERS', ['TEAM'])]), 'createUser'),
    ).toBe(false);
    expect(hasAdminCapability(actor([grant('PERM-IDN-MANAGE-USERS')]), 'createUser')).toBe(true);
  });

  it('does not derive assignment from read, role membership, or another action grant', () => {
    const viewOnly = actor([grant('PERM-ADM-ROLE-VIEW'), grant('PERM-ADM-PERMISSION-VIEW')], {
      roles: ['ADMIN'],
    });
    expect(hasAdminCapability(viewOnly, 'assignUserRole')).toBe(false);
    expect(hasAdminCapability(viewOnly, 'removeUserRole')).toBe(false);
    expect(hasAdminCapability(viewOnly, 'assignRolePermissions')).toBe(false);
    expect(hasAdminCapability(viewOnly, 'assignUserScope')).toBe(false);
    expect(hasAdminCapability(viewOnly, 'removeUserScope')).toBe(false);

    const userManager = actor([grant('PERM-IDN-MANAGE-USERS')]);
    expect(hasAdminCapability(userManager, 'createUser')).toBe(true);
    expect(hasAdminCapability(userManager, 'assignUserRole')).toBe(false);
    expect(hasAdminCapability(userManager, 'removeUserRole')).toBe(false);
    expect(hasAdminCapability(userManager, 'assignUserScope')).toBe(false);
  });

  it('keeps page visibility separate and gates the role-grant form by its own action capability', () => {
    const pages = [
      'src/pages/admin/index.astro',
      'src/pages/admin/users/index.astro',
      'src/pages/admin/users/new.astro',
      'src/pages/admin/users/[userId].astro',
      'src/pages/admin/roles/index.astro',
      'src/pages/admin/roles/[roleId].astro',
      'src/pages/admin/permissions/index.astro',
      'src/pages/admin/scopes/index.astro',
    ];
    for (const page of pages)
      expect(existsSync(new URL(`../../../${page}`, import.meta.url))).toBe(true);

    const registry = read('src/shared/authorization/admin-workspace.ts');
    const roleDetail = read('src/pages/admin/roles/[roleId].astro');
    expect(registry).toContain('Route visibility belongs to pageAccessDecision');
    expect(registry).not.toContain('ADMIN_ROUTE_PERMISSIONS');
    for (const path of pages) {
      expect(pageAccessDecision(actor([]), path), path).toBe('ALLOWED');
    }
    expect(pageAccessDecision(actor([], { accountState: 'DISABLED' }), '/admin/users')).toBe(
      'AUTHENTICATION_REQUIRED',
    );
    expect(roleDetail).toContain("hasAdminCapability(actor, 'assignRolePermissions')");
    expect(roleDetail).toContain('data-role-grants');
    expect(roleDetail).toContain("querySelector<HTMLFormElement>('[data-role-grants]')");
    expect(roleDetail).not.toContain("canAccessAdminRoute(actor, 'roleDetail')");
  });

  it('keeps the canonical SYSTEM_OWNER grants protected in the rendered user controls', () => {
    const owner = actor(APPROVED_PERMISSION_CODES.map((code) => grant(code)));
    for (const capability of Object.keys(ADMIN_ACTION_CAPABILITIES) as AdminActionCapability[]) {
      expect(hasAdminCapability(owner, capability), capability).toBe(true);
    }
    const page = read('src/pages/admin/users/[userId].astro');
    expect(page).toContain('isProtectedOwnerRoleGrant');
    expect(page).toContain('isProtectedOwnerScope');
    expect(page).toContain('!protectedRole(role.code)');
    expect(page).toContain('!protectedScope(scope.kind)');
  });
});
