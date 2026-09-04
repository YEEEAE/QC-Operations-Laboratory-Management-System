import { describe, expect, it } from 'vitest';
import { authorize } from '../../../src/shared/authorization/authorize';
import { AppError } from '../../../src/shared/errors/app-error';

const base = {
  actor: {
    id: 'reviewer-1',
    accountState: 'ACTIVE' as const,
    roles: ['SUPERVISOR'],
    permissions: [{ code: 'PERM-INSP-REVIEW' as const, scopes: ['DOMAIN' as const] }],
  },
  permission: 'PERM-INSP-REVIEW' as const,
  action: 'REVIEW' as const,
  entity: {
    type: 'INSPECTION_REPORT',
    id: 'report-1',
    state: 'SUBMITTED',
    authorId: 'author-1',
    domain: 'INSPECTION',
  },
  scope: { domain: 'INSPECTION' },
  currentVersion: 4,
  expectedVersion: 4,
  sod: { actorId: 'reviewer-1', authorId: 'author-1' },
  businessCondition: true,
};

describe('central authorization', () => {
  it('allows an explicitly permitted in-scope action', () => {
    expect(authorize(base)).toMatchObject({ allowed: true });
  });

  it('denies missing permission, inactive account, wrong scope, stale version and undefined policy', () => {
    expect(authorize({ ...base, actor: { ...base.actor, permissions: [] } }).allowed).toBe(false);
    expect(authorize({ ...base, actor: { ...base.actor, accountState: 'DISABLED' } }).allowed).toBe(
      false,
    );
    expect(authorize({ ...base, scope: { domain: 'QUALITY' } }).allowed).toBe(false);
    expect(authorize({ ...base, expectedVersion: 3 })).toMatchObject({
      allowed: false,
      code: 'CONFLICT_STALE_VERSION',
    });
    expect(
      authorize({
        ...base,
        permission: 'PERM-INSP-APPROVE',
        action: 'APPROVE',
        actor: { ...base.actor, permissions: [{ code: 'PERM-INSP-APPROVE', scopes: ['DOMAIN'] }] },
      }),
    ).toMatchObject({ allowed: false, code: 'AUTHZ_DENIED' });
  });

  it('throws the canonical stale-version error when required by the caller', () => {
    expect(() => authorize({ ...base, expectedVersion: 2 }, { throwOnDeny: true })).toThrowError(
      expect.objectContaining<AppError>({ code: 'CONFLICT_STALE_VERSION' }),
    );
  });
});
