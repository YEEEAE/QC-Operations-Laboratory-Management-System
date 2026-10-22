import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildRoleRegisterHref,
  filterRoleRecords,
  paginateRoleRecords,
  parseRoleRegisterStatus,
} from '../../../src/ui/administration/roles-register.js';
import type { RoleRegisterRecord } from '../../../src/ui/administration/roles-register.js';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

const sourceRoles: RoleRegisterRecord[] = [
  {
    name: 'Sample read role',
    code: 'ROLE-READ-01',
    description: 'Read access for controlled records',
    active: true,
  },
  {
    name: 'Sample archived role',
    code: 'ROLE-ARCHIVE-VERY-LONG-IDENTIFIER-02',
    description: null,
    active: false,
  },
];

describe('roles register presentation', () => {
  it('filters by visible role name, full code, description and current active state', () => {
    expect(filterRoleRecords(sourceRoles, '  READ  ', '').map((role) => role.code)).toEqual([
      'ROLE-READ-01',
    ]);
    expect(
      filterRoleRecords(sourceRoles, 'very-long-identifier-02', '').map((role) => role.code),
    ).toEqual(['ROLE-ARCHIVE-VERY-LONG-IDENTIFIER-02']);
    expect(filterRoleRecords(sourceRoles, '', 'active').map((role) => role.active)).toEqual([true]);
    expect(filterRoleRecords(sourceRoles, '', 'inactive').map((role) => role.active)).toEqual([
      false,
    ]);
  });

  it('rejects an unsupported status filter rather than treating it as a valid state', () => {
    expect(parseRoleRegisterStatus('active')).toBe('active');
    expect(parseRoleRegisterStatus('inactive')).toBe('inactive');
    expect(parseRoleRegisterStatus('SYSTEM_OWNER')).toBe('');
  });

  it('keeps filter context in page links and resets pagination when filters change', () => {
    expect(buildRoleRegisterHref({ query: 'Quality role', status: 'active', page: 2 })).toBe(
      '/admin/roles?q=Quality+role&status=active&page=2',
    );
    expect(buildRoleRegisterHref({ query: '', status: 'active' })).toBe(
      '/admin/roles?status=active',
    );
  });

  it('paginates the already-authorized role projection without inventing a role version', () => {
    const roles = Array.from({ length: 26 }, (_, index) => ({
      ...sourceRoles[0],
      name: `Role ${index + 1}`,
      code: `ROLE-${index + 1}`,
    }));
    expect(paginateRoleRecords(roles, 1)).toMatchObject({
      currentPage: 1,
      pageCount: 2,
      items: roles.slice(0, 25),
    });
    expect(paginateRoleRecords(roles, 99)).toMatchObject({
      currentPage: 2,
      items: [roles[25]],
    });
    expect(paginateRoleRecords(roles, 0).currentPage).toBe(1);
  });

  it('keeps the read-only role catalog and detail-page grants guard separate', () => {
    const page = read('src/pages/admin/roles/index.astro');
    const listRoles = read('src/modules/administration/application/list-roles.ts');
    const detail = read('src/pages/admin/roles/[roleId].astro');

    expect(page).toContain('method="get"');
    expect(page).toContain('role="search"');
    expect(page).toContain('aria-label="Applied role filters"');
    expect(page).toContain('aria-label="Role catalog table" tabindex="0"');
    expect(page).toContain('scope="row"');
    expect(page).toContain('role.description');
    expect(page).toContain('role.version.toString()');
    expect(page).not.toMatch(/<form[^>]+method="post"|astro:actions|actions\./i);
    expect(page).not.toContain('expectedVersion');
    expect(listRoles).toContain("input.actor.accountState !== 'ACTIVE'");
    expect(detail).toContain("hasAdminCapability(actor, 'assignRolePermissions')");
    expect(detail).toContain('expectedVersion: BigInt(form.dataset.version');
  });
});
