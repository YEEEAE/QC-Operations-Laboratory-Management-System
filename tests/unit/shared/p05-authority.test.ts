import { describe, expect, it } from 'vitest';
import { isP05Authority } from '../../../src/shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

function actor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    id: 'u-1',
    loginIdentity: 'test-user',
    accountState: 'ACTIVE',
    roles: [],
    permissions: [],
    ...overrides,
  };
}

describe('P-05 authority', () => {
  it.each([
    ['Employee', ['EMPLOYEE'], 'u-1', true, false],
    ['Supervisor', ['SUPERVISOR'], 'u-1', true, true],
    ['Manager/QCM', ['MANAGER'], 'u-1', true, true],
    ['Admin only', ['ADMIN'], 'u-1', true, false],
    ['named yazeed owner', ['SYSTEM_OWNER'], 'owner-uuid', true, true],
    ['other system owner identity', ['SYSTEM_OWNER'], 'other-user', true, false],
    ['Admin + Manager', ['ADMIN', 'MANAGER'], 'u-1', true, true],
    ['inactive Manager', ['MANAGER'], 'u-1', false, false],
  ])('%s resolves to %s', (_name, roles, id, active, expected) => {
    expect(
      isP05Authority(
        actor({
          id,
          loginIdentity: roles.includes('SYSTEM_OWNER') && expected ? 'yazeed' : 'other-user',
          roles,
          accountState: active ? 'ACTIVE' : 'INACTIVE',
        }),
      ),
    ).toBe(expected);
  });

  it('requires canonical login identity instead of the legacy id value', () => {
    expect(isP05Authority(actor({ id: 'yazeed', roles: ['SYSTEM_OWNER'] }))).toBe(false);
    expect(
      isP05Authority(
        actor({
          id: '01900000-0000-7000-8000-000000000001',
          loginIdentity: 'yazeed',
          roles: ['SYSTEM_OWNER'],
        }),
      ),
    ).toBe(true);
    expect(
      isP05Authority(
        actor({
          id: '01900000-0000-7000-8000-000000000002',
          loginIdentity: 'other-user',
          roles: ['SYSTEM_OWNER'],
        }),
      ),
    ).toBe(false);
    expect(
      isP05Authority(
        actor({ id: '01900000-0000-7000-8000-000000000003', loginIdentity: 'yazeed', roles: [] }),
      ),
    ).toBe(false);
    expect(
      isP05Authority(
        actor({
          id: '01900000-0000-7000-8000-000000000004',
          loginIdentity: 'yazeed',
          roles: ['SYSTEM_OWNER'],
          accountState: 'INACTIVE',
        }),
      ),
    ).toBe(false);
  });
});
