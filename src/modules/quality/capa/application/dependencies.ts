import { getDatabase } from '../../../../shared/database/database.js';
import { Argon2idPasswordHasher } from '../../../identity/security/argon2-password-hasher.js';
import { PostgresUserRepository } from '../../../identity/infrastructure/postgres-user-repository.js';
import { PostgresCapaRepository } from '../infrastructure/postgres-repository.js';
import { CloseCapaUseCase } from './close-capa.js';
import { GetCapaUseCase } from './get-capa.js';
import { CAPA_CLOSE_ELIGIBLE_STATES } from '../domain/capa.js';

export function capaActionDependencies() {
  const database = getDatabase();
  const users = new PostgresUserRepository(database);
  const passwords = new Argon2idPasswordHasher();
  const verifier = {
    verify: async (input: { actorId: string; secret: string }): Promise<boolean> => {
      const user = await users.findById(input.actorId);
      return Boolean(user && user.accountState === 'ACTIVE' && (await passwords.verify(input.secret, user.passwordHash)));
    },
  };
  return { close: new CloseCapaUseCase(new PostgresCapaRepository(database), verifier) };
}

export function capaReadDependencies() {
  return {
    get: new GetCapaUseCase(new PostgresCapaRepository(getDatabase())),
    canClose: (actor: { accountState: string; roles: readonly string[]; permissions: readonly { code: string; active?: boolean }[] }, state: string) =>
      actor.accountState === 'ACTIVE' && actor.roles.includes('SUPERVISOR') &&
      actor.permissions.some((permission) => permission.code === 'PERM-CAPA-CLOSE' && permission.active !== false) &&
      CAPA_CLOSE_ELIGIBLE_STATES.includes(state as (typeof CAPA_CLOSE_ELIGIBLE_STATES)[number]),
  };
}
