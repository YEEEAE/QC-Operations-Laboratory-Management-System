import type { APIRoute } from 'astro';
import { providerEvidenceIntakeDependencies } from '../../modules/release-governance/application/provider-evidence-intake-dependencies.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ProviderAttestationError } from '../../modules/release-governance/application/ports/provider-attestation.js';

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

  try {
    const { attestation, result } = await providerEvidenceIntakeDependencies().execute({
      rawBody,
      keyId: request.headers.get('x-qc-key-id'),
      timestamp: request.headers.get('x-qc-timestamp'),
      signature: request.headers.get('x-qc-signature'),
    });
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
      if (error.reason === 'POLICY_NOT_CONFIGURED')
        return response(503, 'PROVIDER_SIGNER_POLICY_NOT_CONFIGURED');
      if (error.reason === 'CONFIGURATION') return response(503, 'PROVIDER_SIGNER_POLICY_INVALID');
      if (error.reason === 'PAYLOAD') return response(400, 'INVALID_ATTESTATION');
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
    if (error instanceof AppError && error.code === 'RESOURCE_NOT_FOUND')
      return response(404, 'RELEASE_CANDIDATE_NOT_FOUND');
    if (error instanceof AppError && error.code === 'CONFLICT_STALE_VERSION') {
      return response(409, 'CANDIDATE_IDENTITY_MISMATCH');
    }
    if (error instanceof AppError && error.code === 'CONFLICT_DUPLICATE_COMMAND') {
      return response(409, 'EVIDENCE_DIGEST_CONFLICT');
    }
    return response(503, 'EVIDENCE_STORE_UNAVAILABLE');
  }
};
