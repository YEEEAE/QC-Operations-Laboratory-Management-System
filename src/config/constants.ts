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
  logLevel: 'LOG_LEVEL',
  releaseId: 'RELEASE_ID',
  releaseBuildId: 'RELEASE_BUILD_ID',
  releaseBuildTimestamp: 'RELEASE_BUILD_TIMESTAMP',
  releaseEnvironment: 'RELEASE_ENVIRONMENT',
  releaseGitSha: 'RELEASE_GIT_SHA',
  releaseMigrationHead: 'RELEASE_MIGRATION_HEAD',
  releaseEvidenceSigners: 'RELEASE_EVIDENCE_SIGNERS_JSON',
  otelEndpoint: 'OTEL_EXPORTER_OTLP_ENDPOINT',
  otelHeaders: 'OTEL_EXPORTER_OTLP_HEADERS',
  rateLimitLoginMax: 'RATE_LIMIT_LOGIN_MAX',
  rateLimitLoginWindowSeconds: 'RATE_LIMIT_LOGIN_WINDOW_SECONDS',
  r2Endpoint: 'R2_ENDPOINT',
  r2AccessKeyId: 'R2_ACCESS_KEY_ID',
  r2SecretAccessKey: 'R2_SECRET_ACCESS_KEY',
  r2Bucket: 'R2_BUCKET',
  aiPrimaryProvider: 'AI_PRIMARY_PROVIDER',
  aiFallbackProvider: 'AI_FALLBACK_PROVIDER',
  aiExternalProcessingApproved: 'AI_EXTERNAL_PROCESSING_APPROVED',
  aiProcessingPolicyJson: 'AI_PROCESSING_POLICY_JSON',
  groqApiKey: 'GROQ_API_KEY',
  groqModel: 'GROQ_MODEL',
  groqBaseUrl: 'GROQ_BASE_URL',
  geminiApiKey: 'GEMINI_API_KEY',
  geminiModel: 'GEMINI_MODEL',
  geminiBaseUrl: 'GEMINI_BASE_URL',
} as const;

export const CRITICAL_ENV_KEYS = [ENV_KEYS.databaseUrl, ENV_KEYS.sessionSecret] as const;
export const OPTIONAL_ENV_KEYS = [
  ENV_KEYS.serviceVersion,
  ENV_KEYS.logLevel,
  ENV_KEYS.releaseId,
  ENV_KEYS.releaseBuildId,
  ENV_KEYS.releaseBuildTimestamp,
  ENV_KEYS.releaseEnvironment,
  ENV_KEYS.releaseGitSha,
  ENV_KEYS.releaseMigrationHead,
  ENV_KEYS.releaseEvidenceSigners,
  ENV_KEYS.otelEndpoint,
  ENV_KEYS.otelHeaders,
  ENV_KEYS.rateLimitLoginMax,
  ENV_KEYS.rateLimitLoginWindowSeconds,
  ENV_KEYS.r2Endpoint,
  ENV_KEYS.r2AccessKeyId,
  ENV_KEYS.r2SecretAccessKey,
  ENV_KEYS.r2Bucket,
] as const;

// Structured logging levels accepted by the pino sink. `src/config/env.ts`
// rejects any other value at validation time; the logger itself resolves an
// unexpected value to `info` because logging must never break a request.
export const SERVER_LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;
export type ServerLogLevel = (typeof SERVER_LOG_LEVELS)[number];
export const DEFAULT_LOG_LEVEL: ServerLogLevel = 'info';

export const R2_ENV_KEYS = [
  ENV_KEYS.r2Endpoint,
  ENV_KEYS.r2AccessKeyId,
  ENV_KEYS.r2SecretAccessKey,
  ENV_KEYS.r2Bucket,
] as const;
