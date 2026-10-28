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

/** Server-side allowlist: profiles may only bind to their named Neon branch and identity keys. */
const APPROVED_DATABASE_IDENTITIES = {
  production: { branch: 'production', urlKey: 'DATABASE_URL', hostKey: 'PRODUCTION_DATABASE_HOST', databaseKey: 'PRODUCTION_DATABASE_NAME' },
  staging: { branch: 'staging', urlKey: 'STAGING_DATABASE_URL', hostKey: 'STAGING_DATABASE_HOST', databaseKey: 'STAGING_DATABASE_NAME' },
  pilot: { branch: 'pilot', urlKey: 'PILOT_DATABASE_URL', hostKey: 'PILOT_DATABASE_HOST', databaseKey: 'PILOT_DATABASE_NAME' },
} as const;

const NEON_PROFILE_KEYS = Object.keys(APPROVED_DATABASE_IDENTITIES) as (keyof typeof APPROVED_DATABASE_IDENTITIES)[];
const APPROVED_NEON_AUTH_JWKS_URL =
  'https://ep-fragrant-bar-b5ns86ri.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json';

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
  PRODUCTION_DATABASE_NAME: optionalEnv(z.string().trim().min(1)),
  STAGING_DATABASE_NAME: optionalEnv(z.string().trim().min(1)),
  PILOT_DATABASE_NAME: optionalEnv(z.string().trim().min(1)),
  // These are server-side metadata/credentials only. DATABASE_URL_UNPOOLED is
  // deliberately rejected by the runtime parser below and belongs in operator
  // tooling, never in the web service process.
  DATABASE_URL_UNPOOLED: optionalEnv(z.string().trim()),
  NEON_BRANCH: optionalEnv(z.string().trim().min(1)),
  NEON_AUTH_ENABLED: z.enum(['true', 'false']).default('false'),
  LOCAL_PASSWORD_LOGIN_ENABLED: z.enum(['true', 'false']).default('true'),
  NEON_AUTH_JWKS_URL: optionalEnv(z.string().trim().url().refine((value) => value === APPROVED_NEON_AUTH_JWKS_URL, 'must match the owner-approved Neon Auth JWKS URL')),
  NEON_AUTH_ISSUER: optionalEnv(z.string().trim().url().refine((value) => new URL(value).protocol === 'https:', 'must use HTTPS')),
  NEON_AUTH_AUDIENCE: optionalEnv(z.string().trim().min(1)),
  STAGING_NEON_AUTH_JWKS_URL: optionalEnv(z.string().trim().url().refine((value) => value === APPROVED_NEON_AUTH_JWKS_URL, 'must match the owner-approved Neon Auth JWKS URL')),
  STAGING_NEON_AUTH_ISSUER: optionalEnv(z.string().trim().url().refine((value) => new URL(value).protocol === 'https:', 'must use HTTPS')),
  STAGING_NEON_AUTH_AUDIENCE: optionalEnv(z.string().trim().min(1)),
  STAGING_NEON_AUTH_ENABLED: z.enum(['true', 'false']).default('false'),
  PILOT_NEON_AUTH_JWKS_URL: optionalEnv(z.string().trim().url().refine((value) => value === APPROVED_NEON_AUTH_JWKS_URL, 'must match the owner-approved Neon Auth JWKS URL')),
  PILOT_NEON_AUTH_ISSUER: optionalEnv(z.string().trim().url().refine((value) => new URL(value).protocol === 'https:', 'must use HTTPS')),
  PILOT_NEON_AUTH_AUDIENCE: optionalEnv(z.string().trim().min(1)),
  PILOT_NEON_AUTH_ENABLED: z.enum(['true', 'false']).default('false'),
  EXPLABS_API_KEY: optionalEnv(z.string().trim().min(1)),
  STAGING_EXPLABS_API_KEY: optionalEnv(z.string().trim().min(1)),
  PILOT_EXPLABS_API_KEY: optionalEnv(z.string().trim().min(1)),
  EXPLABS_BASE_URL: optionalEnv(z.string().trim().url().refine((value) => new URL(value).protocol === 'https:', 'must use HTTPS')),
  EXPLABS_ALLOWED_ORIGIN: optionalEnv(z.string().trim().url().refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' && url.origin === value && !url.username && !url.password;
  }, 'must be an exact HTTPS origin without credentials, path, query, or fragment')),
  EXPLABS_ENABLED: z.enum(['true', 'false']).default('false'),
  EXPLABS_REQUEST_TIMEOUT_MS: optionalEnv(z.string().regex(/^\d+$/).refine((value) => Number(value) >= 100 && Number(value) <= 30_000, 'must be between 100 and 30000 milliseconds')),
  STAGING_DATABASE_HOST: optionalEnv(z.string().trim()),
  PILOT_DATABASE_HOST: optionalEnv(z.string().trim()),
  PRODUCTION_DATABASE_HOST: optionalEnv(z.string().trim()),
  STAGING_SESSION_SECRET: optionalEnv(z.string().min(32)),
  PILOT_SESSION_SECRET: optionalEnv(z.string().min(32)),
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
  R2_REGION: optionalEnv(z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  STAGING_R2_ENDPOINT: optionalEnv(z.string().trim().pipe(z.url())),
  STAGING_R2_ACCESS_KEY_ID: optionalEnv(z.string().trim().min(1)),
  STAGING_R2_SECRET_ACCESS_KEY: optionalEnv(z.string().min(1)),
  STAGING_R2_BUCKET: optionalEnv(z.string().trim().min(3)),
  STAGING_R2_REGION: optionalEnv(z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  PILOT_R2_ENDPOINT: optionalEnv(z.string().trim().pipe(z.url())),
  PILOT_R2_ACCESS_KEY_ID: optionalEnv(z.string().trim().min(1)),
  PILOT_R2_SECRET_ACCESS_KEY: optionalEnv(z.string().min(1)),
  PILOT_R2_BUCKET: optionalEnv(z.string().trim().min(3)),
  PILOT_R2_REGION: optionalEnv(z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
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
    if (result.data.NODE_ENV === 'production' && !result.data.APP_ENVIRONMENT_PROFILE) {
      throw new InvalidEnvironmentError([ENV_KEYS.appEnvironmentProfile], []);
    }
    const profile = result.data.APP_ENVIRONMENT_PROFILE ?? result.data.NODE_ENV;
    if ((profile === 'development' || profile === 'test') && profile !== result.data.NODE_ENV) {
      throw new InvalidEnvironmentError([], [ENV_KEYS.appEnvironmentProfile]);
    }
    if ((profile === 'staging' || profile === 'pilot') && result.data.NODE_ENV !== 'production') {
      throw new InvalidEnvironmentError([], [ENV_KEYS.appEnvironmentProfile, ENV_KEYS.nodeEnv]);
    }
    if (profile === 'production' && result.data.NODE_ENV !== 'production') {
      throw new InvalidEnvironmentError([], [ENV_KEYS.appEnvironmentProfile, ENV_KEYS.nodeEnv]);
    }
    if (result.data.NODE_ENV === 'production' && !NEON_PROFILE_KEYS.includes(profile as keyof typeof APPROVED_DATABASE_IDENTITIES)) {
      throw new InvalidEnvironmentError([], [ENV_KEYS.appEnvironmentProfile]);
    }
    if (profile !== 'production' && input.NEON_BRANCH?.trim().toLowerCase() === 'production') {
      throw new InvalidEnvironmentError([], [ENV_KEYS.neonBranch]);
    }
    if ((profile === 'development' || profile === 'test') && input.NEON_BRANCH?.trim() && input.NEON_BRANCH.trim() !== profile) {
      throw new InvalidEnvironmentError([], [ENV_KEYS.neonBranch]);
    }
    const profileBinding = profile in APPROVED_DATABASE_IDENTITIES
      ? APPROVED_DATABASE_IDENTITIES[profile as keyof typeof APPROVED_DATABASE_IDENTITIES]
      : undefined;
    const profileDatabaseUrl = profileBinding
      ? result.data[profileBinding.urlKey]
      : result.data.DATABASE_URL;
    const profileSessionSecret = profile === 'staging'
      ? result.data.STAGING_SESSION_SECRET
      : profile === 'pilot'
        ? result.data.PILOT_SESSION_SECRET
        : result.data.SESSION_SECRET;
    const invalid: string[] = [];
    const missing: string[] = [];
    if (input.DATABASE_URL_UNPOOLED?.trim()) invalid.push(ENV_KEYS.databaseUrlUnpooled);
    if (input.MIGRATION_DATABASE_URL?.trim()) invalid.push(ENV_KEYS.migrationDatabaseUrl);
    const neonAuthValues = profile === 'staging'
      ? [result.data.STAGING_NEON_AUTH_JWKS_URL, result.data.STAGING_NEON_AUTH_ISSUER, result.data.STAGING_NEON_AUTH_AUDIENCE]
      : profile === 'pilot'
        ? [result.data.PILOT_NEON_AUTH_JWKS_URL, result.data.PILOT_NEON_AUTH_ISSUER, result.data.PILOT_NEON_AUTH_AUDIENCE]
        : [result.data.NEON_AUTH_JWKS_URL, result.data.NEON_AUTH_ISSUER, result.data.NEON_AUTH_AUDIENCE];
    const neonAuthEnabled = profile === 'staging'
      ? result.data.STAGING_NEON_AUTH_ENABLED
      : profile === 'pilot'
        ? result.data.PILOT_NEON_AUTH_ENABLED
        : result.data.NEON_AUTH_ENABLED;
    if (neonAuthValues.some(Boolean) && neonAuthValues.some((value) => !value)) {
      invalid.push('profile-specific Neon Auth settings');
    }
    if (neonAuthEnabled === 'true' && neonAuthValues.some((value) => !value)) {
      missing.push(...(profile === 'staging'
        ? ['STAGING_NEON_AUTH_JWKS_URL', 'STAGING_NEON_AUTH_ISSUER', 'STAGING_NEON_AUTH_AUDIENCE'].filter((_, index) => !neonAuthValues[index])
        : profile === 'pilot'
          ? ['PILOT_NEON_AUTH_JWKS_URL', 'PILOT_NEON_AUTH_ISSUER', 'PILOT_NEON_AUTH_AUDIENCE'].filter((_, index) => !neonAuthValues[index])
          : [ENV_KEYS.neonAuthJwksUrl, ENV_KEYS.neonAuthIssuer, ENV_KEYS.neonAuthAudience].filter((_, index) => !neonAuthValues[index])));
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
    if (profileBinding) {
      if (!result.data.APP_ENVIRONMENT_PROFILE) missing.push(ENV_KEYS.appEnvironmentProfile);
      if (input.NEON_BRANCH?.trim() !== profileBinding.branch) invalid.push(ENV_KEYS.neonBranch);
      if (!profileDatabaseUrl) missing.push(profileBinding.urlKey);
      for (const binding of Object.values(APPROVED_DATABASE_IDENTITIES)) {
        // An unprovisioned, inactive environment must not prevent production
        // from starting. Validate every supplied identity pair; non-production
        // still requires production's identity to enforce separation.
        const required = binding === profileBinding
          || binding === APPROVED_DATABASE_IDENTITIES.production
          || Boolean(result.data[binding.hostKey] || result.data[binding.databaseKey]);
        if (!required) continue;
        if (!result.data[binding.hostKey]) missing.push(binding.hostKey);
        if (!result.data[binding.databaseKey]) missing.push(binding.databaseKey);
      }
      const configuredHosts = NEON_PROFILE_KEYS.map((key) => ({ key, host: result.data[APPROVED_DATABASE_IDENTITIES[key].hostKey]?.toLowerCase() }));
      for (let left = 0; left < configuredHosts.length; left += 1) {
        for (let right = left + 1; right < configuredHosts.length; right += 1) {
          if (configuredHosts[left]?.host && configuredHosts[left].host === configuredHosts[right]?.host) {
            invalid.push(APPROVED_DATABASE_IDENTITIES[configuredHosts[left].key].hostKey, APPROVED_DATABASE_IDENTITIES[configuredHosts[right]!.key].hostKey);
          }
        }
      }
      if (profile !== 'production' && result.data.DATABASE_URL) invalid.push(ENV_KEYS.databaseUrl);
      if (profile === 'staging' && result.data.PILOT_DATABASE_URL) invalid.push(ENV_KEYS.pilotDatabaseUrl);
      if (profile === 'pilot' && result.data.STAGING_DATABASE_URL) invalid.push(ENV_KEYS.stagingDatabaseUrl);
      if (profile !== 'staging' && result.data.STAGING_DATABASE_URL) invalid.push(ENV_KEYS.stagingDatabaseUrl);
      if (profile !== 'pilot' && result.data.PILOT_DATABASE_URL) invalid.push(ENV_KEYS.pilotDatabaseUrl);
      if (profile !== 'production' && result.data.SESSION_SECRET) invalid.push(ENV_KEYS.sessionSecret);
      if (profile === 'production' && (result.data.STAGING_SESSION_SECRET || result.data.PILOT_SESSION_SECRET)) invalid.push('STAGING_SESSION_SECRET', 'PILOT_SESSION_SECRET');
      if (profile === 'staging' && result.data.PILOT_SESSION_SECRET) invalid.push('PILOT_SESSION_SECRET');
      if (profile === 'pilot' && result.data.STAGING_SESSION_SECRET) invalid.push('STAGING_SESSION_SECRET');
      if (!profileSessionSecret) missing.push(profile === 'staging' ? 'STAGING_SESSION_SECRET' : profile === 'pilot' ? 'PILOT_SESSION_SECRET' : ENV_KEYS.sessionSecret);
      const hasGenericAuth = Boolean(result.data.NEON_AUTH_JWKS_URL || result.data.NEON_AUTH_ISSUER || result.data.NEON_AUTH_AUDIENCE);
      const hasOtherProfileAuth = profile === 'staging'
        ? Boolean(result.data.PILOT_NEON_AUTH_JWKS_URL || result.data.PILOT_NEON_AUTH_ISSUER || result.data.PILOT_NEON_AUTH_AUDIENCE)
        : profile === 'pilot'
          ? Boolean(result.data.STAGING_NEON_AUTH_JWKS_URL || result.data.STAGING_NEON_AUTH_ISSUER || result.data.STAGING_NEON_AUTH_AUDIENCE)
          : Boolean(result.data.STAGING_NEON_AUTH_JWKS_URL || result.data.STAGING_NEON_AUTH_ISSUER || result.data.STAGING_NEON_AUTH_AUDIENCE || result.data.PILOT_NEON_AUTH_JWKS_URL || result.data.PILOT_NEON_AUTH_ISSUER || result.data.PILOT_NEON_AUTH_AUDIENCE);
      if (profile !== 'production' && hasGenericAuth) invalid.push('production Neon Auth settings are not valid for a non-production profile');
      if (profile !== 'production' && result.data.NEON_AUTH_ENABLED === 'true') invalid.push(ENV_KEYS.neonAuthEnabled);
      if (profile !== 'staging' && result.data.STAGING_NEON_AUTH_ENABLED === 'true') invalid.push('STAGING_NEON_AUTH_ENABLED');
      if (profile !== 'pilot' && result.data.PILOT_NEON_AUTH_ENABLED === 'true') invalid.push('PILOT_NEON_AUTH_ENABLED');
      if (hasOtherProfileAuth) invalid.push('another profile Neon Auth settings');
      if (profile !== 'production' && (
        result.data.EXPLABS_API_KEY || result.data.EXPLABS_BASE_URL ||
        result.data.EXPLABS_ALLOWED_ORIGIN || result.data.EXPLABS_ENABLED === 'true'
      )) invalid.push('production EXPLABS settings are not valid for a non-production profile');
      if (profile === 'staging' && result.data.PILOT_EXPLABS_API_KEY) invalid.push('PILOT_EXPLABS_API_KEY');
      if (profile === 'pilot' && result.data.STAGING_EXPLABS_API_KEY) invalid.push('STAGING_EXPLABS_API_KEY');
      if (profile === 'production' && (result.data.STAGING_EXPLABS_API_KEY || result.data.PILOT_EXPLABS_API_KEY)) invalid.push('STAGING_EXPLABS_API_KEY', 'PILOT_EXPLABS_API_KEY');
      if (profile === 'staging' && (result.data.PILOT_DATABASE_HOST && result.data.PILOT_DATABASE_HOST.toLowerCase() === result.data.STAGING_DATABASE_HOST?.toLowerCase())) invalid.push(ENV_KEYS.pilotDatabaseHost, ENV_KEYS.stagingDatabaseHost);
      if (profile === 'pilot' && (result.data.STAGING_DATABASE_HOST && result.data.PILOT_DATABASE_HOST?.toLowerCase() === result.data.STAGING_DATABASE_HOST.toLowerCase())) invalid.push(ENV_KEYS.pilotDatabaseHost, ENV_KEYS.stagingDatabaseHost);
      if (profile === 'pilot' && result.data.PILOT_ENABLED === 'true') {
        if (result.data.PILOT_SHADOW_MODE !== 'true') invalid.push(ENV_KEYS.pilotShadowMode);
        for (const key of [ENV_KEYS.pilotSite, ENV_KEYS.pilotDepartment, ENV_KEYS.pilotLine, ENV_KEYS.pilotShift] as const) {
          if (!input[key]?.trim()) missing.push(key);
        }
      }
    } else if (result.data.NEON_AUTH_ENABLED === 'true' || result.data.STAGING_NEON_AUTH_ENABLED === 'true' || result.data.PILOT_NEON_AUTH_ENABLED === 'true' || result.data.STAGING_DATABASE_URL || result.data.PILOT_DATABASE_URL || result.data.STAGING_DATABASE_HOST || result.data.PILOT_DATABASE_HOST || result.data.PRODUCTION_DATABASE_HOST || result.data.STAGING_DATABASE_NAME || result.data.PILOT_DATABASE_NAME || result.data.PRODUCTION_DATABASE_NAME || result.data.STAGING_SESSION_SECRET || result.data.PILOT_SESSION_SECRET || result.data.STAGING_NEON_AUTH_JWKS_URL || result.data.STAGING_NEON_AUTH_ISSUER || result.data.STAGING_NEON_AUTH_AUDIENCE || result.data.PILOT_NEON_AUTH_JWKS_URL || result.data.PILOT_NEON_AUTH_ISSUER || result.data.PILOT_NEON_AUTH_AUDIENCE || result.data.STAGING_EXPLABS_API_KEY || result.data.PILOT_EXPLABS_API_KEY) {
      invalid.push(
        result.data.NEON_AUTH_ENABLED === 'true' ? ENV_KEYS.neonAuthEnabled
          : result.data.STAGING_NEON_AUTH_ENABLED === 'true' ? 'STAGING_NEON_AUTH_ENABLED'
            : result.data.PILOT_NEON_AUTH_ENABLED === 'true' ? 'PILOT_NEON_AUTH_ENABLED'
              : result.data.STAGING_DATABASE_URL ? ENV_KEYS.stagingDatabaseUrl : ENV_KEYS.pilotDatabaseUrl,
      );
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
        const actualDatabase = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
        const binding = APPROVED_DATABASE_IDENTITIES[profile as keyof typeof APPROVED_DATABASE_IDENTITIES];
        if (binding) {
          const expectedHost = result.data[binding.hostKey];
          const expectedDatabase = result.data[binding.databaseKey];
          if (!expectedHost || parsed.hostname.toLowerCase() !== expectedHost.toLowerCase()) throw new Error();
          if (!expectedDatabase || actualDatabase !== expectedDatabase) throw new Error();
        } else {
          const hostname = parsed.hostname.toLowerCase();
          if (!['development', 'test'].includes(profile) || !['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) throw new Error();
        }
      } catch {
        throw new InvalidEnvironmentError([], [profile === 'staging' ? ENV_KEYS.stagingDatabaseUrl : profile === 'pilot' ? ENV_KEYS.pilotDatabaseUrl : ENV_KEYS.databaseUrl]);
      }
    }
    const productionMissing =
      result.data.NODE_ENV === 'production' || profile === 'production'
        ? [
            !selectedDatabase ? (profile === 'staging' ? ENV_KEYS.stagingDatabaseUrl : profile === 'pilot' ? ENV_KEYS.pilotDatabaseUrl : ENV_KEYS.databaseUrl) : '',
            !profileSessionSecret ? (profile === 'staging' ? 'STAGING_SESSION_SECRET' : profile === 'pilot' ? 'PILOT_SESSION_SECRET' : ENV_KEYS.sessionSecret) : '',
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
    if ((profile === 'development' || profile === 'test') && genericR2 > 0) invalid.push(...R2_ENV_KEYS);
    if ((profile === 'production' || profile === 'development' || profile === 'test') && ([...STAGING_R2_ENV_KEYS, ...PILOT_R2_ENV_KEYS].some((key) => input[key]))) invalid.push(...[...STAGING_R2_ENV_KEYS, ...PILOT_R2_ENV_KEYS]);
    if (profile === 'staging' && PILOT_R2_ENV_KEYS.some((key) => input[key])) invalid.push(...PILOT_R2_ENV_KEYS);
    if (profile === 'pilot' && STAGING_R2_ENV_KEYS.some((key) => input[key])) invalid.push(...STAGING_R2_ENV_KEYS);
    const configuredR2 = r2Values.filter(Boolean).length;
    const regionKey = profile === 'staging' ? 'STAGING_R2_REGION' : profile === 'pilot' ? 'PILOT_R2_REGION' : 'R2_REGION';
    for (const key of ['R2_REGION', 'STAGING_R2_REGION', 'PILOT_R2_REGION'] as const) {
      if (result.data[key] && (key !== regionKey || profile === 'development' || profile === 'test')) invalid.push(key);
    }
    if (result.data[regionKey] && configuredR2 !== r2Keys.length) invalid.push(regionKey);
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
    return {
      ...result.data,
      APP_ENVIRONMENT_PROFILE: profile,
      DATABASE_URL: selectedDatabase,
      SESSION_SECRET: profileSessionSecret,
      NEON_AUTH_JWKS_URL: profile === 'staging' ? result.data.STAGING_NEON_AUTH_JWKS_URL : profile === 'pilot' ? result.data.PILOT_NEON_AUTH_JWKS_URL : result.data.NEON_AUTH_JWKS_URL,
      NEON_AUTH_ISSUER: profile === 'staging' ? result.data.STAGING_NEON_AUTH_ISSUER : profile === 'pilot' ? result.data.PILOT_NEON_AUTH_ISSUER : result.data.NEON_AUTH_ISSUER,
      NEON_AUTH_AUDIENCE: profile === 'staging' ? result.data.STAGING_NEON_AUTH_AUDIENCE : profile === 'pilot' ? result.data.PILOT_NEON_AUTH_AUDIENCE : result.data.NEON_AUTH_AUDIENCE,
      NEON_AUTH_ENABLED: neonAuthEnabled,
      EXPLABS_API_KEY: profile === 'staging' ? result.data.STAGING_EXPLABS_API_KEY : profile === 'pilot' ? result.data.PILOT_EXPLABS_API_KEY : result.data.EXPLABS_API_KEY,
    };
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
