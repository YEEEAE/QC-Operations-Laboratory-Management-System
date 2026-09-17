import { describe, expect, it, vi } from 'vitest';
import { AssignUserScopeUseCase } from '../../../src/modules/administration/application/assign-user-scope.js';
import { RemoveUserScopeUseCase } from '../../../src/modules/administration/application/remove-user-scope.js';
import type {
  AuthorizationRepository,
  UserScopeRecord,
} from '../../../src/modules/administration/ports/authorization-repository.js';
import {
  SCOPE_KINDS,
  normalizeScopeValue,
  scopeRequiresValue,
} from '../../../src/shared/authorization/types.js';
import {
  isProtectedOwnerRoleGrant,
  isProtectedOwnerScope,
} from '../../../src/shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const scope = (kind: UserScopeRecord['kind'], value: string | null = null): UserScopeRecord => ({
  id: `scope-${kind}`,
  userId: 'member-1',
  kind,
  value,
  assignedBy: 'actor-1',
  assignedAt: new Date('2026-09-18T00:00:00Z'),
  revokedAt: null,
});

const actor = (overrides: Partial<ActorContext> = {}): ActorContext => ({
  id: 'actor-1',
  loginIdentity: 'operator',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions: [{ code: 'PERM-ADM-SCOPE-ASSIGN', scopes: ['GLOBAL'] }],
  ...overrides,
});

const repository = (overrides: Partial<AuthorizationRepository> = {}): AuthorizationRepository =>
  ({
    listRoles: vi.fn(),
    getRole: vi.fn(),
    listPermissions: vi.fn(),
    listRolePermissions: vi.fn(),
    replaceRolePermissions: vi.fn(),
    listUserScopes: vi.fn().mockResolvedValue([]),
    listUserRoles: vi.fn().mockResolvedValue([]),
    assignUserRole: vi.fn(),
    removeUserRole: vi.fn(),
    replaceUserScopes: vi.fn(),
    assignUserScope: vi.fn().mockResolvedValue([]),
    removeUserScope: vi.fn().mockResolvedValue([]),
    ...overrides,
  }) as AuthorizationRepository;

describe('AssignUserScopeUseCase', () => {
  it('grants exactly one scope and leaves every unrelated scope untouched', async () => {
    const remaining = [scope('SITE', 'site-1'), scope('DOMAIN', 'quality')];
    const repo = repository({
      assignUserScope: vi
        .fn()
        .mockResolvedValue([scope('SITE', 'site-1'), scope('DOMAIN', 'quality'), scope('GLOBAL')]),
    });
    const result = await new AssignUserScopeUseCase(repo).execute({
      actor: actor(),
      userId: 'member-1',
      kind: 'GLOBAL',
      requestId: 'req-assign',
    });
    expect(repo.assignUserScope).toHaveBeenCalledWith({
      userId: 'member-1',
      kind: 'GLOBAL',
      actorId: 'actor-1',
      requestId: 'req-assign',
    });
    // The pre-existing grants survive the incremental grant.
    expect(result.map((entry) => entry.kind)).toEqual(
      expect.arrayContaining(['SITE', 'DOMAIN', 'GLOBAL']),
    );
    expect(remaining).toHaveLength(2);
  });

  it('normalizes the value for a named collection', async () => {
    const repo = repository();
    await new AssignUserScopeUseCase(repo).execute({
      actor: actor(),
      userId: 'member-1',
      kind: 'SITE',
      value: '  site-1  ',
      requestId: 'req-assign',
    });
    expect(repo.assignUserScope).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'SITE', value: 'site-1' }),
    );
  });

  it('denies the grant without the explicit scope-assignment permission', async () => {
    const repo = repository();
    await expect(
      new AssignUserScopeUseCase(repo).execute({
        actor: actor({ permissions: [], roles: ['ADMIN'] }),
        userId: 'member-1',
        kind: 'GLOBAL',
        requestId: 'req-assign',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(repo.assignUserScope).not.toHaveBeenCalled();
  });

  it('denies an inactive actor even when the grant exists', async () => {
    const repo = repository();
    await expect(
      new AssignUserScopeUseCase(repo).execute({
        actor: actor({ accountState: 'DISABLED' }),
        userId: 'member-1',
        kind: 'GLOBAL',
        requestId: 'req-assign',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('never lets an actor widen their own visibility', async () => {
    const repo = repository();
    await expect(
      new AssignUserScopeUseCase(repo).execute({
        actor: actor({ id: 'member-1' }),
        userId: 'member-1',
        kind: 'GLOBAL',
        requestId: 'req-assign',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repo.assignUserScope).not.toHaveBeenCalled();
  });

  it.each([
    { kind: 'SITE' as const, value: undefined },
    { kind: 'TEAM' as const, value: '   ' },
    { kind: 'GLOBAL' as const, value: 'site-1' },
  ])('rejects the invalid pair $kind/$value', async ({ kind, value }) => {
    const repo = repository();
    await expect(
      new AssignUserScopeUseCase(repo).execute({
        actor: actor(),
        userId: 'member-1',
        kind,
        value,
        requestId: 'req-assign',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(repo.assignUserScope).not.toHaveBeenCalled();
  });

  it('rejects a scope kind outside the canonical vocabulary', async () => {
    const repo = repository();
    await expect(
      new AssignUserScopeUseCase(repo).execute({
        actor: actor(),
        userId: 'member-1',
        kind: 'TENANT' as never,
        requestId: 'req-assign',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});

describe('RemoveUserScopeUseCase', () => {
  it('revokes one grant and preserves the unrelated ones', async () => {
    const repo = repository({
      removeUserScope: vi.fn().mockResolvedValue([scope('SITE', 'site-1')]),
    });
    const result = await new RemoveUserScopeUseCase(repo).execute({
      actor: actor(),
      userId: 'member-1',
      kind: 'TEAM',
      value: 'team-1',
      requestId: 'req-remove',
    });
    expect(repo.removeUserScope).toHaveBeenCalledWith({
      userId: 'member-1',
      kind: 'TEAM',
      value: 'team-1',
      actorId: 'actor-1',
      requestId: 'req-remove',
    });
    expect(result.map((entry) => entry.kind)).toEqual(['SITE']);
  });

  it('omits the value for a valueless grant', async () => {
    const repo = repository();
    await new RemoveUserScopeUseCase(repo).execute({
      actor: actor(),
      userId: 'member-1',
      kind: 'GLOBAL',
      requestId: 'req-remove',
    });
    const call = (repo.removeUserScope as ReturnType<typeof vi.fn>).mock.calls[0]![0] as object;
    expect(call).toMatchObject({ kind: 'GLOBAL', actorId: 'actor-1' });
    expect(call).not.toHaveProperty('value');
  });

  it('denies the revocation without the explicit scope-assignment permission', async () => {
    const repo = repository();
    await expect(
      new RemoveUserScopeUseCase(repo).execute({
        actor: actor({ permissions: [] }),
        userId: 'member-1',
        kind: 'SITE',
        value: 'site-1',
        requestId: 'req-remove',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(repo.removeUserScope).not.toHaveBeenCalled();
  });

  it('never lets an actor revoke their own grants', async () => {
    const repo = repository();
    await expect(
      new RemoveUserScopeUseCase(repo).execute({
        actor: actor({ id: 'member-1' }),
        userId: 'member-1',
        kind: 'SITE',
        value: 'site-1',
        requestId: 'req-remove',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repo.removeUserScope).not.toHaveBeenCalled();
  });
});

describe('canonical scope vocabulary and owner protections', () => {
  it('exposes exactly the persisted scope kinds', () => {
    expect(SCOPE_KINDS).toEqual([
      'OWN',
      'ASSIGNED',
      'TEAM',
      'DEPARTMENT',
      'SITE',
      'DOMAIN',
      'GLOBAL',
    ]);
  });

  it('requires a value only for the collection-naming kinds', () => {
    expect(scopeRequiresValue('TEAM')).toBe(true);
    expect(scopeRequiresValue('SITE')).toBe(true);
    expect(scopeRequiresValue('OWN')).toBe(false);
    expect(scopeRequiresValue('ASSIGNED')).toBe(false);
    expect(scopeRequiresValue('GLOBAL')).toBe(false);
  });

  it('normalizes or fails closed for every kind', () => {
    expect(normalizeScopeValue('SITE', '  site-1 ')).toEqual({ ok: true, value: 'site-1' });
    expect(normalizeScopeValue('SITE', '')).toEqual({ ok: false });
    expect(normalizeScopeValue('GLOBAL', '')).toEqual({ ok: true });
    expect(normalizeScopeValue('GLOBAL', 'site-1')).toEqual({ ok: false });
  });

  it('protects the canonical owner role and GLOBAL scope only', () => {
    expect(isProtectedOwnerRoleGrant('yazeed', 'SYSTEM_OWNER')).toBe(true);
    expect(isProtectedOwnerRoleGrant('yazeed', 'ADMIN')).toBe(false);
    expect(isProtectedOwnerRoleGrant('verify-user', 'SYSTEM_OWNER')).toBe(false);
    expect(isProtectedOwnerScope('yazeed', 'GLOBAL')).toBe(true);
    expect(isProtectedOwnerScope('yazeed', 'SITE')).toBe(false);
    expect(isProtectedOwnerScope('verify-user', 'GLOBAL')).toBe(false);
  });
});
