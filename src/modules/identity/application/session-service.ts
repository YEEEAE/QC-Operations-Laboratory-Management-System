import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';
import { systemClock, type Clock } from '../../../shared/time/clock.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { canAuthenticate } from '../domain/account-state.js';
import { isSessionUsable, type Session } from '../domain/session.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { SessionRepository } from '../ports/session-repository.js';

export const SESSION_COOKIE_NAME = '__Host-qc_session';
export function hashSessionToken(token: string): string { return createHash('sha256').update(token, 'utf8').digest('hex'); }
export function sessionCookie(token: string, secure = process.env.NODE_ENV === 'production'): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
}
export function expiredCookie(secure = process.env.NODE_ENV === 'production'): string { return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}; Max-Age=0`; }

export class SessionService {
  constructor(private readonly users: UserRepository, private readonly sessions: SessionRepository, private readonly clock: Clock = systemClock, private readonly lifetimeMs: number) {}
  async createForUser(userId: string): Promise<{ session: Session; token: string }> {
    const user = await this.users.findById(userId);
    if (!user || !canAuthenticate(user.accountState)) throw new AppError('AUTH_ACCOUNT_DISABLED', { userSafe: true });
    const token = randomBytes(32).toString('base64url');
    const now = this.clock.now();
    const session = await this.sessions.create({ id: uuidv7(), userId, tokenHash: hashSessionToken(token), createdAt: now, expiresAt: new Date(now.getTime() + this.lifetimeMs) });
    return { session, token };
  }
  async resolve(token: string): Promise<{ session: Session; user: NonNullable<Awaited<ReturnType<UserRepository['findById']>>> }> {
    const session = await this.sessions.findByTokenHash(hashSessionToken(token));
    const user = session ? await this.users.findById(session.userId) : undefined;
    if (!session || !user) throw new AppError('AUTH_SESSION_EXPIRED', { userSafe: true });
    if (session.revokedAt) throw new AppError('AUTH_SESSION_REVOKED', { userSafe: true });
    if (!isSessionUsable(session, this.clock.now())) throw new AppError('AUTH_SESSION_EXPIRED', { userSafe: true });
    if (!canAuthenticate(user.accountState)) throw new AppError('AUTH_ACCOUNT_DISABLED', { userSafe: true });
    return { session, user };
  }
  async revoke(sessionId: string): Promise<void> { await this.sessions.revoke(sessionId, this.clock.now(), 'LOGOUT'); }
  async revokeAllForUser(userId: string, reason = 'PASSWORD_RESET'): Promise<void> { await this.sessions.revokeAllForUser(userId, this.clock.now(), reason); }
}

export function constantTimeTokenMatch(a: string, b: string): boolean { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
