import type { APIRoute } from 'astro';
import { AppError } from '../../../shared/errors/app-error.js';
import { systemHealthReleaseIdentityDependencies } from '../../../modules/system-health/application/dependencies.js';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function problem(status: number, title: string, requestId?: string): Response {
  return new Response(
    JSON.stringify({
      type: 'about:blank',
      title,
      status,
      ...(requestId ? { requestId } : {}),
    }),
    { status, headers: JSON_HEADERS },
  );
}

/**
 * Authenticated sanitized build-identity surface (Prompt 12).
 *
 * Returns the exact server-derived deployment identity — Git SHA, immutable
 * build ID, release-candidate ID, deployment timestamp, and environment
 * name — generated at CI/build time and injected through server environment.
 * Nothing is accepted from the browser: query strings and request bodies are
 * ignored. Credentials, endpoints, and raw errors are never exposed.
 * Unauthenticated callers receive 401, actors without PERM-HLTH-VIEW
 * receive 403, and any absent identity stays UNVERIFIED (fail closed).
 */
export const GET: APIRoute = ({ locals }) => {
  const requestId = locals.requestContext?.requestId;
  const actor = locals.actor;
  if (!actor) return problem(401, 'AUTH_REQUIRED', requestId);
  try {
    const release = systemHealthReleaseIdentityDependencies().identity.execute({ actor });
    return new Response(
      JSON.stringify({
        status: release.status,
        release: {
          ...(release.releaseId ? { id: release.releaseId } : {}),
          ...(release.buildId ? { buildId: release.buildId } : {}),
          ...(release.gitSha ? { gitSha: release.gitSha } : {}),
          ...(release.buildTimestamp ? { buildTimestamp: release.buildTimestamp } : {}),
          ...(release.environment ? { environment: release.environment } : {}),
          ...(release.migrationHead ? { migrationHead: release.migrationHead } : {}),
        },
      }),
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (error) {
    if (error instanceof AppError) return problem(403, error.code, requestId);
    return problem(500, 'SYSTEM_INTERNAL', requestId);
  }
};
