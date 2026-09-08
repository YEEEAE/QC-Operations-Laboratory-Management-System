import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APPROVED_PERMISSION_CODES, FOUNDATION_ROLE_PERMISSIONS } from '../../../db/seeds/common';
import { isPermissionCode } from '../../../src/shared/authorization/permissions';
import { navigationGroups, visibleNavigation } from '../../../src/ui/navigation/navigation';

describe('navigation permission and route integrity', () => {
  it('uses canonical permission codes and implemented pages', () => {
    for (const item of navigationGroups.flatMap((group) => group.items)) {
      if (item.capability) {
        const permissions = Array.isArray(item.capability) ? item.capability : [item.capability];
        for (const permission of permissions) {
          expect(isPermissionCode(permission), `${item.id}:${permission}`).toBe(true);
        }
      }
      const page = new URL(`../../../src/pages${item.href}.astro`, import.meta.url);
      const index = new URL(`../../../src/pages${item.href}/index.astro`, import.meta.url);
      expect(existsSync(page) || existsSync(index), item.href).toBe(true);
    }
  });

  it('exposes existing admin reading capabilities instead of only health and backups', () => {
    const links = visibleNavigation(FOUNDATION_ROLE_PERMISSIONS.ADMIN).flatMap((group) =>
      group.items.map((item) => item.href),
    );
    for (const href of [
      '/documents',
      '/change-requests',
      '/audit',
      '/search',
      '/notifications',
      '/account',
    ]) {
      expect(links).toContain(href);
    }
    expect(links).not.toContain('/laboratory/tests');
    expect(visibleNavigation([])).toEqual([]);
  });

  it('supports each canonical dashboard permission independently', () => {
    for (const permission of ['PERM-DASH-VIEW', 'PERM-DASH-MANAGEMENT', 'PERM-DASH-ADMIN']) {
      expect(
        visibleNavigation([permission]).flatMap((group) => group.items.map((item) => item.href)),
      ).toContain('/dashboard');
    }
  });

  it('exposes every implemented navigation page to the system-owner permission set', () => {
    const allLinks = navigationGroups.flatMap((group) => group.items.map((item) => item.href));
    const visibleLinks = visibleNavigation(APPROVED_PERMISSION_CODES).flatMap((group) =>
      group.items.map((item) => item.href),
    );
    expect(visibleLinks).toEqual(allLinks);
  });
});
