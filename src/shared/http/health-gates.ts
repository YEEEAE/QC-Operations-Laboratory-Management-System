import { PROBLEM_CONTENT_TYPE } from '../../config/constants.js';
import { applySecurityHeaders } from '../security/security-headers.js';

export type HealthHeaderEnvironment = 'development' | 'test' | 'production';

export function headerEnvironmentForHealth(): HealthHeaderEnvironment {
  const candidate = process.env.NODE_ENV;
  if (candidate === 'production' || candidate === 'test') return candidate;
  return 'development';
}

function jsonWithRequestId(
  status: number,
  body: Record<string, string>,
  requestId: string,
  headerEnv: HealthHeaderEnvironment,
): Response {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': requestId,
    },
  });
  return applySecurityHeaders(response, headerEnv);
}

export function liveHealthResponse(
  headerEnv: HealthHeaderEnvironment,
  requestId: string,
): Response {
  return jsonWithRequestId(200, { status: 'healthy' }, requestId, headerEnv);
}

export function unavailableHealthResponse(
  headerEnv: HealthHeaderEnvironment,
  requestId: string,
): Response {
  return jsonWithRequestId(503, { status: 'unhealthy' }, requestId, headerEnv);
}

export function degradedConfigurationResponse(
  requestId: string,
  headerEnv: HealthHeaderEnvironment,
): Response {
  const payload = {
    type: 'about:blank',
    title: 'SERVICE_UNAVAILABLE',
    status: 503,
    requestId,
  };
  return applySecurityHeaders(
    new Response(JSON.stringify(payload), {
      status: 503,
      headers: {
        'content-type': PROBLEM_CONTENT_TYPE,
        'x-request-id': requestId,
      },
    }),
    headerEnv,
  );
}
