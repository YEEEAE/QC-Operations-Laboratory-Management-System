import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { User } from '../../../src/modules/identity/domain/user.js';
import type { UserRepository } from '../../../src/modules/identity/ports/user-repository.js';
import type { PasswordHasher } from '../../../src/modules/identity/security/password-hasher.js';
import type { SessionService } from '../../../src/modules/identity/application/session-service.js';
import type { AuditService } from '../../../src/shared/audit/audit-service.js';
import { AdminResetPasswordUseCase } from '../../../src/modules/identity/application/admin-reset-password.js';
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
  recordSuccessfulLogin = async () => {};
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
  changePassword = async (id: string, passwordHash: string, expectedVersion: bigint) => {
    const current = this.store.get(id);
    if (!current || current.version !== expectedVersion) {
      throw new AppError('CONFLICT_STALE_VERSION');
    }
    this.store.set(id, { ...current, passwordHash, version: current.version + 1n });
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

  it('denies listing to an Admin role without the explicit permission', async () => {
    const users = new MemoryUsers([user()]);
    await expect(new ListUsersUseCase(users).execute({ actor: actor([]) })).rejects.toMatchObject({
      code: 'AUTHZ_PERMISSION_MISSING',
    });
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
    await expect(useCase.execute({ actor: actor([]), userId: found.id })).rejects.toMatchObject({
      code: 'AUTHZ_PERMISSION_MISSING',
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
    await new AdminResetPasswordUseCase(users, hasher, sessionStub, recorder).execute({
      actor: actor([reset]),
      userId: target.id,
      temporaryPassword: 'temp-next',
      expectedVersion: 3n,
      requestId: 'req-1',
    });
    expect(users.store.get(target.id)?.passwordHash).toBe('hash:temp-next');
    expect(sessionStub.revokeAllForUser).toHaveBeenCalledWith(target.id, 'PASSWORD_RESET');
    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ADMIN_RESET_PASSWORD' }),
    );
    await expect(
      new AdminResetPasswordUseCase(users, hasher, sessionStub, recorder).execute({
        actor: actor([reset], target.id),
        userId: target.id,
        temporaryPassword: 'temp-self',
        expectedVersion: 4n,
        requestId: 'req-2',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });
});
