# QC-100-01 — Gap Register

Priorities are based on controlled-record, security, scientific, recovery, and release impact. This is a backlog, not a claim that any gap was fixed.

| ID | Priority | Gap / root cause | Evidence | Affected domains | Required evidence-backed remediation |
|---|---|---|---|---|---|
| G-001 | P0 | PostgreSQL/Testcontainers runtime is unavailable, so DB behavior is not proven | E-09 | 1–21, 29–36, 59, 74, 78–83 | Run approved PostgreSQL 18 disposable/controlled tests; capture migration, constraints, transaction, authorization, audit, seed, concurrency and idempotency results |
| G-002 | P0 | Applied migration head/checksum/privilege state is unknown | E-03, E-09 | 3,4,7,16–18,31,35,78–80 | Run read-only preflight and migration-integrity checks against a named target; do not infer DB state from files |
| G-003 | P0 | Delivery contains direct database/infrastructure composition in observed pages/actions | E-04, E-12 | 11,27,34,39,45,74,89 | Move composition behind approved server boundary or update the guard/specification with explicit approved exception; add regression scan |
| G-004 | P0 | Server-side authorization and concurrency cannot be proven against real persisted data | E-09 | 4,6,7,8,15,18,20,24,35,70,72 | Execute role/scope/SoD/IDOR/stale-version/idempotency negative tests on PostgreSQL |
| G-005 | P1 | Current scorecard has no executable manifest linking every domain to a test/evidence artifact | E-14, E-16 | 1–100 | Keep this scorecard and matrix versioned; add exact artifact/run IDs as evidence is produced |
| G-006 | P0 | Browser/E2E execution is blocked by Chromium host permissions and localhost EPERM | E-11 | 12,22–28,31–32,37–74,89–100 | Run in CI/approved browser environment; retain report, traces, release SHA, server logs and outcome counts |
| G-007 | P1 | Remote CI result for current HEAD is not known | E-13 | 1,7,13,29–33,78–87 | Capture current GitHub Actions run/check status and bind it to `eadc263...` |
| G-008 | P1 | E2E fixture availability and environment contracts are not demonstrated for protected workflows | E-11 | 6,12,15,23–27,43,58,70,72,98–100 | Define controlled test identities/data and execute positive/negative journeys without weakening production authorization |
| G-009 | P0 | Provider deployment, secrets rotation, runtime health, telemetry and rollback evidence are absent | E-13, E-16 | 9,21,29–32,57,78–84 | Produce provider-backed release identity, health/readiness, secret configuration, logs/alerts and rollback/forward-fix evidence |
| G-010 | P1 | Requirements, risk, role/scope and policy decisions are documented but not fully traced to executable current evidence | E-16 | 2,10,14,17,24,37,42,57,75–77 | Complete requirement-to-evidence mapping and resolve/defer policy items explicitly with deny-by-default behavior |
| G-011 | P1 | UI/a11y/responsive/interaction claims lack browser and representative manual evidence | E-11 | 22–28,38–56,61–65,68–73,88–97,100 | Run browser matrix, axe plus manual keyboard/RTL/zoom/reduced-motion and record exact release evidence |
| G-012 | P1 | No approved performance, usability, time-on-task or capacity acceptance evidence | E-16 | 28–30,47–49,63,66–69,84–86 | Approve thresholds first; run repeatable load/performance/usability measurement; store raw results and environment identity |
| G-013 | P0 | UAT, backup/restore, business continuity and production acceptance evidence are missing | E-16 | 1,2,9,10,14,20,31,37,42–44,57,66–67,75–84,98–100 | Execute risk-tiered UAT and isolated restore drill against exact release; record ACCEPTED/REJECTED/BLOCKED/NOT EXECUTED only |
| G-014 | P1 | Terminology/content/design governance and AI evaluation evidence are incomplete | E-16 | 37–44,61,66,69,88,94,97,99 | Establish approved glossary/content review and AI eval/model-risk records; no AI authority expansion |
| G-015 | P1 | Static source scan found TODO placeholders in controlled documents | E-12 | 10,17,18 | Classify each placeholder as template-only or unresolved requirement; link to requirement IDs and keep unresolved behavior blocked |
| G-016 | P2 | Build emits unused `Writable` warning | E-10 | 19,29,33,85,87 | Remove unused import or document the warning; rerun build and record result |
| G-017 | P1 | Runtime version mismatch weakens reproducibility | E-02 | 1,7,13,29,31,78–87 | Run all gates on Node 24.20.x and keep CI/local toolchain aligned |
| G-018 | P1 | No evidence of object-storage/provider recovery for files/evidence | E-16 | 9,21,36,48,73,83 | Execute private storage upload/download/hash/recovery drill with business linkage and unauthorized negative cases |
| G-019 | P1 | Report/search/dashboard scope consistency is not current runtime evidence | E-12, E-11 | 24,27,45–49,74,77 | Use one authorized dataset contract and verify UI, direct route, export and deep-link scope with role fixtures |
| G-020 | P1 | Critical scientific/policy authority decisions remain unresolved | E-16 | 1,2,8,10,15–18,23,43–44,57,71,75,83,98–100 | Obtain approved controlled sources/policies; keep release, approval, retest, limits, retention and recovery authority blocked until then |

## Triage order

1. G-001/G-002/G-004: establish real database and authorization evidence.
2. G-003: resolve the observed architecture contradiction.
3. G-006/G-008/G-011: execute browser and protected workflow evidence in an approved environment.
4. G-009/G-013/G-020: establish provider, UAT, recovery and policy evidence.
5. G-007/G-010/G-012/G-014/G-015/G-016/G-017/G-018/G-019: close remaining traceability, quality and governance gaps.

