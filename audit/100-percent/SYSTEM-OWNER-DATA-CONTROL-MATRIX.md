# SYSTEM_OWNER data-control matrix

This is an implementation inventory. `SUPPORTED` means an existing server-side
use case was located; `GAP` means a domain-safe owner operation still needs to
be implemented and verified. No row grants arbitrary SQL or bypasses state,
scope, concurrency, signature, or audit rules.

| Domain / persisted record | View | Create/edit | Controlled removal | Hard delete | Status | Test / DB evidence |
|---|---|---|---|---|---|
| Tasks | Supported | Existing task use cases | Domain policy | Draft only where implemented | IMPLEMENTED | Delete-draft path static-verified; PostgreSQL BLOCKED |
| Findings / NCR / RCA / CAPA | Supported | Existing quality use cases | VOID/state workflows | Not for controlled history | IMPLEMENTED | NOT VERIFIED / BLOCKED |
| Receiving / Quarantine / Inspection | Supported | Existing workflows | Archive/void/correction | Draft-only where allowed | IMPLEMENTED | NOT VERIFIED / BLOCKED |
| Laboratory tests, samples, measurements, results | Supported | Existing laboratory use cases | Void/correction per state | Not for controlled history | IMPLEMENTED | NOT VERIFIED / BLOCKED |
| Equipment / Calibration / Maintenance | Supported | Existing asset use cases | Decommission/void/correction | Draft-only where allowed | IMPLEMENTED | NOT VERIFIED / BLOCKED |
| Documents / Templates / versions | Supported | Existing document/template use cases | Supersede/archive/void | Not for approved history | IMPLEMENTED | NOT VERIFIED / BLOCKED |
| Approvals / electronic signatures | Read/history | Existing approval/signature paths | Controlled correction only | Never | IMMUTABLE_EVIDENCE | BLOCKED |
| Change Requests | Supported | Existing contextual use case | Cancel/supersede per state | Draft-only where allowed | IMPLEMENTED | NOT VERIFIED / BLOCKED |
| Files / Evidence | Supported | Existing file use cases | Controlled/draft removal paths | Draft only | IMPLEMENTED | NOT VERIFIED / BLOCKED |
| Reports / Search / Notifications | Supported | Read models / existing actions | Domain-specific | Not assumed | NOT_APPLICABLE | NOT VERIFIED |
| Release candidates / approvals / UAT evidence | Read/history | Existing governance paths | Withdraw/void per policy | Never for evidence history | IMMUTABLE_EVIDENCE | BLOCKED |
| Risk records / audit events | Read/history | Existing governed paths | Controlled correction only | Never | IMMUTABLE_EVIDENCE | BLOCKED |

Remaining gaps are tracked as implementation work, not inferred permission
grants. Representative PostgreSQL persistence and cross-domain owner actions
remain blocked until a disposable PostgreSQL 18 runtime is available.

## Task 005 executable control path

- **Use case / action:** `DeleteDraftTaskUseCase` via `tasks.deleteDraft`.
- **Permission:** `PERM-TASK-DELETE-DRAFT`.
- **Invariants:** server-side actor, `DRAFT` state, non-empty reason, `expectedVersion`, and dependency guard for checklist items or active evidence links.
- **Persistence:** transactional delete with `SYSTEM_OWNER_DELETE_DRAFT_TASK` audit event; stale versions map to conflict.
- **Evidence:** focused administration suite `18/18 PASS`; PostgreSQL 18 integration remains `BLOCKED` because Docker is unavailable.
