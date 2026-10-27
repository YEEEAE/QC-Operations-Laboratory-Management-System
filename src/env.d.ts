// Astro requires this triple-slash reference for generated .astro types;
// it is intentionally exempt from the generic triple-slash lint rule.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    requestContext: import('./shared/http/request-context').RequestContext;
    actor?: import('./shared/authorization/types').ActorContext;
    user?: import('./modules/identity/domain/user').User;
    sessionRecovery?: import('./shared/identity/session-recovery').SessionRecoveryNotice;
  }
}
