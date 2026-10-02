import type { Kysely } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import type { UserListFilter, UserListPage, UserRepository } from '../ports/user-repository.js';
import type { User } from '../domain/user.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { isScopeKind, normalizeScopeValue } from '../../../shared/authorization/types.js';
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
      const scopes = input.scopes.map((scope) => {
        if (!isScopeKind(scope.kind)) throw new AppError('VALIDATION_FAILED', { userSafe: true });
        const normalized = normalizeScopeValue(scope.kind, scope.value);
        if (!normalized.ok) throw new AppError('VALIDATION_FAILED', { userSafe: true });
        return { kind: scope.kind, ...(normalized.value ? { value: normalized.value } : {}) };
      });
      if (
        new Set(scopes.map((scope) => `${scope.kind}:${scope.value ?? ''}`)).size !== scopes.length
      )
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
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
      if (scopes.length)
        await tx
          .insertInto('user_scopes')
          .values(
            scopes.map((s) => ({
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
        payload: { roleCodes: input.roleCodes, scopes },
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
  async listUserDisplayNames(ids: readonly string[]) {
    if (ids.length === 0) return [];
    const rows = await this.db
      .selectFrom('users')
      .select(['id', 'display_name'])
      .where('id', 'in', [...new Set(ids)])
      .execute();
    return rows.map((row) => ({ id: row.id, displayName: row.display_name }));
  }
  async listUsersPage(filter: UserListFilter): Promise<UserListPage> {
    const page = Number.isSafeInteger(filter.page) ? Math.max(1, filter.page) : 1;
    const pageSize = Number.isSafeInteger(filter.pageSize)
      ? Math.min(100, Math.max(1, filter.pageSize))
      : 25;
    let countQuery = this.db.selectFrom('users').select((eb) => eb.fn.countAll().as('total'));
    let rowsQuery = this.db
      .selectFrom('users')
      .select([
        'id',
        'login_identity',
        'email',
        'display_name',
        'account_state',
        'must_change_password',
        'last_login_at',
        'version',
      ]);
    if (filter.accountState) {
      countQuery = countQuery.where('account_state', '=', filter.accountState) as typeof countQuery;
      rowsQuery = rowsQuery.where('account_state', '=', filter.accountState) as typeof rowsQuery;
    }
    const query = filter.query?.trim();
    if (query) {
      const pattern = `%${query.replace(/[\\%_]/g, (value) => `\\${value}`)}%`;
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('login_identity', 'ilike', pattern),
          eb('display_name', 'ilike', pattern),
          eb('email', 'ilike', pattern),
        ]),
      ) as typeof countQuery;
      rowsQuery = rowsQuery.where((eb) =>
        eb.or([
          eb('login_identity', 'ilike', pattern),
          eb('display_name', 'ilike', pattern),
          eb('email', 'ilike', pattern),
        ]),
      ) as typeof rowsQuery;
    }
    const count = await countQuery.executeTakeFirstOrThrow();
    const total = Number(count.total);
    const effectivePage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
    const sortColumn = {
      loginIdentity: 'login_identity',
      displayName: 'display_name',
      state: 'account_state',
      lastLogin: 'last_login_at',
    } as const;
    const sortColumnName = sortColumn[filter.sortBy ?? 'loginIdentity'];
    const direction = filter.sortDirection === 'desc' ? 'desc' : 'asc';
    const rows = await rowsQuery
      .orderBy(sortColumnName, direction)
      .orderBy('id', direction)
      .limit(pageSize)
      .offset((effectivePage - 1) * pageSize)
      .execute();
    return {
      items: rows.map((row) => ({
        id: row.id,
        loginIdentity: row.login_identity,
        ...(row.email ? { email: row.email } : {}),
        displayName: row.display_name,
        accountState: row.account_state as User['accountState'],
        mustChangePassword: row.must_change_password,
        ...(row.last_login_at ? { lastLoginAt: row.last_login_at } : {}),
        version: BigInt(row.version),
      })),
      total,
      page: effectivePage,
      pageSize,
    };
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
