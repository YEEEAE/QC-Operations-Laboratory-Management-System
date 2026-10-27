import { createHash } from 'node:crypto';
import { z } from 'zod';
import { ENV_KEYS, PILOT_R2_ENV_KEYS, R2_ENV_KEYS, SERVER_LOG_LEVELS, STAGING_R2_ENV_KEYS } from './constants';

const postgresUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
        Boolean(url.hostname) &&
        Boolean(url.pathname && url.pathname !== '/')
      );
    } catch {
      return false;
    }
  }, 'must be a PostgreSQL URL');
const optionalEnv = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );

function databaseIdentityFingerprint(value: string): string {
  const url = new URL(value);
  // Hash only the URL identity fields. The digest is used for equality checks,
  // never returned to the UI or logs; the raw URL remains in server memory only.
  return createHash('sha256')
    .update([
      url.protocol,
      url.hostname.toLowerCase(),
      url.port,
      url.pathname,
      url.username,
      url.password,
      [...url.searchParams.entries()]
        .filter(([key]) => /^(?:password|user|token|access[_-]?token|refresh[_-]?token|api[_-]?key|apikey|client[_-]?secret|secret)$/i.test(key))
        .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
          leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue),
        )
        .map(([key, value]) => `${key}=${value}`)
        .join('&'),
    ].join('\u0000'))
    .digest('hex');
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENVIRONMENT_PROFILE: z.enum(['development', 'test', 'production', 'staging', 'pilot']).optional(),
  DATABASE_URL: optionalEnv(postgresUrlSchema),
  STAGING_DATABASE_URL: optionalEnv(postgresUrlSchema),
  PILOT_DATABASE_URL: optionalEnv(postgresUrlSchema),
  // These are server-side metadata/credentials only. DATABASE_URL_UNPOOLED is
  // deliberately rejected by the runtime parser below and belongs in operator
  // tooling, never in the web service process.
  DATABASE_URL_UNPOOLED: optionalEnv(z.string().trim()),
  NEON_BRANCH: optionalEnv(z.string().trim().min(1)),
  NEON_AUTH_JWKS_URL: optionalEnv(z.string().trim().url().refine((value) => new URL(value).protocol === 'https:', 'must use HTTPS')),
  NEON_AUTH_ISSUER: optionalEnv(z.string().trim().url().refine((value) => new URL(value).protocol === 'https:', 'must use HTTPS')),
  NEON_AUTH_AUDIENCE: optionalEnv(z.string().trim().min(1)),
  EXPLABS_API_KEY: optionalEnv(z.string().trim().min(1)),
  STAGING_DATABASE_HOST: optionalEnv(z.string().trim()),
  PILOT_DATABASE_HOST: optionalEnv(z.string().trim()),
  PRODUCTION_DATABASE_HOST: optionalEnv(z.string().trim()),
  PILOT_ENABLED: z.enum(['true', 'false']).default('false'),
  PILOT_SHADOW_MODE: z.enum(['true', 'false']).default('true'),
  PILOT_SCOPE_SITE: optionalEnv(z.string().trim()),
  PILOT_SCOPE_DEPARTMENT: optionalEnv(z.string().trim()),
  PILOT_SCOPE_LINE: optionalEnv(z.string().trim()),
  PILOT_SCOPE_SHIFT: optionalEnv(z.string().trim()),
  PILOT_REAL_MASTER_DATA_ENABLED: z.enum(['true', 'false']).default('false'),
  PILOT_MASTER_DATA_APPROVAL_REFERENCE: optionalEnv(z.string().trim()),
  SESSION_SECRET: optionalEnv(z.string().min(32)),
  SERVICE_VERSION: z.string().trim().min(1).default('0.1.0'),
  LOG_LEVEL: optionalEnv(z.enum(SERVER_LOG_LEVELS)),
  // Render platform metadata is runtime-derived; never accept a browser copy.
  RENDER: optionalEnv(z.enum(['true', 'false'])),
  RENDER_GIT_COMMIT: optionalEnv(z.string().trim()),
  RELEASE_EVIDENCE_SIGNERS_JSON: optionalEnv(z.string().trim().min(1)),
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalEnv(z.string().trim().pipe(z.url())),
  OTEL_EXPORTER_OTLP_HEADERS: optionalEnv(z.string().trim().min(1)),
  RATE_LIMIT_LOGIN_MAX: optionalEnv(z.string().regex(/^\d+$/)),
  RATE_LIMIT_LOGIN_WINDOW_SECONDS: optionalEnv(z.string().regex(/^\d+$/)),
  R2_ENDPOINT: optionalEnv(z.string().trim().pipe(z.url())),
  R2_ACCESS_KEY_ID: optionalEnv(z.string().trim().min(1)),
  R2_SECRET_ACCESS_KEY: optionalEnv(z.string().min(1)),
  R2_BUCKET: optionalEnv(z.string().trim().min(3)),
  STAGING_R2_ENDPOINT: optionalEnv(z.string().trim().pipe(z.url())),
  STAGING_R2_ACCESS_KEY_ID: optionalEnv(z.string().trim().min(1)),
  STAGING_R2_SECRET_ACCESS_KEY: optionalEnv(z.string().min(1)),
  STAGING_R2_BUCKET: optionalEnv(z.string().trim().min(3)),
  PILOT_R2_ENDPOINT: optionalEnv(z.string().trim().pipe(z.url())),
  PILOT_R2_ACCESS_KEY_ID: optionalEnv(z.string().trim().min(1)),
  PILOT_R2_SECRET_ACCESS_KEY: optionalEnv(z.string().min(1)),
  PILOT_R2_BUCKET: optionalEnv(z.string().trim().min(3)),
});

export type ServerEnv = z.infer<typeof envSchema> & { APP_ENVIRONMENT_PROFILE: 'development' | 'test' | 'production' | 'staging' | 'pilot'; DATABASE_URL?: string };

export class InvalidEnvironmentError extends Error {
  readonly missing: readonly string[];
  readonly invalid: readonly string[];

  constructor(missing: readonly string[], invalid: readonly string[]) {
    super(
      `Invalid server environment configuration (${[...missing, ...invalid].join(', ') || 'unknown'})`,
    );
    this.name = 'InvalidEnvironmentError';
    this.missing = missing;
    this.invalid = invalid;
  }
}

export function parseServerEnv(input: Record<string, string | undefined>): ServerEnv {
  const result = envSchema.safeParse(input);
  if (result.success) {
    const profile = result.data.APP_ENVIRONMENT_PROFILE ?? result.data.NODE_ENV;
    const profileDatabaseUrl = profile === 'staging' ? result.data.STAGING_DATABASE_URL : profile === 'pilot' ? result.data.PILOT_DATABASE_URL : result.data.DATABASE_URL;
    const invalid: string[] = [];
    const missing: string[] = [];
    if (input.DATABASE_URL_UNPOOLED?.trim()) invalid.push(ENV_KEYS.databaseUrlUnpooled);
    if (input.MIGRATION_DATABASE_URL?.trim()) invalid.push(ENV_KEYS.migrationDatabaseUrl);
    const neonAuthValues = [result.data.NEON_AUTH_JWKS_URL, result.data.NEON_AUTH_ISSUER, result.data.NEON_AUTH_AUDIENCE];
    if (neonAuthValues.some(Boolean) && neonAuthValues.some((value) => !value)) {
      invalid.push(ENV_KEYS.neonAuthJwksUrl, ENV_KEYS.neonAuthIssuer, ENV_KEYS.neonAuthAudience);
    }

    const configuredProfileUrls = [
      [ENV_KEYS.databaseUrl, result.data.DATABASE_URL],
      [ENV_KEYS.stagingDatabaseUrl, result.data.STAGING_DATABASE_URL],
      [ENV_KEYS.pilotDatabaseUrl, result.data.PILOT_DATABASE_URL],
    ] as const;
    const fingerprints = new Map<string, string>();
    for (const [key, value] of configuredProfileUrls) {
      if (!value) continue;
      const fingerprint = databaseIdentityFingerprint(value);
      const previousKey = fingerprints.get(fingerprint);
      if (previousKey) invalid.push(previousKey, key);
      else fingerprints.set(fingerprint, key);
    }
    if (profile === 'staging' || profile === 'pilot') {
      if (result.data.DATABASE_URL) invalid.push(ENV_KEYS.databaseUrl);
      if (!profileDatabaseUrl) missing.push(profile === 'staging' ? ENV_KEYS.stagingDatabaseUrl : ENV_KEYS.pilotDatabaseUrl);
      const expectedHost = profile === 'staging' ? result.data.STAGING_DATABASE_HOST : result.data.PILOT_DATABASE_HOST;
      if (!expectedHost) missing.push(profile === 'staging' ? ENV_KEYS.stagingDatabaseHost : ENV_KEYS.pilotDatabaseHost);
      if (!result.data.PRODUCTION_DATABASE_HOST) missing.push(ENV_KEYS.productionDatabaseHost);
      if (expectedHost && result.data.PRODUCTION_DATABASE_HOST && expectedHost.toLowerCase() === result.data.PRODUCTION_DATABASE_HOST.toLowerCase()) invalid.push(profile === 'staging' ? ENV_KEYS.stagingDatabaseHost : ENV_KEYS.pilotDatabaseHost);
      if (profile === 'staging' && (result.data.PILOT_DATABASE_URL || result.data.PILOT_DATABASE_HOST)) invalid.push(ENV_KEYS.pilotDatabaseUrl);
      if (profile === 'pilot' && (result.data.STAGING_DATABASE_URL || result.data.STAGING_DATABASE_HOST)) invalid.push(ENV_KEYS.stagingDatabaseUrl);
      if (profile === 'pilot' && result.data.PILOT_ENABLED === 'true') {
        if (result.data.PILOT_SHADOW_MODE !== 'true') invalid.push(ENV_KEYS.pilotShadowMode);
        for (const key of [ENV_KEYS.pilotSite, ENV_KEYS.pilotDepartment, ENV_KEYS.pilotLine, ENV_KEYS.pilotShift] as const) {
          if (!input[key]?.trim()) missing.push(key);
        }
      }
    } else if (result.data.STAGING_DATABASE_URL || result.data.PILOT_DATABASE_URL || result.data.STAGING_DATABASE_HOST || result.data.PILOT_DATABASE_HOST) {
      invalid.push(result.data.STAGING_DATABASE_URL ? ENV_KEYS.stagingDatabaseUrl : ENV_KEYS.pilotDatabaseUrl);
    }
    if (result.data.PILOT_REAL_MASTER_DATA_ENABLED === 'true') {
      // No approved source-backed onboarding authority is wired to runtime configuration yet.
      invalid.push(ENV_KEYS.pilotMasterDataEnabled);
    }
    if (result.data.PILOT_ENABLED === 'true' && profile !== 'pilot') invalid.push(ENV_KEYS.pilotEnabled);
    if (missing.length || invalid.length) throw new InvalidEnvironmentError(missing, invalid);
    const selectedDatabase = profileDatabaseUrl;
    if (selectedDatabase) {
      try {
        const parsed = new URL(selectedDatabase);
        if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') throw new Error();
        // Neon runtime URLs use the pooled endpoint; the direct endpoint is
        // reserved for operator migration tooling.
        if (
          parsed.hostname.endsWith('.neon.tech') &&
          !parsed.hostname.split('.')[0]?.endsWith('-pooler')
        ) throw new Error();
        const expectedHost = profile === 'staging' ? result.data.STAGING_DATABASE_HOST : profile === 'pilot' ? result.data.PILOT_DATABASE_HOST : undefined;
        if (expectedHost && parsed.hostname.toLowerCase() !== expectedHost.toLowerCase()) throw new Error();
        if (profile === 'production' && result.data.PRODUCTION_DATABASE_HOST && parsed.hostname.toLowerCase() !== result.data.PRODUCTION_DATABASE_HOST.toLowerCase()) throw new Error();
        if ((profile === 'staging' || profile === 'pilot') && parsed.hostname.toLowerCase() === result.data.PRODUCTION_DATABASE_HOST?.toLowerCase()) throw new Error();
      } catch {
        throw new InvalidEnvironmentError([], [profile === 'staging' ? ENV_KEYS.stagingDatabaseUrl : profile === 'pilot' ? ENV_KEYS.pilotDatabaseUrl : ENV_KEYS.databaseUrl]);
      }
    }
    const productionMissing =
      result.data.NODE_ENV === 'production' || profile === 'production'
        ? [
            !selectedDatabase ? (profile === 'staging' ? ENV_KEYS.stagingDatabaseUrl : profile === 'pilot' ? ENV_KEYS.pilotDatabaseUrl : ENV_KEYS.databaseUrl) : '',
            !result.data.SESSION_SECRET ? ENV_KEYS.sessionSecret : '',
            !input.SERVICE_VERSION?.trim() ? ENV_KEYS.serviceVersion : '',
            profile === 'production' && !result.data.PRODUCTION_DATABASE_HOST ? ENV_KEYS.productionDatabaseHost : '',
            // SECURITY-ARCHITECTURE §142: no unlimited-abuse exposure on login.
            !(result.data.RATE_LIMIT_LOGIN_MAX && result.data.RATE_LIMIT_LOGIN_WINDOW_SECONDS)
              ? `${ENV_KEYS.rateLimitLoginMax} + ${ENV_KEYS.rateLimitLoginWindowSeconds}`
              : '',
          ].filter(Boolean)
        : [];
    if (
      (result.data.OTEL_EXPORTER_OTLP_ENDPOINT && !result.data.OTEL_EXPORTER_OTLP_HEADERS) ||
      (!result.data.OTEL_EXPORTER_OTLP_ENDPOINT && result.data.OTEL_EXPORTER_OTLP_HEADERS)
    ) {
      throw new InvalidEnvironmentError([], [ENV_KEYS.otelEndpoint, ENV_KEYS.otelHeaders]);
    }
    // Backup artifact storage is all-or-none: a partial R2 configuration must
    // fail at validation time instead of surfacing at the first backup attempt
    // (.env.example documents "configure all four together").
    const r2Keys = profile === 'staging' ? STAGING_R2_ENV_KEYS : profile === 'pilot' ? PILOT_R2_ENV_KEYS : R2_ENV_KEYS;
    const r2Values = profile === 'staging'
      ? [result.data.STAGING_R2_ENDPOINT, result.data.STAGING_R2_ACCESS_KEY_ID, result.data.STAGING_R2_SECRET_ACCESS_KEY, result.data.STAGING_R2_BUCKET]
      : profile === 'pilot'
        ? [result.data.PILOT_R2_ENDPOINT, result.data.PILOT_R2_ACCESS_KEY_ID, result.data.PILOT_R2_SECRET_ACCESS_KEY, result.data.PILOT_R2_BUCKET]
        : [result.data.R2_ENDPOINT, result.data.R2_ACCESS_KEY_ID, result.data.R2_SECRET_ACCESS_KEY, result.data.R2_BUCKET];
    const genericR2 = [result.data.R2_ENDPOINT, result.data.R2_ACCESS_KEY_ID, result.data.R2_SECRET_ACCESS_KEY, result.data.R2_BUCKET].filter(Boolean).length;
    if ((profile === 'staging' || profile === 'pilot') && genericR2 > 0) invalid.push(...R2_ENV_KEYS);
    if ((profile === 'production' || profile === 'development' || profile === 'test') && ([...STAGING_R2_ENV_KEYS, ...PILOT_R2_ENV_KEYS].some((key) => input[key]))) invalid.push(...[...STAGING_R2_ENV_KEYS, ...PILOT_R2_ENV_KEYS]);
    const configuredR2 = r2Values.filter(Boolean).length;
    if (profile === 'staging' || profile === 'pilot') {
      if (configuredR2 < r2Keys.length) missing.push(...r2Keys.filter((_, index) => !r2Values[index]));
      const bucket = String(r2Values[3] ?? '').toLowerCase();
      const label = profile === 'staging' ? 'staging' : 'pilot';
      if (bucket && !bucket.includes(label)) invalid.push(profile === 'staging' ? 'STAGING_R2_BUCKET' : 'PILOT_R2_BUCKET');
    }
    if (configuredR2 > 0 && configuredR2 < r2Keys.length) {
      invalid.push(...r2Keys);
    }
    if (missing.length || invalid.length) throw new InvalidEnvironmentError(missing, invalid);
    if (productionMissing.length) throw new InvalidEnvironmentError(productionMissing, []);
    return { ...result.data, APP_ENVIRONMENT_PROFILE: profile, DATABASE_URL: selectedDatabase };
  }

  const missing: string[] = [];
  const invalid: string[] = [];
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? 'unknown');
    if (issue.code === 'invalid_type' && issue.input === undefined) missing.push(key);
    else invalid.push(key);
  }
  throw new InvalidEnvironmentError([...new Set(missing)], [...new Set(invalid)]);
}

let cachedEnv: ServerEnv | undefined;
export function getServerEnv(): ServerEnv {
  return (cachedEnv ??= parseServerEnv(process.env));
}

export function resetServerEnvForTests(): void {
  cachedEnv = undefined;
}

export const serverEnvKeys = ENV_KEYS;
