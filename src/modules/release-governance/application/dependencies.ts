import { getDatabase } from '../../../shared/database/database.js';
import { Argon2idPasswordHasher } from '../../identity/security/argon2-password-hasher.js';
import { PostgresUserRepository } from '../../identity/infrastructure/postgres-user-repository.js';
import { ApproveReleaseUseCase } from './approve-release.js';
import { PostgresReleaseGovernanceRepository } from '../infrastructure/postgres-repository.js';

export function releaseGovernanceActionDependencies() {
  const database = getDatabase();
  const users = new PostgresUserRepository(database);
  const passwords = new Argon2idPasswordHasher();
  const verifier = {
    verify: async (input: { actorId: string; secret: string }): Promise<boolean> => {
      const user = await users.findById(input.actorId);
      return Boolean(
        user && user.accountState === 'ACTIVE' && (await passwords.verify(input.secret, user.passwordHash)),
      );
    },
  };
  const repository = new PostgresReleaseGovernanceRepository(database);
  return {
    approve: new ApproveReleaseUseCase(repository, verifier),
    repository,
  };
}

export function releaseGovernanceReadDependencies() {
  const database = getDatabase();
  return { repository: new PostgresReleaseGovernanceRepository(database) };
}
