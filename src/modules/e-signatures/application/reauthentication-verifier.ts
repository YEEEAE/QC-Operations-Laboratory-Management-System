import type { Kysely } from 'kysely';
import { Argon2idPasswordHasher } from '../../identity/security/argon2-password-hasher.js';
import { PostgresUserRepository } from '../../identity/infrastructure/postgres-user-repository.js';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ReauthenticationVerifier } from '../ports/repository.js';

/**
 * QC-100-FINAL-004 — the shared reauthentication verifier used by the final
 * approval ceremony.
 *
 * The final (QCM) approval is a controlled signature event, so the actor must
 * prove identity again with their own password. The credential is verified
 * against the server-side hash and is never stored, logged, or echoed; a
 * non-ACTIVE account can never reauthenticate.
 *
 * This replaces the per-module inline copies (quarantine templates carried its
 * own) so every controlled ceremony verifies identity identically.
 */
export function createPasswordReauthenticationVerifier(
  database: Kysely<DatabaseSchema>,
): ReauthenticationVerifier {
  const users = new PostgresUserRepository(database);
  const passwords = new Argon2idPasswordHasher();
  return {
    async verify(input: { actorId: string; secret: string }): Promise<boolean> {
      const user = await users.findById(input.actorId);
      if (!user || user.accountState !== 'ACTIVE') return false;
      return passwords.verify(input.secret, user.passwordHash);
    },
  };
}
