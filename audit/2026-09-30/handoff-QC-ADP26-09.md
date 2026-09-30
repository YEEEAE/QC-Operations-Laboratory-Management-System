# QC-ADP26-09 — template authority and version transport

Date: 2026-10-01 (Asia/Riyadh)  
State: **PARTIAL**  
Candidate HEAD: `9c493ad5763c38c4e290a1e6e232950c24783621`  
Requested audit HEAD: `0b1bb21bb3b4eca77862dbba1da8623044e96355` — mismatch detected; evidence below was rebound to the current checkout.  
Initial worktree: clean on `main`; no pre-existing user changes were present.  
Implementation dirty fingerprint (SHA-256 of `git diff --binary HEAD` for the seven changed source/test paths listed in this handoff): `e4c010b4dfe95db4b7eddcbffc27e08fcc7578cf1caf587e4d457c51fdcefcf6`.
Toolchain: pnpm `11.25.0`; local Node `22.22.3`, bundled Node `24.19.0`. Repository requires Node `>=24.20.0 <25`; runtime parity is **NOT VERIFIED**.

## Changed

- Both template pages now use the P-06 `isTemplateAuthority(actor)` policy helper. The generic `SYSTEM_OWNER` role no longer reveals or enables authority-only controls for noncanonical owners. The middleware continues to use `pageAccessDecision` for route visibility; each mutation remains guarded in its application use case by active account, permission/scope, state, expected version, and required ceremony.
- Detail POST now validates `expectedVersion` inside the guarded failure path as a positive decimal PostgreSQL BIGINT (`1..9223372036854775807`). Alternate syntax, empty/zero/negative input, overflow, and oversized text produce an `expectedVersion` field error instead of throwing before the handler. The Astro Action schema applies the same string/range validation.
- Failed detail actions retain nonsecret context and the revision values, associate errors with labeled fields, preserve reason text, and leave password inputs blank. The create page also keeps reauthentication secrets out of retained form values. Detail form submission prevents a repeated click while a request is in flight.
- No P-06 policy, database schema, or migration changed. P-06 is already owner-approved. Generic document-version approval RD-019 remains separate and is not needed for this finding.

## Data and transaction boundary

- Reads: template list reads `qc.inspection_template_versions` and resolves template headers from `qc.inspection_templates`; detail reads the version and header, gated by active actor and template permission/scope. Route visibility comes from `pageAccessDecision`; read permission does not grant mutation authority.
- Writes: Create inserts a template header when needed and a version row; lifecycle actions update the existing version state and increment `version`; Revise inserts a new DRAFT version. The existing repository transaction writes the matching `qc.audit_events` row and `qc.outbox_events` row atomically with each mutation. Expected-version compare-and-set rejects stale transition writes. No schema write was required for this fix.
- Constraints in source migration `0008_quarantine.sql`: positive BIGINT `version`, unique `(template_id, version_no)`, and restricted FKs to template/user rows. Later state/content guards remain in the migration chain. Checked-in source migration head: `0042_immutable_lab_equipment_usage.sql`. Applied database head is **NOT VERIFIED** because no isolated database could be started. Production was not contacted.
- Audit/outbox event payloads and keys remain the existing template lifecycle contract; this change adds none. A malformed-version or denied action must not create a row/audit/outbox write; that candidate-bound DB assertion is present in the PG integration test but was not executed here.

## Evidence

| Requirement | Status | Evidence |
| --- | --- | --- |
| Candidate binding | PARTIAL | HEAD above differs from requested audit HEAD. Initial tree was clean. Implementation dirty fingerprint above covers all modified code/test paths; verification-run build identity is separate and generated under `.ci-results/`. |
| Canonical authority positive/negative policy | PASS (unit/source) | `tests/unit/quarantine/template-policy.test.ts`; existing assertions cover Supervisor, Manager, canonical `yazeed`, noncanonical/missing-identity SYSTEM_OWNER, Employee, and Admin. Both pages are asserted to consume the helper. |
| Strict expected-version parse and field mapping | PASS (unit/source) | `tests/unit/ui/mutation-post.test.ts`: positive and PostgreSQL BIGINT maximum, empty/zero/negative/alternate syntax/overflow/10,000-character rejection, field attribution. |
| Focused template regression | PASS | 4 files, 73/73 tests: mutation POST, template policy, template state, and in-memory template lifecycle. |
| PostgreSQL 18 denial/no-write/positive control | BLOCKED | Added to `tests/integration/quarantine/template-concurrency.test.ts`: existing DRAFT row, positive authorized read control, noncanonical-owner and Admin denial, unchanged row/audit/outbox snapshot, then canonical yazeed review success. Testcontainers failed before running any cases: no working container runtime; Docker daemon socket is absent. 3 tests skipped. |
| Astro typecheck | FAIL (pre-existing, unrelated) | 999 files; 1 error remains at `src/pages/quality/findings/index.astro` (`Date.formatDate` absent on `Date`); no errors remain in changed pages/tests. 112 existing hints. Node was 24.19.0, one patch below contract. |
| Astro build | PASS (toolchain caveat) | Final source/test state passed `pnpm verification:begin && pnpm build` on HEAD `9c493ad5763c38c4e290a1e6e232950c24783621`; run ID `a55c8833-67fa-404e-8d06-288bcf2a470f`; source fingerprint `c77bb15240dab9dc9cc6ef13ba9766141597cf75dcf438a40676deb8613cb238`; migration head `0042_immutable_lab_equipment_usage.sql`; build artifact digest `a329b448b7a85d7e89d56cdb40a4534ebf236f7e749499bc13c62aa8969fc932`; server entry digest `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`. Final run context/build evidence is in `.ci-results/run-context.json` and `.ci-results/build.json`; a later handoff-only evidence refresh does not change the source/test dirty fingerprint above. Runtime was Node 24.19.0, one patch below the required `>=24.20.0 <25`; exact runtime parity remains NOT VERIFIED. |
| Direct HTTP/browser role and malformed POST | PARTIAL | Local built server returned HTTP 303 for both protected GET routes and browser inspection showed the sign-in page with returnTo `/quarantine/admin`. Authenticated fixtures and a running PostgreSQL-backed app were unavailable; malformed POST and allowed/denied role behavior were NOT VERIFIED. No credentials or production request were used. |
| 320/375/768/1440 CSS px, 200%, keyboard, manual AT, human UAT | NOT VERIFIED | No authenticated rendered page was available. No WCAG or UAT claim is made. |
| Source/applied schema and build identity | PARTIAL | Source schema is unchanged; source head is `0042_immutable_lab_equipment_usage.sql`; applied head is NOT VERIFIED. Local candidate-bound build identity is recorded above and final run details are in `.ci-results/run-context.json` / `.ci-results/build.json`; it is not release approval. |

## Page and finding disposition

- `RT-QUAR-002` `/quarantine/admin`: F-009's canonical-authority display logic and password retention defect are corrected in source. The page card's runtime/provider, HTTP-role, responsive, and assistive-technology checks remain open.
- `RT-QUAR-003` `/quarantine/admin/[templateId]`: F-009's authority role check, pre-try `BigInt` throw, and missing expected-version field recovery are corrected in source. The card's populated-record HTTP/PG/browser/AT checks remain open.
- `QC-PAGE-F-009`: implementation portion **CLOSED IN SOURCE**; full finding/page acceptance **OPEN / NOT VERIFIED** pending exact-candidate PostgreSQL, authenticated HTTP/browser, responsive, AT and human evidence.
- Related findings and other page-card checks were not closed by this task.

## Decisions and next evidence

- No unresolved owner decision blocks the code change. The existing P-06 authority set is canonical: Supervisor, Manager, and named active `yazeed/SYSTEM_OWNER`; Admin and noncanonical SYSTEM_OWNER remain denied.
- Keep this task **PARTIAL** until PostgreSQL 18 and authenticated role fixtures run on the final candidate. Do not infer unchanged DB rows/audit/outbox from the unexecuted test source.
- No commit, push, merge, deployment, production migration, external publication, or human UAT signature was performed.

## Key files

- `src/pages/quarantine/admin/index.astro`
- `src/pages/quarantine/admin/[templateId].astro`
- `src/actions/quarantine-templates.ts`
- `src/ui/forms/mutation-post.ts`
- `tests/unit/ui/mutation-post.test.ts`
- `tests/unit/quarantine/template-policy.test.ts`
- `tests/integration/quarantine/template-concurrency.test.ts`
