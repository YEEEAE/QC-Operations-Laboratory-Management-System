# QC-ADP26-20 — UI contract reconciliation handoff

**State: PARTIAL.** The source defect and all five observed assertion mismatches were reconciled against current code and the approved UI/copy contracts. The four requested UI suites pass on the local candidate. Authenticated browser, viewport, assistive-technology, and human UAT evidence remains NOT VERIFIED.

## Candidate and tool identity

| Field | Value |
|---|---|
| Requested audit SHA | `0b1bb21bb3b4eca77862dbba1da8623044e96355` |
| Verified local candidate | `318b3e787025658a06fbb97c70bfa392ce318a9f` on `main` |
| Freeze state | Clean working tree before this task; no user changes present |
| Dirty source/test fingerprint | `f9ec86fb9c6177ecad469d539b0295e2c6be594f2085915a24f9151c3ae00281` — SHA-256 of `git diff --binary HEAD` limited to the five changed source/test paths below; audit, Mind, and generated files excluded |
| Runtime | Node `v24.20.0`; Vitest `5.0.0`; Prettier `3.9.6` |
| Package manager contract | `pnpm@11.25.0` is pinned in `package.json`; actual pnpm version NOT VERIFIED because Corepack could not fetch it (`registry.npmjs.org` DNS `ENOTFOUND`) |
| Source schema | `0042_immutable_lab_equipment_usage`, checksum `d9b2531390b4ee00516b9bea07de0e706c3b78c1b13d2925481b29a4ff5340ab` |
| Applied schema | NOT VERIFIED; no database connection or mutation was used |
| Build identity | `rel-8b915f96fecad9c2`, build `local-318b3e787025`, timestamp `2026-10-01T03:01:47.435Z`, local/dirty |
| Artifact | `dist/server/entry.mjs`, SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb` |

The current checkout HEAD differs from the requested SHA, so none of the earlier evidence was transferred. All results below were rerun or inspected on the current candidate. The build identity matches the current Git SHA and the local artifact digest; it is not production evidence.

## Intention and source reconciliation

The governing references were `audit/2026-09-20/QC-100-FINAL-005-shared-ui-navigation-forms-grids-recovery.md` (token floor and shrinking ratchets), `audit/2026-09-20/QC-100-FINAL-023-copy-inventory-terminology-governance.md` (copy truth), `Documents/QC-VISUAL-SYSTEM.md` (semantic token and print rules), and `Documents/UX-WRITING-GUIDE.md` §4 (stale/dependency recovery meaning). Assertions were not weakened.

| Mismatch | Source finding | Resolution |
|---|---|---|
| Raw-color token contract | `OperationalState.astro` used `#fff`, `#111`, and `#333` in its print rule. This was the actual token offender. | Replaced them with existing semantic tokens `--surface-evidence`, `--text-primary`, and `--border-evidence`; no new token or status meaning. |
| Ad-hoc date ratchet | The current 88-page inventory has two fewer `.toLocale*` pages than the old 19-page snapshot: task detail and the findings register. The findings page imported `formatDate` but called a nonexistent `Date.formatDate` method. | Reduced the approved snapshot to the 17 current offenders, fixed the findings renderer to call `formatDate(finding.createdAt)`, and asserted that route uses the approved formatter. The existing candidate type error on this route is removed; the remaining type error is elsewhere. |
| Register bound inventory | `/documents` has two reads: `review=mine` invokes `ListDocumentReviewQueueUseCase` with a bounded SQL `LIMIT`; the normal `ListDocumentsUseCase` invokes an unbounded `document_identities` query and filters owner scope in application code. | Updated `isBounded` to inspect the primary list call, not any bounded read somewhere on the page. `/documents` stays in the unbounded-register ratchet; no pagination or authorization policy was invented. |
| Stale-message wording | Runtime copy says the record changed, instructs “Reload it before trying again,” and confirms “Nothing was resubmitted.” The approved guide requires those meanings, not the obsolete literal phrase “Reload the latest data.” | Replaced the literal phrase check with assertions for changed record, reload before retry, and no resubmission. |
| Dependency-message wording | Runtime copy says the linked record is unavailable and asks the user to refresh to check current options. The old test required a different literal sentence. | Asserted unavailable linked record and a refresh to check/review current options/state, preserving the required recovery meaning. |

Finding scope traced: `/quality/findings` remains a read-only `findingsReadDependencies().list.execute({ actor, state })` path. `ListFindingsUseCase` delegates to `PostgresFindingRepository.list`, which performs a scoped `SELECT` on `findings` for owner/creator and optional state, ordered by update time and id. The repair changes only the date display. The documents inventory contract inspects the two existing branches; neither was modified. No action/use case, permission, SQL, state transition, transaction, audit, outbox, constraint, or migration changed. Database proof is N/A by contract because no write or schema path changed; applied schema remains NOT VERIFIED.

## Verification evidence

| Check | Result | Evidence / limit |
|---|---|---|
| Baseline focused UI contracts | FAIL, 4 test cases / 5 assertion mismatches | Fresh run before edits on current candidate; the date test encoded two stale entries, register test misclassified the conditional review read, copy checks pinned obsolete wording, and the token test found the actual print hex colors. Retained here as HISTORICAL. |
| Final focused UI contracts | PASS — 4 files / 45 tests | `node_modules/.bin/vitest run tests/unit/ui/design-governance-contract.test.ts tests/unit/ui/mutation-safety-contract.test.ts tests/unit/ui/register-surface-contract.test.ts tests/unit/ui/copy-governance-contract.test.ts` under Node `v24.20.0`; exit 0. Static page discovery covered all 88 current `.astro` route files. |
| Targeted formatting | PASS | Prettier 3.9.6 on the three changed TypeScript test files. The installed Prettier has no Astro parser, so it could not format-check `.astro`; Astro compilation covered syntax. |
| `git diff --check` | PASS | No whitespace errors. |
| Astro build | PASS | `node_modules/.bin/astro build`, followed by release identity generation and verification. Vendor annotation, dynamic-import, and chunk-size warnings were emitted. |
| Release identity | PASS, local only | `release:verify` returned `verified: true` for `rel-8b915f96fecad9c2` and current SHA. `write-build-evidence.mjs` was attempted once but BLOCKED because no candidate-bound verification run context existed; no CI build-evidence report is claimed. |
| Full Astro typecheck | FAIL — 1 error, 0 warnings, 113 hints | `astro check` now reports the existing error at `src/pages/ai-advisory.astro:148` (`requestButton` may be null). It no longer reports the Findings date error; no changed file has a remaining diagnostic. This unrelated error is not fixed here. |
| Authenticated browser / viewport / AT / UAT | NOT VERIFIED | No authenticated fixture or populated disposable PostgreSQL environment was available for an exact-candidate render. No WCAG or human-acceptance claim is made. |
| PostgreSQL / audit / outbox before-after | N/A for this presentation-only scope | No writes, transactions, constraints, or migrations were changed or executed. |

The product script pins pnpm 11.25.0, but Corepack's registry fetch failed due DNS. To retain useful evidence, Vitest, Astro, Prettier, and release verification were invoked from the already installed local binaries under Node 24.20.0. The `pnpm` runtime version and the package-script build-evidence writer remain NOT VERIFIED.

## Finding status

- **QC-PAGE-F-020 — PARTIAL:** source/token issue, date display defect, bounded-read classification, and copy-contract checks are reconciled and locally verified. The contracts scan all 88 route files, but that does not prove rendered behavior across all route states.
- **Closed locally:** actual print-color token offender; Findings date renderer defect; false inventory mismatches in date, register-bound, and approved copy intent.
- **Open:** authenticated rendering of empty/denied/unavailable states, 320/375/768/1440 CSS-pixel and 200% checks, keyboard/AT, and human UAT. No permission or data-owner decision is introduced by these fixes.

## Changed paths

- `src/ui/components/feedback/OperationalState.astro`
- `src/pages/quality/findings/index.astro`
- `tests/unit/ui/design-governance-contract.test.ts`
- `tests/unit/ui/mutation-safety-contract.test.ts`
- `tests/unit/ui/register-surface-contract.test.ts`
- `.agents/mind/01-mind-latest.md`
- `audit/2026-09-30/handoff-QC-ADP26-20.md`
- `workspace-map/` generated inventories

No commit, push, merge, deployment, external write, production migration, or UAT signature was performed.
