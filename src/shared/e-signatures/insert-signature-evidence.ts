import type { Transaction } from 'kysely';
import type { DatabaseSchema } from '../database/db-types.js';

export interface SignatureEvidenceInsert {
  id: string;
  actorId: string;
  subjectType: string;
  subjectId: string;
  subjectVersion: bigint;
  action: string;
  meaning: string;
  signedAt: Date;
  snapshotHash: string;
  reason?: string;
  reauthMethod: string;
  requestId: string;
}

/** Persist signature evidence on the owning domain's transaction connection. */
export async function insertSignatureEvidence(
  tx: Transaction<DatabaseSchema>,
  evidence: SignatureEvidenceInsert,
): Promise<void> {
  await tx
    .insertInto('electronic_signatures')
    .values({
      id: evidence.id,
      actor_id: evidence.actorId,
      subject_type: evidence.subjectType,
      subject_id: evidence.subjectId,
      subject_version: evidence.subjectVersion,
      action: evidence.action,
      meaning: evidence.meaning,
      signed_at: evidence.signedAt,
      snapshot_hash: evidence.snapshotHash,
      reason: evidence.reason ?? null,
      reauth_method: evidence.reauthMethod,
      request_id: evidence.requestId,
    })
    .execute();
}
