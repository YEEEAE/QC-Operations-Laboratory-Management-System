/**
 * Security header baseline (SECURITY-ARCHITECTURE §74–§78, DEPLOYMENT-ARCHITECTURE §40).
 *
 * CSP baseline (§76): default-src 'self'; object-src 'none'; base-uri 'none';
 * frame-ancestors 'none'; form-action 'self'. Script/style inherit
 * default-src 'self' in production — no unsafe-inline, no unsafe-eval.
 *
 * Development exception (§78 documented reason): the Astro dev server injects
 * inline scripts/styles for HMR and requires a websocket connection, so the
 * dev CSP adds script-src/style-src 'unsafe-inline' and connect-src ws:.
 * This exception never applies to production.
 */

export type DeploymentEnvironment = 'development' | 'test' | 'production';

const CSP_BASELINE = [
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
] as const;

const CSP_DEVELOPMENT_EXTRAS = [
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' ws:",
] as const;

export function contentSecurityPolicy(environment: DeploymentEnvironment): string {
  if (environment === 'production') return CSP_BASELINE.join('; ');
  return [...CSP_BASELINE, ...CSP_DEVELOPMENT_EXTRAS].join('; ');
}

export function securityHeaders(environment: DeploymentEnvironment): Record<string, string> {
  const headers: Record<string, string> = {
    'content-security-policy': contentSecurityPolicy(environment),
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
  };
  // §70: HSTS only in production, once the deployment is fully HTTPS.
  if (environment === 'production') {
    headers['strict-transport-security'] = 'max-age=31536000';
  }
  return headers;
}

/**
 * Applies headers to a response, falling back to a rebuilt Response if the
 * underlying headers are immutable. Never throws.
 */
export function applySecurityHeaders(
  response: Response,
  environment: DeploymentEnvironment,
): Response {
  const headers = securityHeaders(environment);
  try {
    for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    return response;
  } catch {
    const merged = new Headers(response.headers);
    for (const [name, value] of Object.entries(headers)) merged.set(name, value);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: merged,
    });
  }
}
