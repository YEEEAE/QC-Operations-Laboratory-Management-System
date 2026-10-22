# CA-P-APPROVALS — execution status

## Outcome

**PARTIAL.** The approvals queue presentation was revised locally; authenticated, populated-record before/after acceptance and the requested browser matrix are not verified. No authority, API, schema, action, Sidebar, or domain workflow was changed.

## Before / after inventory

| Existing content / behavior | After presentation change | Status |
| --- | --- | --- |
| Page header and assigned-count badge | PageHeader retained; count moved to one register count below the header | Preserved, count remains unavailable during queue failure |
| Owner-specific purpose and owner decision notice | Preserved verbatim; no signature or release equivalence introduced | Preserved |
| Generic signature policy unresolved / partial notices | Preserved verbatim | Preserved |
| Provider failure | Existing ProviderUnavailableState retained with no zero count | Preserved |
| Assigned actionable approval read and owner pathway | Same `approvalReads.list.execute({ actor })`, same server-owned read and actor-derived owner path | Preserved |
| Subject identity/type and approval-case state | Desktop table and mobile cards | Preserved |
| Workflow, requester, current subject version | Desktop table and mobile cards | Preserved |
| Work-item status | Explicit “Work item state”, separate from decision availability | Preserved and clarified |
| Decision-capability projection and reason | Explicit “Decision availability”, same server-resolved capability labels and reasons | Preserved and clarified |
| Subject link to approval detail | Same `/approvals/{approvalCase.id}` route on table/card | Preserved |
| Read/filter/export/auth/pagination | No list filter/query, export operation, local authorization control, or server pagination contract exists in this page/read source | N/A; not added |
| Decision submission | Owned by `/approvals/[approvalId]`, not this register | N/A here; detail action remains unchanged |
| Sidebar, links, order, icons, permissions and behavior | AppLayout/Sidebar untouched | Preserved |

## State / transition / guard matrix

| Concern / state | Visible UI behavior | Transition or action | Source guard / evidence |
| --- | --- | --- | --- |
| Authentication absent | Redirect to login with `/approvals` return path | None on register | `Astro.locals.actor` gate in `src/pages/approvals/index.astro` |
| Queue read succeeds with records | Render authorized actionable rows and derived current capability | Open existing approval detail link | `ListMyApprovalsUseCase.execute` → `listActionable`; assignment or named-owner listing plus `authorizeApprovalView` in `list-my-approvals.ts` |
| Owner path | Owner header/policy notice; all actionable work may be listed | Detail action still requires server capability | `isOwnerApprovalPath(actor)` and `OWNER_APPROVAL_DEFERRAL` in `owner-approval-policy.ts`; not a signature and not a bypass |
| Work item `PENDING`/`IN_PROGRESS` | Recorded state shown separately | Capability can be available or blocked | `isApprovalWorkItemActionable`; `ResolveApprovalDecisionCapabilitiesUseCase` |
| Current subject/case version mismatch | “Version changed” status when capability resolver identifies stale | Open detail/reload current record | Resolver compares subject version with approval-case subject version |
| Assignment/scope/state/SoD denied | “Review only” status/reason or no current decision | No decision control on register | `authorizeApprovalDecision`; detail action enforces again server-side |
| Decision handler unsupported | “Review only” and owning-domain explanation | No decision control on register | Transition decision allow-list in approvals dependencies |
| Signature policy unresolved | Policy notice and “Policy blocked” capability | No action authority inferred | `approvalSignaturePolicyStatus`, `createApprovedSignaturePolicy`, capability resolver |
| Provider queue failure | ProviderUnavailableState; no fabricated count/list | Retry via provider component | Catch around authoritative list read; no error converted to empty |
| Read succeeds with zero visible rows | OperationalState empty with policy-aware explanation | None | Read-model result; not proof that every decision is available |
| Filter / export / pagination | Not applicable | Not implemented | No source support in approvals page/read contract; adding would require unrelated product/API contracts |

## Verification

| Check | Result |
| --- | --- |
| Focused presentation + existing owner/policy tests | PASS — 5 new surface assertions; 17 owner/signature policy assertions (22 total across the final focused invocation) |
| Astro build | PASS — `node node_modules/astro/astro.js build` with Node 24.20.0; one existing large-chunk warning |
| `astro check` | FAIL — 2 unrelated missing imports in `audit/CA-P-500/{committed-500,workingtree-500}.astro`; no errors reported in changed page/test |
| Graph refresh | NOT RUN yet |
| Before/after screenshots on same populated record/account/viewport | NOT RUN — disposable DB has zero approval cases and zero supported subject records; no fixture substituted |
| Authenticated allowed and rejected accounts on a real dynamic approval record | BLOCKED — no populated record; therefore cannot distinguish actual route/subject denial acceptance |
| 320/390/768/1024/1440 responsive runtime matrix | NOT RUN |
| Keyboard/focus, icon names, 200%/400% zoom, reduced motion, forced colors | NOT RUN in browser (CSS has explicit visible focus, forced-colors border/focus treatment; no motion introduced) |
| Runtime contrast measurement | NOT RUN |
| Accessible browser screenshots | NOT RUN |

## Functional debt kept out of scope

Approval reads are unbounded at the repository (`listActionable` has no paging/filter input), and requester name lookup is a second presentation-only source. These are existing read-path characteristics, not changed or repaired by this presentation task. Owner listing includes all actionable records by explicit centralized owner decision; it does not make all decisions available. Domain ceremonies and generic signing policy remain server/domain-owned.

## Files changed

- `src/pages/approvals/index.astro`
- `tests/unit/approvals/approvals-register-surface.test.ts`
- `audit/CA-P-APPROVALS/execution-status.md`
