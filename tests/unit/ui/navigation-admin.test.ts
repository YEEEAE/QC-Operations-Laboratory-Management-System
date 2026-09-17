import { describe, expect, it } from 'vitest';
import { visibleNavigation } from '../../../src/ui/navigation/navigation.js';

const ADMIN_HREFS = [
  '/admin',
  '/admin/users',
  '/admin/roles',
  '/admin/permissions',
  '/admin/scopes',
];

function hrefsFor(loginIdentity = 'member', roles: readonly string[] = []): string[] {
  return visibleNavigation({
    id: loginIdentity,
    loginIdentity,
    accountState: 'ACTIVE',
    roles,
    permissions: [],
  }).flatMap((group) => group.items.map((item) => item.href));
}

describe('administration navigation visibility', () => {
  it('exposes the full workspace to the seeded Admin permission set', () => {
    const links = hrefsFor('admin', ['ADMIN']);
    for (const href of ADMIN_HREFS) {
      expect(links, href).toContain(href);
    }
  });

  it('exposes the full workspace to the system-owner permission set', () => {
    const links = hrefsFor('yazeed', ['SYSTEM_OWNER']);
    for (const href of ADMIN_HREFS) {
      expect(links, href).toContain(href);
    }
  });

  it('shows the read-only workspace without mutation grants', () => {
    const links = hrefsFor();
    for (const href of ADMIN_HREFS) {
      expect(links, href).toContain(href);
    }
  });

  it('shows the read-only workspace to an Admin role without mutation grants', () => {
    const links = hrefsFor('admin', ['ADMIN']);
    for (const href of ADMIN_HREFS) {
      expect(links, href).toContain(href);
    }
  });

  it('shows the workspace to operational roles without administration grants', () => {
    for (const role of ['EMPLOYEE', 'SUPERVISOR', 'MANAGER'] as const) {
      const links = hrefsFor(role.toLowerCase(), [role]);
      for (const href of ADMIN_HREFS) {
        expect(links, `${role}:${href}`).toContain(href);
      }
    }
  });

  it('hides only owner-private navigation from a non-canonical system owner', () => {
    expect(hrefsFor('owner-like', ['SYSTEM_OWNER'])).not.toContain('/system/health');
    expect(hrefsFor('yazeed', ['SYSTEM_OWNER'])).toContain('/system/health');
  });
});
