# Data Governance and Lineage Register — QC-100-FINAL-032-A

**Status:** Source-derived governance map for candidate `a0d0661294cb7cba17d8a9a9068a9f696ec197cf`  
**Schema source:** PostgreSQL schema `qc`; migration head `0033_controlled_document_execution_context`  
**Applied provider schema:** NOT VERIFIED  
**Purpose:** Route each persisted entity family to its owner, authoritative source, lineage, classification rule, steward, and safe correction path. This register does not create permissions, data retention periods, scientific rules, or approval authority.

## Authority and key contract

Resolve conflicts using `SYSTEM-INVARIANTS.md` → `DOMAIN-MAP.md` → approved
business/permission/state rules → `DATA-MODEL.md` → `DATA-DICTIONARY.md` →
forward-only migrations. Runtime behavior must not promote `POLICY-DEPENDENT`,
`SOURCE-DEPENDENT`, or `UNCONFIRMED` data rules into approved truth.

Every business table's technical key is its migration-defined UUID primary key,
unless called out below. Human business numbers are separate unique keys.
Foreign keys, `NOT NULL`, `CHECK`, and unique/partial indexes in the migration
set are the structural authority; this summary names the principal constraint
families and is not a replacement for the DDL. Most mutable aggregates use a
positive `version` column and must be changed with an expected-version
compare-and-set. Generic subject references without a declared FK are validated
and authorized by the owning module; their presence does not transfer write
ownership.

## Entity ownership, lineage, classification, and stewardship

| Owner / module | Migration-backed entities | Keys and principal constraints | Authoritative source and lineage | Classification and steward |
|---|---|---|---|---|
| Identity (`identity`) | `users`, `sessions`, `password_reset_requests`, `rate_limit_windows` | UUID PKs; unique login identity; user/session/token FKs; expiry/state checks where defined | Personal account lifecycle and session service; actor identity is referenced by `created_by`/`updated_by`, audit, and signatures | Field-level `DATA-DICTIONARY` classification; credentials/tokens are SECRET. Functional steward: Identity/Admin; named service owner UNRESOLVED (013/026). |
| Authorization / Administration (`administration`) | `roles`, `permissions`, `role_permissions`, `user_roles`, `user_scopes` | UUID PKs; unique role/permission codes and active membership/scope uniqueness; FKs to users/roles/permissions | Approved role/permission/scope matrices; server authorization is authoritative, not role labels or client input | Field-level dictionary classification; identity and access-control data may be SENSITIVE. Steward: Admin function under `PERMISSION-MATRIX`; named operator UNRESOLVED. |
| Tasks (`tasks`) | `tasks`, `task_assignments`, `task_checklist_items`, `task_comments`, `task_dependencies` | UUID PKs; FK relationships; unique assignment/checklist/dependency constraints; positive versions on aggregate | Task use cases and state machine; assignments, comments, and checklist rows derive from the owning task and actor | Field-level dictionary classification; task text may contain SENSITIVE QC content. Steward: Tasks/Supervisor function; named support owner UNRESOLVED. |
| Quality (`quality`) | `findings`, `ncrs`, `rcas`, `capas`, `capa_actions`, `capa_close_snapshots` | UUID PKs; unique human numbers; FK chain Finding→NCR→RCA/CAPA and CAPA actions; state/positive-version constraints | Quality domain state machines and linked source record; closure snapshot preserves reviewed state | Field-level dictionary classification; controlled findings/CAPA evidence may be SENSITIVE. Steward: Quality/QCM under approved permissions; named QCM UNRESOLVED. |
| Receiving and inspection (`quarantine`) | `receiving_items`, `inspection_templates`, `inspection_template_versions`, `inspection_template_sections`, `inspection_template_points`, `inspection_reports`, `inspection_report_results`, `inspection_report_snapshots`, `inspection_template_document_sources` | UUID PKs; unique receiving/inspection/template revision numbers; FKs across receiving→inspection→versioned template/source; enum-like `CHECK` values, positive versions | Approved WI/SOP/specification and template version; report snapshot captures source/result context at submission/approval | Field-level dictionary classification; controlled QC evidence may be SENSITIVE. Steward: Quarantine/Inspection + QCM per permission matrix. Scientific acceptance source remains 013/026-dependent where marked. |
| Laboratory (`laboratory`) | `lab_test_templates`, `lab_test_template_versions`, `lab_test_template_sections`, `lab_test_template_parameters`, `lab_tests`, `lab_samples`, `lab_measurements`, `lab_equipment_usage`, `lab_document_usage`, `lab_test_snapshots`, `lab_test_template_document_sources` | UUID PKs; unique test/revision numbers; FK lineage to template, receiving, sample, equipment/calibration, document version; retest and positive-version checks | Approved test method/WI/SOP, effective template/document version, source receiving item, equipment/calibration snapshot; execution snapshots remain immutable | Field-level dictionary classification; measurement/evidence content may be SENSITIVE. Steward: Laboratory/QCM. Scientific method and acceptance rules stay SOURCE-DEPENDENT until approved. |
| Equipment (`assets`) | `equipment`, `calibration_records`, `maintenance_records`, `equipment_status_history`, `calibration_history`, `maintenance_history` | UUID PKs; unique equipment/calibration/maintenance numbers; equipment/calibration FKs; current calibration pointer; positive versions and state constraints | Equipment master and approved calibration certificate/maintenance evidence; append-only histories preserve prior states | Field-level dictionary classification; certificate/equipment operational data per dictionary. Steward: Equipment/Calibration; approved correction is a new controlled record/transition, not rewriting history. |
| Controlled documents (`documents`) | `document_identities`, `document_versions`, `document_version_files` | UUID PKs; unique document number and revision; effective-version partial unique index; immutable file links after draft | Document identity → immutable revision/content hash/file evidence; approved revision changes create a new version | Field-level dictionary classification; controlled document content may be SENSITIVE. Steward: Controlled Documents + authorized reviewers; unresolved approval scope remains 013/026-owned. |
| Review and approval (`approvals`) | `approval_cases`, `approval_work_items`, `approval_decisions` | UUID PKs; FKs among case/work-item/decision, subjects use explicitly typed references; version/state constraints | Approval workflow, linked subject version, decision evidence and audit event | Field-level dictionary classification; approval evidence may be SENSITIVE. Steward: owning business domain for decision truth; approvals module owns orchestration only. |
| E-signature (`e-signatures`) | `electronic_signatures` | UUID PK; subject type/id/version and request identity; append-only DB guards | Server-side reauthentication and authorized action bind the signature to exact version/hash; signature is immutable evidence | Signature/reauth metadata SENSITIVE; signing secrets SECRET and never persisted. Steward: E-signature infrastructure; action scope only from approved policy. |
| Change Requests (`change-requests`) | `change_requests`, `change_request_changes`, `change_application_attempts` | UUID PKs; typed target/source references and FK relationships; expected target/request versions | Approved change request snapshot → owning-domain apply attempt; successful apply is atomic with target and audit | Field-level dictionary classification; change evidence may be SENSITIVE. Steward: Change Requests orchestrates; target domain owns target truth/correction. |
| Audit (`shared/audit`) | `audit_events` | UUID PK; actor/subject typed references and indexes; append-only protection; deliberately no cascade to erase history | Server-side event emitted by owning transaction; approved audit query contract is the only projection | Payload minimized and field-classified; security data SENSITIVE/SECRET excluded or redacted. Steward: Audit capability; business owner remains source domain. |
| Files and evidence (`shared/files`) | `files`, `evidence_links` | UUID PKs; storage-key uniqueness and ownership/link constraints; typed subject links may require owner validation | File hash/storage metadata plus owning record evidence link; file bytes are not business approval by themselves | Per-field dictionary classification; file contents inherit linked record classification; storage credentials SECRET. Steward: Files/Evidence; scan/MIME and retention policies remain 013/026-dependent. |
| Notifications / outbox (`shared/notifications`, `shared/outbox`) | `notifications`, `notification_deliveries`, `outbox_events` | UUID PKs; unique dedupe keys; FK to notification where declared; claim/lease state checks | Outbox row is committed with business transaction; delivery is derived side effect and is not business completion | Minimize recipient and payload data per dictionary; notification content may be SENSITIVE. Steward: shared capability; source event owned by originating domain. |
| Reject Reports (`reject-reports`) | `reject_reports`, `reject_issue_slips`, `issue_slip_approval_confirmations`, `daily_reject_entries` | UUID PKs; unique human numbers/period constraints and FK relations; optimistic versions on controlled rows | Reject records derive from authorized source records and approved policy; reports are projections, never source of truth | Field-level dictionary classification; QC report content may be SENSITIVE. Steward: Reject Reports owns its records; cross-domain source authority remains with source owner. |
| Reporting / Dashboard / Search (`reporting`, `dashboard`, shared search) | No dedicated reporting, dashboard, or search tables are created by migrations `0001`–`0033`; these modules query source-owned tables/read models | No persisted entity PK or independent write constraint in the current source schema | Results derive from authorized domain repositories/query services. A projection does not become an authoritative source or gain ownership of source rows | Classification follows the source fields and approved projection. Technical steward: query-owning module; business correction remains with source entity owner. |
| Release Governance (`release-governance`) | `release_candidates`, `release_approvals`, `release_gate_evidence`, `release_risk_evidence` | UUID PKs; unique release/build identity constraints; FKs to candidate/evidence/approval; versioned candidate | Trusted server-derived evidence tied to exact SHA/build/app/schema identity; PASS does not imply RELEASED | Security/release evidence SENSITIVE; secrets excluded. Steward: Release Governance; acceptance authority follows release policy and named authorized owner. |
| Backup and Recovery (`backup-recovery`) | `backup_runs`, `restore_runs`, `recovery_evidence` | UUID PKs; release-artifact uniqueness and run/evidence FK lineage | Provider/artifact identity, backup verification, isolated restore evidence; a backup row alone is not proof of restore | Operational security evidence SENSITIVE; DB credentials SECRET. Steward: Admin for drills, named system owner for production restore authorization. |
| UAT Evidence (`uat-evidence`) | `uat_cycles`, `uat_session_evidence`, `uat_defects`, `uat_acceptances` | UUID PKs; candidate/cycle/session/evidence FKs and status/version checks | Human participant evidence tied to frozen candidate; technical tests cannot synthesize acceptance | Personal and session evidence SENSITIVE; tokens SECRET. Steward: UAT process owner; genuine acceptance remains external and excluded from this task. |
| AI Advisory (`ai-advisory`) | No AI-interaction table is created by migrations `0001`–`0033` | No persisted entity key or database constraint in the current source schema | Advisory data remains in the implemented application/provider boundary; no database persistence is inferred from the logical model heading | Any future field classification and retention must follow the dictionary and approved processing/retention policy. Steward: Admin function for configuration; external-processing approval remains open. |
| System migration ledger (`shared/database`) | `schema_migrations` | Migration identity/name key and SHA-256 checksum ledger (per migration runner); not a business entity | Forward-only SQL migration files are source schema truth; applied ledger is database-specific truth | Operational metadata INTERNAL; connection credentials SECRET. Steward: Database Engineering; production changes require separate authorization. |

## Stewardship and correction rules

1. **Source stewardship:** each module above is the technical steward of its
   entity and sole writer through its use cases/repositories. Cross-domain
   orchestration may coordinate an approved multi-domain transaction; it does
   not transfer ownership of the other domain's business truth.
2. **Classification:** field classification in `DATA-DICTIONARY.md` is
   authoritative. A table can contain fields of different classes. Do not
   assign a blanket lower class; if a field is unclassified or ambiguous, keep
   the gap explicit and resolve it through the approved governance owner.
3. **Mutable draft:** edit only while the owning state machine permits it,
   with server authorization, scope, expected version, and audit where required
   by the approved rule. A stale update returns a conflict.
4. **Submitted/approved/signed/closed/superseded evidence:** do not overwrite
   controlled history. Correct through an approved return/revision/correction
   workflow that appends a new event/version and retains source references and
   hashes. Master-data edits never rewrite historical snapshots.
5. **Policy/source-dependent corrections:** default deny until the named
   decision owner supplies an approved correction, retention, scientific, or
   authority rule. This register does not infer correction rights from a module
   name or database privilege.
6. **Deletion:** FK default is restrictive; no destructive cascade may erase
   controlled history. Draft hard-delete is available only where its specific
   approved state/use-case contract allows it, with audit and expected version.
7. **Lineage:** cross-domain source links and snapshot references retain the
   exact source identity/version/hash where the approved model requires it.
   Polymorphic references are validated by the owning module; a UUID alone is
   not proof of a valid or authorized source.

## Transaction and concurrency review result

The system-level baseline is PostgreSQL `READ COMMITTED`, optimistic
compare-and-set first, and row locks only for a documented invariant. Audit,
signature, required snapshots, idempotency result, and outbox effects join the
owning transaction when they are part of the approved business transition.
Network work remains outside database transactions.

Candidate review found Quality `findings`, `ncrs`, `capas`, and `rcas`
transitions checked the caller's expected version but did not increment the
stored aggregate version; concurrent calls could therefore both match the
same version predicate. RCA draft updates also lacked a version predicate.
QC-100-FINAL-032-A fixes these paths by advancing the version in the same
conditional `UPDATE` statement and returning `CONFLICT_STALE_VERSION` when the
compare-and-set loses. This is row-local and uses the existing `READ COMMITTED`
isolation; it adds no global lock or policy change.

## Known dependencies and boundaries

- 002/027: run the final candidate's migrations and affected concurrency suite
  against disposable PostgreSQL 18; this local host may not provide a container
  runtime. Candidate-specific DB behavior is NOT VERIFIED until that evidence
  exists.
- 013/026: resolve unresolved reference-data stewardship, field classifications,
  retention/correction rules, signature authority, and policy/source-dependent
  edges. Existing runtime deny behavior remains in force.
- 003: authenticated E2E only if the affected Quality mutation surface requires
  browser-level regression; this task changes server-side repository behavior.
- 006/040: no accessibility-specific claim is made for these persistence-only
  changes.
- 012: reconcile technical and external owner evidence. Human acceptance is an
  external dependency and is not executed or inferred here.

No audit domain was added, no scored domain was introduced, and the 80-domain
denominator is unchanged. `PASS ≠ RELEASED`.
