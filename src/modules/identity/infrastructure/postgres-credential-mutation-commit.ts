import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { CredentialMutation, CredentialMutationCommit } from '../ports/credential-mutation.js';

export class PostgresCredentialMutationCommit implements CredentialMutationCommit {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async execute(input: CredentialMutation): Promise<void> {
    await this.database.transaction().execute(async (tx) => {
      const changed = await tx
        .updateTable('users')
        .set({
          password_hash: input.passwordHash,
          must_change_password: input.mustChangePassword,
          updated_at: input.at,
          updated_by: input.actorId,
          version: input.expectedVersion + 1n,
        })
        .where('id', '=', input.userId)
        .where('version', '=', input.expectedVersion)
        .returning('id')
        .executeTakeFirst();
      if (!changed) throw new AppError('CONFLICT_STALE_VERSION');

      await tx
        .updateTable('sessions')
        .set({ revoked_at: input.at, revoked_reason: input.reason })
        .where('user_id', '=', input.userId)
        .where('revoked_at', 'is', null)
        .execute();

      await new PostgresAuditRepository(tx).append({
        actorType: 'USER',
        actorId: input.actorId,
        subjectType: 'USER',
        subjectId: input.userId,
        action: input.action,
        requestId: input.requestId,
      });
    });
  }
}
