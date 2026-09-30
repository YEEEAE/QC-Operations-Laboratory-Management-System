import { describe, expect, it } from 'vitest';
import { ChangePasswordUseCase } from '../../../src/modules/identity/application/change-password.js';
import { GetAccountUseCase } from '../../../src/modules/identity/application/get-account.js';
import type { User } from '../../../src/modules/identity/domain/user.js';
import type { UserRepository } from '../../../src/modules/identity/ports/user-repository.js';
import type {
  CredentialMutationCommit,
  CredentialMutation,
} from '../../../src/modules/identity/ports/credential-mutation.js';

const user: User = {
  id: 'u1',
  loginIdentity: 'qa',
  displayName: 'QA',
  passwordHash: 'old',
  accountState: 'ACTIVE',
  mustChangePassword: false,
  version: 1n,
};
class Users implements UserRepository {
  value = { ...user };
  findByLoginIdentity = async () => this.value;
  findById = async () => this.value;
  listUsers = async () => [this.value];
  recordSuccessfulLogin = async () => {};
  create = async () => this.value;
  updateProfile = async () => this.value;
  changePassword = async (_id: string, hash: string) => {
    this.value = { ...this.value, passwordHash: hash, version: this.value.version + 1n };
  };
  setAccountState = async () => {};
}
const actor = {
  id: 'u1',
  loginIdentity: 'qa',
  accountState: 'ACTIVE' as const,
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-IDN-VIEW-SELF' as const, scopes: ['OWN'] as const },
    { code: 'PERM-IDN-CHANGE-OWN-PASSWORD' as const, scopes: ['OWN'] as const },
  ],
};

describe('identity account use cases', () => {
  it('returns a safe account view without password material', async () => {
    const users = new Users();
    const result = await new GetAccountUseCase(users).execute(actor);
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.id).toBe('u1');
  });
  it('requires the current password and revokes sessions after change', async () => {
    const users = new Users();
    let commitInput: CredentialMutation | undefined;
    const hasher = {
      hash: async (v: string) => `hash:${v}`,
      verify: async (v: string, h: string) => v === 'current' && h === 'old',
    };
    const commit: CredentialMutationCommit = {
      execute: async (input) => {
        commitInput = input;
        users.value = {
          ...users.value,
          passwordHash: input.passwordHash,
          version: users.value.version + 1n,
        };
      },
    };
    await new ChangePasswordUseCase(users, hasher, commit).execute({
      actor,
      currentPassword: 'current',
      newPassword: 'new',
      requestId: 'req-1',
    });
    expect(users.value.passwordHash).toBe('hash:new');
    expect(commitInput).toMatchObject({
      action: 'CHANGE_PASSWORD',
      reason: 'PASSWORD_CHANGE',
      requestId: 'req-1',
    });
  });

  it('refuses missing and incorrect credentials before any credential commit', async () => {
    const users = new Users();
    let commits = 0;
    const commit: CredentialMutationCommit = {
      execute: async () => {
        commits += 1;
      },
    };
    const hasher = {
      hash: async (value: string) => `hash:${value}`,
      verify: async (value: string, encoded: string) => value === 'current' && encoded === 'old',
    };
    const useCase = new ChangePasswordUseCase(users, hasher, commit);

    await expect(
      useCase.execute({
        actor,
        currentPassword: '',
        newPassword: 'next',
        requestId: 'missing-current',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      fieldErrors: { currentPassword: ['errors.required'] },
    });
    await expect(
      useCase.execute({
        actor,
        currentPassword: 'wrong',
        newPassword: 'next',
        requestId: 'wrong-current',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
    expect(commits).toBe(0);
    expect(users.value.passwordHash).toBe('old');
  });
});
