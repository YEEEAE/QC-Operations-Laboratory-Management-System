# QC-ADP-05 — Laboratory templates and report drafts handoff

**State:** PARTIAL / NO-GO; route acceptance BLOCKED  
**Task:** QC-ADP-05  
**Source checkout HEAD:** `ecb59ccd21aa7a2f403a386f36c0633b2f6628d1` (working tree has the local UX change noted below)  
**Source migration head:** `0040_signed_release_gate_evidence`; migration `0039_laboratory_report_drafts.sql` SHA-256 `b52e70d5dc45aab6f1553a3d761b8d2dab2e455eb5db5f27e44caf27d0e823a9`  
**Changed source file SHA-256:** `src/pages/laboratory/report-templates.astro` `2815400b0662998b410050015508b1959ec95e1652020cf4e9d3b10bc6084343`; regression contract `tests/unit/ui/form-ux-contract.test.ts` `9bd0b132388d9a10391fdc298f4d7310083ce8f0c98509f442a1c7004b661c80`  
**Source authority:** [owner RBAC decision](../../Documents/OWNER-DECISION-RBAC-2026-09-23.md); [decision register](../../Documents/DECISION-ASSUMPTION-REGISTER-026.md) PD-01/02/03; [laboratory draft contract](../../Documents/LABORATORY-REPORT-TEMPLATES.md); [adaptive page audit](../2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md) §§3, 19A, 22.

## Root-cause findings

- The audited live denial on `/laboratory/report-templates` did **not** establish a missing `yazeed` grant. Source inspection found a diagnostic bug: when listing drafts failed, the page set a load-failure flag, hid the form, then fell through to copy claiming the user lacked create permission. The audited live source-health projection said database head `0018` while `0039` was shipped and pending; at that head the draft table is likely absent. [`0030_reject_reports_role_parity.sql`](../../db/migrations/0030_reject_reports_role_parity.sql) (also pending at `0018`) refreshes `SYSTEM_OWNER` with all active permissions, so a stale role grant is another plausible effect of the same migration lag. Therefore schema lag is the supported likely cause of the misleading denial; the actual live grant/scope is still **NOT VERIFIED** and must not be changed by inference.
- The page/use case requires an active direct `PERM-LAB-CREATE` grant with `OWN` or `GLOBAL` scope (and `PERM-LAB-VIEW` to read). The server derives the author from the authenticated actor and enforces author scope for `OWN`. Being the named system owner or seeing the route does not itself satisfy that create check. Local UX now distinguishes authorization errors from storage/read failures and directs the operator to check the grant or migration as appropriate.
- Migration `0039` defines separate transcription-draft storage, an `author_id → qc.users(id) ON DELETE RESTRICT` FK, timestamps, and a positive version. The repository writes append-only CREATE/SAVE audit events in the same transaction and applies compare-and-set version updates plus OWN/GLOBAL scope checks. `0039` contains no FK or immutable snapshot to an approved template/document revision; an approved source model/revision is absent from the repository. Do not add a fabricated source ID, measurement unit, precision rule, scientific limit, formula, or result evaluation.
- The local source has advanced to `0040`; historical live health on 2026-09-24 reported `0018` applied, `0039` shipped, and 21 pending. This is a health projection, not a direct applied-ledger/grant query. Production migration remains blocked by the credential-rotation gate and requires separate explicit migration authority.
- The owner-approved RBAC decision defines separate create/edit and review/final-approval powers. It does not supply the controlled laboratory method, effective source form, source hash, acceptance criteria, or manual-judgment policy. PD-01/02/03 are still open; the scientific path must remain fail-closed.

## Local change

Updated `src/pages/laboratory/report-templates.astro` to report a draft-list/database failure as a data-source/readiness problem rather than a permission denial; selected-draft lookup failure remains scope-safe, and actual authorization errors identify the permission and required `OWN`/`GLOBAL` scope. Stale-version and storage-save failures now give distinct recovery guidance while preserving entered data in the form. Access-denial copy directs the user to the system owner and explicitly says this does not grant review or approval authority. Added nearby transcription guidance to enter the source's unit and decimal precision exactly, with no conversion, rounding, or scientific evaluation. No grant is broadened and no criteria are invented.

Existing flow remains a separate 12-row transcription draft, saved/read through its repository and printed with a draft/not-approved warning. No official template connection, source FK/snapshot, actual live grant correction, migration, deployment, or scientific evaluation was performed.

## Frozen page acceptance denominator and handoff

The denominator below is the full finding list already attached to each route card in the audit. Every listed finding remains in the denominator, including blocked and unverified cases. Route closure requires positive success, a real-record authorization rejection, and scope/ownership boundary evidence on the same candidate; source code inspection or a memory-repository unit test alone does not close a live page card.

| Route card / route | Applicable checks (finding IDs) | PASS / denominator | State; evidence |
|---|---|---:|---|
| [RT-LAB-001](../../src/pages/laboratory/index.astro) `/laboratory` | F-009, F-010, F-013, F-016, F-005, F-014 | 0/6 (0%) | NOT VERIFIED; see [source route cards](../2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md) and candidate-bound route evidence requirements below. |
| [RT-LAB-002](../../src/pages/laboratory/tests/index.astro) `/laboratory/tests` | F-009, F-010, F-013, F-016, F-005, F-014 | 0/6 (0%) | NOT VERIFIED; populated list, scoped roles, and route actions not exercised. |
| [RT-LAB-003](../../src/pages/laboratory/tests/new.astro) `/laboratory/tests/new` | F-009, F-010, F-013, F-016, F-005, F-015 | 0/6 (0%) | BLOCKED / NOT VERIFIED; no approved in-scope template/source or candidate-bound role E2E. |
| [RT-LAB-009](../../src/pages/laboratory/report-templates.astro) `/laboratory/report-templates` | F-009, F-010, F-013, F-016, F-005, F-006, F-015 | 0/7 (0%) | BLOCKED / NOT VERIFIED; actual yazeed grant and applied schema unavailable; no browser session. |
| [RT-LAB-004](../../src/pages/laboratory/tests/[labTestId]/index.astro) `/laboratory/tests/[labTestId]` | F-009, F-010, F-013, F-016, F-005, F-014, F-028 | 0/7 (0%) | NOT VERIFIED; populated details, lifecycle/action scopes, and sample context not exercised. |
| [RT-LAB-005](../../src/pages/laboratory/tests/[labTestId]/execute.astro) `/laboratory/tests/[labTestId]/execute` | F-009, F-010, F-013, F-016, F-005, F-015, F-029 | 0/7 (0%) | BLOCKED / NOT VERIFIED; source-bound unit/precision and controlled evaluation unavailable. |
| [RT-LAB-006](../../src/pages/laboratory/tests/[labTestId]/review.astro) `/laboratory/tests/[labTestId]/review` | F-009, F-010, F-013, F-016, F-005 | 0/5 (0%) | NOT VERIFIED; independent reviewer success/denial and workflow evidence not exercised. |
| [RT-LAB-007](../../src/pages/laboratory/tests/[labTestId]/retests/new.astro) `/laboratory/tests/[labTestId]/retests/new` | F-009, F-010, F-013, F-016, F-005, F-015 | 0/6 (0%) | BLOCKED / NOT VERIFIED; approved retest policy remains open; no positive/negative runtime proof. |

**Closure:** 0 PASS / 50 applicable checks = **0%**. No `N/A` exclusions. This is an evidence-closure ratio for the nine listed page cards only; it is not a page-quality or product-quality score. Each route remains non-READY.

## Evidence results

| Evidence | Result | Boundary |
|---|---|---|
| [`tests/unit/laboratory/report-drafts.test.ts`](../../tests/unit/laboratory/report-drafts.test.ts) + [`tests/unit/ui/form-ux-contract.test.ts`](../../tests/unit/ui/form-ux-contract.test.ts) on Node 24.20.0 | PASS — 12/12 | In-memory behavior and source contract: 12 rows, exact text preservation, create/read/update, version conflict, owner scope/permission rejection, and distinct storage versus permission guidance. Not PostgreSQL, live role or route evidence. |
| `astro check` on Node 24.20.0 | PASS — 0 errors, 0 warnings, 89 hints | Source diagnostics only; hints include pre-existing unused imports/locals, including `savedId` in the report page. |
| [`tests/integration/laboratory/report-drafts.test.ts`](../../tests/integration/laboratory/report-drafts.test.ts) (PostgreSQL 18 Testcontainers) | BLOCKED before tests; 3 skipped | `Could not find a working container runtime strategy`; no PostgreSQL case ran. |
| Live `yazeed` grant/scope and migration ledger | NOT VERIFIED | Safari UI automation permissions were unavailable; browser tool had only `about:blank`; configured restricted PostgreSQL MCP documentation/launcher was absent. No Render/provider query used because project database rules require the canonical restricted connection and the live credential-rotation gate remains open. |
| Approved source/template and effective revision/hash | BLOCKED | No controlled source form or approved revision is supplied in project files; PD-01/02/03 remain OPEN. |
| Authenticated role E2E, 12-sample UAT, live screenshots, reflow/keyboard/AT | NOT RUN / BLOCKED | No authorized live browser session or isolated PG18 UAT environment; UAT requires real role-bound participants. |

## Route-level next evidence required

For each of RT-LAB-001, 002, 003, 004, 005, 006, 007, and 009, run the applicable findings from its frozen table above on one exact candidate: a positive permitted flow, a negative real-record unauthorized flow, a cross-owner/scope denial, plus that card's populated-state, keyboard/reflow, error-recovery, and role-specific journey checks. Keep failed, blocked, and unverified checks in the denominator. Record candidate identity, DB version/schema ledger, role/grants/scope, and evidence path. Do not mark READY until all applicable findings pass.

For I-01, first obtain the controlled laboratory form/method with its effective revision and content hash from Document Control/QC method owner, plus approved field units/precision and any scientific criteria. Then connect its immutable source identity/version to the draft/test path, label each sample and unit beside its input, verify invalid-value correction/recovery against that source, and exercise the 12-sample path. Keep any scientific evaluation disabled until the required owner decisions are closed.

## Non-execution / authorization boundary

No database grants, production records, migration ledger, production schema, external service, official source, deployment, commit, or remote branch were changed. Do not reconcile or widen the `yazeed` grant by inference. Production migration/deployment remain separately gated.
