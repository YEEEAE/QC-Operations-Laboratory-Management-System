import { describe, expect, it } from 'vitest';
import { SessionService } from '../../../src/modules/identity/application/session-service.js';
import type { Session } from '../../../src/modules/identity/domain/session.js';
import type { User } from '../../../src/modules/identity/domain/user.js';
import type { SessionRepository } from '../../../src/modules/identity/ports/session-repository.js';
import type { UserRepository } from '../../../src/modules/identity/ports/user-repository.js';

const baseUser: User = {
  id: 'u1',
  loginIdentity: 'qa',
  displayName: 'QA',
  passwordHash: 'not-used',
  accountState: 'ACTIVE',
  mustChangePassword: false,
  version: 1n,
};

class MemoryUsers implements UserRepository {
  constructor(public user: User = baseUser) {}
  async findByLoginIdentity() {
    return this.user;
  }
  async findById() {
    return this.user;
  }
  async listUsers() {
    return [this.user];
  }
  async recordSuccessfulLogin() {}
  async create() {
    return this.user;
  }
  async updateProfile() {
    return this.user;
  }
  async changePassword() {}
  async setAccountState(_id: string, state: User['accountState']) {
    this.user = { ...this.user, accountState: state };
  }
}

class MemorySessions implements SessionRepository {
  value?: Session;
  async create(input: Omit<Session, 'version'>) {
    this.value = { ...input, version: 1n };
    return this.value;
  }
  async findByTokenHash(hash: string) {
    return this.value?.tokenHash === hash ? this.value : undefined;
  }
  async revoke(id: string, at: Date, reason: string) {
    if (this.value?.id === id) this.value = { ...this.value, revokedAt: at, revokedReason: reason };
  }
  async revokeAllForUser() {
    if (this.value) this.value = { ...this.value, revokedAt: new Date(), revokedReason: 'ALL' };
  }
}

function setup() {
  const now = new Date('2026-09-08T00:00:00.000Z');
  const users = new MemoryUsers();
  const sessions = new MemorySessions();
  const service = new SessionService(users, sessions, { now: () => now }, 60_000);
  return { now, users, sessions, service };
}

describe('server session security', () => {
  it('denies expired, revoked, and disabled sessions', async () => {
    const expired = setup();
    const created = await expired.service.createForUser('u1');
    expired.sessions.value = { ...created.session, expiresAt: new Date(expired.now.getTime() - 1) };
    await expect(expired.service.resolve(created.token)).rejects.toMatchObject({
      code: 'AUTH_SESSION_EXPIRED',
    });

    const revoked = setup();
    const revokedSession = await revoked.service.createForUser('u1');
    await revoked.service.revoke(revokedSession.session.id);
    await expect(revoked.service.resolve(revokedSession.token)).rejects.toMatchObject({
      code: 'AUTH_SESSION_REVOKED',
    });

    const disabled = setup();
    const disabledSession = await disabled.service.createForUser('u1');
    await disabled.users.setAccountState('u1', 'DISABLED');
    await expect(disabled.service.resolve(disabledSession.token)).rejects.toMatchObject({
      code: 'AUTH_ACCOUNT_DISABLED',
    });
  });
});
