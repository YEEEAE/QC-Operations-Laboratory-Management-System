import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { VerifiedProviderAttestation } from '../application/ports/provider-attestation.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';

/** Persist one authenticated, owner-scoped provider statement without changing prior evidence. */
export async function recordProviderGateEvidence(
  database: Kysely<DatabaseSchema>,
  attestation: VerifiedProviderAttestation,
): Promise<{ evidenceId: string; replayed: boolean }> {
  try {
    return await database.transaction().execute(async (trx) => {
      const candidate = await trx
        .selectFrom('release_candidates')
        .selectAll()
        .where('id', '=', attestation.identity.releaseId)
        .forUpdate()
        .executeTakeFirst();
      if (!candidate) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (candidate.state !== 'PENDING')
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      if (
        candidate.git_sha.toLowerCase() !== attestation.identity.gitSha ||
        candidate.build_id !== attestation.identity.buildId ||
        candidate.application_version !== attestation.identity.applicationVersion ||
        candidate.migration_head !== attestation.identity.migrationHead ||
        candidate.uat_cycle_id !== attestation.identity.uatCycleId ||
        BigInt(candidate.version) !== attestation.identity.releaseVersion
      )
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });

      const priorNonce = await trx
        .selectFrom('release_provider_nonce_claims')
        .select('release_gate_evidence_id')
        .where('signer_id', '=', attestation.signerId)
        .where('signer_key_id', '=', attestation.keyId)
        .where('nonce', '=', attestation.nonce)
        .executeTakeFirst();
      if (priorNonce) throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });

      const latest = await trx
        .selectFrom('release_gate_evidence')
        .select('evidence_version')
        .where('release_id', '=', candidate.id)
        .where('evidence_type', '=', attestation.evidenceType)
        .orderBy('evidence_version', 'desc')
        .limit(1)
        .executeTakeFirst();
      const evidenceVersion = BigInt(latest?.evidence_version ?? 0) + 1n;
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
          signer_scope: sql`${JSON.stringify(attestation.signerScope)}::jsonb`,
          signature_digest: attestation.signatureDigest,
        })
        .returning('id')
        .executeTakeFirstOrThrow();
      await trx
        .insertInto('release_provider_nonce_claims')
        .values({
          release_gate_evidence_id: row.id,
          signer_id: attestation.signerId,
          signer_key_id: attestation.keyId,
          nonce: attestation.nonce,
        })
        .execute();
      const requestId = `PROVIDER_EVIDENCE:${attestation.signatureDigest}`;
      await new PostgresAuditRepository(trx).append({
        actorType: 'SERVICE',
        subjectType: 'RELEASE_GATE_EVIDENCE',
        subjectId: row.id,
        action: 'RELEASE_GATE_EVIDENCE_RECORDED',
        newState: attestation.status,
        reason: `Signed ${attestation.evidenceType} provider evidence recorded.`,
        requestId,
        payload: {
          releaseId: candidate.id,
          evidenceType: attestation.evidenceType,
          status: attestation.status,
          provider: attestation.provider,
          signerId: attestation.signerId,
          signerKeyId: attestation.keyId,
          evidenceDigest: attestation.evidenceDigest,
          signatureDigest: attestation.signatureDigest,
          gitSha: attestation.identity.gitSha,
          buildId: attestation.identity.buildId,
          migrationHead: attestation.identity.migrationHead,
        },
      });
      return { evidenceId: row.id, replayed: false };
    });
  } catch (error) {
    const postgresError = error as { code?: string; constraint?: string };
    if (
      postgresError?.code === '23505' &&
      postgresError.constraint === 'uq_release_provider_nonce_claims__signer_nonce'
    ) {
      throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
    }
    throw error;
  }
}
