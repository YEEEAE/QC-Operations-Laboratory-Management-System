import { describe, expect, it } from 'vitest';
import { pageAccessDecision } from '../../../src/shared/routing/page-access.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor = (overrides: Partial<ActorContext> = {}): ActorContext => ({
  id: 'actor-1',
  loginIdentity: 'employee',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [],
  ...overrides,
});

describe('canonical page access', () => {
  it('requires authentication for ordinary application pages', () => {
    expect(pageAccessDecision(undefined, '/admin')).toBe('AUTHENTICATION_REQUIRED');
  });

  it('allows every active authenticated persona to open ordinary pages', () => {
    for (const current of [
      actor({ loginIdentity: 'employee', roles: ['EMPLOYEE'] }),
      actor({ loginIdentity: 'inspector', roles: ['INSPECTOR'] }),
      actor({ loginIdentity: 'supervisor', roles: ['SUPERVISOR'] }),
      actor({ loginIdentity: 'manager', roles: ['MANAGER'] }),
      actor({ loginIdentity: 'admin', roles: ['ADMIN'] }),
      actor({ loginIdentity: 'owner-like', roles: ['SYSTEM_OWNER'] }),
      actor({ loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'] }),
    ]) {
      expect(pageAccessDecision(current, '/admin/users')).toBe('ALLOWED');
      expect(pageAccessDecision(current, '/quarantine/admin')).toBe('ALLOWED');
    }
  });

  it('isolates owner-only routes by canonical login identity, not role label', () => {
    expect(pageAccessDecision(actor({ roles: ['SYSTEM_OWNER'] }), '/system/health')).toBe(
      'YAZEED_ONLY',
    );
    expect(
      pageAccessDecision(
        actor({ loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'] }),
        '/system/health',
      ),
    ).toBe('ALLOWED');
  });

  it('rejects inactive actors even when they carry the canonical owner identity', () => {
    expect(
      pageAccessDecision(
        actor({ loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'], accountState: 'DISABLED' }),
        '/system/health',
      ),
    ).toBe('AUTHENTICATION_REQUIRED');
  });
});
