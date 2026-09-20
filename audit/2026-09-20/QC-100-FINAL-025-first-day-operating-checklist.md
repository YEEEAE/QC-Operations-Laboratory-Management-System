# QC-100-FINAL-025 — First-day operating checklist, incident/problem runbook, local recovery exercise

**Date:** 2026-09-20 (UTC)
**Work status: PARTIAL** — items 1–3 DONE locally with evidence; item 4 DONE as
separation (no external dependency was closed or converted). Production operation,
provider recovery, E2E/accessibility/UAT evidence remain external and BLOCKED.

## 1. Candidate identity (frozen before execution)

| Field | Value |
| --- | --- |
| Git SHA | `e29c9fd3b282ae1c5053993cc19a6779af9c7a26` (`main`, subject "update site") |
| Working tree | dirty — 11 paths at freeze (6 modified + 5 untracked from QC-100-FINAL-024 family, preserved untouched) |
| Content-based dirty fingerprint (sha256 over per-file sha256 of all modified+untracked paths, ordered) | pre-task `d1c47bfcda4f9c9664d56a054b9b7ca6a7e55437299743ca2172f6b498db3580`; final `93b5cbe8dfe06ec83b05f976d6cbb4ef959eb1a8b203d0941bfbc41893ca58a4` (shift = this task's new docs only) |
| Release identity | `rel-c2d11ab601eb0704`, build `local-e29c9fd3b282`, `workingTree: dirty`, gitSha matches HEAD |
| Build identity | not rebuilt in this phase (documentation + DB-level exercise only) |
| Schema/migration identity | source head `0031_qc_creation_parity_two_stage_approval` (`44b160a6b8c09769fd7f18e19c29b2e29c98635cbf81de603a2cbbbd6324ec61`), **unchanged**; 31/31 migrations applied to disposable `qc_f025`, 77 qc tables |
| Runtime | exercises executed with Node `v24.20.0` (contract `>=24.20.0 <25`) on disposable PostgreSQL 18.6 (TLS verify-full) |
| Audit comparison candidate | `653b58d22d4a17994db7376a3bd691ca6e789f1a` (2026-09-19, maturity 45.8%, gates 0/19, NO-GO) — frozen; not changed |
| Evidence timestamps | exercise `2026-09-20T16:31:45Z`; restore `16:32–16:35Z`; docs/checks `16:40Z+` |

## 2. Prerequisites inspected

- `.agents/mind/01-mind-latest.md` read (current-state sections + ledger).
- `AGENTS.md`; skills discovery (`.agents/skills`, 369 dirs); relevant skills read:
  `documentation-template`, `handoff-spec`, `better-writing` — consumed as guidance.
- Base owners reused, not rebuilt: 008 (backup bundle/restore tooling), 019/020
  (starting data, role guides, support register), 007/001 (parity facts); 013/026 gaps
  referenced, not resolved here.
- Canonical sources consumed read-only: `Documents/PRODUCTION-READINESS-CHECKLIST.md`,
  `BACKUP-RECOVERY-PLAN.md`, `RESTORE-DRILL-RUNBOOK.md`, `INCIDENT-QUICK-REFERENCE.md`,
  `SUPPORT-OWNERSHIP-REGISTER.md`, `ROLE-OPERATING-GUIDES.md`,
  `OBSERVABILITY-ARCHITECTURE.md`; code facts: `src/modules/backup-recovery/**`,

## 3. Requirement → implementation → evidence → unresolved dependency

### Item 1 — First-day checklist from actual readiness — **DONE (local)**

- Changed: `Documents/FIRST-DAY-OPERATING-CHECKLIST.md` (new).
- Every row carries evidence reference, functional owner, dependency ID, and reversible
  action. Readiness claims limited to what current evidence proves: health/readiness
  probes, in-app notifications (no external channel — stated as fact), backup job
  contract (local-verified), monitoring posture (logs/traceId exist; provider alerting
  absent — stated as PENDING).
- Evidence: this record §4 checks; candidate facts re-derived on this tree.
- Unresolved: DEP-025-01..07 (checklist §5).

### Item 2 — Incident triage + problem records + local failure/recovery exercise — **DONE (local)**

- Changed: `Documents/INCIDENT-PROBLEM-RUNBOOK.md` (new): incident record and problem
  record templates (impact, safe containment, diagnosis, recovery verification,
  follow-up) plus a failure→first-response map citing canonical policy.
- Local exercise on disposable PostgreSQL 18.6 (database `qc_f025`, task-owned keys
  `f025-*`, disposable identities only; no external alert sent; no human approval
  simulated). Machine output retained in ignored `.tmp/qc-f025/`, checksums: exercise
  result JSON `323b05ae…044e3`; restore checklist `6ec23506…d4119`; corrupted-ledger
  negative `af6b65ba…d6e18c`; dump `5685851d…d3581` (276,813 bytes).
- Results (all PASS, exit 0):
  - S1 dependency outage: unreachable endpoint failed closed, no credential material in
    error; recovery probe answered under TLS verify-full after recovery.
  - S2 ambiguous controlled write: same-key retry replayed the recorded `COMPLETED`
    outcome (exactly-once); conflicting fingerprint rejected by unique key, original
    unchanged (409-class).
  - S3 outbox/notification side-effect failure: committed business record survived the
    undelivered side effect; duplicate `dedupe_key` rejected; one pending row remained
    claimable for separate recovery.
  - S4 backup-set integrity + isolated restore: `pg_dump` → `pg_restore` into isolated
    `qc_restore_f025` (77 tables, 31-entry ledger, exercise rows present);
    `run-recovery-checklist`: `manifest-schema` PASS, `restored-database` PASS;
    corrupted-ledger control FAILed honestly (`RESTORE_VERIFICATION_FAILED`, "migration
    ledger mismatch"); provider/operator gates remained BLOCKED as designed.
- Unresolved: provider restore/PITR; application-compatibility/authorization/session
  gates on a restored target (operator evidence); DEP-025-01/02.

### Item 3 — Minimum operating mode + stop-work conditions from approved policy — **DONE (local)**

- Changed: `Documents/FIRST-DAY-OPERATING-CHECKLIST.md` §4.
- Derived strictly from `PRODUCTION-READINESS-CHECKLIST.md` status vocabulary and
  `INCIDENT-QUICK-REFERENCE.md` / `BACKUP-RECOVERY-PLAN.md`; no threshold, RPO/RTO
  value, or policy invented. Explicit rules: never hide a failed dependency behind a
  healthy dashboard; no continuity claim without measured recovery evidence.

### Item 4 — Separate ready local preparation from pending external operations; feed 012 — **DONE**

## 4. Technical checks on the final tree

| Check | Result |
| --- | --- |
| Local recovery exercise (S1–S3) | PASS 6/6, exit 0, `2026-09-20T16:31:45Z` |
| Isolated restore + checklist (S4 positive) | PASS (`restored-database` PASS; operator/provider gates BLOCKED by design) |
| Negative control (corrupted ledger) | FAIL surfaced honestly (`RESTORE_VERIFICATION_FAILED`) — expected behavior |
| Migration chain to disposable `qc_f025` | 31/31 applied, 77 tables |
| `release:identity` | `rel-c2d11ab601eb0704`, gitSha = HEAD, dirty flag true |
| typecheck / lint / format | see §4.1 (re-run after doc changes) |
| E2E (003), accessibility (006/040), UAT (004) | NOT RUN / BLOCKED — external owners |
| Regression ownership | 002/027 consume this record; no application code changed |

### 4.1 Final static checks (re-run on the final tree, Node v24.20.0)

- `prettier --check` on the four touched files: **PASS**.
- Repo-wide `format:check`: **FAIL** on `tests/unit/ui/record-journey-contract.test.ts`
  — pre-existing file owned by the QC-100-FINAL-024 family (untracked at freeze);
  not touched by this task.
- `typecheck`: **1 error** in `tests/integration/qc-100-final-024/record-journey-linkage.test.ts`
  (`occurredAt` not in `AuditEventInput`) — pre-existing, same owner; not touched.
- `lint`: **1 error** in the same 024 file (unused import) — pre-existing; not touched.
- Secret scan of the three new/changed artifacts: no credentials, connection strings,
  tokens, or keys (only policy sentences mentioning the words).
- My files introduce **zero** type/lint/format findings (verified by scoped checks).

## 5. Unresolved / handoff

- Next phase: final audit 012 reconciliation — input: this record +
  `Documents/FIRST-DAY-OPERATING-CHECKLIST.md` §5 dependency register.
- DEP-025-01 remains the hard gate for any production operating day.
- `PASS ≠ RELEASED`: all results above are local candidate evidence only.


- `PENDING (external)` rows and the DEP-025-01..07 register (checklist §5) keep every
  external dependency named with its owner (015/008/013/026/003/006/040/004).
- No automatic go-live, no release authorization, no score change; gates remain 0/19.

  `scripts/recovery/*`, `src/shared/notifications/*` (in-app only), health routes.
- No duplicate policy source created; DOCUMENTATION-INVENTORY updated with the two new
  entries.
