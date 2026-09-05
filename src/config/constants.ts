export const APP_TIME_ZONE = 'Asia/Riyadh';
export const UTC_TIME_ZONE = 'UTC';
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
export const REQUEST_ID_HEADER = 'x-request-id';
export const TRACEPARENT_HEADER = 'traceparent';
export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

export const ENV_KEYS = {
  nodeEnv: 'NODE_ENV',
  databaseUrl: 'DATABASE_URL',
  sessionSecret: 'SESSION_SECRET',
  serviceVersion: 'SERVICE_VERSION',
  otelEndpoint: 'OTEL_EXPORTER_OTLP_ENDPOINT',
  otelHeaders: 'OTEL_EXPORTER_OTLP_HEADERS',
  rateLimitLoginMax: 'RATE_LIMIT_LOGIN_MAX',
  rateLimitLoginWindowSeconds: 'RATE_LIMIT_LOGIN_WINDOW_SECONDS',
} as const;

export const CRITICAL_ENV_KEYS = [ENV_KEYS.databaseUrl, ENV_KEYS.sessionSecret] as const;
export const OPTIONAL_ENV_KEYS = [
  ENV_KEYS.serviceVersion,
  ENV_KEYS.otelEndpoint,
  ENV_KEYS.otelHeaders,
  ENV_KEYS.rateLimitLoginMax,
  ENV_KEYS.rateLimitLoginWindowSeconds,
] as const;
