# QC-ADP26-16 — AI advisory request transport

**Finding:** QC-PAGE-F-016  
**Route:** `/ai-advisory`  
**State:** PARTIAL — source transport changes implemented; authenticated route acceptance and the PD-31 processing decision remain open.  
**Candidate HEAD:** `c1642208b8ea1814720fee341ec69d0ba86c88af` (the requested audit SHA `0b1bb21bb3b4eca77862dbba1da8623044e96355` was not the current candidate).  
**Dirty source fingerprint:** recorded in the final `.ci-results/run-context.json` and `.ci-results/build.json` for this HEAD.  
**Branch/status at freeze:** `main`; initially clean; task changes are local and uncommitted.

## Changed

- `/ai-advisory` now calls `pageAccessDecision` for page visibility, while the form still requires `PERM-AI-USE` and the relevant mode permission. The use case rechecks both permissions against the synthetic AI advisory scope; no named-owner bypass exists.
- The request form uses `method="post"`. Its submit control is disabled in the rendered baseline, including when JavaScript is unavailable, and client code enables it only when provider configuration, the complete valid policy, and the server approval gate are present. The approved data-class and consent controls are shown only with that policy.
- A request disables its submit control, marks the form busy, announces pending status, and blocks repeat submission until the action settles. Rejected transport and returned action errors preserve current form values and non-secret source references, announce that the outcome is unknown, and require a request edit before another attempt. Server provider calls remain bounded by the 12-second adapter abort timeout.
- Refusal, provider timeout/unavailable, request transport uncertainty, and recovery guidance have distinct messages. Editing request data clears consent on both `input` and `change`.
- Copy reports success/failure and attempts a temporary local fallback. **Edit locally** places the advisory into the question field, focuses it, clears consent, and states that the text remains local. No autosave or controlled decision action was added.
- `Documents/AI-PROVIDERS.md` documents the disabled no-script baseline and recovery behavior. A focused UI transport contract suite was added.

## Source and data path

- **Page reads:** server-derived actor/permissions, `pageAccessDecision`, and server environment-derived AI availability/policy/configuration. The page does not query QC domain rows.
- **Action:** `aiAdvisory.requestAdvisory` accepts bounded JSON and rechecks authenticated actor and mode permissions in `GetAdvisoryUseCase`. Invalid/missing/incomplete policy or absent approval produces no configured external provider; consent and permitted data class are checked before provider availability/completion. Provider destinations remain the existing exact Groq/Gemini allowlist.
- **Writes/constraints:** no PostgreSQL business-table, QC-record, audit, signature, or outbox write is performed by this page/use case. No multi-statement database transaction exists in the advisory flow; migration and DB rollback/race/replay tests are N/A by this source contract. Authentication/session resolution remains the shared application middleware path.
- **Open owner decision:** PD-31 remains PARTIAL. Source names the required business owner / approved provider contract but does not identify a named accountable person. No provider approval, retention/deletion terms, advisory audit persistence/outbox contract, or human acceptance was inferred or enabled.

## Evidence

Toolchain contract: Node `v24.20.0`; pnpm `11.25.0`.

| Check | Status | Evidence |
| --- | --- | --- |
| Candidate identity | PASS | Final HEAD and dirty source fingerprint are recorded in `.ci-results/run-context.json` and `.ci-results/build.json`; HEAD differs from the requested audit SHA. |
| Source schema | PASS | Build identity reports source migration head `0042_immutable_lab_equipment_usage`. No migration changed. |
| Applied schema | NOT VERIFIED | No database was queried for this page-only transport change. |
| Focused unit/security/offline eval | PASS | `pnpm exec vitest run tests/unit/ui/ai-advisory-transport-contract.test.ts tests/unit/ai-advisory/advisory.test.ts tests/unit/ai-advisory/page-availability.test.ts tests/unit/ai-advisory/providers.test.ts tests/integration/ai-advisory/evals.test.ts tests/integration/ai-advisory/security.test.ts` — 6 files, 97/97 tests. Deterministic fake providers only; no live provider call. |
| No-policy external call gate | PASS (source/unit contract) | `ai-configuration.ts` produces no provider without flag + complete policy + approved provider credentials; `GetAdvisoryUseCase` checks consent/class before provider availability/completion. No live provider was enabled. |
| POST/no-JavaScript query safety | PASS (source contract) | Rendered form declares `method="post"`; submit button stays disabled without the client handler. No question/excerpt is placed in a GET URL. |
| Busy/error/timeout/recovery, consent invalidation, copy and local edit | PASS (source contract) | `tests/unit/ui/ai-advisory-transport-contract.test.ts` and `src/pages/ai-advisory.astro`; client-side event behavior was not exercised in an authenticated browser. |
| Official QC mutation | PASS (source review) | Action/use case returns advisory data only; page has no controlled QC mutation, approval, signature, persistence, SQL, audit, or outbox path. |
| Build | PASS after candidate-bound verification context | `pnpm verification:begin` then `pnpm build`; final identity recorded in `.ci-results/build.json`. First build attempt failed only because the required run context was absent; rerun on the same source fingerprint passed. |
| Browser route | PARTIAL | Local browser reached `GET /ai-advisory` and was redirected to `/login?returnTo=%2Fai-advisory`. No authenticated test fixture was available, so the changed authenticated page and 320/375/768/1440 CSSpx, 200% zoom, keyboard and manual AT behavior are NOT VERIFIED. |
| PostgreSQL 18 / DB before-after | N/A for changed advisory flow | No DB read/write contract or schema change in this path; applied schema and common session middleware behavior remain outside this task's evidence. No production DB was accessed. |
| Human UAT / live provider | NOT RUN | External enablement and live provider calls are expressly out of scope; UAT requires a human. |

## Findings

- **QC-PAGE-F-016:** source-level transport, disabled-baseline, consent invalidation, copy feedback, and local-edit issues addressed on this candidate. Full route acceptance remains OPEN pending authenticated browser/AT evidence.
- **PD-31:** OPEN/PARTIAL; authorized business owner must decide provider/use-case scope, data processing terms, consent and outage rules, whether advisory requests require durable audit/outbox evidence, and human acceptance. Owner identity is not named in the current decision source.
- **No unrelated page/finding closed.**

## Final candidate binding

Final source fingerprint, release/build ID, and artifact digest are recorded in `.ci-results/run-context.json`, `.ci-results/build.json`, and `dist/release-identity.json` after all task documentation and workspace maps are updated. Generated build files and evidence remain local; no commit, push, merge, deployment, external write, or production migration was performed.
