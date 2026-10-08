# QC-LAUNCH-001 — local baseline and decision plan

**Status:** PARTIAL / NO-GO · **Candidate:** `f72fde0c41c8f373066210f337c6c1c3921a52f1` · **Reference:** `60e78cc6fdafe6c70e249be2d687c1df3af45412`

## Local change summary

This task added only the local baseline packet:

- `execution-report.html`
- `evidence.json`
- `patch-or-decision-plan.md`

No product source, migration, controlled document, GitHub resource, production database, role, or deployment was changed. The initial checkout was clean. The frozen source fingerprint was captured before these evidence outputs were written and is recorded in `evidence.json`.

## Baseline result

- 86 canonical routes, 88 physical Astro pages, 47 SQL migration files (source head `0047_task_references_occurrences.sql`).
- 118 files under `Documents/QC_System_WI_SOP_Pack`: 45 PDF, 69 DOCX, 2 ZIP, 2 TXT. This is a file inventory, not evidence that any item is controlled, approved, or effective.
- Seven files under `src/modules/quarantine/catalog`; catalog/source digests are recorded separately from operational approval.
- The candidate SHA differs from the audit reference. Historical criterion evidence is therefore stale until each item is re-established against the candidate.
- The execution prompt pack reports 75 provisional score items, 45 outstanding, a 23.95-point preliminary earned roll-up, 3 failed points, and 73.05 untested/pending points. It names 45 outstanding criterion IDs and associates them with task cards, but does not map the three failed points to rows, list the 30 earned rows, or give per-row point weights. The reference audit report named in Project Mind is absent from this checkout and reference commit tree.
- Criterion ownership in `evidence.json` records exactly one primary function for each of the 45 outstanding IDs, derived from that criterion’s task-card owner. Other named functions remain in the supporting-owner field. Named individuals, official accountability acceptance, and an independent rubric reviewer were not supplied.
- Current accepted points: **0.00**. This records the lack of fresh criterion evidence and independent rubric acceptance; it does not assert absence of implementation.

## Verification

| Command | Result | Follow-up |
|---|---|---|
| `git rev-parse HEAD` | PASS — exact candidate recorded | Do not change the branch or remote. |
| `pnpm test:architecture` (Node 24.20.0) | PASS — boundary and route registry checks | This is source/automated evidence only. |
| `pnpm requirements:check` (Node 24.20.0) | BLOCKED, exit 1 | It cannot read missing `audit/100-percent/POLICY-CLOSURE-MATRIX.md` (`scripts/requirements/check-reconciliation.mjs:22`). Resolve the authoritative source provenance before restoring the file or changing the checker. |

Logs and SHA-256 digests are in `evidence.json`; raw command output is in `.ci-results/QC-LAUNCH-001/`. An earlier exploratory architecture run used Node 22.22.3 and is not used as evidence.

## Decision requests and owners

| Request | Primary owner | Dependency / evidence needed |
|---|---|---|
| Restore or identify the authoritative policy-closure matrix required by the reconciliation checker | QMS / Release authority | Controlled source path, revision, approval/effectivity and provenance; then rerun `pnpm requirements:check` on this exact candidate. |
| Supply the criterion-level QC360 scoring register and the exact reference audit artifact | Release engineering / audit | All 75 criterion rows, point weights, row statuses, evidence links, exact candidate binding, and explanation of the 3 failed points. |
| Accept the 45 primary functional-owner assignments | QC Manager / QMS | Confirm each role assignment and name accountable people through the authorized ownership process. |
| Reverify the 30 historical-rollup items and 45 outstanding items | Each primary function in `evidence.json` | Evidence type and acceptance rule per criterion; run source, automated, runtime, and authority checks only where specified. |
| Independent rubric review | Independent reviewer appointed by release authority | Review exact candidate evidence; record accepted point total and signed review reference. |

## No-change controls and rollback

There is no product patch to apply or production rollback. The only rollback is local removal of this three-file evidence packet if it is rejected. Preserve the frozen candidate identity and all pre-existing work. No commit, push, PR, branch change, deployment, production write, migration, or provider change is authorized or performed.

## Residual risk / sign-off

The baseline is incomplete at criterion-row status and authority level, and the required reconciliation command is blocked by a missing source file. Applied database state, provider/runtime parity, PostgreSQL runtime acceptance, human UAT, and independent score review were not examined here. Release decision remains **NO-GO**. Sign-off from QMS, release owner, and independent reviewer: **NOT PROVIDED**.
