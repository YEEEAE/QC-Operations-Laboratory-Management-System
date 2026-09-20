import { describe, expect, it } from 'vitest';
import { authorize } from '../../../src/shared/authorization/authorize.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const record = {
  type: 'LAB_TEST',
  id: 'lab-fixture-031-001',
  state: 'UNDER_REVIEW',
  ownerId: 'employee-031',
  authorId: 'employee-031',
  domain: 'LABORATORY',
};
const scope = { domain: 'LABORATORY' };
const supervisor: ActorContext = {
  id: 'supervisor-031',
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: [{ code: 'PERM-LAB-APPROVE', scopes: ['DOMAIN'] }],
};
const input = (actor: ActorContext, overrides: Partial<Parameters<typeof authorize>[0]> = {}) => ({
  actor,
  permission: 'PERM-LAB-APPROVE' as const,
  action: 'APPROVE',
  entity: record,
  scope,
  currentVersion: 4n,
  expectedVersion: 4n,
  businessCondition: true,
  ...overrides,
});

describe('effective action decisions on valid records', () => {
  it('allows an active supervisor with the explicit in-scope stage-one grant', () => {
    expect(authorize(input(supervisor)).allowed).toBe(true);
  });

  it('denies role-only and revoked permission grants', () => {
    expect(authorize(input({ ...supervisor, permissions: [] })).code).toBe(
      'AUTHZ_PERMISSION_MISSING',
    );
    expect(
      authorize(
        input({ ...supervisor, permissions: [{ ...supervisor.permissions[0]!, active: false }] }),
      ).code,
    ).toBe('AUTHZ_PERMISSION_MISSING');
  });

  it('denies inactive actors, changed scopes, wrong workflow states, and stale versions', () => {
    expect(authorize(input({ ...supervisor, accountState: 'DISABLED' })).code).toBe('AUTHZ_DENIED');
    expect(authorize(input(supervisor, { scope: { domain: 'QUALITY' } })).code).toBe(
      'AUTHZ_SCOPE_DENIED',
    );
    expect(authorize(input(supervisor, { entity: { ...record, state: 'APPROVED' } })).code).toBe(
      'AUTHZ_DENIED',
    );
    expect(authorize(input(supervisor, { expectedVersion: 3n })).code).toBe(
      'CONFLICT_STALE_VERSION',
    );
  });

  it('keeps final approval out of the stage-one state even for a named owner', () => {
    const namedOwner: ActorContext = {
      ...supervisor,
      id: 'owner-031',
      loginIdentity: 'yazeed',
      roles: ['SYSTEM_OWNER'],
      permissions: [{ code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] }],
    };
    expect(
      authorize(input(namedOwner, { permission: 'PERM-APR-APPROVE', entity: record })).code,
    ).toBe('AUTHZ_DENIED');
  });
});
