# CA-F-00 — execution status

2026-10-17 · base HEAD `450d1fbec493d14566f585c0dc4c67cff96d6e78` + local working-tree changes; initial `git status --short` empty. **PARTIAL** overall; NCR, CAPA and Retest operational writes **BLOCKED** separately. No commit/push/deploy/production access or migration.

## Local changes

- NCR/CAPA source gates now exist in the application and PostgreSQL create adapters, not just the denied JSON action. No invented source provider or checkbox-based policy.
- Independent domain checks mirror existing DB nonblank title/action description, boolean and unique integer sequence contracts.
- Retest validates provider output/context identity, resets all inherited execution/derived-result fields, and passes the reason to audit mutation. Original state, result and evidence untouched.
- `field-contracts.md`: per-field source/type/required/server-client/error matrix, including action children and missing intent-version/replay contracts.
- `wiring-and-gates.md`: actual dependency trace, separate persistence/audit gates and exact questions/authority owners. Source texts were read directly from approved Q3/L5 DOCX XML; neither has assigned effectivity.

## Fresh verification

| Check | Result / boundary |
|---|---|
| Node | **v24.20.0** explicitly selected from nvm. `/opt/homebrew/opt/node@24/bin` unexpectedly resolves to v26.0.0; preliminary run on it is not the accepted evidence. |
| Focused tests | **71/71 PASS**, 7 files: new creation-source-gates, new actual Retest production wiring, prerequisite-evidence-boundary, scientific-governance, lab-workflow, controlled-policy-fail-closed; plus `tests/integration/quality/ncr.test.ts` which is domain-only despite folder name. |
| Typecheck | Astro check **0 errors / 0 warnings / 123 hints**, 1117 files. Initial run exposed missing `derivedFrom` in new test fixture; corrected and rerun. |
| Architecture | Both boundary check and canonical route-file integrity **PASS**. |
| Build | `astro build` **PASS**, exit 0. This is Astro build only, not a signed/released artifact or the evidence-wrapped package build pipeline. Existing large chunk advisory remains. |
| Diff | `git diff --check` **PASS**; no UI, Sidebar, actions, transport, migrations or signature policy changes. |
| Workspace map | Generator run; VERIFICATION index updated from actual files. It also removes previously indexed CA-04 screenshots absent from this checkout and adds existing execution-record.json; no screenshots were deleted by this task. |
| Graph | `graphify update .` **PASS**: 67,385 nodes / 128,120 edges / 3,261 communities. Tool reports 9 partially extracted files and 374 no-symbol files; graph is navigation, source remains truth. No LLM API used. |
| PostgreSQL persistence / concurrency | **NOT RUN**. The adapter guards fail before database access; no real governed positive write source exists. Synthetic repository tests prove application behavior only. |
| Browser / no-JS / screenshots / AT | **NOT RUN** on this candidate; UI unchanged and no newly enabled form. Existing prior evidence is not relabeled as fresh acceptance. |

Command for accepted focused run:

```sh
PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH" node_modules/.bin/vitest run \
  tests/unit/quality/creation-source-gates.test.ts \
  tests/unit/quality/prerequisite-evidence-boundary.test.ts \
  tests/unit/laboratory/retest-production-wiring.test.ts \
  tests/unit/laboratory/scientific-governance.test.ts \
  tests/unit/laboratory/lab-workflow.test.ts \
  tests/unit/policy/controlled-policy-fail-closed.test.ts \
  tests/integration/quality/ncr.test.ts
```

## Remaining blockers

Missing approved effective initiation, numbering, assignment, CAPA requirements/action-plan and Retest policy decisions are listed individually in `wiring-and-gates.md`. No live policy, number, deadline, unit, scientific criterion or owner assignment was invented. Native operational forms, source-lock/expected-version/idempotency, atomic NCR/CAPA aggregate/audit, populated database round-trips and browser acceptance are not complete. No disabled form or blocker card is counted as their completion. CA-03 prerequisite remains PARTIAL.

Process coverage: 387 local `.agents/skills/**/SKILL.md` files were discovered. The relevant graphify, Karpathy and verification instructions were read/used, but complete reading of all 387 skill documents was **NOT COMPLETED** in this subagent run. No claim of full capability-policy discovery compliance is made.
