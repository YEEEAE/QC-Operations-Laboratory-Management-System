import type { Kysely } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { User } from '../domain/user.js';
const map = (r: DatabaseRow<'users'>): User => ({ id: r.id as string, loginIdentity: r.login_identity, ...(r.email ? { email: r.email } : {}), displayName: r.display_name, passwordHash: r.password_hash, accountState: r.account_state as User['accountState'], mustChangePassword: r.must_change_password, ...(r.last_login_at ? { lastLoginAt: r.last_login_at } : {}), version: BigInt(r.version) });
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async findByLoginIdentity(identity: string) { const r = await this.db.selectFrom('users').selectAll().where('login_identity', '=', identity).executeTakeFirst(); return r ? map(r) : undefined; }
  async findById(id: string) { const r = await this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst(); return r ? map(r) : undefined; }
  async recordSuccessfulLogin(id: string, at: Date) { await this.db.updateTable('users').set({ last_login_at: at, updated_at: at, updated_by: id }).where('id', '=', id).execute(); }
}
