# QC-100-FINAL-018 — Complete clear, consistent and accessible product wording

- Candidate (HEAD): `20d64e4188cebc635a206d42f938b0ddc0df0e6a` (commit subject "update site", clean tree at start)
- Working-tree diff fingerprint (content-based, sha256 of `git diff -- '*.astro'`): `68f2d0e558986b9aa54c3dcf752e80902776f771099371121760725cfbb3536a`
- Evidence timestamp: 2026-09-19T23:32:17Z
- Node runtime: 22.22.3 (outside the declared contract `>=24.20.0 <25` — pre-existing host condition, unchanged by this diff)
- Build identity: `pnpm build` exit 0 (server built; no release artifact published)

## Baseline state on this candidate

The prior 018 record (2026-09-19, candidate-side) already delivered the shared vocabulary
(`src/shared/copy/ux-vocabulary.ts`), the UX Writing Guide (`Documents/UX-WRITING-GUIDE.md`),
the UX-writing regression contract (`tests/unit/ui/ux-writing-contract.test.ts`), and
humanization across findings/equipment/calibrations/maintenance/inspections/backups/search.
This phase re-audited every route family against the guide on the current HEAD and repaired
the residual gaps found, without touching regulated terms, server authorization, state
machines, SoD, or the E2E pins.

## Item-by-item record

### Item 1 — Audit all route families; replace raw identifiers where meaning is preserved — DONE (residuals repaired)

Method (read-only sweep across `src/pages/**` on HEAD):
- Raw state/status/result/severity enum cells (`<td>{x.state}</td>` style): 2 files matched —
  `src/pages/quarantine/admin/[templateId].astro`, `src/pages/tasks/index.astro`. Both repaired (below).
- Placeholder glyphs (➜ ► ● ■ ◆ etc.) in page copy: 0 matches. Repeated **U+2192 →** audit
  arrows (intentional transition notation, pinned by the existing contract
  `transitionLabel`) remain the only arrow uses.
- Uppercase enum text leaked into option labels: 1 (`RELEASED` filter option label vs the
  already-humanized `Not released` sibling) — repaired via `releaseStateLabel`.
- Technical identifier as a column heading: `Task ID` heading over `task.taskNo` values —
  relabeled `Task number` to match the data actually shown (existing asset-register
  ID-heading rule, `scope="col">[A-Za-z]+ ID</th>`).
- Raw user identifiers rendered as labels: task assignee columns/details rendered
  `currentAssigneeId` (a UUID) directly — replaced with a resolved display name.

Changes:
1. `src/pages/tasks/index.astro` — heading `Task ID` → `Task number`; state cell
   `{task.state}` → `{stateLabel(task.state)}`; assignee cell now shows the resolved
   `displayName` via a bounded identity read (`identityAdminReadDependencies().listUsers`,
   presentation-only, failure-tolerant — falls back to `Named account`, never a raw UUID).
2. `src/pages/tasks/[taskId].astro` — State `<dd>{task.state}</dd>` → `{stateLabel(task.state)}`;
   assignee `<dd>` now shows the resolved `displayName`
   (`identityAdminReadDependencies().getUser`, presentation-only fallback `Named account`).
3. `src/pages/quarantine/admin/[templateId].astro` — eyebrow, status pill, and facts
   `State` all humanized with `stateLabel(template.state)`.
4. `src/pages/quarantine/admin/index.astro` — register state cell `{t.state}` →
   `{stateLabel(t.state)}` (record version suffix `v{n}` retained; it is a concurrency fact).
5. `src/pages/quarantine/receiving/index.astro` — release-state filter option labels now
   come from `releaseStateLabel(true/false)` instead of one literal `RELEASED` + one human
   `Not released` (consistent pair; `RELEASED` spelling itself is regulated and unchanged).
6. `src/pages/admin/users/[userId].astro` — accessible names aligned with visible labels:
   scope-value inputs `aria-label={`${kind} scope value`}` → use
   `uxVocabulary.scopeKindLabels[kind] ?? kind`, matching the visible fieldset labels and
   the pattern already shipped on `/admin/users/new`; `scopeLabel()` (confirm-dialog intent
   text) now reads `Own records: value` instead of the raw kind code `OWN:value`.

Evidence: `grep` sweeps recorded above (0 raw state cells remain project-wide), typecheck 0
errors, targeted UI suites PASS (below).

### Item 2 — State, next action, responsible role, recovery in plain English — DONE (no further gaps)

- Regulated terms verified untouched: PASS/FAIL/HOLD/RELEASED/VOID/NCR/CAPA retain exact
  spelling in the vocabulary (`tests/unit/ui/ux-writing-contract.test.ts` pins
  `stateLabel('PASS')==='PASS'` etc., 14/14 PASS on the final tree).
- The E2E receiving-detail facts pin (`Receiving state` / `Inspection result` /
  `Release System State` / `NOT_RELEASED`) is preserved verbatim.
- Release-boundary wording intact: `releaseStateLabel` (`RELEASED` / `Not released`),
  `uxVocabulary.boundaries.passNotRelease` ("does not release"), `aiNotAuthority`
  ("advisory only") unchanged; drafts/approvals/notifications never claim release (guide
  rule enforced by vocabulary, not page-by-page duplication).
- Plain-English state/next-action/recovery copy spot-checked across quarantine overview,
  receiving register, tasks, approvals, backups, admin users: no generic "something went
  wrong" family strings (`errorClasses` remain distinct; contract enforces).

### Item 3 — Ambiguous labels, destructive/corrective context, accessible-name parity, error↔control correspondence — DONE

- Destructive/corrective confirmations already carry consequence + audit + reversibility
  context (`ConfirmDialog` on `/admin/users/[userId]`: role/scope removal, disable,
  activate, revoke sessions, password reset — each states what stops applying and what is
  preserved; issue-slip checkpoint and document-review confirmations are scope-stated).
- Placeholder glyphs: none found (prior phase eliminated them; sweep confirms 0).
- Accessible names now match visible labels for scope-value inputs (both create and edit
  surfaces use the same human scope-kind label).
- Error instructions correspond to real controls: `FormErrorSummary` consumers pass
  `fieldErrors` keyed by the actual field names rendered on the same page (spot-checked
  template admin, user create/edit, backup restore).

### Item 4 — Arabic/RTL scope (013 gate) — NOT RUN (BLOCKED by owner decision)

013 recorded no approved Arabic/RTL translation scope; per instructions, controlled
translations were **not invented** and English is not counted as localized completion.
No `locale`/`direction` values were altered. Unresolved dependency: owner decision via 013.

### Item 5 — Copy contracts, link/heading checks, browser & screen-reader review — PARTIAL

- Copy contracts: `pnpm exec vitest run tests/unit/ui` — **26 files / 255 PASS / 0 FAIL**
  (includes `ux-writing-contract.test.ts` 14/14). No behavior test required updating: none
  pinned the removed raw-enum renders or the `Task ID` heading (grep over `tests/` found no
  references), so the existing pins were preserved and new pins for the humanized cells are
  covered by the existing patterns.
- Typecheck: `tsc --noEmit` — **0 errors** (853-file project; hints unchanged).
- Lint: `pnpm lint` — **0 errors, 0 warnings** on the full run.
- Format: `pnpm format:check` — **PASS** (all matched files).
- Build: `pnpm build` — **exit 0** (server bundle completes).
- Browser rendering and screen-reader review: **NOT RUN** — same environmental blocker
  recorded by 016/017 (no authenticated browser/AT harness on this host). Human
  screen-reader validation remains an external human-evidence dependency.

### Item 6 — UX Writing evidence + mapped-domain rollup — DONE (this file + Mind ledger)

- This evidence file is the UX Writing record for the phase on candidate
  `20d64e4188cebc635a206d42f938b0ddc0df0e6a` with the diff fingerprint above.
- Mind ledger entry added (concise, per protocol).
- Editorial quality was **not** substituted for product maturity: no scores were changed;
  gates remain 0/19 and PASS ≠ RELEASED.

## Changed files

- `src/pages/tasks/index.astro`
- `src/pages/tasks/[taskId].astro`
- `src/pages/quarantine/admin/index.astro`
- `src/pages/quarantine/admin/[templateId].astro`
- `src/pages/quarantine/receiving/index.astro`
- `src/pages/admin/users/[userId].astro`

## Unresolved dependencies / owners

- Arabic/RTL translation scope: owner decision via task family 013 (BLOCKED, do not invent).
- Authenticated browser + screen-reader (AT) review on this candidate: NOT RUN (host
  blocker, same as 016/017); human AT evidence is an external dependency for 004.
- Final audit012 credit: wording evidence above is candidate-side; human/production gates
  remain 0/19 and cannot be converted from editorial completion.

## Handoff summary

- Implementation state: **DONE** for items 1, 2, 3, 6 (on this candidate, local evidence);
  **PARTIAL** for item 5 (automated copy contracts PASS; browser/AT NOT RUN);
  **BLOCKED** for item 4 (owner decision via 013).
- Evidence grades: copy contracts/typecheck/lint/format/build = **PASS**; browser
  rendering & screen-reader review = **NOT RUN**; Arabic/RTL = **BLOCKED**; human UAT and
  release gates = unchanged, **PASS ≠ RELEASED**.
- Next phase inputs: final audit012 consumes this file; downstream owners listed above.
