# QC-100-FINAL-013 — Remaining Requirements Inventory & Controlled-Source Request Pack

- **Candidate (re-frozen before execution):** `eab4e341ea87a7eb6ce8c62e94673a74ffd7cb60` (HEAD, `main`, 2026-09-18).
- **Environment:** Node `24.20.0`, pnpm `11.25.0` (package contract), `LC_ALL=en_US.UTF-8` required for Homebrew PG startup.
- **Disposable PostgreSQL:** local Homebrew PostgreSQL **18.6**, `qc_test` database, TLS enabled with a throwaway self-signed certificate, port `55433`, created and destroyed for this task. Never pointed at a shared or production database.
- **Audit baseline recheck:** `298e307721af97d9c1bd22279d0c784fbf5b62a8` observations are historical inputs only; all runtime evidence below was produced on the actual candidate above.
- **Result legend:** each row is `DONE` (implemented and evidenced on this candidate), `PARTIAL` (mechanics evidenced, scope incomplete), or `BLOCKED` (authority/source missing). Evidence states: `PASS` / `BLOCKED` / `NOT RUN`.

## A. What was executed on this candidate

| Check | Command / suite | Result |
|---|---|---|
| Migrations (fresh apply) | `pnpm exec tsx scripts/db/migrate.ts` on disposable PG 18.6 | **PASS** — `0001..0029` applied, 0 pending |
| Migration zero-op re-run | same command again | **PASS** — `applied: []`, idempotent |
| Migration status | `scripts/db/migration-status.ts` | **PASS** — 29 applied / 0 pending |
| Preflight | `scripts/db/preflight.ts` | **PASS** — connectivity, schema `qc`, `qc_users`, `schema_migrations`, read-only capabilities |
| Migration integrity | `scripts/db/check-migration-integrity.ts` | **PASS** — 29 migrations |
| Schema integrity | `scripts/db/check-schema-integrity.ts` | **PASS** — 77 tables / 0 orphans |
| Full integration | `vitest run tests/integration` against populated disposable PG | **PASS** — 87 files / 353 tests |
| Concurrency / idempotency | `tests/integration/concurrency` | **PASS** — 12/12 on live PG (stale-version, idempotent replay, SoD, controlled mutations) |
| Unit | `vitest run tests/unit` | **PASS** — 83 files / 564 tests |
| Browser E2E | Playwright suites | **BLOCKED** — host Chromium/localhost permission restriction (unchanged environmental blocker, CB-002) |
| Docker | — | **UNAVAILABLE** on this host (unchanged); local PG 18.6 used as the disposable substitute via `QC_TEST_DATABASE_URL` |

This closes the evidence gaps previously held by G-001/G-002/G-004 **for local disposable-PG scope only**; provider/production parity, CI and browser E2E remain separate gates.

## B. Requirement inventory (remaining, by domain)

### B1. Laboratory (REQ-LAB-002/008/011/018/020; TR-LAB-007; TR-LAB-008; PD-01..06, PD-22, PD-23, PD-38)

| Requirement | Source | Owner | Implementation path | Acceptance evidence | Status |
|---|---|---|---|---|---|
| Per-parameter PASS/FAIL limits (PD-01) | BR-LAB-003/021 | QC WI/SOP per method (external authority) | Controlled configuration intake → versioned criteria → injected server evaluator bound by `sourceReference`/`contentHash` | Positive/negative evaluation cases on PG + source hash drift denial | **BLOCKED** — no approved source supplied |
| Approved method per test (PD-03) | BR-LAB-002 | QC method/template authority | Template snapshot at execution start (exists) + evaluator source binding | Template/source hash mismatch denial tests (exist, unit PASS) | **BLOCKED** on method content itself |
| Precision / rounding (PD-04/PD-05) | BR-LAB-005; DB §26 | QC precision statement | Raw decimal text preserved (current); no rounding in scientific path | Rounding-absence unit tests PASS | **BLOCKED** — policy value missing; fail-closed preserved |
| Retest count/authorizer/effect (PD-06; REQ-LAB-018) | BR-LAB-014..018 | Lab/QMS retest policy | `PERM-LAB-AUTHORIZE-RETEST` exists; count/effect policy port fail-closed | Retest matrix tests after policy supply | **BLOCKED** |
| Manual PASS/FAIL judgment (PD-07) | BR-INSP-007 | QC manual-judgment procedure | No manual override path exists by design | Denial test exists | **BLOCKED** |
| Lab reject decision authority (PD-38; TR-LAB-007) | STATE-MACHINES §TR-LAB-007 | QC/QMS reject-authority source | `RejectLabTestUseCase` + `LabRejectPolicy` port; default throws `POLICY_SOURCE_REQUIRED`; dual permission + SoD + P-05 + version + reason wired | Unit 564/564 incl. scientific-governance; integration 353/353; PG-backed reject mechanics PASS | **PARTIAL (mechanics DONE/evidenced) / decision BLOCKED** |
| VOID lab test (TR-LAB-008; REQ-LAB-019) | STATE-MACHINES §TR-LAB-008 | QC/QMS void policy | Deliberately unimplemented; `transitionLab` denies VOID from APPROVED/REJECTED; no action registered | Denial test PASS (`governance.test.ts`) | **BLOCKED** — policy-denied by design until void policy is approved |

### B2. QMS / Quality (REQ-QUAL-009/010; PD-15, PD-16, PD-17, PD-18)

| Requirement | Source | Owner | Implementation path | Acceptance evidence | Status |
|---|---|---|---|---|---|
| Finding→NCR threshold (PD-15) | BR-QUAL-010 | QC NCR criteria | No automatic threshold; explicit NCR creation only | Negative test (no auto-NCR) | **BLOCKED** |
| FAIL→NCR automatic vs manual (PD-16) | BR-INSP-015/016 | QC FAIL-handling procedure | No automatic NCR creation | Current behavior documented | **BLOCKED** |
| NCR closure authority (PD-17) | BR-QUAL-012 | QMS workflow + permission binding | P-04 CAPA closure closed separately; NCR closure matrix open | Invalid-transition denial tests | **PARTIAL / BLOCKED** |
| CAPA effectiveness check (PD-18) | BR-QUAL-031..033 | Quality-policy owner | `ACTIONS_COMPLETE` ≠ effectiveness enforced; no claim invented | CAPA closure tests PASS | **BLOCKED** on effectiveness policy value |

### B3. Inspection (PD-02, PD-07; REQ-INSP-004/006/008)

| Requirement | Source | Owner | Implementation path | Acceptance evidence | Status |
|---|---|---|---|---|---|
| Criteria source binding (PD-02) | BR-INSP-004, BR-LAB-021 | Document-control approved version | Template snapshot at execution start (exists) | Snapshot-immutability tests PASS | **BLOCKED** on approved source content |
| Evidence-before-Submit (REQ-INSP-008) | BR-INSP-009 | Approved requirement | Server-counted evidence Submit gate (QC-CLOSURE-006) | PG integration PASS; E2E BLOCKED (browser) | **DONE mechanics / E2E BLOCKED** |

### B4. Equipment / Calibration (REQ-EQP-005, REQ-CAL-002/004; PD-20, PD-21, PD-30)

| Requirement | Source | Owner | Implementation path | Acceptance evidence | Status |
|---|---|---|---|---|---|
| Calibration interval/due-date derivation (PD-20) | BR-CAL-002/003 | Approved calibration policy | Explicit `SCHEDULED`/`COMPLETED`/`FAILED` states + append-only history (QC-CLOSURE-008); interval not derived | 0027 constraints + asset PG tests PASS | **BLOCKED** — interval value missing |
| Overdue equipment use policy (PD-21) | BR-CAL-004 | Approved equipment-use policy | Fail-closed at Submit (equipment ACTIVE + CURRENT non-overdue calibration) | Negative PG tests PASS | **PARTIAL** — context-specific gate DONE; generic policy OPEN |
| Controlled equipment fields / Change Request level (PD-30) | BR-ADM-004; BR-EQP-005 | Business owner catalog | Privileged + audited admin paths; controlled-field list unresolved | Audit events present | **BLOCKED** |

### B5. Documents / Approvals / Signatures (REQ-DOC-007/008; REQ-APR-009; REQ-ESIG-008; PD-11, PD-12, PD-13, PD-14, PD-32, RD-019)

| Requirement | Source | Owner | Implementation path | Acceptance evidence | Status |
|---|---|---|---|---|---|
| Generic document approval authority (RD-019 / PD-12 slice) | Permission Matrix | Business authority | Document approval follows P-05/state/version/signature for approved slices; generic grant list open | Approval tests PASS for approved slices | **PARTIAL / BLOCKED** |
| Generic effective-date rule (PD-13) | BR-DOC-009 | Document-control/QMS rule | Template lifecycle slice closed (P-06); generic rule open | Template lifecycle tests PASS | **PARTIAL / BLOCKED** |
| Revision numbering scheme (PD-14) | BR-DOC-008 | Document-control procedure | Free-text reference only; no invented scheme | — | **BLOCKED** |
| Generic SoD matrix (PD-11) | BR-APR-006/007 | QMS SoD matrix | Self-review/approve/reject/release denied; unknown combinations denied | SoD negative tests PASS | **PARTIAL / BLOCKED** |
| Signature action scope (PD-32) | BR-ESIG-008 | QMS signature policy | P-06/P-07 scopes closed; complete action list open | Signature mechanics tests PASS | **PARTIAL / BLOCKED** |

### B6. Correction / Retention / Audit integrity (PD-24, PD-25, PD-33, PD-34, PD-35; REQ-DATA-011)

| Requirement | Source | Owner | Implementation path | Acceptance evidence | Status |
|---|---|---|---|---|---|
| Retention per record class (PD-24) | DB §99; observability docs | QMS retention schedule | No automatic deletion job exists (fail-closed) | Absence asserted in design review | **BLOCKED** |
| Archival timing/retrievability (PD-25) | BR-DOC-004/005 | QMS archival schedule | Archive transition preserves; no deletion clock | — | **BLOCKED** |
| Audit hash-chain/signed digest (PD-33; REQ-AUD-007) | BR-AUD-001/006/007 | Security/QMS design | Append-only audit exists; no cryptographic mechanism claimed | Audit contract tests PASS | **BLOCKED** |
| Permitted hard-delete list (PD-34) | BR-GEN-050..053 | Per-domain approval | Controlled-record deletion denied | Negative tests PASS | **BLOCKED** |
| Import strategy (PD-35) | BR-GEN-063/064 | Per-use-case owner | Full validation; no silent partial success | — | **BLOCKED** |
| NUMERIC precision source (REQ-DATA-011) | DATA-DICTIONARY | Controlled requirement | Raw decimal preserved; no invented precision | Unit tests PASS | **BLOCKED** |

### B7. Recovery / Operations (PD-26..PD-29; REQ-BKP-006/007/008)

All four remain **BLOCKED**: RPO/RTO targets and production-restore authority require business-owner decisions plus isolated-drill/provider evidence. UI displays targets (RPO 24h / RTO 4h) as **targets only, not measurements**. No change made.

### B8. Localization — Domain 70 (retained, not dropped)

- **Source:** `Documents/UI-UX-SPECIFICATION.md` — header "**Languages:** Arabic / English capable", section 42 "Language / RTL" (logical positioning, RTL layout, Arabic typography, correct icon direction, protected business-code bidi), final block "Arabic: RTL supported / English: LTR supported".
- **Current delivery:** English-only, `lang="en"`, LTR (confirmed in Mind §10 and source).
- **Gap:** the approved specification declares Arabic capability; the delivery is English/LTR. There is **no explicit owner decision** stating whether Arabic/RTL is in-scope for the current release or an approved exclusion.
- **Required decision (external authority):** explicit applicability decision for Arabic/RTL — either (a) implement localization with human acceptance evidence, or (b) record an approved exclusion with a transparent scoring denominator (99 domains instead of 100).
- **Action taken in this task:** decision request recorded below (section C); the domain remains scored as its own line (last audit 25.0%→7.0%, `NOT VERIFIED`); **no silent removal, no invented exclusion, no scoring-denominator change without owner approval.**
- **Status:** **BLOCKED** on owner decision.


## C. Controlled-source request pack (handoff to business authority)

The following must come from the authorized QC/QMS/business source before the corresponding fail-closed defaults may open. **Nothing below was invented in this task.**

1. **PD-01/02/03/04/05 (laboratory scientific core):** per-method approved source document (ID/version/hash), per-parameter limits, units, tolerances, precision and rounding rule.
2. **PD-38:** reject decision authority source for TR-LAB-007 (who may decide a lab test is rejected and under what conditions).
3. **TR-LAB-008:** explicit VOID policy (allowed states, authority, reason, signature, audit meaning) or an approved permanent exclusion.
4. **PD-06:** retest count, authorizer, and effect on final result.
5. **PD-07:** manual PASS/FAIL judgment procedure.
6. **PD-15/16/17/18:** NCR thresholds, FAIL→NCR automation, NCR closure authority, CAPA effectiveness policy.
7. **PD-20/21:** calibration interval derivation and overdue-use policy per equipment class.
8. **PD-24/25/33/34/35:** retention schedule, archival schedule, audit integrity mechanism, hard-delete list, import strategy.
9. **PD-26/27/28/29:** RPO/RTO targets, production-restore authority, escalation policy.
10. **PD-11/12/13/14/30/32/37:** generic SoD matrix, complete role→permission grants, generic document effective-date and revision rules, controlled reference-data catalog, complete signature-action list, audit-export grant list.
11. **Domain 70:** explicit Arabic/RTL applicability decision (implement-with-acceptance vs approved exclusion + scoring denominator).

## D. Downstream handoff notes

- **Tasks 011 / 010 / 003 / 004:** PG-backed integration evidence (353/353), concurrency/idempotency (12/12), migrations (29) and schema (77 tables/0 orphans) are now **fresh on candidate `eab4e34`**; E2E remains BLOCKED by browser host restrictions (CB-002) — do not treat this task as E2E closure.
- **Fail-closed defaults preserved:** default lab evaluator still throws; reject default policy still throws `POLICY_SOURCE_REQUIRED`; VOID still denied by the state machine. Opening any of them requires section-C sources.
- **No policy, scientific value, or authority was changed or invented.** No code or test files were modified in this task.

## E. Work status vs evidence status

- **Work status:** **PARTIAL / BLOCKED** — inventory and request pack complete; disposable-PG evidence refreshed on the frozen candidate; every remaining requirement has a source, owner, path and acceptance evidence defined, but the authority decisions in section C are external blockers.
- **Evidence status:** local gates **PASS** (unit 564/564, integration 353/353, concurrency 12/12, migrations 29/29, schema 77 tables/0 orphans, preflight/integrity PASS); browser E2E **BLOCKED**; provider/production/UAT **NOT RUN** in this task.

