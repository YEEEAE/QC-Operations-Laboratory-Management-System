# QC-100-FINAL-023 — Humanize all product content and govern terminology

## Identity

| Field | Value |
| --- | --- |
| Candidate HEAD | `654c3d4e7d388dfa4ddf3fea4f24320d8675625d` (commit subject "update site", `main`) |
| Working tree | dirty — 25 paths (24 product + 1 evidence below) |
| Product-change content fingerprint (sha256 over path+content of every dirty path outside `audit/`) | `432ae27ad1638504b4c160622d34dbc8be7edbd8ac45f487da30e23c9c5e8864` |
| Release identity | `rel-be542dbed16c2e8f` (verified, `gitSha` matches HEAD, `workingTree: dirty`) |
| Build identity | `pnpm build` exit 0 (server built in 3.21s; no release artifact published) |
| Migration head | `0031_qc_creation_parity_two_stage_approval` (`44b160a6b8c09769fd7f18e19c29b2e29c98635cbf81de603a2cbbbd6324ec61`) — source image unchanged by this phase |
| Node runtime | 22.22.3 (outside declared contract `>=24.20.0 <25` — pre-existing host condition) |
| Evidence timestamp | 2026-09-20T02:42:25Z (checks re-run on the final tree) |
| Audit comparison candidate | `653b58d22d4a17994db7376a3bd691ca6e789f1a` (2026-09-19, maturity 45.8%, gates 0/19, NO-GO) — frozen; this phase does not change the score or the denominator |

## Scope and prerequisites

- Covered disciplines: **UX Writing / Microcopy**, **Content Design / Terminology Governance**.
- Base owners reused (not rebuilt): 018 (wording completion + shared vocabulary), 013 (policy
  reconciliation), 021 (contextual guidance / journey panel).
- Audit domains 4, 20, 65–70 already exist; this phase added **no** new scored domain and did not
  change the 80-domain denominator.
- No server authorization, state machine, SoD, idempotency, migration, or schema change. Wording only.

## Checklist executed

1. Inventory labels, help, confirmations, notifications, error/success across every route family → **DONE**.
2. Natural concise English; preserve regulated terms; distinguish saved/submitted/reviewed/approved/released → **DONE**.
3. Replace generic messages with truthful outcome + recovery; filtered-empty vs no-data vs unavailable → **DONE** (contract-level).
4. Verify visible/accessible label agreement, grammar, headings, links, error→control mapping; add copy regressions → **DONE** (automated); human comprehension evidence = external dependency.

## Item-by-item record

### Item 1 — Route-level copy inventory + governed glossary + before/after matrix — DONE

- Method: enumerated all 87 routes / 26 families from `src/shared/routing/routes.ts` and mapped the
  five copy surfaces (labels/headings, help/hints, confirmations, notifications, error/success) plus
  the shared copy sources and feedback components per family.
- Deliverables: `Documents/COPY-INVENTORY.md` (route-level inventory with implementation owner per
  family) and `Documents/COPY-GLOSSARY.md` (governed terminology: regulated terms, the five distinct
  lifecycle words, the state-code→label table, other vocabularies with their helpers, boundary
  statements, forbidden copy, change control).
- No duplicate policy source created: both documents defer meaning to the owning domain and read
  the single implementation source `src/shared/copy/ux-vocabulary.ts`.

### Item 2 — Natural concise English; regulated terms preserved; lifecycle words distinguished — DONE

- Added `uxVocabulary.lifecycle` (saved / submitted / reviewed / approved / released), each stating
  its own boundary so a surface can never imply the next controlled step.
- Extended `stateLabels` for coverage gaps that previously fell through to ad-hoc humanization:
  `IN_REVIEW`, `EFFECTIVE`, `SUPERSEDED`, `APPLYING`, `APPLIED`, `APPLICATION_FAILED`, `CLOSED`,
  `PENDING_QCM_APPROVAL`, `NOT_DETERMINED`, `NOT_RELEASED`, `ISSUED`, `APPROVAL_TRACKING`, `FINALIZED`.
- Added `targetTypeLabel()` and `workflowTypeLabel()`; unknown codes pass through verbatim rather
  than being guessed.
- Regulated terms verified untouched: `stateLabel('PASS'|'FAIL'|'HOLD'|'RELEASED'|'VOID')` unchanged
  (pinned by both contracts); English/LTR only — Arabic/RTL not implemented (no approved scope).

### Item 3 — Truthful outcome/recovery; filtered-empty vs no-data vs unavailable — DONE (contract-level)

- Confirmed each register keeps three distinct branches: outage (`ProviderUnavailableState`,
  "this view is not empty, no count is shown"), filtered-empty (named + "clear filters"), truly empty
  (named + create action). Pinned by the new contract for six registers plus the shared component.
- Retention wording: "your entries are preserved" remains only where the surface keeps entries
  (client never-clears-input + server value re-render). `CONFLICT_STALE` says "Nothing was resubmitted";
  `DUPLICATE_COMMAND` says "nothing was duplicated". No surface promises an action the server did not commit.
- No copy claims a restore executes, a PASS releases, or a backup proves a restore.

### Item 4 — Label agreement, headings, links, error→control mapping; copy regressions — DONE (automated)

- Headings now name the human value actually shown (no "ID" heading over a human number).
- Register person columns resolve a display name (`identityAdminReadDependencies`, presentation-only,
  failure-tolerant, fallback `Named account`) — matching the tasks-register precedent; never a raw UUID
  as a row value.
- Error→control mapping unchanged: `FormErrorSummary` field errors stay keyed to the real field ids;
  `enhanceMutationForm` focuses the first invalid control on `VALIDATION_ERROR`.
- New regression contract `tests/unit/ui/copy-governance-contract.test.ts` (13 tests): glossary
  completeness/distinctness, humanized facts, no raw enum facts, no "ID" headings, create-form number
  naming, register name resolution, empty/unavailable distinctness, no generic failure copy.

## Before → after matrix (contextual)

| # | Route family | Surface / context | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | Quarantine · Receiving | Register column heading | `Receiving ID` | `Receiving number` | The cell shows `receivingNo`; the guide forbids an "ID" heading over a human number |
| 2 | Quarantine · Receiving | Create-form label (field + error map) | `Receiving ID` | `Receiving number` | Field label must name the value the operator supplies |
| 3 | Quarantine · Inspections | Register column heading | `Inspection ID` | `Inspection number` | Same rule; value is `inspectionNo` |
| 4 | Quarantine · Inspections | Register "Inspector" cell | raw `authorId` UUID | resolved display name / `Named account` | Never render a raw account identifier as a row value |
| 5 | Quarantine · Inspections review | Facts "Workflow state" | `<dd>{inspection.state}</dd>` raw enum | `stateLabel(inspection.state)` | Raw enums never render in visible facts |
| 6 | Quarantine · Receiving detail | History transition | `{oldState ?? 'not set'} to {newState ?? 'not set'}` | `transitionLabel(old, new)` | Never renders "not set to not set" |
| 7 | Laboratory · Tests | Register column heading | `Test ID` | `Test number` | Heading must match the shown `labTestNo` |
| 8 | Laboratory · Tests | Register "Executor" cell | raw `authorId` UUID | resolved display name / `Named account` | Human name, not a raw identifier |
| 9 | Laboratory · Test detail | Facts line + journey state | `State: {test.state}` raw enum | `stateLabel(test.state)` | Humanized fact |
| 10 | Quality · Findings | Register column heading | `Finding ID` | `Finding number` | Heading matches `findingNo` |
| 11 | Quality · Findings | Create-form label (field + error map) | `Finding ID` | `Finding number` | Names the supplied value |
| 12 | Quality · Findings | Register "Owner" cell | raw `ownerId` UUID or `Unassigned` | resolved display name / `Unassigned` | Never a raw identifier |
| 13 | Documents | Register "Owner" cell | raw `ownerId ?? createdBy` UUID | resolved display name / `Named account` | Never a raw identifier |
| 14 | Documents · Version | Register "Author" cell | raw `createdBy` UUID | resolved display name / `Named account` | Never a raw identifier |
| 15 | Documents · Version | Register + detail state badge | `label={version.state}` raw enum | `stateLabel(version.state)` | Humanized lifecycle label |
| 16 | Documents · Version | Facts "Lifecycle state" + journey state | raw `version.state` | `stateLabel(version.state)` | Humanized fact |
| 17 | Documents · Version review | State badge | raw `version.state` | `stateLabel(version.state)` | Consistency with detail/register |
| 18 | Documents · Version | Attachment column heading | `File ID` | `File reference` | Removes the ID-heading pattern |
| 19 | Change requests | Filter option labels | raw `{value}` (e.g. `UNDER_REVIEW`) | `stateLabel(value)` | Filter options are visible copy |
| 20 | Change requests | Register state badge + target cell | raw `changeRequest.state`, `targetType` | `stateLabel(...)`, `targetTypeLabel(...)` | Humanized controlled values |
| 21 | Change requests · Detail | Header + journey state + controlled context | raw state / target type | humanized state / target-type label | Consistent terminology |
| 22 | Reject reports | Register status cells (slip, daily, summary) | raw `slip.status` / `record.status` / `report.status` | `stateLabel(...)` | Register now matches the detail page |
| 23 | Approvals | Queue "Workflow" / "Submitted by" / state badge | raw `workflowType`, `requestedBy` UUID, work-item enum | `workflowTypeLabel(...)`, resolved display name, `stateLabel(...)` | Humanized queue |
| 24 | Copy domain | Format gate | `format:check` FAIL on `help-content.ts` + `help-content-contract.test.ts` | PASS (formatting-only) | Clears the pre-existing copy-domain format FAIL |

## Requirement → implementation → evidence → unresolved dependency

| Req (scoped item) | Implementation | Technical evidence | Unresolved dependency / owner |
| --- | --- | --- | --- |
| 1 Inventory all route families | `Documents/COPY-INVENTORY.md`, `Documents/COPY-GLOSSARY.md` | 87 routes / 26 families enumerated from `routes.ts`; inventory reviewed against guide | None |
| 2 Natural English; preserve regulated terms; lifecycle distinct | `src/shared/copy/ux-vocabulary.ts` (`lifecycle`, `stateLabels`, `targetTypeLabel`, `workflowTypeLabel`) | `copy-governance-contract` (glossary + regulated pins) PASS; `ux-writing-contract` PASS | Arabic/RTL applicability → **013** (BLOCKED, not invented) |
| 3 Truthful outcome/recovery; empty vs unavailable | `ProviderUnavailableState`, `EmptyTableState`, `errorClasses`, register branches | `copy-governance-contract` (outage/empty) + `mutation-safety-contract` PASS | Browser/AT confirmation → **003/006/040** (NOT RUN) |
| 4 Label agreement, headings, links, error→control | page edits in matrix rows 1–23 | typecheck 0 errors; unit 101 files / 766 PASS; architecture PASS; build exit 0 | Human comprehension evidence → **004** (external, not invented) |

## Verification evidence on the final tree

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm exec tsc --noEmit` | **PASS** — 0 errors |
| Unit suite | `pnpm test:unit` | **PASS** — 101 files / 766 tests (was 753; +13 new copies) |
| Copy contracts | `vitest run tests/unit/ui/copy-governance-contract.test.ts` | **PASS** — 13/13 |
| Architecture | `pnpm test:architecture` | **PASS** — boundaries + route registry integrity |
| Lint | `pnpm lint` | **PASS** — 0 errors |
| Format | `pnpm format:check` | **PASS** (the two pre-existing failures are fixed) |
| Build | `pnpm build` | **PASS** — exit 0 |
| Release identity | `pnpm release:identity` + `pnpm release:verify` | **PASS** — `rel-be542dbed16c2e8f` verified |
| Migrations / schema | — | **HISTORICAL / N-A** — source image unchanged; no migration or schema edit in this phase |
| Browser / accessibility (axe, NVDA, 320px/200%, no-JS) | — | **NOT RUN** — blocked by host (owners 003/006/040) |
| Affected authenticated E2E | — | **NOT RUN** — Docker-only runner unavailable (owner 003) |
| Human comprehension / UAT | — | **BLOCKED** — external human evidence (owner 004); never fabricated |
| Production gates | — | **0/19** unchanged; `PASS ≠ RELEASED` |

## Changed files

Product (24): `src/shared/copy/ux-vocabulary.ts`, `src/shared/copy/help-content.ts` (format only),
`src/pages/quarantine/receiving/{index,new,[receivingId]}.astro`,
`src/pages/quarantine/inspections/{index,[inspectionId]/review}.astro`,
`src/pages/laboratory/tests/{index,[labTestId]/index}.astro`,
`src/pages/quality/findings/{index,new}.astro`,
`src/pages/documents/{index,[documentId]/index}.astro`,
`src/pages/documents/[documentId]/versions/[versionId]/{index,review}.astro`,
`src/pages/change-requests/{index,[changeRequestId]/index}.astro`,
`src/pages/reject-reports/index.astro`, `src/pages/approvals/index.astro`,
`tests/unit/ui/copy-governance-contract.test.ts` (new),
`tests/unit/ui/help-content-contract.test.ts` (format only),
`Documents/COPY-GLOSSARY.md` (new), `Documents/COPY-INVENTORY.md` (new),
`Documents/UX-WRITING-GUIDE.md` (glossary cross-reference).
Evidence (1): this file.

## Handoff

**Implementation state** (separate from evidence grade):

- Item 1 — **DONE**
- Item 2 — **DONE**
- Item 3 — **DONE** (contract-level)
- Item 4 — **DONE** (automated); human comprehension remains an external dependency

Overall for this phase: **PARTIAL** — all four scoped items are implemented and locally verified,
but browser/AT/E2E/human acceptance cannot be evidenced on this host.

**Evidence grades:** copy contracts / typecheck / lint / format / architecture / build / release = **PASS**;
browser + accessibility = **NOT RUN**; authenticated E2E = **NOT RUN**; Arabic/RTL = **BLOCKED** (013);
human UAT = **BLOCKED** (004); migration/schema = **HISTORICAL (N/A)**.

**Unresolved dependencies / owners:**

- Arabic/RTL localization applicability → **013** (owner decision; text not invented).
- Authenticated browser + AT (axe, NVDA, 320px/200%, no-JS) → **003/006/040** (NOT RUN).
- Human comprehension / UAT → **004** (external; cannot be converted into completion).
- Final evidence reconciliation → **012** (consume this file; no score change).

**Feed to:** final audit 012 and downstream owners 002/027 (regression), 003 (E2E), 006/040 (a11y).

**Next phase inputs:** the copy inventory and glossary are the baseline for any future wording change;
a localization phase requires an approved 013 applicability decision before any translation is written.

`PASS ≠ RELEASED` — editorial completion is not product maturity; gates remain 0/19.
