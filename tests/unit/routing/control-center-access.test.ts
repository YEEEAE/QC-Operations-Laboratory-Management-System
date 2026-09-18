import { describe, expect, it } from 'vitest';
import { pageAccessDecision } from '../../../src/shared/routing/page-access.js';
import { getRouteByPath, getRouteByPathname } from '../../../src/shared/routing/routes.js';
import { navigationGroups, visibleNavigation } from '../../../src/ui/navigation/navigation.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor = (overrides: Partial<ActorContext> = {}): ActorContext => ({
  id: 'actor-1',
  loginIdentity: 'employee',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [],
  ...overrides,
});

const CONTROL_CENTER_PATH = '/system/control-center';

describe('owner control center route contract', () => {
  it('registers a canonical route classified explicitly as YAZEED_ONLY', () => {
    const route = getRouteByPath(CONTROL_CENTER_PATH);
    expect(route).toBeDefined();
    expect(route?.visibility).toBe('YAZEED_ONLY');
    expect(route?.page).toBe('src/pages/system/control-center.astro');
    expect(route?.domain).toBe('system-health');
  });

  it('denies every non-canonical persona server-side, including SYSTEM_OWNER role holders', () => {
    expect(pageAccessDecision(undefined, CONTROL_CENTER_PATH)).toBe('AUTHENTICATION_REQUIRED');
    expect(pageAccessDecision(actor(), CONTROL_CENTER_PATH)).toBe('YAZEED_ONLY');
    expect(pageAccessDecision(actor({ roles: ['SUPERVISOR'] }), CONTROL_CENTER_PATH)).toBe(
      'YAZEED_ONLY',
    );
    expect(pageAccessDecision(actor({ roles: ['MANAGER'] }), CONTROL_CENTER_PATH)).toBe(
      'YAZEED_ONLY',
    );
    expect(pageAccessDecision(actor({ roles: ['ADMIN'] }), CONTROL_CENTER_PATH)).toBe(
      'YAZEED_ONLY',
    );
    expect(
      pageAccessDecision(
        actor({ loginIdentity: 'owner-like', roles: ['SYSTEM_OWNER'] }),
        CONTROL_CENTER_PATH,
      ),
    ).toBe('YAZEED_ONLY');
    // Full normal permissions never substitute for the canonical login identity.
    expect(
      pageAccessDecision(
        actor({
          roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'SYSTEM_OWNER'],
          permissions: [
            { code: 'PERM-IDN-MANAGE-USERS', scopes: ['GLOBAL'] },
            { code: 'PERM-ADM-ROLE-ASSIGN', scopes: ['GLOBAL'] },
            { code: 'PERM-ADM-SCOPE-ASSIGN', scopes: ['GLOBAL'] },
            { code: 'PERM-ADM-AUDIT-VIEW', scopes: ['GLOBAL'] },
            { code: 'PERM-HLTH-VIEW', scopes: ['GLOBAL'] },
          ],
        }),
        CONTROL_CENTER_PATH,
      ),
    ).toBe('YAZEED_ONLY');
  });

  it('denies a disabled or inactive canonical owner identity', () => {
    for (const accountState of ['DISABLED', 'INACTIVE'] as const) {
      expect(
        pageAccessDecision(
          actor({ loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'], accountState }),
          CONTROL_CENTER_PATH,
        ),
      ).toBe('AUTHENTICATION_REQUIRED');
    }
  });

  it('allows only the active canonical owner', () => {
    expect(
      pageAccessDecision(
        actor({ loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'] }),
        CONTROL_CENTER_PATH,
      ),
    ).toBe('ALLOWED');
    // An active canonical identity without the SYSTEM_OWNER role is not enough.
    expect(
      pageAccessDecision(
        actor({ loginIdentity: 'yazeed', roles: ['EMPLOYEE'] }),
        CONTROL_CENTER_PATH,
      ),
    ).toBe('YAZEED_ONLY');
  });

  it('shows the navigation item only to the canonical owner', () => {
    const owner = actor({ loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'] });
    const nonOwner = actor({ roles: ['ADMIN', 'SYSTEM_OWNER'] });
    const ownerNav = visibleNavigation(owner).flatMap((group) => group.items.map((i) => i.href));
    const otherNav = visibleNavigation(nonOwner).flatMap((group) => group.items.map((i) => i.href));
    expect(ownerNav).toContain(CONTROL_CENTER_PATH);
    expect(otherNav).not.toContain(CONTROL_CENTER_PATH);
    expect(
      navigationGroups.flatMap((group) => group.items).find((i) => i.href === CONTROL_CENTER_PATH)
        ?.routeId,
    ).toBe(getRouteByPathname(CONTROL_CENTER_PATH)?.id);
  });
});
