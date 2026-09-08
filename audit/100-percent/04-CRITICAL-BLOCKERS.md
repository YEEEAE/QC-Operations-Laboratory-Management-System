# QC-100-01 — Critical Blockers

These blockers prevent evidence-backed closure for the affected domains. They are not implementation changes.

| ID | Blocker | Direct evidence | Impacted domains | Exit evidence required |
|---|---|---|---|---|
| CB-001 | No current PostgreSQL runtime evidence | E-09: Testcontainers could not find a working container runtime; no approved `DATABASE_URL` was available | 1–21, 29–36, 59, 74–83, 98–100 | Run migrations, constraints, authorization, transaction, audit, backup-catalog and recovery tests against approved PostgreSQL 18; record exact database identity and counts |
| CB-002 | Browser/E2E execution is blocked by host permissions and localhost policy | E-11: 57/57 E2E failures include Chromium `SIGTRAP`/Mach rendezvous and `connect EPERM 127.0.0.1:4321` | 12, 22–28, 31–32, 37–74, 89–97, 100 | Execute the same release candidate in CI or an approved browser-capable environment and retain report/trace evidence |
| CB-003 | Delivery-layer database composition contradicts the declared boundary invariant | E-04 passes a custom guard, but E-12 finds direct `getDatabase()`/infrastructure imports in pages/actions | 11, 12, 22–23, 27, 34, 37–39, 74, 89 | Remove or formally justify each violation through approved composition boundaries; add a guard that detects the observed pattern |
| CB-004 | Runtime database migration head/checksum/apply state is not current evidence | E-03 proves only repository files, not applied database state | 3, 4, 7, 9, 16–18, 31, 35, 78–80, 83 | `db:preflight`, migration integrity, fresh/upgrade/repeat migration evidence against the named database |
| CB-005 | No current UAT/release-candidate evidence | E-16 contains plans and prior historical notes; no exact current release UAT record was produced | 1, 2, 10, 12, 22–28, 37–77, 80, 83–84, 98–100 | Execute role × domain × workflow × state × negative scenarios bound to this HEAD/build |
| CB-006 | Backup/restore and disaster-recovery execution is not evidenced | Controlled plan defines evidence requirements, but no restore drill result is current here | 9, 14, 30–31, 57, 74, 82–83 | Isolated restore/PITR/object recovery drill with integrity and audit-history verification |
| CB-007 | Remote CI result is unknown | E-13 is configuration only; no current check-run evidence was captured | 1, 13, 29–33, 78–87 | Capture the exact workflow run URL/SHA and all job results for this HEAD |
| CB-008 | Scientific and policy-dependent decisions remain unresolved in the approved documents | Foundation documents explicitly defer limits, authority, retest, retention, RPO/RTO and similar decisions | 1–2, 8, 10, 15–18, 23, 43–44, 57, 71, 75–77, 83, 88, 98–100 | Approved controlled policy/source plus negative-path tests; until then keep sensitive actions denied/blocked |
| CB-009 | No production/provider evidence | No provider dashboard, deployed artifact, live health, or release identity verification was captured in this prompt | 9, 29–32, 57, 74, 78–84 | Provider-backed deployment, health, observability, secrets, rollback and recovery evidence |
| CB-010 | Full audit model has no single executable coverage gate | Current package has focused tests and a CI workflow, but no machine-readable 100-domain manifest was present before this baseline | 1–100 | Maintain the scorecard/matrix as the authoritative backlog and add executable evidence links per domain |

## Blocker rule

Any domain depending on one of CB-001, CB-002, CB-005, or CB-006 cannot be scored as closure-level while the blocker remains open, even when static source inspection or focused tests look favorable.

