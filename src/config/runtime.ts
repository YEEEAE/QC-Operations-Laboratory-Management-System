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
  serviceName: typeof SERVICE_NAME;
  serviceVersion: string;
  release: ConfiguredReleaseIdentity;
  databaseUrl?: string;
  observability: { otelEndpoint?: string; otelHeadersConfigured: boolean };
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
    serviceName: SERVICE_NAME,
    serviceVersion: getServiceVersion(env, '0.1.0'),
    release: getConfiguredReleaseIdentity(env, releaseArtifact, runtimeArtifactSha256),
    databaseUrl: env.DATABASE_URL,
    observability: {
      otelEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
      otelHeadersConfigured: Boolean(env.OTEL_EXPORTER_OTLP_HEADERS),
    },
  };
}
