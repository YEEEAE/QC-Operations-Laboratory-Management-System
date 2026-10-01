import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { User } from '../../../src/modules/identity/domain/user.js';
import type {
  UserListFilter,
  UserRepository,
} from '../../../src/modules/identity/ports/user-repository.js';
import type { PasswordHasher } from '../../../src/modules/identity/security/password-hasher.js';
import type { SessionService } from '../../../src/modules/identity/application/session-service.js';
import type { AuditService } from '../../../src/shared/audit/audit-service.js';
import { AdminResetPasswordUseCase } from '../../../src/modules/identity/application/admin-reset-password.js';
import type {
  CredentialMutation,
  CredentialMutationCommit,
} from '../../../src/modules/identity/ports/credential-mutation.js';
import { CreateUserUseCase } from '../../../src/modules/identity/application/create-user.js';
import { DisableUserUseCase } from '../../../src/modules/identity/application/disable-user.js';
import { GetUserUseCase } from '../../../src/modules/identity/application/get-user.js';
import { ListUsersUseCase } from '../../../src/modules/identity/application/list-users.js';
import { UpdateUserUseCase } from '../../../src/modules/identity/application/update-user.js';

function user(overrides: Partial<User> = {}): User {
  return {
    id: '01900000-0000-7000-8000-000000000001',
    loginIdentity: 'member',
    displayName: 'Member',
    passwordHash: 'hash:old',
    accountState: 'ACTIVE',
    mustChangePassword: false,
    version: 3n,
    ...overrides,
  };
}

class MemoryUsers implements UserRepository {
  store = new Map<string, User>();
  constructor(seed: readonly User[] = []) {
    for (const entry of seed) this.store.set(entry.id, { ...entry });
  }
  findByLoginIdentity = async (loginIdentity: string) =>
    [...this.store.values()].find((entry) => entry.loginIdentity === loginIdentity);
  findById = async (id: string) => this.store.get(id);
  listUsers = async () => [...this.store.values()];
  listUsersPage = async (filter: UserListFilter) => {
    const matches = [...this.store.values()]
      .filter((entry) => !filter.query || entry.loginIdentity.includes(filter.query))
      .filter((entry) => !filter.accountState || entry.accountState === filter.accountState)
      .sort((left, right) => left.loginIdentity.localeCompare(right.loginIdentity));
    const start = (filter.page - 1) * filter.pageSize;
    const items = matches
      .slice(start, start + filter.pageSize)
      .map(({ passwordHash: _hash, ...entry }) => {
        void _hash;
        return entry;
      });
    return {
      items,
      total: matches.length,
      page: filter.page,
      pageSize: filter.pageSize,
    };
  };
  recordSuccessfulLogin = async () => {};
  createProvisioned: NonNullable<UserRepository['createProvisioned']> = async (input) =>
    this.create({
      ...input,
      accountState: 'ACTIVE',
      mustChangePassword: true,
    });
  create = async (input: {
    id: string;
    loginIdentity: string;
    email?: string;
    displayName: string;
    passwordHash: string;
    accountState: User['accountState'];
    mustChangePassword: boolean;
  }): Promise<User> => {
    const created: User = {
      id: input.id,
      loginIdentity: input.loginIdentity,
      ...(input.email ? { email: input.email } : {}),
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      accountState: input.accountState,
      mustChangePassword: input.mustChangePassword,
      version: 1n,
    };
    this.store.set(created.id, created);
    return created;
  };
  updateProfile = async (
    id: string,
    input: { displayName: string; email?: string; expectedVersion: bigint },
  ): Promise<User> => {
    const current = this.store.get(id);
    if (!current || current.version !== input.expectedVersion) {
      throw new AppError('CONFLICT_STALE_VERSION');
    }
    const next: User = {
      ...current,
      displayName: input.displayName,
      email: input.email,
      version: current.version + 1n,
    };
    this.store.set(id, next);
    return next;
  };
  changePassword = async (
    id: string,
    passwordHash: string,
    expectedVersion: bigint,
    _actorId?: string,
    _at?: Date,
    mustChangePassword = false,
  ) => {
    const current = this.store.get(id);
    if (!current || current.version !== expectedVersion) {
      throw new AppError('CONFLICT_STALE_VERSION');
    }
    this.store.set(id, {
      ...current,
      passwordHash,
      mustChangePassword,
      version: current.version + 1n,
    });
  };
  setAccountState = async (id: string, state: User['accountState'], expectedVersion: bigint) => {
    const current = this.store.get(id);
    if (!current || current.version !== expectedVersion) {
      throw new AppError('CONFLICT_STALE_VERSION');
    }
    this.store.set(id, { ...current, accountState: state, version: current.version + 1n });
  };
}

const hasher: PasswordHasher = {
  hash: async (value: string) => `hash:${value}`,
  verify: async () => true,
};

function sessions() {
  return { revokeAllForUser: vi.fn(async () => {}) } as unknown as SessionService;
}

function audit() {
  return { record: vi.fn(async () => {}) } as unknown as AuditService & {
    record: ReturnType<typeof vi.fn>;
  };
}

const actor = (permissions: ActorContext['permissions'], id = 'actor-1'): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions,
});

const manageUsers = { code: 'PERM-IDN-MANAGE-USERS' as const, scopes: ['GLOBAL'] as const };
const assignRoles = { code: 'PERM-ADM-ROLE-ASSIGN' as const, scopes: ['GLOBAL'] as const };
const assignScopes = { code: 'PERM-ADM-SCOPE-ASSIGN' as const, scopes: ['GLOBAL'] as const };
const deactivate = { code: 'PERM-IDN-DEACTIVATE' as const, scopes: ['GLOBAL'] as const };
const reset = { code: 'PERM-IDN-RESET-PASSWORD' as const, scopes: ['GLOBAL'] as const };

describe('identity administration use cases', () => {
  it('lists members as safe views without password material', async () => {
    const users = new MemoryUsers([user()]);
    const result = await new ListUsersUseCase(users).execute({ actor: actor([manageUsers]) });
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('passwordHash');
    expect(result[0]?.loginIdentity).toBe('member');
  });

  it('pages a large user register with source filters and a safe projection', async () => {
    const seed = Array.from({ length: 501 }, (_, index) =>
      user({ id: `user-${index}`, loginIdentity: `member-${String(index).padStart(3, '0')}` }),
    );
    const repository = new MemoryUsers(seed);
    const useCase = new ListUsersUseCase(repository);
    const first = await useCase.executePage({
      actor: actor([]),
      filter: { page: 1, pageSize: 25 },
    });
    const last = await useCase.executePage({
      actor: actor([]),
      filter: { page: 21, pageSize: 25 },
    });
    const filtered = await useCase.executePage({
      actor: actor([]),
      filter: { query: 'member-500', page: 1, pageSize: 25 },
    });
    expect(first.total).toBe(501);
    expect(first.items).toHaveLength(25);
    expect(last.items).toHaveLength(1);
    expect(filtered.items.map((entry) => entry.loginIdentity)).toEqual(['member-500']);
    expect(first.items[0]).not.toHaveProperty('passwordHash');
  });

  it('allows active users to list safe member views without mutation authority', async () => {
    const users = new MemoryUsers([user()]);
    await expect(new ListUsersUseCase(users).execute({ actor: actor([]) })).resolves.toHaveLength(
      1,
    );
  });

  it('denies listing to inactive accounts even with the grant', async () => {
    const users = new MemoryUsers([user()]);
    const inactive: ActorContext = { ...actor([manageUsers]), accountState: 'DISABLED' };
    await expect(new ListUsersUseCase(users).execute({ actor: inactive })).rejects.toMatchObject({
      code: 'AUTHZ_DENIED',
    });
  });

  it('reads one member safely and reports missing members as not found', async () => {
    const users = new MemoryUsers([user()]);
    const useCase = new GetUserUseCase(users);
    const found = await useCase.execute({
      actor: actor([manageUsers]),
      userId: '01900000-0000-7000-8000-000000000001',
    });
    expect(found).not.toHaveProperty('passwordHash');
    await expect(
      useCase.execute({ actor: actor([manageUsers]), userId: 'missing' }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    await expect(useCase.execute({ actor: actor([]), userId: found.id })).resolves.toMatchObject({
      id: found.id,
    });
  });

  it('creates a member ACTIVE with forced password change and audit', async () => {
    const users = new MemoryUsers();
    const recorder = audit();
    const created = await new CreateUserUseCase(users, hasher, recorder).execute({
      actor: actor([manageUsers]),
      loginIdentity: 'new-member',
      displayName: 'New Member',
      temporaryPassword: 'temp-1',
      requestId: 'req-1',
    });
    expect(created).not.toHaveProperty('passwordHash');
    expect(created.accountState).toBe('ACTIVE');
    expect(created.mustChangePassword).toBe(true);
    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE_USER', subjectId: created.id }),
    );
    await expect(
      new CreateUserUseCase(users, hasher, recorder).execute({
        actor: actor([]),
        loginIdentity: 'blocked',
        displayName: 'Blocked',
        temporaryPassword: 'temp-2',
        requestId: 'req-2',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });

  it('lets a manager with only global MANAGE create an account without initial grants', async () => {
    const users = new MemoryUsers();
    const created = await new CreateUserUseCase(users, hasher).execute({
      actor: { ...actor([manageUsers]), roles: ['MANAGER'] },
      loginIdentity: 'manager-created-member',
      displayName: 'Manager Created Member',
      temporaryPassword: 'temp-1',
      requestId: 'manager-create-1',
      roleCodes: [],
      scopes: [],
    });

    expect(created.accountState).toBe('ACTIVE');
    expect(created.mustChangePassword).toBe(true);
    expect(users.store.has(created.id)).toBe(true);
  });

  it('denies initial role and scope grants without each assignment permission before hashing or writes', async () => {
    const users = new MemoryUsers();
    const create = vi.spyOn(users, 'create');
    const createProvisioned = vi.spyOn(users, 'createProvisioned');
    const hash = vi.fn(async (value: string) => `hash:${value}`);
    const recorder = audit();
    const useCase = new CreateUserUseCase(users, { hash, verify: hasher.verify }, recorder);

    await expect(
      useCase.execute({
        actor: { ...actor([manageUsers]), roles: ['MANAGER'] },
        loginIdentity: 'denied-provisioned-member',
        displayName: 'Denied Member',
        temporaryPassword: 'temp-1',
        roleCodes: ['CC_MEMBER'],
        scopes: [{ kind: 'TEAM', value: 'qc-lab' }],
        requestId: 'manager-provision-denied-1',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });

    expect(hash).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(createProvisioned).not.toHaveBeenCalled();
    expect(users.store.size).toBe(0);
    expect(recorder.record).not.toHaveBeenCalled();

    await expect(
      useCase.execute({
        actor: { ...actor([manageUsers, assignRoles]), roles: ['MANAGER'] },
        loginIdentity: 'denied-scope-member',
        displayName: 'Denied Scope Member',
        temporaryPassword: 'temp-2',
        scopes: [{ kind: 'TEAM', value: 'qc-lab' }],
        requestId: 'manager-scope-denied-1',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(users.store.size).toBe(0);
  });

  it('provisions only the requested grants when MANAGE and matching assignment permissions exist', async () => {
    const users = new MemoryUsers();
    const createProvisioned = vi.spyOn(users, 'createProvisioned');
    const created = await new CreateUserUseCase(users, hasher).execute({
      actor: { ...actor([manageUsers, assignRoles, assignScopes]), roles: ['MANAGER'] },
      loginIdentity: 'manager-authorized-member',
      displayName: 'Manager Authorized Member',
      temporaryPassword: 'temp-1',
      roleCodes: ['CC_MEMBER'],
      scopes: [{ kind: 'TEAM', value: 'qc-lab' }],
      requestId: 'manager-provision-allowed-1',
    });

    expect(created.accountState).toBe('ACTIVE');
    expect(created.mustChangePassword).toBe(true);
    expect(createProvisioned).toHaveBeenCalledWith(
      expect.objectContaining({
        roleCodes: ['CC_MEMBER'],
        scopes: [{ kind: 'TEAM', value: 'qc-lab' }],
      }),
    );
  });

  it('requires global scope on the explicit initial role-assignment grant', async () => {
    const users = new MemoryUsers();
    const hash = vi.fn(async (value: string) => `hash:${value}`);
    const useCase = new CreateUserUseCase(users, { hash, verify: hasher.verify });

    await expect(
      useCase.execute({
        actor: actor([manageUsers, { code: 'PERM-ADM-ROLE-ASSIGN', scopes: ['TEAM'] }]),
        loginIdentity: 'out-of-scope-provision',
        displayName: 'Out of Scope Member',
        temporaryPassword: 'temp-1',
        roleCodes: ['CC_MEMBER'],
        requestId: 'scope-denied-provision-1',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SCOPE_DENIED' });

    expect(hash).not.toHaveBeenCalled();
    expect(users.store.size).toBe(0);
  });

  it('rejects stale profile updates before mutation', async () => {
    const users = new MemoryUsers([user()]);
    const recorder = audit();
    const useCase = new UpdateUserUseCase(users, recorder);
    await expect(
      useCase.execute({
        actor: actor([manageUsers]),
        userId: '01900000-0000-7000-8000-000000000001',
        displayName: 'Stale',
        expectedVersion: 1n,
        requestId: 'req-1',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(users.store.get('01900000-0000-7000-8000-000000000001')?.displayName).toBe('Member');
    const updated = await useCase.execute({
      actor: actor([manageUsers]),
      userId: '01900000-0000-7000-8000-000000000001',
      displayName: 'Renamed',
      expectedVersion: 3n,
      requestId: 'req-2',
    });
    expect(updated.displayName).toBe('Renamed');
    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'UPDATE_USER' }),
    );
  });

  it('disables a member with session invalidation and audit, never the self account', async () => {
    const target = user();
    const users = new MemoryUsers([target]);
    const sessionStub = sessions();
    const recorder = audit();
    await new DisableUserUseCase(users, sessionStub, recorder).execute({
      actor: actor([deactivate]),
      userId: target.id,
      expectedVersion: 3n,
      requestId: 'req-1',
    });
    expect(users.store.get(target.id)?.accountState).toBe('DISABLED');
    expect(sessionStub.revokeAllForUser).toHaveBeenCalledWith(target.id, 'ACCOUNT_DISABLED');
    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DISABLE_USER' }),
    );
    await expect(
      new DisableUserUseCase(users, sessionStub, recorder).execute({
        actor: actor([deactivate], target.id),
        userId: target.id,
        expectedVersion: 4n,
        requestId: 'req-2',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('resets passwords with session invalidation and audit, never the self account', async () => {
    const target = user();
    const users = new MemoryUsers([target]);
    const sessionStub = sessions();
    const recorder = audit();
    const commit: CredentialMutationCommit = {
      execute: async (input: CredentialMutation) => {
        await users.changePassword(
          input.userId,
          input.passwordHash,
          input.expectedVersion,
          input.actorId,
          input.at,
          input.mustChangePassword,
        );
        await sessionStub.revokeAllForUser(input.userId, input.reason);
        await recorder.record({
          actorType: 'USER',
          actorId: input.actorId,
          subjectType: 'USER',
          subjectId: input.userId,
          action: input.action,
          requestId: input.requestId,
        });
      },
    };
    await new AdminResetPasswordUseCase(users, hasher, commit).execute({
      actor: actor([reset]),
      userId: target.id,
      temporaryPassword: 'temp-next',
      expectedVersion: 3n,
      requestId: 'req-1',
    });
    expect(users.store.get(target.id)?.passwordHash).toBe('hash:temp-next');
    expect(users.store.get(target.id)?.mustChangePassword).toBe(true);
    expect(sessionStub.revokeAllForUser).toHaveBeenCalledWith(target.id, 'PASSWORD_RESET');
    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ADMIN_RESET_PASSWORD' }),
    );
    await expect(
      new AdminResetPasswordUseCase(users, hasher, commit).execute({
        actor: actor([reset], target.id),
        userId: target.id,
        temporaryPassword: 'temp-self',
        expectedVersion: 4n,
        requestId: 'req-2',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });
});
