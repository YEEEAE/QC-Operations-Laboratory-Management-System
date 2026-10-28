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
  'databaseUrl',
  '*.databaseUrl',
  'DATABASE_URL',
  '*.DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  '*.DATABASE_URL_UNPOOLED',
  'connectionString',
  '*.connectionString',
  'dsn',
  '*.dsn',
  'EXPLABS_API_KEY',
  '*.EXPLABS_API_KEY',
  'NEON_AUTH_JWKS_URL',
  '*.NEON_AUTH_JWKS_URL',
];

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY = /(?:password|secret|token|api[_-]?key|key$|authorization|cookie|credential|connection[_-]?string|database[_-]?url|^dsn$)/i;
const POSTGRES_URL = /\bpostgres(?:ql)?:\/\/[^\s"'`<>]+/gi;
const URI_USERINFO = /\b(https?:\/\/)[^/@\s]+@/gi;
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT = /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\b/g;
const SECRET_QUERY_VALUE = /([?&][^=?&#\s]*(?:token|password|api[_-]?key|apikey|secret|credential|signature)[^=]*=)[^&#\s]*/gi;
const SECRET_HEADER = /(["']?[A-Za-z0-9_-]*(?:authorization|api[_-]?key|key|token|secret|credential|cookie)[A-Za-z0-9_-]*["']?\s*[:=]\s*["']?)[^\s,;"'}]+/gi;
const INLINE_SECRET = /\b((?:EXPLABS_API_KEY|DATABASE_URL_UNPOOLED|MIGRATION_DATABASE_URL|password|secret|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi;

function redactText(value: string): string {
  return value
    .replace(POSTGRES_URL, '[REDACTED_DATABASE_URL]')
    .replace(URI_USERINFO, '$1[REDACTED]@')
    .replace(BEARER_TOKEN, `Bearer ${REDACTED}`)
    .replace(JWT, REDACTED)
    .replace(SECRET_QUERY_VALUE, `$1${REDACTED}`)
    .replace(SECRET_HEADER, `$1${REDACTED}`)
    .replace(INLINE_SECRET, `$1${REDACTED}`);
}

function sanitizeLogValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') return redactText(value);
  if (typeof value !== 'object' || value === null) return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactText(value.message),
      ...(value.stack ? { stack: redactText(value.stack) } : {}),
      ...(value.cause ? { cause: sanitizeLogValue(value.cause, seen) } : {}),
    };
  }
  if (Array.isArray(value)) return value.map((entry) => sanitizeLogValue(entry, seen));
  const sanitized: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    sanitized[key] = SENSITIVE_KEY.test(key) ? REDACTED : sanitizeLogValue(entry, seen);
  }
  return sanitized;
}

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
        logger[level](sanitizeLogValue(fields) as Record<string, unknown>, redactText(message ?? ''));
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
