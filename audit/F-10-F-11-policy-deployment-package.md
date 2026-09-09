# F-10 / F-11 — Controlled Policy & Deployment Package

**Source findings:** `audit/2026-09-09-production-ui-audit.md` (F-10 MEDIUM, F-11 MEDIUM, both on the policy/deployment track — §90: sensitive undefined behavior stays denied until approved).
**Date:** 2026-09-09
**HEAD (fresh, recomputed — prior audit SHAs NOT reused):** `6e65cd5f67edf449219736dc2ddf9f92ffb7ca82`
**Working tree:** modified (`.DS_Store` tracked modification + untracked `public/assets/qc-login-3d-background/`) — evidence below binds to this HEAD plus the package file itself, not to a clean tree.
**Node:** local `v22.22.3`, outside the repo contract `>=24.20.0` — results are local, not release evidence.

## Verdict (unchanged — read first)

```text
F-10 status: OPEN (policy/deployment blocker, still MEDIUM)
F-11 status: OPEN (policy/deployment blocker, still MEDIUM)
Production readiness: UNVERIFIED — NO CHANGE (PRODUCTION-READINESS-CHECKLIST.md §55)
Production DR readiness: UNVERIFIED — NO CHANGE
UAT overall: NOT EXECUTED — NO CHANGE
100% / production-ready: NOT CLAIMED (documentation alone never proves readiness)
```

This package changes **no readiness status**, grants **no authority**, configures **no provider**, and approves **no policy**. It inventories the six areas, separates what is missing in code from what is missing in policy, and keeps every undefined sensitive action at DENY with fresh test proof.

---

## 1. Scope inventory (current reality, file:line)

| # | Area | Current implementation reality | Policy reality |
|---|---|---|---|
| 1 | Object/file storage | No provider selected or wired. Health probe reports `UNKNOWN` by construction (`src/modules/system-health/infrastructure/postgres-health-probes.ts:47-56`). Render doc: providers "deliberately unselected" (`docs/operations/RENDER-DEPLOYMENT.md:56`). `.env.example` carries no storage variables. | Provider choice deferred: `BKP-DD-009`, `DEP-DD-016`, `AD-ARCH-008` |
| 2 | Backup / restore | Catalog UI exists but records intents only: empty catalog renders "No backup sets are recorded … never as a healthy state" (`src/pages/system/backups/index.astro:18`). No backup-job provider, no physical restore, no WAL/PITR orchestration in the repo. Restore page records a `PLANNED` intent, never executes (`src/pages/system/backups/[backupId]/restore.astro:30-33`, `src/modules/backup-recovery/application/request-restore.ts:99-106` — `orchestration: { executed: false }`). | RPO/RTO, cadence, retention, restore/reopen authorities, e-signature for restore all deferred (`BKP-DD-001/002/003/006/013/014/015/016/021`, `PRD-DD-003`) |
| 3 | AI provider | No provider approved, configured, or integrated. Default adapter is `DisabledAiProvider`: `NOT_CONFIGURED`, no network I/O, no SDK, no credentials (`src/modules/ai-advisory/infrastructure/disabled-ai-provider.ts:1-26`, wired in `src/modules/ai-advisory/application/dependencies.ts:1-6`). Health probe reports `UNKNOWN`, never gates core readiness (`postgres-health-probes.ts:87-96`). UI is advisory-only with copy/use-as-draft as the only actions (`src/pages/ai-advisory.astro:11-46`). | Provider selection, if ever, is a deployment decision; authority boundary is already APPROVED (BR-AI-001..012) and needs no new policy to stay denied |
| 4 | Quarantine template management | Administration surface is **read-only**: approved-template context + receiving-state distribution, explicit "Configuration changes require a separate approved mutation workflow" (`src/pages/quarantine/admin/index.astro:11-13`). Lab-test creation consumes approved templates read-only via `ListApprovedLabTemplatesUseCase`, which "can never create, approve, or retire a template version" (`src/modules/laboratory/application/list-approved-templates.ts:8-17`). No create/version/approve/retire mutation path exists for templates. | Template lifecycle policy (who authors/approves/retires, draft/version ceremony, e-signature need) unapproved — F-10 resolution requires it first |
| 5 | NCR / CAPA closure | State machines enforce gated closure: NCR `CLOSE` only from `READY_FOR_CLOSURE` **and** only with `verificationComplete` (`src/modules/quality/ncr/domain/ncr.ts:58-71`); CAPA `CLOSE` unconditionally throws `AUTHZ_DENIED` at domain level — close is structurally unreachable until a policy path is approved (`src/modules/quality/capa/domain/capa.ts:82-93`). NCR requires a Finding source; CAPA requires an NCR source plus actions (`createNcr`, `createCapa`). Direct global NCR/CAPA creation stays intentionally unexposed (audit §49-53). | Closure authorities unresolved: `RD-017` (who closes NCR), `RD-018` (who closes CAPA), `BR-QUAL-010` + `BR-QUAL-033` UNCONFIRMED (auto-NCR threshold, effectiveness verification) |
| 6 | Approval authorities | Permission codes exist (`PERM-NCR-CLOSE`, `PERM-CAPA-CLOSE`, `PERM-BKP-RESTORE-PRODUCTION`), but the authority matrix is deny-until-approved: `PERMISSION-MATRIX.md` §130 lists `PERM-NCR-CLOSE`, `PERM-CAPA-CLOSE`, `PERM-BKP-RESTORE-PRODUCTION` (among others) as runtime DENY until policy approval. Role ≠ permission; Admin is not an automatic restore/approval authority (`BACKUP-RECOVERY-PLAN.md` §37; restore page: "Admin is not an automatic restore authority"). | Named authorities unresolved: `RD-003/004/006/015/016/017/018/019/020`, `BKP-DD-014/015/016`, `PRD-DD-001/002`, `UAT-DD-001/008/009` |

---

## 2. Implementation gaps (build/configure) — NOT policy

These are absent mechanics. Closing them requires engineering + deployment work, each bound to the exact release and re-verified:

```text
G-01 No object-storage provider wired (SDK/adapter/bucket policy/CORS review per DEPLOYMENT-ARCHITECTURE.md §37)
G-02 No backup-job mechanism (physical base backup + WAL archiving + manifest generation per BACKUP-RECOVERY-PLAN.md §§8-10, 18)
G-03 No restore execution orchestration (only PLANNED intent recording exists)
G-04 No template administration mutations (create/version/review/approve/retire + SoD + e-signature if required)
G-05 No AI provider adapter (port exists: src/modules/ai-advisory/ports/ai-provider.ts; only the disabled adapter is wired)
G-06 No staging/UAT environment execution record for the F-10/F-11 scope on current HEAD
```

## 3. Policy decisions (approve/document) — NOT code defaults

No developer, agent, or AI may invent these. Until approved, the system fails closed:

```text
P-01 BKP-DD-008/009/010/011/012: backup / object-storage / KMS providers, immutability mechanism, cross-region need
P-02 BKP-DD-001/002/003/006/013: RPO, RTO, backup cadence, retention, drill cadence
P-03 BKP-DD-014/015/016 + RD-020: production restore authority, reopen authority, e-signature/reauth ceremony
P-04 RD-017/RD-018 + BR-QUAL-010/033: NCR/CAPA closure authority, auto-NCR threshold, effectiveness-verification rule
P-05 RD-003/004/006/015/016/019: inspection/lab/release/retest/void/document approval authorities
P-06 F-10 template lifecycle policy: author/review/approve/retire roles, draft→version ceremony, audit + concurrency expectations
P-07 PRD-DD-001/002/008 + UAT-DD-001/008/009: final decision authority, sign-off ceremony, risk-acceptance workflow
```

---

## 4. DENY evidence (fresh, this HEAD)

Sensitive actions stay denied by construction. Test proof was re-executed fresh on 2026-09-09 (Node v22.22.3, local):

| Claim | Fresh evidence |
|---|---|
| Production restore is DENY regardless of permission | `isProductionRestorePolicyApproved()` returns `false` (`validate-restore-request.ts:30-32`); `RequestRestoreUseCase` throws `AUTHZ_DENIED/PRODUCTION_RESTORE_AUTHORITY_UNRESOLVED` for `PRODUCTION` (`request-restore.ts:54-58`); UI disables the PRODUCTION option (`restore.astro:30,52`) |
| Restore authorization boundary (incl. Admin-without-permission, scope, drill-target, no-execution) | `tests/integration/system/restore-authorization.test.ts` — **10/10 pass** |
| Backup vocabulary (restorable-only-CREATED/VERIFIED, reason+confirmation, no job-success-as-restore) | `tests/integration/system/backup-catalog.test.ts` — **8/8 pass** |
| AI advisory boundary (disabled default, no authority encoding, secret-like rejection, outage fallback) | `tests/unit/ai-advisory/advisory.test.ts` — **14/14 pass** (incl. "reports not configured and never exposes a provider") |
| Controlled fail-closed defaults (release/approval/retest/supersede/scientific) | `tests/unit/policy/controlled-policy-fail-closed.test.ts` — **10/10 pass** |
| NCR close requires verification; NCR requires Finding source | `tests/integration/quality/ncr.test.ts` — **2/2 pass** |
| CAPA never closes directly; requires completed actions | `tests/integration/quality/capa.test.ts` — **1/1 pass** |

Total fresh: **45/45 pass** across 6 files. Fail-closed unit tests use fakes; integration tests above run without containers (DB-gated suites remain out of scope here — no Docker runtime locally).

---

## 5. Current provider evidence (no invention)

- **Storage:** `storage/UNKNOWN` — "Not configured in this baseline" (`postgres-health-probes.ts:47-56`). System Health renders UNKNOWN, never green.
- **Backup catalog:** empty state is the honest state — "No backup sets are recorded … No backup job provider is approved or configured" (`backups/index.astro:18`). No `SUCCEEDED` job exists to misread.
- **AI:** `ai-provider/UNKNOWN` — "not configured in this baseline" (`postgres-health-probes.ts:87-96`); adapter availability `NOT_CONFIGURED` (`disabled-ai-provider.ts:16-18`); core readiness unaffected by design (BR-AI-001).
- **Restore verification:** every backup set shows `RESTORE NOT VERIFIED` until a real drill evidences otherwise; job state and restore verification are rendered as separate facts (`system/health.astro:22-44`).

## 6. Backup artifact integrity (current HEAD)

No backup artifact exists in the catalog on this baseline, so there is **nothing to verify and nothing claimed**:

```text
Artifacts present: NONE
Integrity checks executed: NONE APPLICABLE (no artifact)
Restorable candidates: NONE (isRestorableBackup requires CREATED/VERIFIED — catalog is empty)
```

When G-02 lands, each artifact must carry the Recovery Manifest contract (BACKUP-RECOVERY-PLAN.md §18: set ID, PG version, WAL coverage, Git SHA, migration head, encryption state, integrity result) before any restore claim.

## 7. Isolated restore verification (current HEAD)

```text
Status on HEAD 6e65cd5: UNVERIFIED — no restore executed on this HEAD.
```

The prior logical drill `RER-2026-09-08-001` (`audit/100-percent/RESTORE-DRILL-RESULT.md`, status PARTIAL on HEAD `06b14cf`) is **stale evidence**: different HEAD, logical-only (`pg_dump/pg_restore` on disposable containers), with provider/PITR/WAL/RPO/RTO explicitly BLOCKED and no independent reviewer. It is referenced as method precedent only — it proves nothing about the current HEAD and is NOT reused as readiness evidence (per its own §7 rule and UAT plan §4 staleness rule). A new isolated drill on the exact release candidate is required (runbook: `docs/operations/RESTORE-DRILL-RUNBOOK.md`; evidence template: `audit/100-percent/RESTORE-DRILL-EVIDENCE-TEMPLATE.md`; gates: `audit/100-percent/DR-EVIDENCE-MATRIX.md` — all 12 gates currently BLOCKED/UNVERIFIED).

## 8. UAT evidence (current HEAD)

```text
Status: NOT EXECUTED — zero participant sessions.
```

The executable kit exists (`audit/100-percent/QC-100-CLOSURE-06-UAT-KIT.md`: "UAT EXECUTION REQUIRED — zero participant sessions have been executed … Nothing below is a result"). Entry criteria (UAT plan §67) are unmet for this HEAD: no release candidate declared, no UAT environment deployed from it, no personas/synthetic data. F-10/F-11-relevant scenarios (quarantine admin read-only, backup/restore UI boundaries §55, AI advisory boundaries §56, NCR/CAPA closure negatives §§23-25) must be executed with Tier-1 negatives before any acceptance. `UAT Passed / Ready for Production` is not claimed.

---

## 9. What this package does NOT do (explicit non-claims)

```text
No provider selected, configured, or integrated (storage/backup/AI/KMS/telemetry).
No RPO/RTO, cadence, retention, or threshold invented.
No closure/restore/approval authority granted to any role or account.
No restore executed; no backup created; no production data touched.
No readiness item moved to PASS; no percentage assigned; no GO issued.
Prior-HEAD drill evidence NOT carried forward as current-HEAD proof.
```

## 10. Gates to close F-10 / F-11 (in order)

1. **Policies P-01–P-07 approved** by the owning functions (Quality/QMS, Platform, Security, Application owners — named individuals are an operations decision, `BKP-DD-020`; this package names none).
2. **Gaps G-01–G-05 implemented** against the exact release, with migration/authorization/concurrency/audit tests.
3. **Isolated restore drill executed** on the exact candidate with a new Recovery Evidence Record (12/12 DR matrix gates evidenced; provider gates unblocked by operator evidence, not by code).
4. **Backup artifact integrity evidenced** per manifest + SHA-256 + DB↔object linkage contract.
5. **UAT executed** on the exact candidate incl. Tier-1 negatives for closure/restore/AI boundaries; outcome ACCEPTED by the designated authority.
6. **Readiness re-reviewed** via `PRODUCTION-READINESS-CHECKLIST.md` (esp. §§X, V, AB, AC) — only then may F-10/F-11 move, and only with current release-bound evidence.

Until then: **F-10 OPEN, F-11 OPEN, readiness UNVERIFIED, audit verdict BLOCKED (68%) stands.**
