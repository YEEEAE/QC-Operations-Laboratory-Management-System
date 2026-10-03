# QC-POST-100-018 — current-candidate reconciliation

**State: PARTIAL / EVIDENCE_PENDING**

## Candidate and scope

- HEAD: `39b76be4395811d653d23cc27e8e15496b6260de` (`main`).
- Initial tracked/untracked working tree: clean. The only task-time pre-evidence modification was the Project Mind reconciliation entry.
- Current route registry: 86 canonical routes in `src/shared/routing/routes.ts`; separate `/404` and `/500` pages bring the source scope to 88 pages.
- `Documents/COPY-INVENTORY.md` was corrected to distinguish its route-family/source inventory from complete rendered-state coverage.
- Baseline candidate available: `f284dc38b6c5bda68ad6a28ff91a419f0f85c7bc` from the frozen prompt-pack optimization. `before-html.txt` and `before-md.txt` freeze the *prompt pack*, not rendered product copy; they are not valid product-copy word-count baselines.
- Source changes between that candidate and current HEAD touch 21 copy/page source files (331 added and 131 removed lines, including a new correction-form component). Line churn is not an eligible-copy word-count reduction measurement.

## Evidence reconciliation

| Acceptance area | Current evidence | Classification |
| --- | --- | --- |
| Source vocabulary, terminology and route-family inventory | `Documents/UX-WRITING-GUIDE.md`, `Documents/COPY-GLOSSARY.md`, `Documents/COPY-INVENTORY.md`; earlier UX handoffs | PARTIAL; earlier handoffs are historical candidates |
| All 88 pages and all rendered states, including print and accessible names | No current candidate-bound rendered-state inventory found | NOT VERIFIED |
| Frozen product-copy baseline and 50% eligible explanatory-text reduction | Frozen prompt-pack artifacts do not freeze product copy; source-line counts are not a word metric | NOT VERIFIED |
| Preservation of regulated/control meaning | Current glossary and source contracts preserve core terms and boundaries; no exhaustive current rendered comparison | PARTIAL |
| Browser, keyboard, zoom, mobile and print rendering | No current candidate-bound browser evidence found | NOT VERIFIED |
| Human operator comprehension / usability acceptance | No signed participant/scenario evidence found | NOT VERIFIED |
| Schema/migration/PG transaction evidence | Presentation-copy scope; no schema change identified or made | N/A for changes made in this reconciliation only |

## Disposition

The previous UX-writing work remains valid as historical/source-level work and is not
reworked without a reproduced defect. The older copy inventory said 87 canonical routes;
the current registry has 86, plus two separate error pages. The current target is therefore
88 source pages, not an assumed 88 canonical routes.

No page copy was rewritten in this reconciliation: there is no valid frozen product-copy
word baseline yet, and static source inspection cannot establish the exact rendered copy in
all states or prove that no controlled meaning changed. Do not claim the 50% target or
acceptance closure from this packet. Continue with an exact-candidate rendered inventory
and reviewed baseline/eligibility dispositions, then make only individually justified copy
edits. Human usability, manual AT, and browser evidence remain required and cannot be
substituted by source tests.

## Current dependency boundaries

- Preserve `PASS` / `FAIL` / `HOLD`, `RELEASED`, `VOID`, `NCR`, and `CAPA` as controlled vocabulary.
- Keep approval separate from release; inspection/laboratory PASS does not release an item.
- Preserve uncertainty after an unknown write; do not invite a blind retry.
- Preserve P-04 closure limits and the explicit distinction between closure and effectiveness.
- Missing scientific or policy authority remains blocked by its owning source; copy edits cannot supply it.

No database, provider, production, authorization, or release operation was performed.
No commit or push was performed.
