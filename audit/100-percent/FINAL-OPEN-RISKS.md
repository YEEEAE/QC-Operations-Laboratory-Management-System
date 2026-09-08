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

These are open risks, not claims that the underlying implementation is absent. Static implementation and focused tests can reduce risk without closing runtime or policy evidence gates.
