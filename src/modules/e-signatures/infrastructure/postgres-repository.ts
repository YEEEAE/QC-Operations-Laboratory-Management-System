import type { Kysely } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { SignatureEvidence } from '../domain/signature-evidence.js';
import type { SignatureEvidenceRepository } from '../ports/repository.js';
import { createSignatureEvidence } from '../domain/signature-evidence.js';

const map = (row: DatabaseRow<'electronic_signatures'>): SignatureEvidence =>
  createSignatureEvidence({
    id: row.id,
    actorId: row.actor_id,
    subjectType: row.subject_type as SignatureEvidence['subjectType'],
    subjectId: row.subject_id,
    subjectVersion: BigInt(row.subject_version),
    action: row.action,
    meaning: row.meaning,
    signedAt: row.signed_at,
    snapshotHash: row.snapshot_hash,
    reason: row.reason ?? undefined,
    reauthMethod: row.reauth_method === 'PASSWORD' ? 'PASSWORD' : 'OTHER_APPROVED_METHOD',
    requestId: row.request_id,
  });

export class PostgresSignatureEvidenceRepository implements SignatureEvidenceRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async create(input: SignatureEvidence): Promise<SignatureEvidence> {
    try {
      const row = await this.database
        .insertInto('electronic_signatures')
        .values({
          id: input.id,
          actor_id: input.actorId,
          subject_type: input.subjectType,
          subject_id: input.subjectId,
          subject_version: input.subjectVersion,
          action: input.action,
          meaning: input.meaning,
          signed_at: input.signedAt,
          snapshot_hash: input.snapshotHash,
          reason: input.reason ?? null,
          reauth_method: input.reauthMethod,
          request_id: input.requestId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return map(row);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async get(id: string): Promise<SignatureEvidence | undefined> {
    if (!/^[0-9a-f-]{36}$/i.test(id))
      throw new AppError('VALIDATION_INVALID_UUID', { userSafe: true });
    const row = await this.database
      .selectFrom('electronic_signatures')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? map(row) : undefined;
  }
}
