# Copy Glossary — Governed Product Terminology

Applies to all user-facing text in `src/pages/**`, `src/ui/**`, and module-produced UI
strings. This is the single terminology-governance source for the product wording; it
does **not** create policy, authorization, or state-machine rules.

- **Owner of wording:** task family 023 (UX Writing / Microcopy; Content Design / Terminology Governance).
- **Owners of meaning:** the domain that owns the state machine or permission. Wording never
  redefines a server rule; it only names one.
- **Requirement owners for unresolved scope:** 013 (policy/applicability decisions) and 026.
- **Implementation source of record:** `src/shared/copy/ux-vocabulary.ts`, consumed by pages and
  components. `Documents/UX-WRITING-GUIDE.md` remains the writing standard.

## 1. Precedence

If wording ever conflicts with a server rule, the server rule wins and the wording is the defect.
The order is: server authorization and state machines → approved requirements → this glossary →
the writing guide → page-local copy.

## 2. Regulated terms — never renamed, translated, or softened

These keep their exact spelling and casing everywhere, including filter options, badges,
table cells, and export output.

| Term | Exact form | Never rendered as |
| --- | --- | --- |
| Scientific pass | `PASS` | Pass, passed, OK |
| Scientific fail | `FAIL` | Fail, failed, Not OK |
| Quarantine hold | `HOLD` | Hold, On hold, Blocked |
| Release fact | `RELEASED` | Released, Released, Yes |
| Void record | `VOID` | Void, Cancelled, Deleted |
| Non-conformance | `NCR` | Ncr, Non-conformance report (in headings) |
| Corrective/preventive action | `CAPA` | Capa |
| Segregation of duties | `SoD` | SOD, segregation |

`stateLabel()` already preserves these; a page must not special-case their casing.

## 3. Controlled lifecycle words — one meaning each

These five words are **not** synonyms. Copy must never collapse them or let a surface imply
the next step. Canonical strings live in `uxVocabulary.lifecycle`.

| Word | Means | Explicitly does not mean |
| --- | --- | --- |
| **Saved** | Stored as a draft. | Submitted, reviewed, approved, released. |
| **Submitted** | Sent for review. | Reviewed, approved, released. |
| **Reviewed** | A reviewer examined the record. | Approved, released. |
| **Approved** | The controlled approval decision was accepted. | Released, applied to the target. |
| **Released** (`RELEASED`) | A separate, policy-controlled release action was accepted by the server. | Granted by `PASS`, approval, or page visibility. |

Related, separately governed words:

| Word | Means | Owner |
| --- | --- | --- |
| **Applied** | An approved change was applied to its target by the owning domain. | Change Requests |
| **Effective** | A controlled document version is the current effective revision. | Controlled Documents |
| **Finalized** | A daily reject record was finalized (immutable snapshot). | Reject Reports |

## 4. State codes → labels (single source)

Every raw enum renders through `stateLabel(code)`. The governed list lives in
`stateLabels` in `src/shared/copy/ux-vocabulary.ts`; it is the only place a code-to-label
mapping may be declared. Adding a new state code means adding its label there — never
inlining a different label on a page.

Representative governed pairs (see the module for the full list):

| Code | Label |
| --- | --- |
| `DRAFT` | Draft |
| `SUBMITTED` | Submitted |
| `SUBMITTED` / `UNDER_REVIEW` | Under review (`IN_REVIEW` → In review) |
| `PENDING_QCM_APPROVAL` | Pending QCM approval |
| `APPROVED` | Approved |
| `EFFECTIVE` | Effective |
| `SUPERSEDED` | Superseded |
| `APPLYING` / `APPLIED` / `APPLICATION_FAILED` | Applying / Applied / Application failed |
| `ISSUED` / `APPROVAL_TRACKING` / `FINALIZED` | Issued / Awaiting approvals / Finalized |
| `OVERDUE`, `OUT_OF_SERVICE`, `DECOMMISSIONED` | Overdue, Out of service, Decommissioned |

An unknown code falls back to a sentence-cased humanization — it is never invented into a
meaning the domain has not approved.

## 5. Other governed vocabularies

| Vocabulary | Helper | Notes |
| --- | --- | --- |
| Authorization scope kinds | `uxVocabulary.scopeKindLabels[kind]` | `OWN` → "Own records"; codes stay server-side. |
| Change-request target types | `targetTypeLabel(code)` | `DOCUMENT_VERSION` → "Controlled document version". |
| Approval workflow types | `workflowTypeLabel(code)` | Unknown codes pass through verbatim, never guessed. |
| Severity | `severityLabel(severity)` | `Not classified` when absent — never a fake value. |
| Audit transitions | `transitionLabel(from, to)` | Never renders "not set to not set". |
| Release state | `releaseStateLabel(boolean)` | `RELEASED` / `Not released`. |

## 6. Boundary statements the copy must keep

| Boundary | Canonical wording | Owner |
| --- | --- | --- |
| `passNotRelease` | PASS is a scientific result. It does not release the item. | Quarantine |
| `backupNotRestoreProof` | A backup created or verified here is not proof of a verified restore. | Backup/Recovery |
| `aiNotAuthority` | AI output is advisory only. It cannot approve, reject, release, sign, or set an official PASS/FAIL. | AI Advisory |

Restore requests never say or imply that a restore executes. Permission denials name the
explicit permission; role membership is never described as authorization.

## 7. Error and outcome wording

Failure copy is chosen by canonical server error class (`uxVocabulary.errorClasses`), never
one generic failure. Each message says what happened, what did **not** change, and the next
step. Forbidden anywhere: "Something went wrong", "An error occurred", "Unexpected error",
"Try again later" as a complete message, and any copy that blames the user, exposes a stack
trace, SQL, table name, provider name, or secret.

Retention wording ("your entries are preserved") may only appear where the surface actually
keeps the submitted values — the client-side never-clears-input contract and the
server-side value re-render. A surface that does not preserve entries must not claim it.

## 8. Empty, filtered-empty, unavailable, and no-data

Four distinct states, never merged:

| State | Says | Never says |
| --- | --- | --- |
| Unavailable | The read did not confirm a response; this view is not empty; no count is shown. | "No records", "0 results". |
| Filtered-empty | No records match the selected filters; offers "Clear filters". | "No records yet". |
| Truly empty | No records exist in your authorized scope; offers the create action. | A count of zero from an unavailable read. |
| Not determined | The value was not produced (e.g. `NOT_DETERMINED`). | A guessed value. |

## 9. Change control

1. Change the wording in `src/shared/copy/ux-vocabulary.ts` first; never inline a duplicate of a
   canonical sentence on a page.
2. Update `Documents/UX-WRITING-GUIDE.md` and `Documents/COPY-INVENTORY.md` only if the change
   alters a rule or adds a surface.
3. Re-run `tests/unit/ui/copy-governance-contract.test.ts` and
   `tests/unit/ui/ux-writing-contract.test.ts`.
4. If a change would rename a regulated term, translate the product, or promise something the
   server does not commit, it needs an owner decision (013/026) before implementation.
