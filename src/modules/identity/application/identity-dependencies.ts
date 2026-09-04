import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { getDatabase } from '../../../shared/database/database.js';
import { PostgresSessionRepository } from '../infrastructure/postgres-session-repository.js';
import { PostgresUserRepository } from '../infrastructure/postgres-user-repository.js';
import { Argon2idPasswordHasher } from '../security/argon2-password-hasher.js';
import { SessionService } from './session-service.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { systemClock } from '../../../shared/time/clock.js';

export function identityDependencies(database: Kysely<DatabaseSchema> = getDatabase()) {
  const users = new PostgresUserRepository(database);
  const sessions = new PostgresSessionRepository(database);
  return { database, users, sessions, passwords: new Argon2idPasswordHasher(), sessionService: new SessionService(users, sessions, systemClock, 8 * 60 * 60 * 1000) };
}

export async function resolveActor(database: Kysely<DatabaseSchema>, userId: string): Promise<ActorContext | undefined> {
  const user = await database.selectFrom('users').selectAll().where('id', '=', userId).executeTakeFirst();
  if (!user) return undefined;
  const rows = await database.selectFrom('user_roles').innerJoin('roles', 'roles.id', 'user_roles.role_id').innerJoin('role_permissions', 'role_permissions.role_id', 'roles.id').innerJoin('permissions', 'permissions.id', 'role_permissions.permission_id').select(['roles.code as role', 'permissions.code as permission']).where('user_roles.user_id', '=', userId).where('user_roles.revoked_at', 'is', null).where('roles.active', '=', true).where('permissions.active', '=', true).execute();
  return { id: userId, accountState: user.account_state as ActorContext['accountState'], roles: [...new Set(rows.map((r) => r.role))], permissions: [...new Set(rows.map((r) => r.permission))].map((code) => ({ code: code as ActorContext['permissions'][number]['code'], scopes: ['OWN', 'GLOBAL'] as const })) };
}
