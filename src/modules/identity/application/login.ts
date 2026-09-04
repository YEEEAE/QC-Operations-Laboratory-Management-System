import { AppError } from '../../../shared/errors/app-error.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { PasswordHasher } from '../security/password-hasher.js';
import { SessionService, sessionCookie } from './session-service.js';
export interface LoginResult { userId: string; cookie: string; mustChangePassword: boolean; }
export class LoginUseCase {
  constructor(private readonly users: UserRepository, private readonly passwords: PasswordHasher, private readonly sessions: SessionService) {}
  async execute(loginIdentity: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByLoginIdentity(loginIdentity);
    const valid = user ? await this.passwords.verify(password, user.passwordHash) : false;
    if (!user || !valid || user.accountState !== 'ACTIVE') throw new AppError('AUTH_INVALID_CREDENTIALS', { userSafe: true, messageKey: 'errors.auth_invalid_credentials' });
    const created = await this.sessions.createForUser(user.id);
    await this.users.recordSuccessfulLogin(user.id, new Date());
    return { userId: user.id, cookie: sessionCookie(created.token), mustChangePassword: user.mustChangePassword };
  }
}
