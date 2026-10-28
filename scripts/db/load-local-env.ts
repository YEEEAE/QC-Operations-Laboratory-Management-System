import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCAL_RUNTIME_ENV_KEYS = new Set([
  'NODE_ENV',
  'APP_ENVIRONMENT_PROFILE',
  'DATABASE_URL',
  'STAGING_DATABASE_URL',
  'PILOT_DATABASE_URL',
  'PRODUCTION_DATABASE_HOST',
  'PRODUCTION_DATABASE_NAME',
  'STAGING_DATABASE_HOST',
  'STAGING_DATABASE_NAME',
  'PILOT_DATABASE_HOST',
  'PILOT_DATABASE_NAME',
  'NEON_BRANCH',
  'NEON_AUTH_JWKS_URL',
  'NEON_AUTH_ISSUER',
  'NEON_AUTH_AUDIENCE',
  'STAGING_NEON_AUTH_JWKS_URL',
  'STAGING_NEON_AUTH_ISSUER',
  'STAGING_NEON_AUTH_AUDIENCE',
  'PILOT_NEON_AUTH_JWKS_URL',
  'PILOT_NEON_AUTH_ISSUER',
  'PILOT_NEON_AUTH_AUDIENCE',
  'EXPLABS_API_KEY',
  'STAGING_EXPLABS_API_KEY',
  'PILOT_EXPLABS_API_KEY',
  'SESSION_SECRET',
  'STAGING_SESSION_SECRET',
  'PILOT_SESSION_SECRET',
  'SERVICE_VERSION',
  'LOG_LEVEL',
  'RATE_LIMIT_LOGIN_MAX',
  'RATE_LIMIT_LOGIN_WINDOW_SECONDS',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
  'OTEL_EXPORTER_OTLP_HEADERS',
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'STAGING_R2_ENDPOINT',
  'STAGING_R2_ACCESS_KEY_ID',
  'STAGING_R2_SECRET_ACCESS_KEY',
  'STAGING_R2_BUCKET',
  'PILOT_R2_ENDPOINT',
  'PILOT_R2_ACCESS_KEY_ID',
  'PILOT_R2_SECRET_ACCESS_KEY',
  'PILOT_R2_BUCKET',
  'AI_EXTERNAL_PROCESSING_APPROVED',
  'AI_PROCESSING_POLICY_JSON',
  'AI_PRIMARY_PROVIDER',
  'AI_FALLBACK_PROVIDER',
  'GROQ_API_KEY',
  'GROQ_MODEL',
  'GROQ_BASE_URL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GEMINI_BASE_URL',
]);

const LOCAL_OPERATOR_ENV_KEYS = new Set([
  // Used only by the explicit migration CLI; never part of runtime config.
  'MIGRATION_DATABASE_URL',
  'MIGRATION_PRODUCTION_RELEASE_ID',
  'MIGRATION_PRODUCTION_APPROVAL_REFERENCE',
  'BOOTSTRAP_ADMIN_IDENTITY',
  'BOOTSTRAP_ADMIN_PASSWORD',
  'BOOTSTRAP_ADMIN_DISPLAY_NAME',
  'BOOTSTRAP_ADMIN_EMAIL',
  'SYSTEM_OWNER_LOGIN_IDENTITY',
  'QC_VERIFY_BASE_URL',
  'QC_VERIFY_SYSTEM_OWNER_PASSWORD',
  'QC_VERIFY_SUPERVISOR_PASSWORD',
  'QC_VERIFY_MANAGER_PASSWORD',
  'QC_VERIFY_ADMIN_PASSWORD',
  'QC_VERIFY_EMPLOYEE_PASSWORD',
  'QC_VERIFY_LEAST_PASSWORD',
  'QC_E2E_PASSWORD',
  'QC_E2E_LOGIN_PASSWORD',
  'QC_E2E_ADMIN_PASSWORD',
  'QC_E2E_SUPERVISOR_PASSWORD',
  'QC_E2E_MANAGER_PASSWORD',
  'QC_E2E_SYSTEM_OWNER_PASSWORD',
  'QC_E2E_LEAST_SESSION_TOKEN',
  'QC_MASTER_DATA_IMPORT_ALLOW',
  'QC_SEED_ALLOW_NON_PRODUCTION',
  'QC_VERIFICATION_SEED_ALLOW',
  'QC_VERIFICATION_OPERATOR_IDENTITY',
  // QC-100-FINAL-004 Task 4: UAT persona passwords (uat-* disposable accounts).
  'QC_UAT_SYSTEM_OWNER_PASSWORD',
  'QC_UAT_QCM_PASSWORD',
  'QC_UAT_SUPERVISOR_PASSWORD',
  'QC_UAT_QC01_PASSWORD',
  'QC_UAT_QC02_PASSWORD',
  'QC_UAT_QC03_PASSWORD',
  'QC_UAT_SEED_ALLOW',
  'QC_UAT_OPERATOR_IDENTITY',
  // QC-100-FINAL-004 Task 5: evidence ingestion guards + acceptance ceremony.
  'QC_UAT_INGEST_ALLOW',
  'QC_UAT_PINNED_RELEASE_SHA',
  'QC_UAT_ACCEPT_PASSWORD',
  'QC_UAT_ACCEPT_SIGNER_IDENTITY',
]);

const LOCAL_MIGRATION_ENV_KEYS = new Set(['DATABASE_URL_UNPOOLED']);

function parseValue(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed.replace(/\s+#.*$/, '').trim();
}

function parseAllowlistedEnvFile(
  contents: string,
  allowedKeys: ReadonlySet<string>,
): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!match || !allowedKeys.has(match[1])) continue;
    parsed[match[1]] = parseValue(match[2]);
  }
  return parsed;
}

/** Parse only canonical application configuration from a local env file. */
export function parseLocalEnvFile(contents: string): Record<string, string> {
  return parseAllowlistedEnvFile(contents, LOCAL_RUNTIME_ENV_KEYS);
}

/** Parse one-time operator and non-production verification settings explicitly. */
export function parseLocalOperatorEnvFile(contents: string): Record<string, string> {
  return parseAllowlistedEnvFile(contents, LOCAL_OPERATOR_ENV_KEYS);
}

/** Parse the direct URL only for the explicit migration CLI. */
export function parseLocalMigrationEnvFile(contents: string): Record<string, string> {
  return parseAllowlistedEnvFile(contents, LOCAL_MIGRATION_ENV_KEYS);
}

export function loadLocalEnv(
  environment: NodeJS.ProcessEnv = process.env,
  path = resolve(process.cwd(), '.env'),
): void {
  let contents: string;
  try {
    contents = readFileSync(path, 'utf8');
  } catch {
    return;
  }

  for (const [key, value] of Object.entries(parseLocalEnvFile(contents))) {
    if (environment[key] === undefined) environment[key] = value;
  }
}

/**
 * Opt-in loader for guarded operator/verification CLIs. Runtime and generic
 * diagnostics must use loadLocalEnv(), which never merges these values.
 */
export function loadLocalOperatorEnv(
  environment: NodeJS.ProcessEnv = process.env,
  path = resolve(process.cwd(), '.env'),
): void {
  let contents: string;
  try {
    contents = readFileSync(path, 'utf8');
  } catch {
    return;
  }

  for (const [key, value] of Object.entries(parseLocalOperatorEnvFile(contents))) {
    if (environment[key] === undefined) environment[key] = value;
  }
}

/** Load the direct database URL only in the explicit migration CLI. */
export function loadLocalMigrationEnv(
  environment: NodeJS.ProcessEnv = process.env,
  path = resolve(process.cwd(), '.env'),
): void {
  let contents: string;
  try {
    contents = readFileSync(path, 'utf8');
  } catch {
    return;
  }

  for (const [key, value] of Object.entries(parseLocalMigrationEnvFile(contents))) {
    if (environment[key] === undefined) environment[key] = value;
  }
}
