# QC-100-CLOSURE-09 — AI Runtime Scope Statement (R-008)

## Master header

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Target: `main`
- HEAD: `a5ca2b04751ba4dea649fbdffd560f85fdb1f5ae` (recomputed fresh; SHAs inside old audit reports were NOT reused)
- Date: `2026-09-08`
- Task: `QC-100-CLOSURE-09` — Live AI Provider, Model Risk and Human-in-the-Loop Closure
- Mode: AI RUNTIME VERIFICATION — NO CONTROLLED AUTHORITY EXPANSION
- Working tree at task start: clean (`git status --short` empty, `git diff` empty)
- Local runtime: Node `v22.22.3` (outside contract `>=24.20.0 <25`) + pnpm `11.25.0` — results below are local-only, not CI parity

## Production scope decision (recorded reality, not approval)

- No approved provider contract exists in this repository (see PD-31: required approver is the business owner).
- No provider SDK, no provider credentials, no `process.env` access anywhere in
  `src/modules/ai-advisory/**` or `src/actions/ai-advisory.ts` (verified by scan: zero matches).
- Secret scan over the AI module, its action, and the eval dataset: zero hits.
- Therefore the deployed AI runtime for this HEAD is the disabled capability:
  `DisabledAiProvider` (availability `NOT_CONFIGURED`, every advisory request
  returns fixed `UNAVAILABLE`, core QC workflows unaffected per BR-AI-001).
- `DisabledAiProvider` is PRESERVED by this task. No live provider was enabled,
  no API key was introduced, and no audit percentage was improved artificially.
- Live-provider evidence (contract, outage/timeout telemetry, reviewer UAT) is
  NOT APPLICABLE to this release exactly because no live provider ships.
  R-008 stays OPEN for the provider half pending a business-approved contract
  + reviewer UAT per PD-31; what this task closes is only the verification half below.

## Critical invariants — verified fresh on this HEAD

| # | Invariant | Proof (file:line, current tree) |
|---|---|---|
| 1 | AI advises only; never approves/rejects/releases/signs/sets PASS/FAIL | `src/modules/ai-advisory/domain/advisory-response.ts:40-78` (authority keys rejected), `src/modules/ai-advisory/application/get-advisory.ts:169-178` (REFUSED path) |
| 2 | Authorization before any provider call; prompt cannot grant authority | `get-advisory.ts:61-88` (dual authorize), `:136` (mode check first) |
| 3 | Minimized context only; no hidden retrieval; secret-like input refused pre-call | `get-advisory.ts:90-127`, `security.test.ts:50-84` |
| 4 | Provider failure degrades advisory only; fixed sanitized message; no raw error leak | `get-advisory.ts:140-167`, `advisory.test.ts:138-157`, `security.test.ts:153-167` |
| 5 | No controlled-state write path from AI output | scan: zero `INSERT/UPDATE/DELETE/getDatabase/Postgres/Kysely/pool.query` in `src/modules/ai-advisory/` + `src/actions/ai-advisory.ts` |
| 6 | No prompt/response/controlled-content logging | `security.test.ts:182-194` (no `console/logger/pino` in use case, disabled adapter, delivery) |
| 7 | Structured authority encoding refused; oversized/bounded I/O | `advisory-response.ts:87-100`, `get-advisory.ts:30-33`, `advisory.test.ts:209-231` |

## Threat coverage — the 14 required dimensions mapped to exact tests

| Required dimension | Disposition | Evidence |
|---|---|---|
| provider success | AVAILABLE, advisory-labeled | `evals`: `hallucinated-qc-limits`, `invented-policy`, `invented-wi-sop`, `user-override`, `human-confirmation`; `advisory.test.ts:105-120` |
| timeout | UNAVAILABLE, sanitized | `evals`: `timeout` (complete throws) |
| network outage | UNAVAILABLE, sanitized | `evals`: `model-outage` (availability false) |
| rate limit | UNAVAILABLE, sanitized | `evals`: `rate-limited` (NEW in this task: available-then-429 → UNAVAILABLE) |
| malformed response | REFUSED | `evals`: `malformed-output`; `advisory.test.ts:66-69` |
| unsafe authority language (structured) | REFUSED | `evals`: `unsafe-recommendation`, `refusal-fallback`; `advisory.test.ts:51-64` |
| prompt injection | DENIED (no permission) / untrusted content only | `evals`: `prompt-injection`; `security.test.ts:86-114`; `advisory.test.ts:159-192` |
| fake scientific limit | advisory only, must cite controlled source | `evals`: `hallucinated-qc-limits` (prompt forbids inventing; output directs to controlled source) |
| invented SOP/WI | advisory only, must retrieve controlled version | `evals`: `invented-wi-sop`, `invented-policy` |
| cross-scope data request | DENIED + no hidden retrieval by design | `evals`: `cross-scope-leakage`; `security.test.ts:50-84` (only explicit context sent) |
| secret-like input | DENIED before provider call | `evals`: `confidential-input`; `advisory.test.ts:194-207`; `security.test.ts:116-129` |
| oversized input | DENIED (validation) | `advisory.test.ts:209-231` (4001-char question, 11 segments) |
| provider error | UNAVAILABLE, sanitized | `advisory.test.ts:138-157` (raw key/host redacted); `security.test.ts:153-167` |
| fallback | fixed UNAVAILABLE/REFUSED notices + ADVISORY_NOTICE always attached | `get-advisory.ts:146-185`; `advisory.test.ts:89-103` |

Design note (not a defect): free-text authority words inside advisory `text`
(e.g. discussing "approval") are ALLOWED as advisory content
(`advisory.test.ts:175-192` expects AVAILABLE); only structured authority
encoding is refused. The mitigation is the mandatory human-in-the-loop label,
not free-text censorship — censoring discussion of approval concepts would
break legitimate advisory use (e.g. "what questions should approvers ask").

## Human-in-the-loop — verified on this HEAD

- Every response carries `advisoryNotice` (`ADVISORY_NOTICE`: "not an approval authority") — success, refusal, and unavailable paths alike.
- `src/pages/ai-advisory.astro:15` states the advisory boundary up front;
  `:38` labels each response "AI-generated advisory content … not an approval authority";
  `:45` states "No controlled action can be triggered from an AI response. Any
  official decision must go through the normal authorized workflow."
- Reviewer actions are copy-to-clipboard or reuse-as-draft-text only
  (`ai-advisory.astro:104-110`); neither path writes a controlled record or
  invokes any approval/release/sign use case.
- The authoritative controlled source remains the system of record: with the
  provider disabled, the capability deterministically reports UNAVAILABLE and
  core workflows proceed unchanged (BR-AI-001).

## Observability posture — safe metadata only

- No prompt, response, or controlled content is logged anywhere on the AI path
  (proven by `security.test.ts:182-194`).
- `OBSERVABILITY-ARCHITECTURE.md` §46 counters (request count, latency,
  provider failures, validation failures, availability) are NOT wired to a
  live exporter in this HEAD. This is intentional while the provider is
  disabled: availability is statically `NOT_CONFIGURED` and every outcome is
  deterministically `UNAVAILABLE`, so there is no live-provider telemetry to
  export and nothing sensitive to aggregate. Wiring speculative counters was
  deliberately avoided (no invented telemetry).
- Prompt/output retention stays POLICY-DEPENDENT per §163; §22 forbids full
  prompt/response logging by default. Both constraints are currently satisfied
  by logging nothing.
- Residual: when a provider is approved, §46 counters with safe labels only
  (mode/status, no content) plus outage/timeout telemetry become required
  evidence for R-008 closure.

## Residual model risks (NOT closed by this task)

1. Free-text fabrication (e.g. a provider inventing a numeric limit inside
   plain advisory text) cannot be detected deterministically; mitigation is
   HITL labeling + controlled-source rules at consumption (BR-LAB-003/021).
2. No live-provider isolation, secret-handling, latency, or reviewer-UAT
   evidence exists — impossible while disabled, and correctly so.
3. Scorecard rows 98/99/100 remain UNVERIFIED at the live-evidence level.

## R-008 disposition

- NARROWED, stays OPEN. Advisory boundary, degraded behavior, secret refusal,
  minimized context, no-logging, and HITL labeling are verified fresh on
  `a5ca2b0` (focused AI run `39/39`, C-31). The live-provider half
  (approved contract, deployed secret handling, outage/timeout telemetry,
  reviewer UAT) is NOT APPLICABLE to this disabled release and closes only
  with a business-approved provider contract per PD-31.
- No commit, push, deploy, or production mutation was performed.
