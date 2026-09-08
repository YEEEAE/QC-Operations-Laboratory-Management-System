# Controlled Policy Decision Register — QC-100-CLOSURE-08 (R-007)

## Master header

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Target: `main`
- HEAD: `06b14cfa571275e76a3839e671fc635559408960` (recomputed fresh; old SHAs in prior audit sections were NOT reused)
- Date: `2026-09-08`
- Task: `QC-100-CLOSURE-08` — Controlled Scientific and Business Policy Decision Closure
- Normative rule: **until a policy is approved, the software must fail closed.** No scientific limit, threshold,
  authority, retention rule, RPO/RTO, or master-data change is invented by code, tests, or this register.

## How to read this register

- `status: OPEN` — no approved controlled source was supplied in this task; the item is NOT closed.
- `fail-closed: ENFORCED` — current code denies/blocks the sensitive action without the approval (with file:line proof).
- `fail-closed: PROCESS` — no automatic system action exists; closure needs a human/operator approval step.
- `required approver/source` names WHO must approve (QC / QMS / business owner), not a guess of what they will decide.
- Items whose principle is APPROVED in `Documents/BUSINESS-RULES.md` but whose instance data is per-template/per-case
  stay OPEN at instance level (e.g. a specific limit value still needs its WI/SOP).

## A. Scientific limits, criteria, methods, precision, rounding

### PD-01 — Scientific limits (per-parameter limits)

- domain: laboratory / inspection
- decision: what numeric/categorical limit decides PASS/FAIL for each parameter.
- why required: `BR-LAB-003` forbids developer defaults; every limit needs an approved controlled source.
- current behavior: limits are read only from `lab_test_template_parameters.acceptance_rule_payload` with
  `controlled_source_reference`; missing/empty criteria → `AUTHZ_DENIED`
  (`src/modules/laboratory/infrastructure/postgres-controlled-sources.ts:25-31`).
- current source: `Documents/BUSINESS-RULES.md BR-LAB-003` (APPROVED principle), `BR-LAB-021` (SOURCE-DEPENDENT).
- risk: inventing a threshold would silently certify or reject product.
- system default: DENY (no limit → no evaluation).
- required approver/source: QC-approved WI/SOP/specification per test method, recorded as template parameters.
- implementation impact: none — already fail-closed; new limits arrive as controlled data, not code.
- tests required: `tests/unit/policy/controlled-policy-fail-closed.test.ts` (evaluate denies) ✅;
  per-template criteria tests only after approved templates exist.
- status: OPEN (instance data).

### PD-02 — Acceptance criteria source binding

- domain: inspection / laboratory
- decision: which approved document (WI/SOP/spec/method/template) binds each criterion, preserved at execution time.
- why required: `BR-INSP-004`, `BR-LAB-021` (SOURCE-DEPENDENT); history must cite the exact version used.
- current behavior: `resolve()` requires template version `APPROVED` + method/content-hash present
  (`postgres-controlled-sources.ts:11-18`); `ApproveLabTestUseCase` rejects evaluation whose
  sourceReference/contentHash drifted from execution context (`approve-lab-test.ts:35-39`).
- current source: `BR-INSP-004`, `BR-LAB-021`.
- risk: criteria swapped mid-flight would certify against the wrong rule.
- system default: DENY on missing/changed source.
- required approver/source: document-control approval of each WI/SOP/template version.
- implementation impact: none.
- tests required: fail-closed suite ✅; source-drift negative path needs a focused test (open, minor).
- status: OPEN (instance data).

### PD-03 — Approved test methods

- domain: laboratory
- decision: which test method (method reference) each lab test executes.
- why required: `BR-LAB-002` (SOURCE-DEPENDENT).
- current behavior: method comes only from the approved template version context; never client-supplied
  (`create-lab-test.ts` + `controlled-sources.ts:13`).
- current source: `BR-LAB-002`.
- risk: unapproved method producing an official-looking result.
- system default: DENY (no approved template version → no test).
- required approver/source: QC-approved test method / template.
- implementation impact: none.
- tests required: fail-closed suite ✅.
- status: OPEN (instance data).

### PD-04 — Numeric precision (decimal places / significant figures)

- domain: laboratory / inspection
- decision: required precision per parameter; no global developer-chosen precision.
- why required: `DATABASE-ARCHITECTURE.md:568` forbids inventing precision/rounding; `qty` precision is
  UNCONFIRMED (`DATA-DICTIONARY.md:695`).
- current behavior: raw observations stored as exact decimal **text**; `validateMeasurement` accepts only
  plain decimal strings, rejects NaN/Infinity/scientific notation, performs zero conversion
  (`src/modules/laboratory/domain/measurement.ts:26-50`); no `toFixed`/`Math.round` in lab/quarantine code.
- current source: `BR-LAB-005` (APPROVED: preserve raw observation) + deferred precision policy.
- risk: silent rounding could flip a borderline PASS/FAIL.
- system default: preserve exact text; never round.
- required approver/source: QC-approved precision statement per method/parameter.
- implementation impact: none until approved; display rounding (if ever approved) must be presentation-only.
- tests required: fail-closed suite (exact-text preservation) ✅ + `scientific-boundaries.test.ts` ✅.
- status: OPEN.

### PD-05 — Rounding rules

- domain: laboratory / inspection
- decision: whether rounding is ever applied, where, and by which rule.
- why required: same as PD-04; UI-invented rounding is an explicit anti-pattern (`UI-UX-SPECIFICATION.md:2559`).
- current behavior: no rounding anywhere in the scientific path (verified by `rg` scan: zero rounding calls).
- current source: deferred; `measurement.ts` carries `precisionGuidance?`/`roundingReference?` as inert
  metadata only — never applied.
- risk: same as PD-04.
- system default: no rounding.
- required approver/source: QC-approved rounding rule per method, if any.
- implementation impact: none.
- tests required: fail-closed suite ✅.
- status: OPEN.

## B. Retest policy

### PD-06 — Retest acceptance policy (count, authorizer, effect on final result)

- domain: laboratory
- decision: how many retests are allowed, who authorizes, how the final result is affected
  (`BR-LAB-018` UNCONFIRMED).
- why required: uncontrolled retesting can hide an original failure (`BR-LAB-017`).
- current behavior: `CreateRetestUseCase` default `denyPolicy` throws `AUTHZ_DENIED`
  (`create-retest.ts:7-11`); structural guards enforced regardless of policy: reason required,
  original link required, sequence must be a positive integer (`domain/retest.ts:3-12`).
- current source: `BR-LAB-014/015/016/017` (APPROVED structure) + `BR-LAB-018` (UNCONFIRMED policy).
- risk: retest-shopping until PASS.
- system default: DENY (no retest without an explicitly injected policy).
- required approver/source: approved laboratory/QMS retest policy.
- implementation impact: none until approved; an approved policy arrives as a `RetestPolicy` implementation,
  not a code default change.
- tests required: fail-closed suite (deny + allow-path) ✅.
- status: OPEN.

### PD-07 — Manual PASS/FAIL human-judgment policy

- domain: inspection
- decision: when/where human judgment may set PASS/FAIL and how it is documented (`BR-INSP-007` UNCONFIRMED).
- why required: judgment calls without a rule are unauditable.
- current behavior: client-submitted results are never accepted as official; approval requires server-side
  deterministic gate (`review.astro` copy + `approve-inspection.ts` businessCondition on recorded result).
- current source: `BR-INSP-007`.
- risk: ad-hoc judgments recorded as controlled results.
- system default: block (no manual-override path exists).
- required approver/source: QC-approved manual-judgment procedure.
- implementation impact: none until approved.
- tests required: fail-closed suite ✅ (approval denies without policy).
- status: OPEN.

## C. Release, approval, SoD authority

### PD-08 — Release authority (who may release quarantined product)

- domain: quarantine/receiving
- decision: which role/permission may execute RELEASE (`BR-QUAR-008` POLICY-DEPENDENT; `PERMISSION-MATRIX.md`).
- why required: PASS ≠ released; release is a separate controlled fact.
- current behavior: `ReleaseReceivingUseCase` default `denyByDefault` (`canRelease: () => false`,
  `release-receiving.ts:10`); release additionally requires state `RELEASE_PENDING` + `PASS` + unreleased
  + explicit `PERM-QUAR-RELEASE` (`release-receiving.ts:40-44`).
- current source: `BR-QUAR-006/007` (APPROVED separation) + `BR-QUAR-008` (POLICY-DEPENDENT owner).
- risk: unauthorized product release to stock/customers.
- system default: DENY.
- required approver/source: QMS-approved release-authority matrix (permission/scope/role binding).
- implementation impact: none until approved; authority arrives as a `ReleasePolicy` implementation.
- tests required: fail-closed suite ✅ + `release-state.test.ts` ✅.
- status: OPEN.

### PD-09 — Laboratory approval authority

- domain: laboratory
- decision: who may approve a lab test (beyond holding the permission codes).
- why required: approval certifies a scientific record.
- current behavior: default `denyPolicy` throws (`approve-lab-test.ts:7-11`); dual permission check
  (`PERM-LAB-APPROVE` + `PERM-APR-APPROVE`), SoD (approver ≠ author), version check, source-drift check.
- current source: `BR-APR-003/004/005/006` (APPROVED mechanics) + exact matrix `BR-APR-007` (POLICY-DEPENDENT).
- risk: self-approval or rubber-stamping.
- system default: DENY.
- required approver/source: QMS-approved lab approval matrix.
- implementation impact: none until approved.
- tests required: fail-closed suite (deny + allow-path) ✅.
- status: OPEN.

### PD-10 — Inspection approval authority

- domain: inspection
- decision: who may approve an inspection report.
- why required: approval publishes the official inspection outcome.
- current behavior: default `denyByDefault` (`approve-inspection.ts:10`); dual permission + SoD + version +
  recorded-result conditions (`approve-inspection.ts:25-54`).
- current source: same approval mechanics as PD-09.
- risk: same as PD-09.
- system default: DENY.
- required approver/source: QMS-approved inspection approval matrix.
- implementation impact: none until approved.
- tests required: fail-closed suite ✅.
- status: OPEN.

### PD-11 — Exact separation-of-duties matrix

- domain: approvals (cross-domain)
- decision: exact author/reviewer/approver/executor incompatibilities (`BR-APR-007` POLICY-DEPENDENT).
- why required: a generic self-approval ban is not a complete SoD matrix.
- current behavior: foundation default enforced — self review/approve/reject/release/sign denied
  (`src/shared/authorization/sod.ts:8-11`); `authorize()` fails closed on any SoD denial.
- current source: `BR-APR-006` (APPROVED default) + `BR-APR-007` (POLICY-DEPENDENT exact matrix).
- risk: incompatible duties combined by one person (e.g. execute + approve).
- system default: DENY self-approval; anything beyond the foundation default needs the matrix.
- required approver/source: QMS-approved SoD matrix referencing `PERMISSION-MATRIX.md §83-85`.
- implementation impact: matrix arrives as policy data; `sod.test.ts` extended per matrix.
- tests required: `tests/unit/shared/sod.test.ts` ✅ (foundation); matrix tests pending approval.
- status: OPEN.

### PD-12 — Exact role→permission grants

- domain: identity/authorization
- decision: precise permissions per Employee/Supervisor/Manager/Admin (`BR-AUTH-005` POLICY-DEPENDENT).
- why required: code enforces whatever grants exist; wrong grants = wrong access.
- current behavior: deny-by-default authorization (`authorize.ts`); Admin is not unlimited historical authority
  (`BR-AUTH-004`); current grants are foundation set only.
- current source: `ROLE-MATRIX.md`, `PERMISSION-MATRIX.md` (exact grants POLICY-DEPENDENT).
- risk: over-permissioned roles.
- system default: DENY anything not explicitly granted.
- required approver/source: business-approved role/permission matrix.
- implementation impact: seed/policy data change only; negative tests per grant.
- tests required: authorization-matrix suites ✅ (foundation); per-grant tests pending approval.
- status: OPEN.

## D. Document control decisions

### PD-13 — Document effective-date rules

- domain: controlled documents
- decision: approval = effective immediately, or a separate effective date (`BR-DOC-009` UNCONFIRMED).
- why required: using a version before/after its effective window breaks traceability.
- current behavior: `SupersedeVersionUseCase` default policy `isApproved: () => false` denies
  (`supersede-version.ts:10-13`); even with an approved policy, `effectiveAt` is mandatory
  (`supersede-version.ts:14`).
- current source: `BR-DOC-009`.
- risk: premature or backdated effectiveness.
- system default: DENY supersede; mandatory effective date.
- required approver/source: document-control/QMS effective-date rule.
- implementation impact: none until approved.
- tests required: fail-closed suite (deny + missing-date) ✅; `review.test.ts` ✅ (approved-policy path).
- status: OPEN.

### PD-14 — Revision numbering rules

- domain: controlled documents
- decision: numeric/alphanumeric/major-minor scheme, who assigns, auto vs manual (`BR-DOC-008` UNCONFIRMED).
- why required: ambiguous revisions break version identity.
- current behavior: revision is a required free-text reference on draft creation; no scheme enforced, none
  invented as canonical.
- current source: `BR-DOC-008`.
- risk: duplicate/confusing revisions.
- system default: PROCESS (no auto-assignment; operator supplies the reference).
- required approver/source: document-control numbering procedure.
- implementation impact: validation rule per approved scheme (future, TDD).
- tests required: pending approval.
- status: OPEN.

## E. Quality-workflow decisions

### PD-15 — Finding→NCR threshold

- domain: quality
- decision: whether every finding needs an NCR or a defined threshold applies (`BR-QUAL-010` UNCONFIRMED).
- why required: auto-creating NCRs for everything floods the system; creating none hides nonconformance.
- current behavior: no automatic NCR creation exists in code (finding and NCR are separate records).
- current source: `BR-QUAL-010`.
- risk: unrecorded nonconformance or noise.
- system default: PROCESS (operator decides per case; no automation to abuse).
- required approver/source: QC-approved NCR initiation criteria.
- implementation impact: none until approved (any future automation needs explicit tests).
- tests required: pending approval.
- status: OPEN.

### PD-16 — Inspection FAIL → NCR automation

- domain: inspection/quality
- decision: FAIL auto-creates NCR vs offers the user an action (`BR-INSP-016` UNCONFIRMED).
- why required: same as PD-15, scoped to inspection outcomes.
- current behavior: approval is atomic with business consequences but creates no NCR automatically.
- current source: `BR-INSP-015` (APPROVED link) + `BR-INSP-016` (UNCONFIRMED automation).
- risk: lost nonconformance on FAIL.
- system default: PROCESS (manual quality-workflow initiation).
- required approver/source: QC-approved FAIL-handling procedure.
- implementation impact: none until approved.
- tests required: pending approval.
- status: OPEN.

### PD-17 — NCR closure authority

- domain: quality
- decision: authorized closure workflow for NCR (`BR-QUAL-012` POLICY-DEPENDENT on state machine + matrix).
- why required: closing on RCA/CAPA text alone hides unresolved nonconformance.
- current behavior: closure requires the authorized state-machine action (`domain/ncr.ts`); no silent close path.
- current source: `BR-QUAL-012`, `STATE-MACHINES.md`, `PERMISSION-MATRIX.md`.
- risk: premature NCR closure.
- system default: DENY invalid transitions.
- required approver/source: QMS-approved NCR closure workflow + permission binding.
- implementation impact: none (mechanics exist); matrix binding pending PD-11/PD-12.
- tests required: existing NCR suites ✅; closure-authority negatives pending matrix approval.
- status: OPEN.

### PD-18 — CAPA effectiveness verification

- domain: quality
- decision: whether every CAPA needs a separate effectiveness check (`BR-QUAL-033` UNCONFIRMED).
- why required: completed actions ≠ effective CAPA (`BR-QUAL-031` APPROVED).
- current behavior: action completion and CAPA closure are distinct; no effectiveness verdict invented.
- current source: `BR-QUAL-031/032` (APPROVED) + `BR-QUAL-033` (UNCONFIRMED).
- risk: ineffective CAPAs closed as successful.
- system default: PROCESS (no automatic effectiveness claim).
- required approver/source: quality-policy effectiveness-check requirement.
- implementation impact: none until approved.
- tests required: pending approval.
- status: OPEN.

### PD-19 — Duplicate receiving detection

- domain: quarantine/receiving
- decision: exact duplicate key (doc/item/lot/date candidates in `BR-QUAR-011` UNCONFIRMED).
- why required: duplicate receipts corrupt inventory and inspection linkage.
- current behavior: no duplicate auto-detection; no false duplicate invented.
- current source: `BR-QUAR-011`.
- risk: double stock or wrong-lot inspection.
- system default: PROCESS (operator vigilance; no blocking rule assumed).
- required approver/source: QC-approved duplicate definition.
- implementation impact: future detection rule (TDD) once approved.
- tests required: pending approval.
- status: OPEN.

## F. Equipment and calibration

### PD-20 — Calibration intervals / due-date derivation

- domain: assets/calibration
- decision: interval source per equipment type (`BR-CAL-002` SOURCE-DEPENDENT; never developer-invented).
- why required: wrong intervals invalidate test contexts.
- current behavior: due dates stored per record; no interval invented in code.
- current source: `BR-CAL-002`, `BR-CAL-003` (APPROVED deterministic overdue state).
- risk: tests executed on silently overdue equipment.
- system default: no invented interval.
- required approver/source: approved calibration policy/data per equipment type.
- implementation impact: none until approved.
- tests required: pending approval.
- status: OPEN.

### PD-21 — Equipment use while overdue

- domain: assets/laboratory
- decision: block vs warn vs exception-approval for overdue equipment (`BR-CAL-004` UNCONFIRMED).
- why required: blocking everything may halt operations; warning-only may certify bad data.
- current behavior: overdue state is deterministic (`BR-CAL-003`); calibration context is snapshotted into lab
  tests (`BR-LAB-012/013`); no use-blocking rule invented.
- current source: `BR-CAL-004`.
- risk: official results from uncalibrated equipment.
- system default: PROCESS (context preserved for reviewer judgment; no silent permission).
- required approver/source: approved equipment-use policy.
- implementation impact: none until approved.
- tests required: pending approval.
- status: OPEN.

### PD-22 — Required environmental conditions

- domain: laboratory
- decision: temperature/humidity/etc. per method (`BR-LAB-008` SOURCE-DEPENDENT).
- why required: conditions affect validity; developers must not set them.
- current behavior: none required or invented by code.
- current source: `BR-LAB-008`.
- risk: invalid tests accepted.
- system default: none enforced.
- required approver/source: approved method environmental requirements.
- implementation impact: future required-field validation (TDD) once approved.
- tests required: pending approval.
- status: OPEN.

### PD-23 — Mandatory equipment identification per test

- domain: laboratory
- decision: when a test must record the equipment used (`BR-LAB-011` SOURCE-DEPENDENT).
- why required: traceability of measurement to calibrated instrument.
- current behavior: context supports equipment entries; requirement flag comes from the approved source.
- current source: `BR-LAB-011`.
- risk: untraceable measurements.
- system default: source-driven (no blanket mandate invented).
- required approver/source: approved method equipment requirements.
- implementation impact: none until approved.
- tests required: pending approval.
- status: OPEN.

## G. Retention, archival, RPO, RTO, recovery authority

### PD-24 — Retention periods (records, files, telemetry, audit)

- domain: cross-domain (records/files/observability)
- decision: how long each record class is kept (`DD-DB-009`, `DO-OBS-009/013`, `PRD-DD-007`).
- why required: premature deletion destroys controlled history; indefinite retention may breach policy.
- current behavior: **no automatic deletion job exists in `src/`** (verified: no cron/schedule/purge/retention
  automation; `deleteFrom` calls are draft-scoped inside their own transactions only —
  `inspection/postgres-repository.ts:189`, `laboratory/postgres-repository.ts:172-175`,
  `administration/postgres-authorization-repository.ts:103` role-permission reassignment).
- current source: deferred in `DATABASE-ARCHITECTURE.md:1528`, `OBSERVABILITY-ARCHITECTURE.md:1328,2005`.
- risk: an invented auto-delete would destroy evidence.
- system default: NEVER auto-delete (fail-closed by absence).
- required approver/source: QMS-approved retention schedule per record class.
- implementation impact: none — any future retention job needs approval + tests + audit proof first.
- tests required: absence verified by scan (this register); job tests only after approval.
- status: OPEN.

### PD-25 — Archival policy

- domain: controlled documents (and future record classes)
- decision: when superseded versions move to archived, how archives stay retrievable.
- why required: archives must remain available for historical traceability (`BR-DOC-004`).
- current behavior: `ARCHIVE` is a state transition (`SUPERSEDED → ARCHIVED`, `document-state.ts:13`) that
  stamps `archivedAt` without deleting anything (`postgres-repository.ts:159`); no retention clock attached.
- current source: `BR-DOC-004/005` (APPROVED traceability) + unresolved retention clock (PD-24).
- risk: archived = forgotten or deleted.
- system default: preserve everything.
- required approver/source: QMS-approved archival/retention schedule.
- implementation impact: none until approved.
- tests required: existing document suites ✅; clock tests pending approval.
- status: OPEN.

### PD-26 — Recovery point objective (RPO)

- domain: backup/recovery
- decision: maximum acceptable data loss (`BR-BKP-006` UNCONFIRMED; `BACKUP-RECOVERY-PLAN.md:17` POLICY-DEPENDENT).
- why required: RPO drives backup frequency and WAL/PITR architecture.
- current behavior: no RPO invented; recovery tooling measures only (`RESTORE-DRILL-RESULT.md`: RPO/RTO
  POLICY-DEPENDENT, measured-not-compared).
- current source: `BR-BKP-006`, `BKP-010`.
- risk: backup cadence that silently misses the business need.
- system default: no claim.
- required approver/source: business-approved RPO target.
- implementation impact: backup schedule + WAL/PITR design follow approval (provider work).
- tests required: drill asserts no RPO comparison without approval (process).
- status: OPEN.

### PD-27 — Recovery time objective (RTO)

- domain: backup/recovery
- decision: maximum acceptable downtime (`BR-BKP-007` UNCONFIRMED; `BACKUP-RECOVERY-PLAN.md:18`).
- why required: RTO drives restore runbooks and standby architecture.
- current behavior: same as PD-26; logical restore drill measured `pg_restore 2s` on a disposable target as
  raw timing only, never compared to a target.
- current source: `BR-BKP-007`.
- risk: restore slower than operations can tolerate.
- system default: no claim.
- required approver/source: business-approved RTO target.
- implementation impact: runbook/SLO design follows approval.
- tests required: same as PD-26.
- status: OPEN.

### PD-28 — Restore / risk-acceptance authority

- domain: backup/recovery
- decision: who may order or accept a production restore (`BACKUP-RECOVERY-PLAN.md:1843` POLICY-DEPENDENT).
- why required: restores rewrite live state.
- current behavior: restore tooling is read/isolated only; `request-restore.ts` authorizes and no production
  restore path is wired to run here.
- current source: `BACKUP-RECOVERY-PLAN.md` authority clauses.
- risk: unauthorized production restore.
- system default: DENY / operator-executed only.
- required approver/source: business-approved restore authority + isolated drill record per restore.
- implementation impact: none in this task.
- tests required: recovery-tooling suite ✅.
- status: OPEN.

## H. Escalation, master data, AI authority, and governance

### PD-29 — Operational escalation policy

- domain: tasks/quality/operations
- decision: escalation paths, timelines, and owners (on-call workflow deferred,
  `OBSERVABILITY-ARCHITECTURE.md:1187`; `DO-OBS-010`).
- why required: stuck/failed controlled work needs a defined escalation, not ad-hoc pressure.
- current behavior: no automatic escalation exists in code (verified: zero `escalat` hits in `src/`);
  Manager owns oversight within scope (`ROLE-MATRIX.md:635`) as principle, not a timed workflow.
- current source: deferred escalation clauses.
- risk: critical findings aging without action, or escalation spam.
- system default: PROCESS (manual management oversight; nothing automatic invented).
- required approver/source: business-approved escalation matrix + on-call policy.
- implementation impact: none until approved.
- tests required: pending approval.
- status: OPEN.

### PD-30 — Master / reference data ownership and change control

- domain: administration
- decision: which reference data is controlled and whether changes need approval/change-request/versioning
  (`BR-ADM-004` POLICY-DEPENDENT; `BR-EQP-005` for equipment fields).
- why required: silent master-data edits corrupt every dependent record.
- current behavior: admin surfaces privileged + audited (`BR-ADM-001/002`); no uncontrolled master-data
  rewrite path; controlled-field list itself is the pending decision.
- current source: `BR-ADM-004`, `BR-EQP-005`.
- risk: ungoverned reference changes.
- system default: privileged + audited; controlled-field designation pending.
- required approver/source: business-approved reference-data catalog + change-control level per item.
- implementation impact: none until approved.
- tests required: existing admin suites ✅; per-item governance tests pending approval.
- status: OPEN.

### PD-31 — AI usage authority and provider contract

- domain: ai-advisory
- decision: approved provider, allowed use cases, outage/timeout handling, reviewer UAT (R-008 context).
- why required: AI must stay advisory-only; provider handling touches secrets and controlled content.
- current behavior: advisory boundary enforced in code (`advisory-response.ts` rejects authority vocabulary);
  provider is `DisabledAiProvider` by default (no live model calls); deterministic eval suite `38/38`
  (`tests/integration/ai-advisory/evals.test.ts`); authorization-before-provider, minimized context,
  secret-like input rejection verified.
- current source: `BR-AI-001..012` (all APPROVED) + pending provider contract (R-008).
- risk: AI presented as official authority; secret leakage to provider.
- system default: DENY provider calls (disabled); advisory text only, never PASS/FAIL/approve/release/sign.
- required approver/source: business-approved AI provider contract + reviewer UAT.
- implementation impact: none until approved.
- tests required: AI eval/security suites ✅; provider-contract tests pending approval.
- status: OPEN (provider half; advisory boundary itself is implemented and tested).

### PD-32 — E-signature scope (which actions require signing)

- domain: e-signatures
- decision: exact action list requiring e-signature (`BR-ESIG-008` UNCONFIRMED).
- why required: under-scoping weakens non-repudiation; over-scoping blocks work.
- current behavior: signature mechanics approved and implemented (reauth, reauthz, meaning, version binding,
  no password storage — `BR-ESIG-001..007`); scope list itself comes from the pending policy.
- current source: `BR-ESIG-008`.
- risk: critical approvals without signatures.
- system default: mechanics enforced wherever signatures are configured; no scope invented.
- required approver/source: QMS-approved e-signature scope list.
- implementation impact: scope configuration only, once approved (TDD).
- tests required: existing e-signature suites ✅; scope tests pending approval.
- status: OPEN.

### PD-33 — Audit integrity mechanism

- domain: audit
- decision: append-only protections vs hash chain vs signed digests vs restricted role (`BR-AUD-007`
  UNCONFIRMED).
- why required: audit must survive record state changes and admin power.
- current behavior: audit is separate from app logs, survives void/supersede (`BR-AUD-001/006`); mechanism
  choice itself is the pending decision — none falsely claimed.
- current source: `BR-AUD-007`.
- risk: tamperable audit trail.
- system default: no mechanism claimed; application-level separation only.
- required approver/source: security/QMS-approved audit-integrity design.
- implementation impact: future (migration + tests) once approved.
- tests required: pending approval.
- status: OPEN.

### PD-34 — Draft deletion policy

- domain: cross-domain
- decision: which draft records may ever be hard-deleted and when (`BR-GEN-053` UNCONFIRMED; per-domain approval).
- why required: deleting the wrong draft destroys work or hides intent.
- current behavior: no hard-delete path for controlled records (`BR-GEN-050/051/052` APPROVED); draft
  deletion eligibility itself is the pending per-domain decision.
- current source: `BR-GEN-053`.
- risk: data loss or cover-up.
- system default: DENY deletion of controlled records.
- required approver/source: per-domain draft-deletion approval.
- implementation impact: none until approved.
- tests required: pending approval.
- status: OPEN.

### PD-35 — Bulk import failure strategy

- domain: laboratory (and future use cases)
- decision: all-or-nothing vs partial vs staged rows per use case (`BR-GEN-064` UNCONFIRMED).
- why required: partial imports silently certify incomplete data.
- current behavior: pasted/bulk entries pass the same full validation as manual input (`BR-LAB-023/024`
  APPROVED); failure strategy per use case is the pending decision.
- current source: `BR-GEN-064`.
- risk: half-imported datasets treated as complete.
- system default: full validation, no silent partial success claimed.
- required approver/source: per-use-case import strategy approval.
- implementation impact: none until approved.
- tests required: existing validation suites ✅; strategy tests pending approval.
- status: OPEN.

### PD-36 — Rejection/return reason mandate per workflow

- domain: approvals
- decision: which workflows mandate a reason on reject/return (`BR-APR-011` POLICY-DEPENDENT; recommended
  default reject/return → reason required).
- why required: reason-less rejections are unauditable.
- current behavior: domain guards require reasons on return/reject/void paths (`requireReason` in
  inspection-state; change-request and finding equivalents); workflow-to-mandate mapping is the pending part.
- current source: `BR-APR-011`.
- risk: silent rejections.
- system default: reason required on the paths that enforce it; no workflow exempted by assumption.
- required approver/source: QMS-approved reason-mandate mapping.
- implementation impact: none until approved.
- tests required: existing state-machine suites ✅.
- status: OPEN.

### PD-37 — Audit-report export authorization

- domain: reporting/audit
- decision: who may export audit data (`BR-RPT-008` POLICY-DEPENDENT).
- why required: audit data in the wrong hands leaks sensitive history.
- current behavior: report/export paths re-authorize against application authorization (`run-report.ts:37`,
  `export-report.ts:49`, `audit-query.ts:50`); audit-specific grant list is the pending decision.
- current source: `BR-RPT-008`.
- risk: unauthorized audit disclosure.
- system default: DENY without the specific grant.
- required approver/source: business-approved audit-export grant list.
- implementation impact: permission binding only, once approved.
- tests required: existing export-safety suite ✅.
- status: OPEN.

## Operator checklist — decisions that require actual QC/QMS/business approval

No code, test, or register entry below substitutes for these approvals. Supply each as a controlled,
signed source; implementation and tests follow per item.

1. [ ] Per-method scientific limits + acceptance criteria + method references (PD-01–PD-03) — QC.
2. [ ] Per-parameter precision and rounding rules, if any (PD-04, PD-05) — QC.
3. [ ] Laboratory retest policy: count, authorizer, final-result effect (PD-06) — lab/QMS.
4. [ ] Manual PASS/FAIL judgment procedure (PD-07) — QC.
5. [ ] Release authority matrix (PD-08) — QMS.
6. [ ] Lab + inspection approval matrices (PD-09, PD-10) — QMS.
7. [ ] Exact SoD matrix beyond the self-approval default (PD-11) — QMS.
8. [ ] Exact role→permission grants (PD-12) — business owner.
9. [ ] Effective-date rule (PD-13) and revision-numbering scheme (PD-14) — document control.
10. [ ] Finding→NCR threshold (PD-15) and FAIL→NCR handling (PD-16) — QC.
11. [ ] NCR closure workflow binding (PD-17) — QMS.
12. [ ] CAPA effectiveness-check requirement (PD-18) — quality policy owner.
13. [ ] Duplicate-receiving definition (PD-19) — QC.
14. [ ] Calibration intervals per equipment type (PD-20) and overdue-use rule (PD-21) — QC/assets.
15. [ ] Environmental-condition and equipment-identification requirements per method (PD-22, PD-23) — QC.
16. [ ] Retention schedule per record class (PD-24) and archival schedule (PD-25) — QMS.
17. [ ] RPO target (PD-26) and RTO target (PD-27) — business owner.
18. [ ] Production restore / risk-acceptance authority (PD-28) — business owner.
19. [ ] Escalation matrix + on-call policy (PD-29) — business owner.
20. [ ] Reference-data catalog + change-control levels (PD-30) — business owner.
21. [ ] AI provider contract + reviewer UAT (PD-31) — business owner.
22. [ ] E-signature scope list (PD-32) — QMS.
23. [ ] Audit-integrity mechanism choice (PD-33) — security/QMS.
24. [ ] Per-domain draft-deletion approvals (PD-34) — domain owners.
25. [ ] Per-use-case import failure strategy (PD-35) — domain owners.
26. [ ] Reject/return reason-mandate mapping (PD-36) — QMS.
27. [ ] Audit-export grant list (PD-37) — business owner.

## R-007 disposition for this task

R-007 stays **OPEN**. This register traces every unresolved policy-dependent decision to its rule, current
fail-closed behavior, and required approver — and adds executable negative-proof cover
(`tests/unit/policy/controlled-policy-fail-closed.test.ts`, 10/10) for the six critical gates
(scientific evaluation, lab approval, retest, release, inspection approval, document effective-date).
No item is closed because no approved controlled source was supplied in this task, and none was invented.
Closing any PD item requires: (1) the approved source, (2) implementation bound to it, (3) green
positive + negative tests on the exact HEAD.
