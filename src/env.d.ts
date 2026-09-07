/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly NODE_ENV: 'development' | 'test' | 'production';
  readonly DATABASE_URL?: string;
  readonly SESSION_SECRET?: string;
  readonly SERVICE_VERSION?: string;
  readonly RATE_LIMIT_LOGIN_MAX?: string;
  readonly RATE_LIMIT_LOGIN_WINDOW_SECONDS?: string;
  readonly OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  readonly OTEL_EXPORTER_OTLP_HEADERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    requestContext: import('./shared/http/request-context').RequestContext;
    actor?: import('./shared/authorization/types').ActorContext;
    user?: import('./modules/identity/domain/user').User;
  }
}
