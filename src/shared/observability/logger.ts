import { Writable } from 'node:stream';
import pino, { type Logger } from 'pino';

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
      level: process.env.LOG_LEVEL ?? 'info',
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
