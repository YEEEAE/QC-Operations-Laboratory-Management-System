# CA-P-ASSETS-CALIBRATIONS-CALIBRATIONID — execution status

**State: PARTIAL** — CAPA A presentation and source-level checks are complete. Required authenticated, populated-record browser comparison and interaction/accessibility evidence are NOT VERIFIED because the local PostgreSQL 18 instance could not be started safely. No sample or sentinel record was substituted.

## Candidate

- HEAD: `374f5f4b3904d084d4a2cb719c250b9138a96de4`
- Working tree: page and focused UI contract test modified; this report is new.
- Page SHA-256: `d29f81700606bf2b289b7c4ea60ad537c2c1514c3413ee0c2287d6a277c17df9`
- Test SHA-256: `42fb392ae2e5987e63df4d21e2e542aede0d7dc0d6199baaddff566e8f9c330f`

## Before / after inventory

| Element | Before | After |
|---|---|---|
| Record identity | Existing PageHeader | PageHeader presents calibration number, linked equipment, record version and textual state |
| Eligibility | Existing source assessment | Equipment state, source calibration state/number/due date, and maintenance state/number remain source-derived and grouped as facts |
| Calibration facts | Existing fields | Existing factual fields grouped together; no new duration, limit, or status calculation |
| Evidence and history | Existing certificate and history data | Certificate/result and status evidence are separated from a history table; source lifecycle metadata is displayed with existing history |
| Relationships | Equipment/journey links | Existing equipment, register and audit relationships remain visible |
| Actions | Existing AssetActionRail | Existing native POST intents and hidden concurrency fields remain; availability remains subject to existing UI filtering and server guards |
| Errors | ProviderUnavailableState for read failures | Resource-not-found and authorization denial return the existing 404 surface; other read failures retain provider-unavailable behavior |
| Sidebar / shell | AppLayout | No Sidebar, shell, route, schema, API, policy or business-rule changes |

## States, transitions and guards

| Surface/state | Available action | Source guard / result |
|---|---|---|
| READ: record detail | View | `GetCalibrationUseCase`: `PERM-CAL-VIEW`, owner/scope and record lookup; not found and denied resolve to 404. Eligibility and history remain source reads. |
| DRAFT | SCHEDULE, SUBMIT | Existing rail permission checks: `PERM-CAL-EDIT-DRAFT`, `PERM-CAL-SUBMIT`; transition use case validates current state/version and scoped active record. |
| SCHEDULED | SUBMIT | `PERM-CAL-SUBMIT`; server transition guard rechecks state/version/scope. |
| SUBMITTED | APPROVE | `PERM-CAL-APPROVE`; server guard includes separation-of-duties check and current version. |
| APPROVED / CURRENT | COMPLETE, FAIL | `PERM-CAL-REVIEW`; server transition guard rechecks state/version/scope. |
| Other states | No action | Existing rail has no applicable action. |
| MAKE_CURRENT / VOID | Not exposed | Remain blocked by existing policy/use-case guards; no new route or bypass. |
| FORM | Native POST actions | Existing intent and `expectedVersion` hidden fields retained; server request context retains `requestId`. No runtime submission verified. |
| DIALOG | N/A | Neither page nor imported action rail defines a dialog. |
| FILTER / EXPORT | N/A | No filter or export function exists on this detail page. |
| PENDING | N/A | No client-side asynchronous action state is defined by this page. |

UI status does not substitute for server authorization. CURRENT, OVERDUE and UNDER_MAINTENANCE remain distinct textual values. No new action was inferred from color or displayed role.

## Verification

| Check | Result |
|---|---|
| Focused record journey source contract | PASS — 1/1 |
| Authorization visibility UI | PASS — 6/6 |
| Equipment eligibility | PASS — 9/9 |
| Calibration integration use-case tests | PASS — 6/6 (fake repository; not live database evidence) |
| Astro build (Node 24.20.0) | PASS — completed; existing vendor/chunk warnings |
| Astro check (Node 24.20.0) | FAIL — 2 missing `../ui/layouts/BaseLayout.astro` imports in `audit/CA-P-500/committed-500.astro` and `workingtree-500.astro`; 129 hints. No changed-page diagnostic reported. |
| `git diff --check` | PASS |
| Matched before/after screenshots on same authorized populated record | NOT RUN — PG18 unavailable; no record substituted |
| 320/390/768/1024/1440 responsive browser checks and overflow | NOT RUN |
| Keyboard, visible focus, accessible names/labels, zoom 200%/400% | NOT RUN |
| Dynamic contrast, reduced motion, forced colors | NOT RUN |
| Authorized account and denied account with actual record | NOT RUN |
| Runtime READ/FORM/DIALOG, denied/failure, action parity before/after | NOT RUN — DIALOG is source-level N/A; POST behavior not exercised |

### Database blocker

`QC_TEST_DATABASE_URL` was not configured. `pg_isready -h 127.0.0.1 -p 55432` found no server. The existing `.tmp/pg18/data` was preserved: the repository disposable-Postgres helper would remove it. A direct `pg_ctl` start failed due to a pre-existing shared-memory block. No process was killed and no database or external environment was modified.

## Existing debt

`AssetActionRail` currently maps action failures to its existing generic “action was not confirmed” message; this pre-existing behavior can hide a more specific permission/version failure in the UI. It was left unchanged because changing mutation error UX is outside this presentation scope. Server guards remain authoritative.
