import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APPROVED_PERMISSION_CODES } from '../../../db/seeds/common';
import { isPermissionCode } from '../../../src/shared/authorization/permissions';
import { navigationGroups, routeBreadcrumbs, visibleNavigation } from '../../../src/ui/navigation/navigation';

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

  it('keeps ordinary operational navigation visible without granting mutations', () => {
    const links = visibleNavigation([]).flatMap((group) =>
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
    expect(links).toContain('/laboratory/tests');
    expect(links).not.toContain('/quarantine/admin');
    expect(links).not.toContain('/system/health');
    expect(links).not.toContain('/admin');
  });

  it('shows Tasks to every authenticated member without granting task actions', () => {
    const links = visibleNavigation([]).flatMap((group) => group.items.map((item) => item.href));
    expect(links).toContain('/tasks');
    expect(navigationGroups.find((group) => group.id === 'work')?.items[0]?.capability).toBeUndefined();
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

  it('keeps breadcrumbs contextual without inventing a /system landing route', () => {
    expect(routeBreadcrumbs('/quality/findings/abc')).toEqual([
      { label: 'Quality', href: '/quality' },
      { label: 'Findings', href: '/quality/findings' },
      { label: 'Record detail' },
    ]);
    expect(routeBreadcrumbs('/laboratory/tests/new')).toEqual([
      { label: 'Laboratory', href: '/laboratory' },
      { label: 'Laboratory tests', href: '/laboratory/tests' },
      { label: 'New record' },
    ]);
    expect(routeBreadcrumbs('/system/health')).toEqual([
      { label: 'System', href: undefined },
      { label: 'System health', href: undefined },
    ]);
  });
});
