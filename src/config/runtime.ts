import { getServerEnv, type ServerEnv } from './env';
import { getServiceVersion, SERVICE_NAME } from './release';

export interface RuntimeConfig {
  environment: ServerEnv['NODE_ENV'];
  serviceName: typeof SERVICE_NAME;
  serviceVersion: string;
  databaseUrl?: string;
  observability: { otelEndpoint?: string; otelHeadersConfigured: boolean };
}

export function getRuntimeConfig(env = getServerEnv()): RuntimeConfig {
  return {
    environment: env.NODE_ENV,
    serviceName: SERVICE_NAME,
    serviceVersion: getServiceVersion(env, '0.1.0'),
    databaseUrl: env.DATABASE_URL,
    observability: {
      otelEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
      otelHeadersConfigured: Boolean(env.OTEL_EXPORTER_OTLP_HEADERS),
    },
  };
}
