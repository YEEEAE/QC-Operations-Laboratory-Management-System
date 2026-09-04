import type { Kysely } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { User } from '../domain/user.js';
import { AppError } from '../../../shared/errors/app-error.js';
const map = (r: DatabaseRow<'users'>): User => ({ id: r.id as string, loginIdentity: r.login_identity, ...(r.email ? { email: r.email } : {}), displayName: r.display_name, passwordHash: r.password_hash, accountState: r.account_state as User['accountState'], mustChangePassword: r.must_change_password, ...(r.last_login_at ? { lastLoginAt: r.last_login_at } : {}), version: BigInt(r.version) });
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async findByLoginIdentity(identity: string) { const r = await this.db.selectFrom('users').selectAll().where('login_identity', '=', identity).executeTakeFirst(); return r ? map(r) : undefined; }
  async findById(id: string) { const r = await this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst(); return r ? map(r) : undefined; }
  async recordSuccessfulLogin(id: string, at: Date) { await this.db.updateTable('users').set({ last_login_at: at, updated_at: at, updated_by: id }).where('id', '=', id).execute(); }
  async create(input: Parameters<UserRepository['create']>[0]) { const r = await this.db.insertInto('users').values({ id: input.id, login_identity: input.loginIdentity, email: input.email ?? null, display_name: input.displayName, password_hash: input.passwordHash, account_state: input.accountState, must_change_password: input.mustChangePassword, created_by: input.actorId, updated_by: input.actorId, created_at: input.at, updated_at: input.at }).returningAll().executeTakeFirstOrThrow(); return map(r); }
  async updateProfile(id: string, input: Parameters<UserRepository['updateProfile']>[1]) { const r = await this.db.updateTable('users').set({ display_name: input.displayName, email: input.email ?? null, updated_at: input.at, updated_by: input.actorId, version: input.expectedVersion + 1n }).where('id', '=', id).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst(); if (!r) throw new AppError('CONFLICT_STALE_VERSION'); return map(r); }
  async changePassword(id: string, passwordHash: string, expectedVersion: bigint, actorId: string, at: Date) { const r = await this.db.updateTable('users').set({ password_hash: passwordHash, must_change_password: false, updated_at: at, updated_by: actorId, version: expectedVersion + 1n }).where('id', '=', id).where('version', '=', expectedVersion).returning('id').executeTakeFirst(); if (!r) throw new AppError('CONFLICT_STALE_VERSION'); }
  async setAccountState(id: string, state: User['accountState'], expectedVersion: bigint, actorId: string, at: Date) { const r = await this.db.updateTable('users').set({ account_state: state, updated_at: at, updated_by: actorId, version: expectedVersion + 1n }).where('id', '=', id).where('version', '=', expectedVersion).returning('id').executeTakeFirst(); if (!r) throw new AppError('CONFLICT_STALE_VERSION'); }
}
