import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { safeReturnTo } from '../shared/http/safe-return-to.js';
import { isAstroActionError, toActionError } from '../shared/errors/action-error.js';
import { identityDependencies } from '../modules/identity/application/identity-dependencies.js';
import { LoginUseCase } from '../modules/identity/application/login.js';
import { LogoutUseCase } from '../modules/identity/application/logout.js';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../shared/security/session-cookie.js';
import { getServerEnv } from '../config/env.js';
import { resolveHighRiskRateLimitPolicy } from '../shared/security/rate-limit.js';
import { rateLimitDependencies } from '../shared/security/rate-limit-dependencies.js';
import { createRequestLogger } from '../shared/observability/logger.js';
import { recordCounter } from '../shared/observability/telemetry.js';

const requestLogger = createRequestLogger();

const login = defineAction({
  accept: 'form',
  input: z.object({
    loginIdentity: z.string(),
    password: z.string(),
    returnTo: z.string().optional(),
  }),
  handler: async (input, context) => {
    try {
      const env = getServerEnv();
      const policy = resolveHighRiskRateLimitPolicy('/login', 'POST', process.env, env.NODE_ENV);
      if (policy === 'FAIL_CLOSED') {
        requestLogger.error(
          { event: 'security.rate_limit.store_unavailable' },
          'login rate-limit policy unavailable',
        );
        recordCounter('qc_rate_limit_store_unavailable_total', 1, { outcome: 'fail_closed' });
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AUTH_RATE_LIMIT_STORE_UNAVAILABLE',
        });
      }
      const decision = policy
        ? await rateLimitDependencies().check(policy, context.clientAddress ?? 'unknown')
        : undefined;
      if (decision?.outcome === 'STORE_UNAVAILABLE') {
        requestLogger.error(
          {
            event: 'security.rate_limit.store_unavailable',
            requestId: context.locals.requestContext?.requestId,
          },
          'login rate-limit store unavailable',
        );
        recordCounter('qc_rate_limit_store_unavailable_total', 1, { outcome: 'fail_closed' });
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AUTH_RATE_LIMIT_STORE_UNAVAILABLE',
        });
      }
      if (decision?.outcome === 'THROTTLED') {
        requestLogger.warn(
          {
            event: 'auth.login.rate_limited',
            requestId: context.locals.requestContext?.requestId,
          },
          'login rate limit exceeded',
        );
        recordCounter('qc_rate_limit_denials_total', 1, { outcome: 'throttled' });
        throw new ActionError({ code: 'TOO_MANY_REQUESTS', message: 'AUTH_RATE_LIMITED' });
      }
      const deps = identityDependencies();
      const result = await new LoginUseCase(
        deps.users,
        deps.passwords,
        deps.sessionService,
      ).execute(input.loginIdentity, input.password);
      context.cookies.set(
        SESSION_COOKIE_NAME,
        result.cookie.split(';')[0].split('=').slice(1).join('='),
        sessionCookieOptions(),
      );
      requestLogger.info(
        { event: 'auth.login.success', requestId: context.locals.requestContext?.requestId },
        'login succeeded',
      );
      return { ok: true, redirectTo: safeReturnTo(input.returnTo) };
    } catch (error) {
      if (isAstroActionError(error)) throw error;
      const mapped = toActionError(error, context.locals.requestContext?.requestId);
      requestLogger.warn(
        { event: 'auth.login.failure', requestId: context.locals.requestContext?.requestId },
        'login failed',
      );
      throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey });
    }
  },
});

const logout = defineAction({
  accept: 'form',
  handler: async (_, context) => {
    try {
      const deps = identityDependencies();
      const cookie = await new LogoutUseCase(deps.sessionService).execute(
        context.cookies.get(SESSION_COOKIE_NAME)?.value,
      );
      const [name, value] = cookie.split(';', 1)[0].split('=');
      context.cookies.set(
        name,
        decodeURIComponent(value ?? ''),
        sessionCookieOptions({ expired: true }),
      );
      return { ok: true, redirectTo: '/login' };
    } catch (error) {
      const mapped = toActionError(error, context.locals.requestContext?.requestId);
      throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey });
    }
  },
});

export const server = { login, logout };
