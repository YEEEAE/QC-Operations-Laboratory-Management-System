/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: 'development' | 'test' | 'production';
  readonly DATABASE_URL?: string;
  readonly SESSION_SECRET?: string;
  readonly OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  readonly OTEL_EXPORTER_OTLP_HEADERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    requestContext: import('./shared/http/request-context').RequestContext;
  }
}
