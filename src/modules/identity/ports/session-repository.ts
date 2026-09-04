import type { Session } from '../domain/session.js';
export interface SessionRepository {
  create(input: Omit<Session, 'version'>): Promise<Session>;
  findByTokenHash(tokenHash: string): Promise<Session | undefined>;
  revoke(id: string, at: Date, reason: string): Promise<void>;
  revokeAllForUser(userId: string, at: Date, reason: string): Promise<void>;
}
