# QC-100-13 — Final Open Risks

| ID | Risk / blocker | Evidence | Affected closure gates | Required evidence |
|---|---|---|---|---|
| R-001 | PostgreSQL runtime and applied migration state are not current evidence | no approved `DATABASE_URL`; migration head is repository-only | database, authorization, workflows, audit, recovery | run migration, constraint, transaction, negative, and restore tests against named PostgreSQL |
| R-002 | Browser/E2E runtime is not current evidence | prior host run was blocked; no current browser artifact for this HEAD | UI, accessibility, workflows, security UX | CI or approved browser environment with report, traces, and accessibility output |
| R-003 | Delivery composition has direct DB/infrastructure imports | `rg` found imports in pages/actions despite guard exit 0 | architecture, API, reporting, search, notifications | remove or formally approved composition boundary plus a detecting guard |
| R-004 | Remote CI status is unknown | `gh run list` could not reach GitHub API | exact release, regression, security, E2E | check-run URL and artifact set for exact SHA |
| R-005 | No participant usability/UAT evidence | study package is new; no sessions executed | UX research, task success, UAT, production decision | executed sessions, raw metrics, analysis, and acceptance record |
| R-006 | Backup/restore/PITR evidence is absent | plan/template exists, no current drill result | continuity, audit durability, recovery | isolated restore drill with integrity and audit-history verification |
| R-007 | Scientific and policy decisions remain controlled-source dependent | foundation documents defer limits, authority, retention, RPO/RTO, and similar policy | laboratory, approvals, compliance, AI, operations | approved controlled decisions and negative-path tests |
| R-008 | AI provider is disabled by default | `DisabledAiProvider`; no provider/runtime evidence | AI operations and human-in-loop | approved provider contract, outage/timeout telemetry, and reviewer UAT |
| R-009 | Runtime version mismatch remains | Node `v22.22.3` vs package contract `>=24.20.0 <25` | reproducibility, CI parity, DevEx | execute using Node `24.20.0` and record output |
| R-010 | Historical scorecard is not a closure certificate | prior scorecard itself lists 5 FAIL and 90 UNVERIFIED | all domains | fresh row-level evidence on exact HEAD |

## QC-100-CLOSURE-01 status delta (HEAD `f9c8eb9`, 2026-09-08)

- R-004 stays OPEN: exact-HEAD Verification CI run `34187138555` is `completed/failure` with zero executed steps; the check-run annotation proves the job never started because the GitHub account is locked for billing. This is an external account blocker, not a source failure, and no source edit can clear it. Closure needs the operator to resolve billing, push (or re-run), then attach the fresh successful run for the new SHA.
- R-009 narrowed but stays OPEN: Node `v24.20.0` + pnpm `11.25.0` execution is now evidenced for install/format/lint/typecheck/architecture/tech-debt/unit/build/release-identity/release-verify on exact HEAD (see C-02–C-06 in `FINAL-EVIDENCE-INDEX.md`). It cannot close until DB-backed suites (integration/migration/concurrency/security) and E2E execute on Node 24 in an environment with container runtime + Playwright browsers — i.e. a green remote CI run.
- Fixed in this task (toolchain only, no app behavior change): `pnpm-workspace.yaml` sharp-builds placeholder → explicit `false`; `check-tech-debt.mjs` file-scoped `console` global. Both were hard CI-gate failures independent of billing.

## QC-100-CLOSURE-03 status delta (HEAD `3f92569`, 2026-09-08)

- R-001 NARROWED (not closed): migration, constraint, transaction, negative-authorization, concurrency, idempotency, and audit/outbox evidence is now current for this HEAD — 18/18 migrations applied with zero pending and repeat no-op, `tableCount 60 / orphanCount 0`, foundation seed `4/198/164` idempotent, and DB-backed suites green on PostgreSQL 18 (`test:migrations` 22/22, `test:concurrency` 12/12, `test:security` 42/42 twice, `test:integration` 234 passed / 0 failed / 1 skipped) — see C-13–C-17 in `FINAL-EVIDENCE-INDEX.md`. What remains under this ID is the restore-drill half of its required evidence ("and restore tests against named PostgreSQL"), which still belongs to R-006, plus the fact that applied-state evidence covers disposable databases, not a production target. R-009 is additionally narrowed for the DB-backed path (Node `24.20.0` execution now evidenced for all DB suites); full R-009 closure still needs the remote CI run (R-004).
- No other risk ID changes in this task; R-002, R-003 (needs container-capable CI behavior proof of the CLOSURE-02 refactor), R-004–R-010 remain OPEN as previously recorded, except as narrowed above.

## QC-100-CLOSURE-04 status delta (HEAD `746c150`, 2026-09-08)

- R-002 NARROWED (not closed): exact-HEAD built-release browser evidence is now current — full Playwright `52 passed / 13 skipped / 0 failed` on Node `24.20.0` with Chromium, plus axe WCAG 2.2 AA (login LTR/RTL + safe 404), 200%/400% reflow, responsive matrix, keyboard tab-order/focus treatment, CSP self-hosted Lottie/WASM with zero external requests, and LTR/RTL screenshots at `1440x900` / `1920x1080` / `768x1024` / `390x844` (see C-18–C-19 in `FINAL-EVIDENCE-INDEX.md`). No opacity remediation was needed (login panel stays opaque and readable). What remains under this ID is the authenticated half: the 13 skipped specs (dashboard/tasks/receiving/inspection/quarantine/laboratory/quality/documents/approvals/files/reports/governance plus manual keyboard/AT/dialog-focus/mobile-sidebar/200%-400% on protected workflows, invalid-input/wrong-role/wrong-scope/direct-URL/stale-record/destructive/loading/empty/error/recovery journeys, and LCP/CLS/CPU profilers) still need approved non-secret fixtures and an authorized environment. R-002 cannot be marked CLOSED until that exact-HEAD authenticated evidence exists.
- No other risk ID changes in this task; R-001 (restore-drill half), R-003 (needs container-capable CI behavior proof), R-004–R-010 remain OPEN as previously recorded.

These are open risks, not claims that the underlying implementation is absent. Static implementation and focused tests can reduce risk without closing runtime or policy evidence gates.

## QC-100-CLOSURE-05 status delta (base HEAD `4384c76`, 2026-09-08)

- PROD-05-A recorded as CRITICAL and OPEN: deployed `qclevel.top` returns `500` HTML (no security headers, no `x-request-id`, no JSON contract) on `/`, `/login`, `/api/health/live`, `/api/health/ready` at probe time. Local code fix (health-gates + reordered middleware, `3/3` new tests GREEN, full `test:unit 29/111` GREEN) is UNDEPLOYED and closes nothing in production. Needs operator secret verification + controlled redeploy + §30 post-deploy verification. Deployed SHA/version/build/Node/logs remain BLOCKED (no Render API access); DB private/internal topology proof remains BLOCKED; external telemetry exporter stays OPTIONAL-per-architecture (not invented). No risk CLOSED in this task.
- No other risk ID changes in this task; R-001 (restore half), R-002 (authenticated half), R-003 (needs container-capable CI behavior proof), R-004, R-005–R-010 remain OPEN as previously recorded.

## QC-100-CLOSURE-06 status delta (HEAD `1d0ef75`, 2026-09-08)

- R-005 remains OPEN: zero participant sessions executed in this session (validator live run: `sessions=0`, `UAT EXECUTION REQUIRED`). What changed is preparation only — executable kit (`QC-100-CLOSURE-06-UAT-KIT.md`: 14 functional + 6 negative + 4 accessibility scripts for 7 roles), evidence templates (session/defect/coverage, all empty/`NOT EXECUTED`), and TDD-validated record validator (`6/6` GREEN, evidence C-24–C-26). R-005 closes only after real sessions + defect backlog + retest + ACCEPTED outcome on the exact release candidate.
- No other risk ID changes in this task; R-001 (restore half), R-002 (authenticated half), R-003 (needs container-capable CI behavior proof), R-004, R-006–R-010 remain OPEN as previously recorded.

## QC-100-CLOSURE-02 status delta (HEAD `1927aeb`, 2026-09-08)

- R-003 narrowed to static-closure: source `rg` scan and the fixed guard now agree — ZERO unapproved direct Delivery → DB/infrastructure imports (evidence C-07–C-11 in `FINAL-EVIDENCE-INDEX.md`). Composition moved to 11 narrow per-capability application factories; guard detects the exact violation patterns and has 5/5 regression tests. R-003 cannot be marked fully CLOSED until a container-capable CI run executes the DB-backed suites (integration/migration/concurrency/security) and E2E against this refactored HEAD, because behavior preservation is currently proven statically (typecheck/unit/build/guard) rather than against live PostgreSQL.
- Domains 11, 27, 34, 39 remain at their current FAIL status in `FINAL-100-DOMAIN-AUDIT.md`: no score is raised without the CI runtime evidence required above. No other risk ID changes in this task; R-001, R-002, R-004–R-010 remain OPEN as previously recorded.

## QC-100-CLOSURE-07 status delta (HEAD `06b14cf`, 2026-09-08)

- R-006 NARROWED (not closed): a real isolated logical restore drill now exists for this HEAD — `pg_dump` artifact (`202909` bytes, SHA-256 recorded) + `pg_restore` into a disposable target (`2s`) with ledger/history/file/app/session evidence (C-27–C-28 in `FINAL-EVIDENCE-INDEX.md`, full record `audit/100-percent/RESTORE-DRILL-RESULT.md`). What remains OPEN under this ID is the provider half: Render physical restore, WAL archiving, PITR, cross-region/immutable copy, object-store provider, approved RPO/RTO, HTTP-level authorization proof, and independent review are all still `BLOCKED`/`UNVERIFIED` — recorded as fact, not claimed. The recovery checklist therefore still reports `RESTORE_NOT_VERIFIED` overall by design.
- No other risk ID changes in this task; R-001 (production applied-state half), R-002 (authenticated half),
  R-003 (needs container-capable CI behavior proof), R-004, R-005, R-007–R-010 remain OPEN as previously recorded.

## QC-100-CLOSURE-08 status delta (HEAD `06b14cf`, 2026-09-08)

- R-007 remains OPEN (narrowed, not closed): all 37 policy-dependent decisions are now traced in
  `audit/100-percent/CONTROLLED-POLICY-DECISION-REGISTER.md` (PD-01–PD-37, each OPEN with its required
  QC/QMS/business approver), and the six critical gates have executable fail-closed proof
  (`tests/unit/policy/controlled-policy-fail-closed.test.ts` 10/10, evidence C-29–C-30). Nothing was invented:
  no limit, threshold, authority, retention rule, RPO/RTO, or master-data change was added; defaults deny
  (release/approval/retest/evaluate/supersede) or absent (auto-delete, escalation, RPO/RTO claims). R-007 closes
  only when approved controlled sources arrive per PD item with bound implementation + green positive/negative
  tests on the exact HEAD.
- No other risk ID changes in this task; R-001 (production applied-state half), R-002 (authenticated half),
  R-003 (needs container-capable CI behavior proof), R-004, R-005, R-006 (provider half), R-008–R-010 remain
  OPEN as previously recorded.

## QC-100-CLOSURE-09 status delta (HEAD `a5ca2b0`, 2026-09-08)

- R-008 remains OPEN (narrowed, not closed): the advisory-only boundary is now
  verified fresh on this HEAD — focused AI run `3 files / 39 tests` GREEN
  (C-31, including the new mid-call 429 `rate-limited` → `UNAVAILABLE` case),
  7 critical invariants mapped to file:line, all 14 required threat dimensions
  mapped to exact tests, HITL labeling + copy/draft-only reviewer path proven,
  and zero DB-write / zero-secret / zero-logging scans recorded (C-32,
  `audit/100-percent/QC-100-CLOSURE-09-AI-RUNTIME-STATEMENT.md`).
  `DisabledAiProvider` is preserved; no live provider was enabled and no key
  introduced. The live-provider half (approved contract, deployed secret
  handling, outage/timeout telemetry, reviewer UAT) is NOT APPLICABLE to this
  disabled release and closes only with a business-approved provider contract
  per PD-31. No other risk ID changes in this task; R-001, R-002, R-003, R-004,
  R-005, R-006, R-007, R-009, R-010 remain OPEN as previously recorded.
