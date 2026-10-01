# QC-ADP26-18 — shell, preferences, help, and error recovery

## Changed

- Every shell preference storage access is guarded. Blocked or malformed browser storage now leaves the current drawer and section state operable; preferences remain a convenience and no operational/user-entered data is stored there.
- Navigation help links and role guide destinations are filtered by the canonical `pageAccessDecision`. The server middleware still returns 404 for direct requests to `YAZEED_ONLY` routes for any account other than active `yazeed`/`SYSTEM_OWNER`.
- The 500 page now distinguishes an ended session, keeps a non-secret request reference, offers sign-in with a same-origin-safe return target for guests, and asks users to inspect record history before retrying an uncertain request. It has a help path and token-based responsive typography/focus styles.
- `OperationalState` uses short human-readable labels for shared state keys. Help text explains blocked preference storage and uncertain request recovery.
- No business use case, SQL, database write/read, schema, transaction, audit, or outbox path was changed; database item is contractually N/A. No migration or dependency added.

## Evidence

| Item | State | Evidence |
|---|---|---|
| Candidate / branch | PASS | Candidate HEAD `c5faa43ea55c6509b2a1d6d89b8f252ae4d327c5`, branch `main`; required audit SHA `0b1bb21bb3b4eca77862dbba1da8623044e96355` differs. Working tree was clean at start. Candidate dirty fingerprint is bound in `.ci-results/run-context.json` (generated after final handoff content); build identity is in `.ci-results/build.json`. |
| Toolchain | PARTIAL | pnpm `11.25.0`; host Node `22.22.3`, bundled Node `24.19.0`; project requires `>=24.20.0 <25`. Build emitted an unsupported-engine warning. |
| Focused unit contracts | PASS | `pnpm exec vitest run tests/unit/ui/app-shell.test.ts tests/unit/ui/help-content-contract.test.ts tests/unit/ui/navigation-permissions.test.ts tests/unit/ui/mobile-drawer-inert.test.ts tests/unit/ui/reflow-320.test.ts` — 5 files, 55/55 PASS (rerun using bundled Node 24.19.0). Covers storage exception guards, help visibility filtering, named-owner decisions, state labels, and existing drawer focus/Escape/reflow contracts. |
| Build / release identity | PASS | `pnpm verification:begin`, `pnpm build`, and `pnpm release:verify` on bundled Node 24.19.0; Astro build and release identity verification completed. Engine is below the project minimum, so this is a local build result, not toolchain-conforming release evidence. Artifact/build identity and dirty fingerprint are recorded in `.ci-results/`. |
| Typecheck | FAIL | `pnpm typecheck` on Node 24.19.0: 10 errors in `scripts/verification/build-route-acceptance.ts`, `tests/e2e/authenticated-closure.spec.ts`, `tests/unit/release/*`, and `tests/unit/verification/route-acceptance.test.ts` (missing `.mjs` declarations and implicit-any parameters); no reported error points to a changed file. |
| Browser / direct HTTP / drawer focus | BLOCKED | An escalated Playwright request reached local preview, but both unauthenticated `/404` and `/500` checks received sanitized 503 because runtime configuration is invalid (DB-dependent middleware could not render the pages). Authenticated fixture is unavailable; the drawer suite requires `QC_E2E_LOGIN_IDENTITY` and `QC_E2E_PASSWORD`. No successful browser drawer check, blocked-storage injection, 320/375/768/1440 measurement, 200% zoom, or AT check is claimed. |
| Owner-only access | PARTIAL | `pageAccessDecision` tests prove synthetic noncanonical SYSTEM_OWNER is denied and canonical yazeed is allowed for both owner routes; middleware source maps `YAZEED_ONLY` to 404. Direct HTTP checks against authenticated role fixtures are NOT VERIFIED. |
| Database / applied schema / row-audit-outbox before-after | N/A | No DB path or mutation was touched; source migration head is `0042_immutable_lab_equipment_usage`. Applied schema was not queried. |
| UAT | NOT VERIFIED | No human acceptance/sign-off. |
| Formatting / diff hygiene | PARTIAL | Prettier passed for changed TypeScript tests/copy; the installed Prettier setup cannot infer a parser for `.astro`. `git diff --check` PASS. Workspace map regenerated. |

## State

**PARTIAL.** Source changes, focused unit evidence, and Astro build are present. Toolchain minimum and runtime configuration blocked browser verification; authenticated direct HTTP, real browser drawer/storage failure injection, responsive/zoom measurements, AT, and UAT remain unverified. No schema/policy decision or production resource was changed.

## Findings

- Closed at source level: storage exceptions no longer break drawer setup/toggles; help-route links use canonical page visibility; guest 500 recovery leads to sign-in and safely returns to the attempted path; session-ended/unknown-result copy and request reference are explicit; shared operational state labels are readable.
- Open: direct HTTP 404 with real non-yazeed/yazeed fixtures; authenticated blocked-storage drawer verification including Escape/focus return; requested viewport/200%/contrast and manual AT checks; rerun build/typecheck under Node 24.20.0; human UAT. The local preview returned config-invalid 503s before either 404/500 page could render, so the two HTTP assertions are environment-blocked rather than implementation evidence.

## Source paths

`src/ui/layouts/AppLayout.astro`, `src/pages/help/index.astro`, `src/pages/500.astro`, `src/ui/components/feedback/OperationalState.astro`, `src/shared/copy/help-content.ts`; focused contracts in `tests/unit/ui/`.
