import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isPermissionCode } from '../../../src/shared/authorization/permissions';
import {
  navigationGroups,
  navigationRouteIds,
  navigationTree,
  routeBreadcrumbs,
  visibleNavigation,
  visibleNavigationUtilities,
} from '../../../src/ui/navigation/navigation';
import { getRouteByPath, routes } from '../../../src/shared/routing/routes';

const EXPECTED_NAVIGATION_HREFS = [
  '/dashboard',
  '/work',
  '/tasks',
  '/quality/findings',
  '/quality/ncr',
  '/quality/rca',
  '/quality/capa',
  '/reject-reports',
  '/quarantine',
  '/quarantine/receiving',
  '/quarantine/inspections',
  '/quarantine/admin',
  '/laboratory/tests',
  '/assets/equipment',
  '/assets/calibrations',
  '/assets/maintenance',
  '/approvals',
  '/change-requests',
  '/reports',
  '/ai-advisory',
  '/admin',
  '/admin/users',
  '/admin/roles',
  '/admin/permissions',
  '/admin/scopes',
  '/audit',
  '/system/health',
  '/system/control-center',
  '/system/backups',
  '/documents',
  '/notifications',
  '/search',
  '/account',
  '/help',
];

describe('navigation permission and route integrity', () => {
  it('uses canonical permission codes and implemented pages', () => {
    for (const item of navigationTree.groups
      .flatMap((group) => group.items)
      .concat(navigationTree.utilities)) {
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
    const member = {
      id: 'member',
      loginIdentity: 'member',
      accountState: 'ACTIVE' as const,
      roles: [],
      permissions: [],
    };
    const links = visibleNavigation(member)
      .flatMap((group) => group.items.map((item) => item.href))
      .concat(visibleNavigationUtilities(member).map((item) => item.href));
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
    expect(links).toContain('/quarantine/admin');
    expect(links).not.toContain('/system/health');
    expect(links).toContain('/admin');
  });

  it('shows Tasks to every authenticated member without granting task actions', () => {
    const links = visibleNavigation({
      id: 'member',
      loginIdentity: 'member',
      accountState: 'ACTIVE',
      roles: [],
      permissions: [],
    }).flatMap((group) => group.items.map((item) => item.href));
    expect(links).toContain('/tasks');
    expect(
      navigationGroups.find((group) => group.id === 'work')?.items[0]?.capability,
    ).toBeUndefined();
  });

  it('supports each canonical dashboard permission independently', () => {
    for (const permission of ['PERM-DASH-VIEW', 'PERM-DASH-MANAGEMENT', 'PERM-DASH-ADMIN']) {
      expect(
        visibleNavigation({
          id: 'member',
          loginIdentity: 'member',
          accountState: 'ACTIVE',
          roles: [],
          permissions: [{ code: permission as never, scopes: ['GLOBAL'] }],
        }).flatMap((group) => group.items.map((item) => item.href)),
      ).toContain('/dashboard');
    }
  });

  it('exposes every implemented navigation page to the system-owner permission set', () => {
    const allLinks = [
      ...navigationGroups.flatMap((group) => group.items),
      ...navigationTree.utilities,
    ].map((item) => item.href);
    const visibleLinks = visibleNavigation({
      id: 'yazeed',
      loginIdentity: 'yazeed',
      accountState: 'ACTIVE',
      roles: ['SYSTEM_OWNER'],
      permissions: [],
    })
      .flatMap((group) => group.items.map((item) => item.href))
      .concat(
        visibleNavigationUtilities({
          id: 'yazeed',
          loginIdentity: 'yazeed',
          accountState: 'ACTIVE',
          roles: ['SYSTEM_OWNER'],
          permissions: [],
        }).map((item) => item.href),
      );
    expect(visibleLinks).toEqual(allLinks);
  });

  it('keeps the two-level tree complete, unique, and within the ten approved sections', () => {
    expect(navigationTree.groups.map((group) => group.label)).toEqual([
      'Overview',
      'Work',
      'Quality',
      'Quarantine',
      'Laboratory',
      'Assets',
      'Governance',
      'Insights',
      'Administration',
      'System',
    ]);
    const items = [
      ...navigationTree.groups.flatMap((group) => group.items),
      ...navigationTree.utilities,
    ];
    const hrefs = items.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(new Set(navigationRouteIds).size).toBe(navigationRouteIds.length);
    expect(navigationRouteIds).toHaveLength(34);
    expect(hrefs).toEqual(EXPECTED_NAVIGATION_HREFS);
    expect(navigationRouteIds).toEqual(
      EXPECTED_NAVIGATION_HREFS.map((href) => getRouteByPath(href)?.id),
    );
    for (const item of items)
      expect(
        routes.some((route) => route.id === item.routeId),
        item.href,
      ).toBe(true);
    expect(navigationTree.groups.every((group) => group.items.length > 0)).toBe(true);
  });

  it('filters owner-only destinations before rendering groups and utilities', () => {
    const nonOwner = {
      id: 'member',
      loginIdentity: 'member',
      accountState: 'ACTIVE' as const,
      roles: ['SYSTEM_OWNER'],
      permissions: [],
    };
    const groups = visibleNavigation(nonOwner);
    const links = [
      ...groups.flatMap((group) => group.items),
      ...visibleNavigationUtilities(nonOwner),
    ];
    expect(links.map((item) => item.href)).not.toContain('/system/health');
    expect(links.map((item) => item.href)).not.toContain('/system/control-center');
    expect(groups.every((group) => group.items.length > 0)).toBe(true);
    expect(
      visibleNavigation({ ...nonOwner, loginIdentity: 'yazeed' }).some(
        (group) => group.id === 'system',
      ),
    ).toBe(true);
  });

  it('keeps breadcrumbs contextual without inventing a /system landing route', () => {
    expect(routeBreadcrumbs('/quality/findings/abc')).toEqual([
      { label: 'Quality', href: '/quality' },
      { label: 'Findings', href: '/quality/findings' },
      { label: 'Record detail' },
    ]);
    expect(routeBreadcrumbs('/laboratory/tests/new')).toEqual([
      { label: 'Laboratory', href: '/laboratory/tests' },
      { label: 'Laboratory tests', href: '/laboratory/tests' },
      { label: 'New record' },
    ]);
    expect(routeBreadcrumbs('/system/health')).toEqual([
      { label: 'System', href: undefined },
      { label: 'System health', href: undefined },
    ]);
    expect(routeBreadcrumbs('/governance/releases/rel-123')).toEqual([
      { label: 'Governance', href: undefined },
      { label: 'Release approval' },
    ]);
  });
});
