# QC visual system — decision room

Status: implemented locally for the dashboard, task and laboratory registers, laboratory creation, and approval queue/detail. This document describes presentation, not approval authority or release readiness.

## Three original directions

| Direction | Work rhythm and composition | Density and type | State and evidence treatment | Best task |
| --- | --- | --- | --- | --- |
| Decision room | Priority queue first, a horizontal stage rail, then recent evidence and coverage | Medium; large decision heading, quiet metadata | Text state plus bounded semantic edge; every count links to its source and shows scope/freshness | Decide what to inspect or act on next |
| Scientific bench | Full-width compact register and precise entry form | High; tabular figures, sticky record key, restrained labels | Method/version and result remain adjacent; missing values say “Not determined” | Find a sample, compare measurements, enter a test |
| Evidence chronology | Subject header, controlled snapshot, event sequence, decision area | Medium-low; chronology and version outrank decoration | Source, actor, time, version and integrity reference remain visible or explicitly unavailable | Review and justify an approval |

The decision room is the primary direction. It exposes urgent work without making a reviewer open several tiles to find a source. The bench and chronology are distinct page families inside the same language. Readability is protected by a 12px utility floor, 44px interactive targets, text labels for all states, and a compact table only where scanning benefits. Task-time improvement is a design hypothesis until measured with representative operators; no human timing claim is made here.

## Token contract

`src/ui/styles/tokens.css` has primitive colors, semantic surfaces/text/borders/states, component aliases, typography, spacing, density and motion. Components consume semantic aliases. `workspaces.css` composes those aliases for the three page families. PASS, APPROVED and RELEASED remain distinct; a scientific PASS never implies release. State words and evidence text are mandatory alongside color.

| Family | Semantic hook | Purpose |
| --- | --- | --- |
| Decision room | `surface-command`, `border-command`, `space-command`, `type-command` | Prioritize actions and show the source contract |
| Bench | `surface-register`, `type-data`, `line-height-data`, compact density | Scan rows and preserve the key column |
| Chronology | `surface-evidence`, `text-provenance`, `border-evidence` | Read source and sequence |
| Feedback | `state-idle/loading/empty/filtered-empty/error/denied/stale/success` | Consistent boundary, always paired with a literal label |

## Component and state contract

`OperationalState` accepts a state, specific title and description, and optional recovery link. It renders idle, loading, empty, filtered-empty, error, denied, stale and success with the same structural anatomy. Urgent states announce as alerts; other states use status. Existing `LoadingState`, `StaleVersionState`, `ProviderUnavailableState` and field error summary remain in their current workflows. A filtered empty state offers filter removal; an unavailable provider must not claim zero; denied must not expose counts. Success follows confirmed server response only.

## Surface rules

- Dashboard: attention and stage flow precede trend; snapshot time, source, scope, window and unavailable coverage remain visible. No client-side official count.
- Dense register: record key stays visible during horizontal table scroll; server controls filters, sort and pagination. Mobile may scroll the table inside its own region while page width stays fixed.
- Entry form: controlled source and version precede identifier. Required labels stay visible; invalid fields and preserved input have specific recovery copy. Save draft is not approval.
- Approval: controlled subject and version precede the decision form; reason is required for return/reject. The server rechecks authority, state, version and signature. Stale recovery does not submit automatically.
- Detail: chronology carries time and transition; evidence unavailable is stated. Print removes dark surfaces but preserves labels, table headers, and references.

## Contribution and drift control

Core UI owners maintain tokens and common components; domain contributors own page content and read-model wording. A proposed token or component change includes use case, state matrix, screenshots at 320/390/768/1440, keyboard and contrast review, forced-colors/reduced-motion/print review, and any breaking migration note. Review must include one UI maintainer and the owning domain reviewer for controlled language. New raw colors or local status meanings require an explicit design decision. Do not change authority or business rules in presentation components.

Prefer extending a semantic token over copying a hex value. Prefer an existing state component over local ad hoc error text. Record breaking prop or token changes with a migration path and keep the previous API until consumers move. Refresh the workspace map after adding files. A visual change is accepted only with current build/typecheck and a human check of the affected workflow; a screenshot alone does not verify authorization or task time.

## Evidence status

Automated checks and screenshots for this local change are recorded in the task handoff. Authenticated browser behavior and human task times require a disposable populated environment and representative users; they must not be inferred from a static visual specimen.
