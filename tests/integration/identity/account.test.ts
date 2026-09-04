import { describe, expect, it } from 'vitest';
import { ChangePasswordUseCase } from '../../../src/modules/identity/application/change-password.js';
import { GetAccountUseCase } from '../../../src/modules/identity/application/get-account.js';
import type { User } from '../../../src/modules/identity/domain/user.js';
import type { UserRepository } from '../../../src/modules/identity/ports/user-repository.js';
import type { SessionRepository } from '../../../src/modules/identity/ports/session-repository.js';
import { SessionService } from '../../../src/modules/identity/application/session-service.js';

const user: User = { id: 'u1', loginIdentity: 'qa', displayName: 'QA', passwordHash: 'old', accountState: 'ACTIVE', mustChangePassword: false, version: 1n };
class Users implements UserRepository { value = { ...user }; findByLoginIdentity = async () => this.value; findById = async () => this.value; recordSuccessfulLogin = async () => {}; create = async () => this.value; updateProfile = async () => this.value; changePassword = async (_id: string, hash: string) => { this.value = { ...this.value, passwordHash: hash, version: this.value.version + 1n }; }; setAccountState = async () => {}; }
class Sessions implements SessionRepository { revoked = false; create = async (input: any) => ({ ...input, version: 1n }); findByTokenHash = async () => undefined; revoke = async () => { this.revoked = true; }; revokeAllForUser = async () => { this.revoked = true; }; }
const actor = { id: 'u1', accountState: 'ACTIVE' as const, roles: ['EMPLOYEE'], permissions: [{ code: 'PERM-IDN-VIEW-SELF' as const, scopes: ['OWN'] as const }, { code: 'PERM-IDN-CHANGE-OWN-PASSWORD' as const, scopes: ['OWN'] as const }] };

describe('identity account use cases', () => {
  it('returns a safe account view without password material', async () => { const users = new Users(); const result = await new GetAccountUseCase(users).execute(actor); expect(result).not.toHaveProperty('passwordHash'); expect(result.id).toBe('u1'); });
  it('requires the current password and revokes sessions after change', async () => { const users = new Users(); const sessions = new Sessions(); const hasher = { hash: async (v: string) => `hash:${v}`, verify: async (v: string, h: string) => v === 'current' && h === 'old' }; const service = new SessionService(users, sessions, { now: () => new Date() }, 1000); await new ChangePasswordUseCase(users, hasher, service).execute({ actor, currentPassword: 'current', newPassword: 'new', requestId: 'req-1' }); expect(users.value.passwordHash).toBe('hash:new'); expect(sessions.revoked).toBe(true); });
});
