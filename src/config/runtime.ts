import { getServerEnv, type ServerEnv } from './env';

export interface RuntimeConfig {
  environment: ServerEnv['NODE_ENV'];
  serviceVersion: string;
  databaseUrl?: string;
  observability: { otelEndpoint?: string; otelHeadersConfigured: boolean };
}

export function getRuntimeConfig(env = getServerEnv()): RuntimeConfig {
  return {
    environment: env.NODE_ENV,
    serviceVersion: env.SERVICE_VERSION,
    databaseUrl: env.DATABASE_URL,
    observability: {
      otelEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
      otelHeadersConfigured: Boolean(env.OTEL_EXPORTER_OTLP_HEADERS),
    },
  };
}
