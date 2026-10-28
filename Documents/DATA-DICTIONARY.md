# Data dictionary — NDB-10 source contract

Status: source-code reference only. This file does not approve a master-data value set, scientific method, QC limit, AQL, ownership assignment, or controlled-document effectivity.

## Master-data intake revision

`qc.master_data_import_revisions` stores a staged, untrusted source revision. It is not an operating catalog and does not activate records.

| Field | Meaning |
| --- | --- |
| `dataset_key` | Closed catalog key for the data class under review. |
| `content_sha256` | SHA-256 of the supplied CSV content and reviewed header mapping. |
| `schema_version` | Intake adapter schema identifier; current UI submits `master-data-csv/v1`. |
| `source_file_reference` | Non-secret controlled source identifier limited to letters, numbers, dot, underscore, and hyphen; URLs and free-form paths are rejected. |
| `import_batch_id` | Database-generated UUID identifying this staged revision batch. |
| `source_owner`, `source_reference`, `effective_revision` | Submitted source lineage; effective revision and approval reference are owner-recorded before approval. |
| `submitted_by`, `submitted_at`, `request_id` | Server actor and idempotent submission provenance. |
| `approval_state`, `import_state`, `version` | Separate owner decision and import receipt lifecycle. Approval does not itself import data. |

The staged record and approval-event history remain append-only with guarded state transitions. Only a registered adapter with an exact matching owner-approved content hash can reach its existing import command. The repository currently registers an equipment adapter only; other entity classes remain blocked until governance and source contracts are approved.

## Item-to-inspection-template mapping revision

`qc.inspection_item_templates` retains mapping revisions. `approval_state` is independent from its operational `state`; historical rows are left in place and do not resolve after the approval gate is introduced.

| Field | Meaning |
| --- | --- |
| `item_code` | Exact item identifier carried by receiving records and matched against exactly one row in an owner-approved staged item source. No normalization or alternate code vocabulary is inferred. |
| `template_version_id` | Exact approved/effective template version selected by the authorized submitter. Runtime inspection resolution follows this pinned version. |
| `source_revision_id`, `source_reference`, `effective_revision` | Pinned owner-approved item source revision and its source/effective revision labels. The source hash is resolved from the immutable intake revision and displayed in the review queue. |
| `approval_state` | `PENDING_SOURCE_APPROVAL`, `APPROVED`, `REJECTED`, or `SUPERSEDED`. Only `APPROVED` rows can resolve. |
| `approved_by`, `approved_at` | Named System Owner approval actor and time. |
| `superseded_by` | Replacement mapping revision; prior mappings and decision events are retained. |

`inspection_item_template_mapping_events` records submit, approval, and supersession decisions with source content hash, audit event, actor, and request ID. Inspection creation stores the mapping revision and pinned source/effective revision alongside the exact template version in the immutable creation snapshot.

## Unresolved governance dependencies

- SYS-10 owner approval of the item master source/value set is required before item mapping approval or any item-data promotion.
- Item, supplier, organizational scope, WI/SOP identity, and additional approved-form adapters remain unregistered unless a governed schema, source owner, effective revision, duplicate identity, and validation contract are approved.
- Supplier identifiers, organizational ownership, units beyond existing source constraints, tolerances, AQL values, and scientific approval rules are not defined here.
- Source promotion remains an explicit owner-authorized operation; this source change does not execute an import or alter database records.
