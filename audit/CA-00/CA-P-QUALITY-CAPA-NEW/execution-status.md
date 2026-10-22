# CA-P-QUALITY-CAPA-NEW — New CAPA

Execution state: **BLOCKED**. Date: 2026-10-17. Inspected HEAD: `a8e289f71534f48ddc9c8486bf7bcb1b9fa9751b`.

No product files changed. Existing working-tree changes to the Mind and
`audit/CA-F-02/` were preserved. This record is not form acceptance.

## Stop condition

The mandatory dependency CA-F-02 is BLOCKED in
`audit/CA-F-02/execution-status.md`; no CA-F-04 execution artifact was found
under `audit/`. The functional exception permits implementation, but does not
supply the missing authority for NCR/RCA eligibility, PD-18 requirement flags,
action assignment/initial state or action-plan input rules. Do not restore the
historical blocker-only description as the intended final design: the requested
operational form remains outstanding, conditional on these sources.

The inspected page has no form, hidden inputs, POST handler or page client
script. It imports PageHeader, AppLayout and DecisionStateCard. PageHeader and
DecisionStateCard are presentation components. AppLayout's client script manages
navigation, preferences, dialogs and scroll regions; it does not create CAPA.
`src/actions/capa.ts` exposes JSON create accepting only `ncrId` and unconditionally
throws FORBIDDEN with `CAPA creation requires an approved source/RCA relation.`
That wording does not establish that RCA is mandatory.

## Reachability / transition matrix

| Concern | State or transition | Source / disposition |
| --- | --- | --- |
| READ | Unauthenticated → login | `new.astro`: absent `Astro.locals.actor`, redirect with returnTo |
| READ | Authenticated → decision card | `new.astro`: unconditional card after actor guard; no NCR/RCA query |
| FORM | Create → denied | `src/actions/capa.ts`: UUID validation followed by unconditional FORBIDDEN |
| FORM | Editing, validation feedback, pending, saved DRAFT → record | N/A in current page: no form or connected create flow; requested implementation BLOCKED, not accepted |
| READ | Populated linked context / provider failure | N/A in current page: no source read; remains a functional gap, not an empty dataset |
| FILTER / EXPORT | N/A | No page filter or export operation |
| AUTH | N/A as a new page concern | Existing authentication redirect preserved; no login or reauthentication ceremony on this page |

P-04 close remains separate from creation. PD-15..18, scientific evaluation,
signatures, schema/API and Sidebar were not modified. No claims of effectiveness,
successful DRAFT persistence, source eligibility or authorization acceptance.

## Evidence and verification

| Check | Result |
| --- | --- |
| Graph query | PASS via installed `~/.venvs/graphifyy/bin/graphify query`; initial bare command unavailable on PATH; scoped output used for navigation only |
| Complete page / PageHeader / AppLayout / DecisionStateCard / CAPA action reads | PASS, static inspection only |
| `git diff --check` before documentation addition | PASS; not workflow evidence |
| Build / typecheck / affected unit tests | NOT RUN; no product change |
| Before/after same actor, data and viewport; 320/390/768/1024/1440 screenshots | NOT RUN; no new visual candidate |
| Keyboard / focus / contrast / long text / 200% / 400% / forced-colors / reduced-motion | NOT RUN |
| Authorized and denied accounts with real populated source; native POST / JS / replay / rollback / redirect | BLOCKED for operational creation; no live account or database test attempted |

No production connection, commit, push, merge or deploy. PASS ≠ RELEASED;
APPROVED ≠ EFFECTIVE. Resume after a specific approved source resolves CA-F-02,
then execute CA-F-04 and the page acceptance matrix on the same candidate.
