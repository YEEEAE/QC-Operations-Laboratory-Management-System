import type { Kysely } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { User } from '../domain/user.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
const map = (r: DatabaseRow<'users'>): User => ({
  id: r.id as string,
  loginIdentity: r.login_identity,
  ...(r.email ? { email: r.email } : {}),
  displayName: r.display_name,
  passwordHash: r.password_hash,
  accountState: r.account_state as User['accountState'],
  mustChangePassword: r.must_change_password,
  ...(r.last_login_at ? { lastLoginAt: r.last_login_at } : {}),
  version: BigInt(r.version),
});
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async findByLoginIdentity(identity: string) {
    const r = await this.db
      .selectFrom('users')
      .selectAll()
      .where('login_identity', '=', identity)
      .executeTakeFirst();
    return r ? map(r) : undefined;
  }
  async createProvisioned(input: Parameters<NonNullable<UserRepository['createProvisioned']>>[0]) {
    return this.db.transaction().execute(async (tx) => {
      const roles = await tx
        .selectFrom('roles')
        .select(['id', 'code'])
        .where('code', 'in', input.roleCodes.length ? input.roleCodes : [''])
        .where('active', '=', true)
        .execute();
      if (roles.length !== new Set(input.roleCodes).size)
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
      for (const scope of input.scopes) {
        if (
          !['OWN', 'ASSIGNED', 'TEAM', 'DEPARTMENT', 'SITE', 'DOMAIN', 'GLOBAL'].includes(
            scope.kind,
          ) ||
          (['TEAM', 'DEPARTMENT', 'SITE', 'DOMAIN'].includes(scope.kind) && !scope.value?.trim()) ||
          (scope.kind === 'GLOBAL' && scope.value)
        )
          throw new AppError('VALIDATION_FAILED', { userSafe: true });
      }
      const row = await tx
        .insertInto('users')
        .values({
          id: input.id,
          login_identity: input.loginIdentity,
          email: input.email ?? null,
          display_name: input.displayName,
          password_hash: input.passwordHash,
          account_state: 'ACTIVE',
          must_change_password: true,
          created_by: input.actorId,
          updated_by: input.actorId,
          created_at: input.at,
          updated_at: input.at,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      if (roles.length)
        await tx
          .insertInto('user_roles')
          .values(
            roles.map((r) => ({
              id: uuidv7(),
              user_id: input.id,
              role_id: r.id,
              assigned_by: input.actorId,
              reason: 'Provisioned with user account',
            })),
          )
          .execute();
      if (input.scopes.length)
        await tx
          .insertInto('user_scopes')
          .values(
            input.scopes.map((s) => ({
              id: uuidv7(),
              user_id: input.id,
              scope_kind: s.kind,
              scope_value: s.value ?? null,
              assigned_by: input.actorId,
              reason: 'Provisioned with user account',
            })),
          )
          .execute();
      await new PostgresAuditRepository(tx).append({
        actorType: 'USER',
        actorId: input.actorId,
        subjectType: 'USER',
        subjectId: input.id,
        action: 'CREATE_USER_PROVISIONED',
        requestId: input.requestId,
        payload: { roleCodes: input.roleCodes, scopes: input.scopes },
      });
      return map(row);
    });
  }
  async findById(id: string) {
    const r = await this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
    return r ? map(r) : undefined;
  }
  async listUsers() {
    const rows = await this.db
      .selectFrom('users')
      .selectAll()
      .orderBy('login_identity')
      .limit(500)
      .execute();
    return rows.map(map);
  }
  async recordSuccessfulLogin(id: string, at: Date) {
    await this.db
      .updateTable('users')
      .set({ last_login_at: at, updated_at: at, updated_by: id })
      .where('id', '=', id)
      .execute();
  }
  async create(input: Parameters<UserRepository['create']>[0]) {
    const r = await this.db
      .insertInto('users')
      .values({
        id: input.id,
        login_identity: input.loginIdentity,
        email: input.email ?? null,
        display_name: input.displayName,
        password_hash: input.passwordHash,
        account_state: input.accountState,
        must_change_password: input.mustChangePassword,
        created_by: input.actorId,
        updated_by: input.actorId,
        created_at: input.at,
        updated_at: input.at,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return map(r);
  }
  async updateProfile(id: string, input: Parameters<UserRepository['updateProfile']>[1]) {
    const r = await this.db
      .updateTable('users')
      .set({
        display_name: input.displayName,
        email: input.email ?? null,
        updated_at: input.at,
        updated_by: input.actorId,
        version: input.expectedVersion + 1n,
      })
      .where('id', '=', id)
      .where('version', '=', input.expectedVersion)
      .returningAll()
      .executeTakeFirst();
    if (!r) throw new AppError('CONFLICT_STALE_VERSION');
    return map(r);
  }
  async changePassword(
    id: string,
    passwordHash: string,
    expectedVersion: bigint,
    actorId: string,
    at: Date,
    mustChangePassword = false,
  ) {
    const r = await this.db
      .updateTable('users')
      .set({
        password_hash: passwordHash,
        must_change_password: mustChangePassword,
        updated_at: at,
        updated_by: actorId,
        version: expectedVersion + 1n,
      })
      .where('id', '=', id)
      .where('version', '=', expectedVersion)
      .returning('id')
      .executeTakeFirst();
    if (!r) throw new AppError('CONFLICT_STALE_VERSION');
  }
  async setAccountState(
    id: string,
    state: User['accountState'],
    expectedVersion: bigint,
    actorId: string,
    at: Date,
  ) {
    const r = await this.db
      .updateTable('users')
      .set({
        account_state: state,
        updated_at: at,
        updated_by: actorId,
        version: expectedVersion + 1n,
      })
      .where('id', '=', id)
      .where('version', '=', expectedVersion)
      .returning('id')
      .executeTakeFirst();
    if (!r) throw new AppError('CONFLICT_STALE_VERSION');
  }
}
