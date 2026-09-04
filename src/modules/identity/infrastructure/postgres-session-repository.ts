import type { Kysely } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import type { SessionRepository } from '../ports/session-repository.js';
import type { Session } from '../domain/session.js';
const map = (r: DatabaseRow<'sessions'>): Session => ({ id: r.id as string, userId: r.user_id, tokenHash: r.session_token_hash, createdAt: r.created_at, ...(r.last_seen_at ? { lastSeenAt: r.last_seen_at } : {}), expiresAt: r.expires_at, ...(r.revoked_at ? { revokedAt: r.revoked_at } : {}), ...(r.revoked_reason ? { revokedReason: r.revoked_reason } : {}), version: BigInt(r.version) });
export class PostgresSessionRepository implements SessionRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async create(input: Omit<Session, 'version'>) { const r = await this.db.insertInto('sessions').values({ id: input.id, user_id: input.userId, session_token_hash: input.tokenHash, created_at: input.createdAt, last_seen_at: input.lastSeenAt ?? null, expires_at: input.expiresAt, revoked_at: input.revokedAt ?? null, revoked_reason: input.revokedReason ?? null }).returningAll().executeTakeFirstOrThrow(); return map(r); }
  async findByTokenHash(hash: string) { const r = await this.db.selectFrom('sessions').selectAll().where('session_token_hash', '=', hash).executeTakeFirst(); return r ? map(r) : undefined; }
  async revoke(id: string, at: Date, reason: string) { await this.db.updateTable('sessions').set({ revoked_at: at, revoked_reason: reason }).where('id', '=', id).where('revoked_at', 'is', null).execute(); }
  async revokeAllForUser(userId: string, at: Date, reason: string) { await this.db.updateTable('sessions').set({ revoked_at: at, revoked_reason: reason }).where('user_id', '=', userId).where('revoked_at', 'is', null).execute(); }
}
