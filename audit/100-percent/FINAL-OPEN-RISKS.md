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

These are open risks, not claims that the underlying implementation is absent. Static implementation and focused tests can reduce risk without closing runtime or policy evidence gates.

## QC-100-CLOSURE-02 status delta (HEAD `1927aeb`, 2026-09-08)

- R-003 narrowed to static-closure: source `rg` scan and the fixed guard now agree — ZERO unapproved direct Delivery → DB/infrastructure imports (evidence C-07–C-11 in `FINAL-EVIDENCE-INDEX.md`). Composition moved to 11 narrow per-capability application factories; guard detects the exact violation patterns and has 5/5 regression tests. R-003 cannot be marked fully CLOSED until a container-capable CI run executes the DB-backed suites (integration/migration/concurrency/security) and E2E against this refactored HEAD, because behavior preservation is currently proven statically (typecheck/unit/build/guard) rather than against live PostgreSQL.
- Domains 11, 27, 34, 39 remain at their current FAIL status in `FINAL-100-DOMAIN-AUDIT.md`: no score is raised without the CI runtime evidence required above. No other risk ID changes in this task; R-001, R-002, R-004–R-010 remain OPEN as previously recorded.
