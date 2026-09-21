import { Writable } from 'node:stream';
import pino, { type Logger } from 'pino';
import { SERVICE_NAME, getServiceVersion } from '../../config/release.js';
import {
  DEFAULT_LOG_LEVEL,
  SERVER_LOG_LEVELS,
  type ServerLogLevel,
} from '../../config/constants.js';

/**
 * Resolve the configured log level. Startup validation (`parseServerEnv`)
 * rejects an unknown `LOG_LEVEL`; at the request path the logger itself must
 * never break a request, so an unexpected value degrades to `info`.
 */
export function resolveLogLevel(candidate: string | undefined): ServerLogLevel {
  const normalized = candidate?.trim().toLowerCase();
  return (SERVER_LOG_LEVELS as readonly string[]).includes(normalized ?? '')
    ? (normalized as ServerLogLevel)
    : DEFAULT_LOG_LEVEL;
}

/**
 * Structured JSON application logging (OBSERVABILITY-ARCHITECTURE §15).
 * Security/audit records are a separate capability; this logger must never be
 * used as business audit evidence. Sensitive fields are redacted before
 * serialization (SECURITY-ARCHITECTURE §131).
 */

const REDACT_PATHS = [
  'password',
  '*.password',
  'currentPassword',
  'newPassword',
  'passwordHash',
  'password_hash',
  'token',
  '*.token',
  'sessionToken',
  'resetToken',
  'secret',
  '*.secret',
  'apiKey',
  'authorization',
  'cookie',
  '*.cookie',
  'setCookie',
  'signatureSecret',
  'email',
  '*.email',
  'phone',
  '*.phone',
  'mobile',
  '*.mobile',
  'query',
  '*.query',
  'searchQuery',
  '*.searchQuery',
  'formValues',
  '*.formValues',
  'rawBody',
  '*.rawBody',
  'prompt',
  '*.prompt',
  'contextContent',
  '*.contextContent',
  'recordContent',
  '*.recordContent',
  'content',
  '*.content',
  'request',
  '*.request',
  'response',
  '*.response',
];

export interface StructuredLogger {
  debug(fields: Record<string, unknown>, message?: string): void;
  info(fields: Record<string, unknown>, message?: string): void;
  warn(fields: Record<string, unknown>, message?: string): void;
  error(fields: Record<string, unknown>, message?: string): void;
}

export interface RequestLogCorrelation {
  requestId?: string;
  traceId?: string;
  spanId?: string;
}

export function createRequestLogger(
  correlation?: RequestLogCorrelation,
  destination?: Writable,
): StructuredLogger {
  const base = pino(
    {
      level: resolveLogLevel(process.env.LOG_LEVEL),
      base: {
        service_name: SERVICE_NAME,
        service_version: getServiceVersion(process.env, '0.1.0'),
        environment: process.env.NODE_ENV ?? 'development',
      },
      redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
      formatters: {
        level(label) {
          return { level: label };
        },
      },
    },
    destination ?? pino.destination({ dest: 1, sync: false }),
  );
  const bound = correlation
    ? base.child({
        ...(correlation.requestId ? { requestId: correlation.requestId } : {}),
        ...(correlation.traceId ? { traceId: correlation.traceId } : {}),
        ...(correlation.spanId ? { spanId: correlation.spanId } : {}),
      })
    : base;
  return wrapSafe(bound);
}

function wrapSafe(logger: Logger): StructuredLogger {
  const safe =
    (level: 'debug' | 'info' | 'warn' | 'error') =>
    (fields: Record<string, unknown>, message?: string) => {
      try {
        logger[level](fields, message ?? '');
      } catch {
        // log sink failure must never break a request
      }
    };
  return {
    debug: safe('debug'),
    info: safe('info'),
    warn: safe('warn'),
    error: safe('error'),
  };
}
