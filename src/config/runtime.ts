import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getServerEnv, type ServerEnv } from './env';
import {
  getConfiguredReleaseIdentity,
  getServiceVersion,
  SERVICE_NAME,
  type ConfiguredReleaseIdentity,
} from './release';

export interface RuntimeConfig {
  environment: ServerEnv['NODE_ENV'];
  profile: ServerEnv['APP_ENVIRONMENT_PROFILE'];
  /** Safe display label only; this is not provider identity attestation. */
  neonBranchLabel?: string;
  serviceName: typeof SERVICE_NAME;
  serviceVersion: string;
  release: ConfiguredReleaseIdentity;
  observability: { otelEndpoint?: string; otelHeadersConfigured: boolean };
}

/** Database connection material is exposed only to the database infrastructure boundary. */
export function getRuntimeDatabaseUrl(env: ServerEnv = getServerEnv()): string | undefined {
  return env.DATABASE_URL;
}

export function getRuntimeConfig(env = getServerEnv()): RuntimeConfig {
  let releaseArtifact: unknown;
  let runtimeArtifactSha256: string | undefined;
  try {
    releaseArtifact = JSON.parse(
      readFileSync(resolve(process.cwd(), 'dist/release-identity.json'), 'utf8'),
    );
    runtimeArtifactSha256 = createHash('sha256')
      .update(readFileSync(resolve(process.cwd(), 'dist/server/entry.mjs')))
      .digest('hex');
  } catch {
    // Missing/unreadable build evidence stays UNVERIFIED; runtime health can
    // still report the independent operational and schema checks.
  }
  return {
    environment: env.NODE_ENV,
    profile: env.APP_ENVIRONMENT_PROFILE,
    neonBranchLabel: env.NEON_BRANCH,
    serviceName: SERVICE_NAME,
    serviceVersion: getServiceVersion(env, '0.1.0'),
    release: getConfiguredReleaseIdentity(env, releaseArtifact, runtimeArtifactSha256),
    observability: {
      otelEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
      otelHeadersConfigured: Boolean(env.OTEL_EXPORTER_OTLP_HEADERS),
    },
  };
}
