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

These are open risks, not claims that the underlying implementation is absent. Static implementation and focused tests can reduce risk without closing runtime or policy evidence gates.
