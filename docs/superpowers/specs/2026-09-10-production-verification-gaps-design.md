# Production Verification Gaps Design

## Goal

Close the four UI/runtime gaps found during read-only production verification without weakening authorization, CSP, or controlled-record rules.

## Scope

1. Expose a sanitized, server-derived release identity on System Health.
2. Make the existing mobile drawer toggle reachable at the `760px` breakpoint and preserve inertness, scroll lock, focus containment, Escape, and focus return.
3. Add a local favicon and explicit document head link.
4. Make the decorative dotLottie background fail closed to a static CSS background when WASM initialization fails; do not add `unsafe-eval`.

## Boundaries

- No production deployment, data mutation, approval, release, restore, or account provisioning.
- Release identity values are read from server-side build/runtime configuration only; missing identity is displayed as `UNVERIFIED`.
- System Health remains exclusive to the authorized `SYSTEM_OWNER` route.
- The background remains decorative, `aria-hidden`, non-interactive, and disabled for reduced motion/print.

## Verification

- Unit/static tests for release identity formatting, mobile shell contracts, favicon reference, and background failure handling.
- `astro check`, lint, architecture checks, focused unit tests, build, and `git diff --check`.
- Local/browser smoke checks at desktop and `320×720`; production findings remain `NOT VERIFIED` until the repaired build is deployed and checked.
