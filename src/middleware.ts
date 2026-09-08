import { defineMiddleware } from 'astro:middleware';
import { createRequestContext } from './shared/http/request-context';
import {
  identityDependencies,
  resolveActor,
} from './modules/identity/application/identity-dependencies.js';
import { ResolveSessionUseCase } from './modules/identity/application/resolve-session.js';
import { applySecurityHeaders } from './shared/security/security-headers';
import { resolveHighRiskRateLimitPolicy } from './shared/security/rate-limit';
import { rateLimitDependencies } from './shared/security/rate-limit-dependencies.js';
import {
  normalizeRouteTemplate,
  recordCounter,
  recordHistogram,
  runWithCorrelation,
} from './shared/observability/telemetry';
import { createRequestLogger } from './shared/observability/logger';
import { cleanAstroPagePath } from './shared/routing/clean-page-path';
import { getServerEnv } from './config/env';
import { PROBLEM_CONTENT_TYPE } from './config/constants';
import {
  degradedConfigurationResponse,
  headerEnvironmentForHealth,
  liveHealthResponse,
  unavailableHealthResponse,
} from './shared/http/health-gates.js';

export { headerEnvironmentForHealth, liveHealthResponse, unavailableHealthResponse };

const publicPaths = new Set(['/login']);

// Fixed-window limiter for high-risk POST routes; thresholds are config-driven
// (SECURITY-ARCHITECTURE §33/§141). This is abuse protection only — never
// authorization.
// Login abuse counters must be shared by all Web Service instances. The
// PostgreSQL store is scoped to the canonical application database and fails
// closed if the dependency is unavailable.
function getHighRiskRateLimiter() {
  return rateLimitDependencies();
}
const requestLogger = createRequestLogger();

function rateLimitedResponse(requestId: string, retryAfterSeconds: number): Response {
  const payload = { type: 'about:blank', title: 'RATE_LIMITED', status: 429, requestId };
  return new Response(JSON.stringify(payload), {
    status: 429,
    headers: {
      'content-type': PROBLEM_CONTENT_TYPE,
      'retry-after': String(Math.max(1, retryAfterSeconds)),
    },
  });
}

export const onRequest = defineMiddleware(
  async ({ request, url, locals, cookies, redirect, clientAddress }, next) => {
    const startedAt = process.hrtime.bigint();
    locals.requestContext = createRequestContext(request);
    const requestContext = locals.requestContext;
    const headerEnv = headerEnvironmentForHealth();
    const isLiveEndpoint = url.pathname === '/api/health/live';
    const isReadyEndpoint = url.pathname === '/api/health/ready';
    const isMachineHealthEndpoint = isLiveEndpoint || isReadyEndpoint;

    // DEPLOYMENT-ARCHITECTURE §29: liveness is process-alive and must stay
    // dependency-free. It bypasses production env validation so Render can
    // detect a live process even when DATABASE_URL/session/rate-limit secrets
    // are missing or invalid. No authorization or business state is exposed.
    if (isLiveEndpoint) {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const routeTemplate = normalizeRouteTemplate(url.pathname);
      recordCounter('qc_http_requests_total', 1, {
        route_template: routeTemplate,
        http_method: request.method,
        status_class: '2xx',
        environment: headerEnv,
      });
      recordHistogram('qc_http_server_duration_ms', durationMs, {
        route_template: routeTemplate,
        http_method: request.method,
        status_class: '2xx',
        environment: headerEnv,
      });
      requestLogger.info(
        {
          event: 'http.request',
          route_template: routeTemplate,
          http_method: request.method,
          status_class: '2xx',
          duration_ms: durationMs,
        },
        'request completed',
      );
      return liveHealthResponse(headerEnv, requestContext.requestId);
    }

    let env: ReturnType<typeof getServerEnv>;
    try {
      env = getServerEnv();
    } catch {
      // Fail closed with redacted JSON + security headers instead of an
      // unhandled Astro 500 page without headers/requestId. Never print values.
      const routeTemplate = normalizeRouteTemplate(url.pathname);
      requestLogger.warn(
        {
          event: 'config.invalid_environment',
          route_template: routeTemplate,
        },
        'invalid server environment configuration',
      );
      if (isReadyEndpoint) return unavailableHealthResponse(headerEnv, requestContext.requestId);
      return degradedConfigurationResponse(requestContext.requestId, headerEnv);
    }
    if (isReadyEndpoint) {
      // Readiness keeps its JSON 200/503 contract via the route probe; the
      // middleware only adds headers/observability and never upgrades 503.
      try {
        const response = await runWithCorrelation(
          {
            requestId: requestContext.requestId,
            traceId: requestContext.traceId,
            spanId: requestContext.spanId,
          },
          () => next(),
        );
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const routeTemplate = normalizeRouteTemplate(url.pathname);
        const statusClass = `${Math.floor(response.status / 100)}xx`;
        recordCounter('qc_http_requests_total', 1, {
          route_template: routeTemplate,
          http_method: request.method,
          status_class: statusClass,
          environment: env.NODE_ENV,
        });
        recordHistogram('qc_http_server_duration_ms', durationMs, {
          route_template: routeTemplate,
          http_method: request.method,
          status_class: statusClass,
          environment: env.NODE_ENV,
        });
        requestLogger.info(
          {
            event: 'http.request',
            route_template: routeTemplate,
            http_method: request.method,
            status_class: statusClass,
            duration_ms: durationMs,
          },
          'request completed',
        );
        const withRequestId = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: (() => {
            const merged = new Headers(response.headers);
            merged.set('x-request-id', requestContext.requestId);
            return merged;
          })(),
        });
        return applySecurityHeaders(withRequestId, env.NODE_ENV);
      } catch {
        return unavailableHealthResponse(env.NODE_ENV, requestContext.requestId);
      }
    }

    // qclevel.top is the only production origin. Render's custom-domain
    // pairing handles www, while this fixed destination also canonicalizes
    // the Render hostname and any unexpected host without trusting Host data.
    const cleanPagePath = cleanAstroPagePath(url.pathname);
    if (
      env.NODE_ENV === 'production' &&
      !isMachineHealthEndpoint &&
      (url.hostname !== 'qclevel.top' || cleanPagePath)
    ) {
      const canonicalUrl = new URL(url);
      canonicalUrl.protocol = 'https:';
      canonicalUrl.hostname = 'qclevel.top';
      canonicalUrl.port = '';
      if (cleanPagePath) canonicalUrl.pathname = cleanPagePath;
      return applySecurityHeaders(redirect(canonicalUrl.toString(), 308), env.NODE_ENV);
    }

    const token = cookies.get('__Host-qc_session')?.value;
    if (token) {
      try {
        const deps = identityDependencies();
        const resolved = await new ResolveSessionUseCase(deps.sessionService).execute(token);
        locals.user = resolved.user;
        locals.actor = await resolveActor(deps.database, resolved.user.id);
      } catch {
        locals.user = undefined;
        locals.actor = undefined;
      }
    }

    let response: Response;

    // Astro form Actions are executed after user middleware. Login's limiter
    // therefore lives inside `actions.login`, where Astro can redirect normal
    // browser failures back into the login page rather than exposing a raw
    // problem document. Direct Action/API calls are covered by that same
    // handler; no browser form path bypasses the limiter.
    const isLoginActionPost =
      url.pathname === '/login' &&
      request.method === 'POST' &&
      url.searchParams.get('_astroAction') === 'login';
    const rateLimitResolution = isLoginActionPost
      ? undefined
      : resolveHighRiskRateLimitPolicy(url.pathname, request.method, process.env, env.NODE_ENV);
    if (rateLimitResolution === 'FAIL_CLOSED') {
      // Production without configured thresholds: fail closed (§142).
      requestLogger.warn(
        {
          event: 'security.rate_limit.fail_closed',
          route_template: normalizeRouteTemplate(url.pathname),
        },
        'rate limit policy unconfigured in production',
      );
      response = rateLimitedResponse(requestContext.requestId, 60);
    } else if (rateLimitResolution) {
      const decision = await getHighRiskRateLimiter().check(
        rateLimitResolution,
        clientAddress ?? 'unknown',
      );
      if (!decision.allowed) {
        requestLogger.warn(
          {
            event: 'security.rate_limit.denied',
            route_template: normalizeRouteTemplate(url.pathname),
            outcome: 'denied',
          },
          'rate limit denial',
        );
        recordCounter('qc_rate_limit_denials_total', 1, {
          outcome: 'denied',
          route_template: normalizeRouteTemplate(url.pathname),
        });
        response = rateLimitedResponse(requestContext.requestId, decision.retryAfterSeconds);
      } else {
        response = await runWithCorrelation(
          {
            requestId: requestContext.requestId,
            traceId: requestContext.traceId,
            spanId: requestContext.spanId,
          },
          () => next(),
        );
      }
    } else {
      response = await runWithCorrelation(
        {
          requestId: requestContext.requestId,
          traceId: requestContext.traceId,
          spanId: requestContext.spanId,
        },
        () => next(),
      );
    }

    if (
      !publicPaths.has(url.pathname) &&
      !locals.user &&
      !url.pathname.startsWith('/api/') &&
      response.status < 400
    ) {
      response = redirect(
        `/login?returnTo=${encodeURIComponent(`${url.pathname}${url.search}`)}`,
        303,
      );
    }
    if (url.pathname === '/login' && locals.user) response = redirect('/dashboard', 303);

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const routeTemplate = normalizeRouteTemplate(url.pathname);
    const statusClass = `${Math.floor(response.status / 100)}xx`;
    recordCounter('qc_http_requests_total', 1, {
      route_template: routeTemplate,
      http_method: request.method,
      status_class: statusClass,
      environment: env.NODE_ENV,
    });
    recordHistogram('qc_http_server_duration_ms', durationMs, {
      route_template: routeTemplate,
      http_method: request.method,
      status_class: statusClass,
      environment: env.NODE_ENV,
    });
    requestLogger.info(
      {
        event: 'http.request',
        route_template: routeTemplate,
        http_method: request.method,
        status_class: statusClass,
        duration_ms: durationMs,
      },
      'request completed',
    );
    return applySecurityHeaders(response, env.NODE_ENV);
  },
);
