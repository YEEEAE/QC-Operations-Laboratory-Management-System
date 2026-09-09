import { describe, expect, it } from 'vitest';
import {
  APPROVED_PERMISSION_CODES,
  FOUNDATION_ROLE_PERMISSIONS,
} from '../../../db/seeds/common.js';
import { visibleNavigation } from '../../../src/ui/navigation/navigation.js';

const ADMIN_HREFS = [
  '/admin',
  '/admin/users',
  '/admin/roles',
  '/admin/permissions',
  '/admin/scopes',
];

function hrefsFor(capabilities: readonly string[]): string[] {
  return visibleNavigation(capabilities).flatMap((group) => group.items.map((item) => item.href));
}

describe('administration navigation visibility', () => {
  it('exposes the full workspace to the seeded Admin permission set', () => {
    const links = hrefsFor(FOUNDATION_ROLE_PERMISSIONS.ADMIN);
    for (const href of ADMIN_HREFS) {
      expect(links, href).toContain(href);
    }
  });

  it('exposes the full workspace to the system-owner permission set', () => {
    const links = hrefsFor(APPROVED_PERMISSION_CODES);
    for (const href of ADMIN_HREFS) {
      expect(links, href).toContain(href);
    }
  });

  it('hides the workspace without explicit grants', () => {
    const links = hrefsFor([]);
    for (const href of ADMIN_HREFS) {
      expect(links, href).not.toContain(href);
    }
  });

  it('hides the workspace from an Admin role without permission grants', () => {
    // Navigation is capability-driven: a role label without grants resolves to
    // the same empty capability set and must see nothing administrative.
    const links = hrefsFor([]);
    for (const href of ADMIN_HREFS) {
      expect(links, href).not.toContain(href);
    }
  });

  it('hides the workspace from operational roles without administration grants', () => {
    for (const role of ['EMPLOYEE', 'SUPERVISOR', 'MANAGER'] as const) {
      const links = hrefsFor(FOUNDATION_ROLE_PERMISSIONS[role]);
      for (const href of ADMIN_HREFS) {
        expect(links, `${role}:${href}`).not.toContain(href);
      }
    }
  });

  it('reveals each section independently from its own grant', () => {
    expect(hrefsFor(['PERM-ADM-USERS'])).toContain('/admin/users');
    expect(hrefsFor(['PERM-ADM-USERS'])).not.toContain('/admin/roles');
    expect(hrefsFor(['PERM-ADM-ROLE-VIEW'])).toContain('/admin/roles');
    expect(hrefsFor(['PERM-ADM-PERMISSION-VIEW'])).toContain('/admin/permissions');
    expect(hrefsFor(['PERM-ADM-SCOPE-ASSIGN'])).toContain('/admin/scopes');
  });
});
