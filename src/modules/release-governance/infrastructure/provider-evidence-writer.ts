import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { VerifiedProviderAttestation } from '../domain/provider-attestation.js';

/** Persist one authenticated, owner-scoped provider statement without changing prior evidence. */
export async function recordProviderGateEvidence(
  database: Kysely<DatabaseSchema>,
  attestation: VerifiedProviderAttestation,
): Promise<{ evidenceId: string; replayed: boolean }> {
  return database.transaction().execute(async (trx) => {
    const candidate = await trx
      .selectFrom('release_candidates')
      .selectAll()
      .where('id', '=', attestation.identity.releaseId)
      .forUpdate()
      .executeTakeFirst();
    if (!candidate) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (
      candidate.git_sha.toLowerCase() !== attestation.identity.gitSha ||
      candidate.build_id !== attestation.identity.buildId ||
      candidate.application_version !== attestation.identity.applicationVersion ||
      candidate.migration_head !== attestation.identity.migrationHead ||
      candidate.uat_cycle_id !== attestation.identity.uatCycleId ||
      BigInt(candidate.version) !== attestation.identity.releaseVersion
    )
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });

    const prior = await trx
      .selectFrom('release_gate_evidence')
      .select(['id', 'status', 'source', 'immutable_reference', 'signer_id', 'signer_key_id'])
      .where('release_id', '=', candidate.id)
      .where('evidence_type', '=', attestation.evidenceType)
      .where('evidence_digest', '=', attestation.evidenceDigest)
      .executeTakeFirst();
    if (prior) {
      if (
        prior.status !== attestation.status ||
        prior.source !== attestation.source ||
        prior.immutable_reference !== attestation.immutableReference ||
        prior.signer_id !== attestation.signerId ||
        prior.signer_key_id !== attestation.keyId
      )
        throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
      return { evidenceId: prior.id, replayed: true };
    }

    const latest = await trx
      .selectFrom('release_gate_evidence')
      .select('evidence_version')
      .where('release_id', '=', candidate.id)
      .where('evidence_type', '=', attestation.evidenceType)
      .orderBy('evidence_version', 'desc')
      .limit(1)
      .executeTakeFirst();
    const evidenceVersion = (latest?.evidence_version ?? 0n) + 1n;
    const auditInfo = {
      provider: attestation.provider,
      signerId: attestation.signerId,
      signerKeyId: attestation.keyId,
      approvedScope: attestation.signerScope,
      approvalReference: attestation.approvalReference,
      deploymentEnvironment: attestation.environment,
      nonce: attestation.nonce,
      evidenceDigest: attestation.evidenceDigest,
      signatureDigest: attestation.signatureDigest,
      signatureAlgorithm: 'HMAC-SHA256',
    };
    const row = await trx
      .insertInto('release_gate_evidence')
      .values({
        release_id: candidate.id,
        evidence_type: attestation.evidenceType,
        status: attestation.status,
        source: attestation.source,
        immutable_reference: attestation.immutableReference,
        observed_at: attestation.observedAt,
        git_sha: attestation.identity.gitSha,
        build_id: attestation.identity.buildId,
        application_version: attestation.identity.applicationVersion,
        migration_head: attestation.identity.migrationHead,
        uat_cycle_id: attestation.identity.uatCycleId,
        release_version: attestation.identity.releaseVersion,
        evidence_version: evidenceVersion,
        recorded_by: attestation.signerId,
        audit_info: auditInfo,
        evidence_digest: attestation.evidenceDigest,
        signer_id: attestation.signerId,
        signer_key_id: attestation.keyId,
        signer_scope: attestation.signerScope,
        signature_digest: attestation.signatureDigest,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return { evidenceId: row.id, replayed: false };
  });
}
