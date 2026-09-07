// Astro requires this triple-slash reference for generated .astro types;
// it is intentionally exempt from the generic triple-slash lint rule.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
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
