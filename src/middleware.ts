import { defineMiddleware } from 'astro:middleware';
import { createRequestContext } from './shared/http/request-context';
import { getDatabase } from './shared/database/database.js';
import {
  identityDependencies,
  resolveActor,
} from './modules/identity/application/identity-dependencies.js';
import { ResolveSessionUseCase } from './modules/identity/application/resolve-session.js';
import { applySecurityHeaders } from './shared/security/security-headers';
import {
  InMemoryRateLimitStore,
  RateLimiter,
  resolveHighRiskRateLimitPolicy,
} from './shared/security/rate-limit';
import {
  normalizeRouteTemplate,
  recordCounter,
  runWithCorrelation,
} from './shared/observability/telemetry';
import { createRequestLogger } from './shared/observability/logger';
import { cleanAstroPagePath } from './shared/routing/clean-page-path';
import { getServerEnv } from './config/env';
import { PROBLEM_CONTENT_TYPE } from './config/constants';

const publicPaths = new Set(['/login']);

// Fixed-window limiter for high-risk POST routes; thresholds are config-driven
// (SECURITY-ARCHITECTURE §33/§141). This is abuse protection only — never
// authorization.
const highRiskRateLimiter = new RateLimiter(new InMemoryRateLimitStore());
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
    locals.requestContext = createRequestContext(request);
    const requestContext = locals.requestContext;
    const env = getServerEnv();

    // qclevel.top is the only production origin. Render's custom-domain
    // pairing handles www, while this fixed destination also canonicalizes
    // the Render hostname and any unexpected host without trusting Host data.
    const cleanPagePath = cleanAstroPagePath(url.pathname);
    if (env.NODE_ENV === 'production' && (url.hostname !== 'qclevel.top' || cleanPagePath)) {
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
        const deps = identityDependencies(getDatabase());
        const resolved = await new ResolveSessionUseCase(deps.sessionService).execute(token);
        locals.user = resolved.user;
        locals.actor = await resolveActor(deps.database, resolved.user.id);
      } catch {
        locals.user = undefined;
        locals.actor = undefined;
      }
    }

    let response: Response;

    const rateLimitResolution = resolveHighRiskRateLimitPolicy(
      url.pathname,
      request.method,
      process.env,
      env.NODE_ENV,
    );
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
      const decision = await highRiskRateLimiter.check(
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

    const startMs = Date.now();
    const routeTemplate = normalizeRouteTemplate(url.pathname);
    const statusClass = `${Math.floor(response.status / 100)}xx`;
    recordCounter('qc_http_requests_total', 1, {
      route_template: routeTemplate,
      http_method: request.method,
      status_class: statusClass,
    });
    requestLogger.info(
      {
        event: 'http.request',
        route_template: routeTemplate,
        http_method: request.method,
        status_class: statusClass,
        duration_ms: Date.now() - startMs,
      },
      'request completed',
    );
    return applySecurityHeaders(response, env.NODE_ENV);
  },
);
