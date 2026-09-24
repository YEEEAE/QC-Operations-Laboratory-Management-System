import type { APIRoute } from 'astro';
import { getServerEnv } from '../../config/env.js';
import { getDatabase } from '../../shared/database/database.js';
import { PostgresReleaseGovernanceRepository } from '../../modules/release-governance/infrastructure/postgres-repository.js';
import { recordProviderGateEvidence } from '../../modules/release-governance/infrastructure/provider-evidence-writer.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  parseProviderSignerPolicies,
  ProviderAttestationError,
  verifyProviderAttestation,
} from '../../modules/release-governance/domain/provider-attestation.js';

const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
function response(status: number, code: string, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ status, code, ...extra }), { status, headers });
}

/** Signed, explicit-scope intake for CI/security/database/E2E provider evidence. */
export const POST: APIRoute = async ({ request }) => {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > 32_768) return response(413, 'PAYLOAD_TOO_LARGE');
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > 32_768) return response(413, 'PAYLOAD_TOO_LARGE');

  let policies;
  try {
    policies = parseProviderSignerPolicies(getServerEnv().RELEASE_EVIDENCE_SIGNERS_JSON);
  } catch {
    return response(503, 'PROVIDER_SIGNER_POLICY_INVALID');
  }
  if (policies.length === 0) return response(503, 'PROVIDER_SIGNER_POLICY_NOT_CONFIGURED');

  let untrusted: unknown;
  try {
    untrusted = JSON.parse(rawBody);
  } catch {
    return response(400, 'INVALID_ATTESTATION');
  }
  if (!untrusted || typeof untrusted !== 'object' || !('identity' in untrusted)) {
    return response(400, 'INVALID_ATTESTATION');
  }
  const identity = (untrusted as { identity?: { releaseId?: unknown } }).identity;
  if (typeof identity?.releaseId !== 'string') return response(400, 'INVALID_ATTESTATION');

  try {
    const attestation = verifyProviderAttestation({
      rawBody,
      keyId: request.headers.get('x-qc-key-id'),
      timestamp: request.headers.get('x-qc-timestamp'),
      signature: request.headers.get('x-qc-signature'),
      policies,
    });
    const database = getDatabase();
    const repository = new PostgresReleaseGovernanceRepository(database);
    const candidate = await repository.getCandidate(attestation.identity.releaseId);
    if (!candidate) return response(404, 'RELEASE_CANDIDATE_NOT_FOUND');
    const result = await recordProviderGateEvidence(database, attestation);
    return response(
      result.replayed ? 200 : 201,
      result.replayed ? 'EVIDENCE_ALREADY_RECORDED' : 'EVIDENCE_RECORDED',
      {
        evidenceId: result.evidenceId,
        gate: attestation.evidenceType,
        status: attestation.status,
        gitSha: attestation.identity.gitSha,
        buildId: attestation.identity.buildId,
        evidenceDigest: attestation.evidenceDigest,
      },
    );
  } catch (error) {
    if (error instanceof ProviderAttestationError) {
      const status =
        error.reason === 'SIGNATURE'
          ? 401
          : error.reason === 'SCOPE'
            ? 403
            : error.reason === 'IDENTITY'
              ? 409
              : 400;
      return response(status, `EVIDENCE_${error.reason}_REJECTED`);
    }
    if (error instanceof AppError && error.code === 'CONFLICT_STALE_VERSION') {
      return response(409, 'CANDIDATE_IDENTITY_MISMATCH');
    }
    if (error instanceof AppError && error.code === 'CONFLICT_DUPLICATE_COMMAND') {
      return response(409, 'EVIDENCE_DIGEST_CONFLICT');
    }
    return response(503, 'EVIDENCE_STORE_UNAVAILABLE');
  }
};
