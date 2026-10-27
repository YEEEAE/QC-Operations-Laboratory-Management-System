import { z } from 'zod';
import { ENV_KEYS, PILOT_R2_ENV_KEYS, R2_ENV_KEYS, SERVER_LOG_LEVELS, STAGING_R2_ENV_KEYS } from './constants';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENVIRONMENT_PROFILE: z.enum(['development', 'test', 'production', 'staging', 'pilot']).optional(),
  DATABASE_URL: z
    .string()
    .trim()
    .refine((value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === 'postgres:' || protocol === 'postgresql:';
      } catch {
        return false;
      }
    }, 'must be a PostgreSQL URL')
    .optional(),
  STAGING_DATABASE_URL: z.string().trim().optional(),
  PILOT_DATABASE_URL: z.string().trim().optional(),
  STAGING_DATABASE_HOST: z.string().trim().optional(),
  PILOT_DATABASE_HOST: z.string().trim().optional(),
  PRODUCTION_DATABASE_HOST: z.string().trim().optional(),
  PILOT_ENABLED: z.enum(['true', 'false']).default('false'),
  PILOT_SHADOW_MODE: z.enum(['true', 'false']).default('true'),
  PILOT_SCOPE_SITE: z.string().trim().optional(),
  PILOT_SCOPE_DEPARTMENT: z.string().trim().optional(),
  PILOT_SCOPE_LINE: z.string().trim().optional(),
  PILOT_SCOPE_SHIFT: z.string().trim().optional(),
  PILOT_REAL_MASTER_DATA_ENABLED: z.enum(['true', 'false']).default('false'),
  PILOT_MASTER_DATA_APPROVAL_REFERENCE: z.string().trim().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  SERVICE_VERSION: z.string().trim().min(1).default('0.1.0'),
  LOG_LEVEL: z.enum(SERVER_LOG_LEVELS).optional(),
  // Render platform metadata is runtime-derived; never accept a browser copy.
  RENDER: z.enum(['true', 'false']).optional(),
  RENDER_GIT_COMMIT: z.string().trim().optional(),
  RELEASE_EVIDENCE_SIGNERS_JSON: z.string().trim().min(1).optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().trim().pipe(z.url()).optional(),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().trim().min(1).optional(),
  RATE_LIMIT_LOGIN_MAX: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_LOGIN_WINDOW_SECONDS: z.string().regex(/^\d+$/).optional(),
  R2_ENDPOINT: z.string().trim().pipe(z.url()).optional(),
  R2_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().trim().min(3).optional(),
  STAGING_R2_ENDPOINT: z.string().trim().pipe(z.url()).optional(),
  STAGING_R2_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
  STAGING_R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  STAGING_R2_BUCKET: z.string().trim().min(3).optional(),
  PILOT_R2_ENDPOINT: z.string().trim().pipe(z.url()).optional(),
  PILOT_R2_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
  PILOT_R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  PILOT_R2_BUCKET: z.string().trim().min(3).optional(),
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
        const expectedHost = profile === 'staging' ? result.data.STAGING_DATABASE_HOST : profile === 'pilot' ? result.data.PILOT_DATABASE_HOST : undefined;
        if (expectedHost && parsed.hostname.toLowerCase() !== expectedHost.toLowerCase()) throw new Error();
        if ((profile === 'staging' || profile === 'pilot') && parsed.hostname.toLowerCase() === result.data.PRODUCTION_DATABASE_HOST?.toLowerCase()) throw new Error();
      } catch {
        throw new InvalidEnvironmentError([], [profile === 'staging' ? ENV_KEYS.stagingDatabaseUrl : profile === 'pilot' ? ENV_KEYS.pilotDatabaseUrl : ENV_KEYS.databaseUrl]);
      }
    }
    const productionMissing =
      result.data.NODE_ENV === 'production'
        ? [
            !selectedDatabase ? (profile === 'staging' ? ENV_KEYS.stagingDatabaseUrl : profile === 'pilot' ? ENV_KEYS.pilotDatabaseUrl : ENV_KEYS.databaseUrl) : '',
            !result.data.SESSION_SECRET ? ENV_KEYS.sessionSecret : '',
            !input.SERVICE_VERSION?.trim() ? ENV_KEYS.serviceVersion : '',
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
