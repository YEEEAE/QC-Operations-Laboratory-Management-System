import type { APIRoute } from 'astro';
import { providerEvidenceIntakeDependencies } from '../../modules/release-governance/application/provider-evidence-intake-dependencies.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ProviderAttestationError } from '../../modules/release-governance/application/ports/provider-attestation.js';
import { apiJsonResponse, readBoundedJsonBody } from '../../shared/http/api-boundary.js';

/** Signed, explicit-scope intake for CI/security/database/E2E provider evidence. */
export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = locals.requestContext?.requestId;
  const body = await readBoundedJsonBody(request, 32_768, { rejectBrowserOrigin: true });
  if (!body.ok) {
    return apiJsonResponse(body.status, {
      status: body.status,
      code: body.code,
      ...(requestId ? { requestId } : {}),
    });
  }

  try {
    const { attestation, result } = await providerEvidenceIntakeDependencies().execute({
      rawBody: body.rawBody,
      keyId: request.headers.get('x-qc-key-id'),
      timestamp: request.headers.get('x-qc-timestamp'),
      signature: request.headers.get('x-qc-signature'),
    });
    return apiJsonResponse(
      result.replayed ? 200 : 201,
      {
        code: result.replayed ? 'EVIDENCE_ALREADY_RECORDED' : 'EVIDENCE_RECORDED',
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
      if (error.reason === 'REGISTRY_NOT_APPROVED')
        return apiJsonResponse(503, {
          status: 503,
          code: 'BLOCKED_BY_AUTHORITY_SOURCE',
          requestId,
        });
      if (error.reason === 'POLICY_NOT_CONFIGURED')
        return apiJsonResponse(503, {
          status: 503,
          code: 'PROVIDER_SIGNER_POLICY_NOT_CONFIGURED',
          requestId,
        });
      if (error.reason === 'CONFIGURATION')
        return apiJsonResponse(503, {
          status: 503,
          code: 'PROVIDER_SIGNER_POLICY_INVALID',
          requestId,
        });
      if (error.reason === 'PAYLOAD')
        return apiJsonResponse(400, { status: 400, code: 'INVALID_ATTESTATION', requestId });
      const status =
        error.reason === 'SIGNATURE'
          ? 401
          : error.reason === 'SCOPE'
            ? 403
            : error.reason === 'IDENTITY'
              ? 409
              : 400;
      return apiJsonResponse(status, {
        status,
        code: `EVIDENCE_${error.reason}_REJECTED`,
        requestId,
      });
    }
    if (error instanceof AppError && error.code === 'RESOURCE_NOT_FOUND')
      return apiJsonResponse(404, {
        status: 404,
        code: 'RELEASE_CANDIDATE_NOT_FOUND',
        requestId,
      });
    if (error instanceof AppError && error.code === 'CONFLICT_STALE_VERSION') {
      return apiJsonResponse(409, {
        status: 409,
        code: 'CANDIDATE_IDENTITY_MISMATCH',
        requestId,
      });
    }
    if (error instanceof AppError && error.code === 'CONFLICT_DUPLICATE_COMMAND') {
      return apiJsonResponse(409, {
        status: 409,
        code: 'EVIDENCE_REPLAY_REJECTED',
        requestId,
      });
    }
    if (error instanceof AppError && error.code === 'DOMAIN_INVALID_TRANSITION') {
      return apiJsonResponse(409, {
        status: 409,
        code: 'CANDIDATE_STATE_REJECTED',
        requestId,
      });
    }
    return apiJsonResponse(503, { status: 503, code: 'EVIDENCE_STORE_UNAVAILABLE', requestId });
  }
};
