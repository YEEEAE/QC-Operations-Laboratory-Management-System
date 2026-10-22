# CA-03 — proposed UI state contracts and source gaps

Date: 2026-10-17. Inspection started at HEAD `b4eea27a80cf4bc71b9180f75443a4391fcbcaac`.
Status: **PARTIAL — documentation proposal; runtime NOT VERIFIED**.
Only this document is written by this subtask. No application, policy, Sidebar,
schema, API, test, Mind, commit, remote or deployment change is authorized here.

## Evidence boundaries

- Read the complete `.agents/mind/01-mind-latest.md` (366 lines, contiguous
  tool continuations), `audit/CA-00/state-contracts.md` (100 lines),
  `audit/CA-00/report.md` (111 lines), and both CA-01 manifest/register files
  (217/2196 lines, including the register continuation).
- Ran `~/.venvs/graphifyy/bin/graphify query "UI state contracts filters auth export dialog"`
  before source browsing, then focused graph queries to locate the inspected files.
  Graph query results were scoped/truncated and are navigation, not complete coverage.
- Initial Git status was clean. Concurrent sessions may subsequently change the tree;
  source references below describe the bytes read, not a frozen final build.
- CA-01 manifest/register describe `567028c1`, not this inspection HEAD. Their
  88 Astro files = 86 screens + 2 redirects, 76 source/10 static/2 runtime classes,
  and nativePost flags are **historical inventory**, not fresh per-action verification.
  A page-level `nativePost:true` does not prove every mutation on that page has a
  no-JS path. API export routes are outside the Astro-screen count.
- CA-01 identifies rest/hover/focus as reference-observed; pressed/disabled/busy
  are derived proposals. None of the machines below is inferred from a screenshot.
- `VERIFICATION.md` was requested but is absent on this checkout.
- No browser, AT, build, unit, integration, concurrency or security test was run by
  this subtask. Source inspection is not proof of rendered or server behavior.

## Skill-discovery limitation and relevant mandatory instructions

Discovery found **387** `.agents/skills/**/SKILL.md` files, **2,324,077 bytes**,
including hidden nested copies. **The requested complete all-skill reading is NOT
COMPLETE**; do not report it as fulfilled. Fully read these local files:
`state-machine`, `component-spec`, `handoff-spec`, `feedback-and-status`,
`loading-states`, `keyboard-navigation`, `form-labelling`, `error-handling-ux`,
`error-prevention-recovery`, `verification-before-completion`, `karpathy-guidelines`.
Also invoked `using-superpowers`, whose explicit subagent-stop applies here.
The remaining discovered skill files have not been read by this subtask.

Relevant instructions applied, not a summary of unrelated skills:

1. `state-machine`: one focused concern per machine; states, events, guards,
   entry/exit effects, impossible states, visible representation, and an exit
   from every state. Diagrams below complement transition tables.
2. `component-spec` / `handoff-spec`: specify behavior and edge cases, keyboard,
   focus and announcements, not just colors; reuse token names and components.
3. `feedback-and-status` / `form-labelling`: visible text as well as color;
   persistent actionable errors; status/alert semantics; field-linked errors and
   persistent labels. No invented audio, haptics, countdown or progress estimate.
4. `keyboard-navigation`: logical tab order, visible focus, modal focus containment,
   focus return and safe recovery when the original control is gone.
5. `verification-before-completion`: fresh evidence before completion claims;
   source review cannot be promoted to browser/AT/UAT acceptance.
6. `karpathy-guidelines`: smallest scoped change; distinguish assumptions from
   facts. Here that means this document only.
7. Generic loading/optimistic/autosave/undo/automatic-retry examples in skills are
   **not project authority**. They do not authorize synthetic SSR loading,
   optimistic regulated decisions, client drafts, policy changes, automatic
   mutation replay, or reversal of controlled records.

## Shared invariants

- UI states describe transport/presentation, never a replacement domain machine.
  Scientific PASS, internal approval, material release and deployment remain distinct.
- SSR resolves directly to a result. Pending indicators appear only for an actual
  in-flight interaction. `reading` below is conceptual server work, not a new spinner.
- Preserve native GET/POST baselines and existing actions, actor derivation,
  permissions, scope, SoD, reason, reauthentication/signature applicability,
  expectedVersion and idempotency contracts. Do not invent tokens on unversioned grants.
- Unknown transport outcome is not failure-to-commit. Do not say “nothing changed”
  or replay automatically. Existing request identity must not be replaced merely to retry.
- Sidebar structure, links, order, icons, permission filtering and behavior are frozen.
- Public and authenticated content stays English/LTR. Use shared vocabulary and
  existing feedback primitives; do not leak provider details, secrets or hidden existence.
- `O` below = observed in inspected source; `P` = proposed interaction requirement,
  not an assertion that wiring exists across all routes.

## 1. READ — SSR registers and record reads

`request → reading → ready | empty | filtered-empty | unavailable | denied-or-missing`

| Current | Event → next | Guard and effect | Basis |
|---|---|---|---|
| request | GET → reading | Existing route/read authorization; no client delay | O |
| reading | rows → ready | Successful authorized result; show real rows/counts | O |
| reading | zero → empty / filtered-empty | Successful read only; active supported filters distinguish the two | O |
| reading | denied/missing → route-safe result | Preserve per-route enumeration policy; do not expose a denied record as existing | O |
| reading | unavailable → unavailable | Sanitized error; no fabricated zero/empty counts | O |
| ready/empty/filtered-empty | refresh → request | Real GET with current supported URL context | P per route |
| unavailable | retry → request | Read-only user retry; no mutation or endless loop | O/P per route |
| any rendered result | leave → exited | Existing safe link; no existence disclosure | P |

Representations: `EmptyTableState.astro:14–35`,
`OperationalState.astro:2–23`, route-specific errors and provider state.
`src/shared/errors/read-failure.ts:3–11` distinguishes MISSING/DENIED internally;
its detail contract renders them alike. `providerUnavailableResponse:23–34`
returns a safe 503 without declaring existence. Reports explicitly separate
404/403/400/503 in `src/pages/reports/[reportCode].astro:18–32`; do not force
that disclosure model onto other detail routes.

Impossible: unavailable + “0 records”; unverified read + success count;
denial + disclosed hidden record. Static policy screens do not simulate a read.

## 2. FILTER — editable controls versus applied server URL

`applied → editing → navigating → applied(result)`, with `editing → invalid`.

| Current | Event → next | Guard and effect | Basis |
|---|---|---|---|
| applied | edit → editing | Controls draft the next supported query; old rows still describe old URL | P model |
| editing | invalid submit → invalid | Existing native/server constraints only; keep inputs | P per route |
| editing/invalid | valid apply → navigating | Native GET, no fetch replacement; real pending text | O |
| applied/editing | clear → navigating | Existing clearHref removes only this register context | O |
| navigating | SSR response → applied | URL, rows and count derive from same server result | O/P per route |
| applied/error result | edit/retry/leave → editing/request/exited | Correct query or existing read retry; do not reinterpret an error as zero | P |

`FilterBar.astro:14–29` is GET/search with Apply/Clear and real submit
`aria-busy`/status. It does **not** implement fetch request IDs, cancellation,
latest-response arbitration or an obsolete-response event. Those rows in CA-00
are prospective only and must not be claimed implemented. No client response
race manager is needed for the current native-navigation baseline.
Empty interpretation is caller-controlled through `clearHref`
(`EmptyTableState.astro:21–35`), not independently verified query semantics.

## 3. FORM — create/edit and controlled mutation feedback

`editing → validating → invalid | submitting → success | classified-error | unknown`

| Current | Event → next | Guard and effect | Basis |
|---|---|---|---|
| editing/error | submit → validating | Approved action/eligibility exists; server remains authority | P per route |
| validating | invalid → invalid | Summary + field errors; focus first invalid; non-secret inputs retained | O |
| validating | valid → submitting | One existing POST/action; preserve version/request identity; busy text and submit disabled | O |
| submitting/success | second submit → unchanged | UI duplicate guard; does not replace server idempotency | O |
| submitting | confirmed result → success | Existing native 303 or enhanced detail navigation/reload | O |
| submitting | field rejection → invalid | Link actual field errors; do not infer fields from opaque domain errors | O |
| submitting | stale → stale | Refresh/review latest record; never silently merge/replay old intent | O/P |
| submitting | duplicate → duplicate | Separate duplicate-command class; reconcile stored outcome/conflict | O/P |
| submitting | auth changed → denied | Stop; safe error; no authority bypass | O |
| submitting | dependency/provider error → unavailable | Preserve inputs; no false empty/success | O |
| submitting | throw/transport loss → unknown | Outcome unconfirmed; record/history link before manual retry | O |
| stale/duplicate/unknown | review → editing/success/exited | Read existing record/history first; result-dependent manual decision | P recovery rule |
| success | committed navigation → exited | Clear unsaved warning only after confirmed commit | O |

Sources: `mutation-interaction.ts:9–45,75–127,152–202`;
`enhance-with-classification.ts:67–168`;
`validation-feedback.ts:25–100`; native helpers `mutation-post.ts:178–274`.
`classifyActionResult` has exact codes plus regex fallback: do not describe every
failure as exact-code classified. Native helpers currently group stale/duplicate
into `conflict`; that is not equal to enhanced-state parity.

The three creation routes remain a **gate before this machine**, not disabled
pseudo-forms: NCR `PD-15/PD-16`, CAPA `PD-18`, Retest
`POLICY_SOURCE_REQUIRED`. Their inspected pages render `DecisionStateCard`
and safe navigation, with no form or context-loading phase. CA-01 records the
blocked action/use-case guards; this subtask did not re-test those guards.
No state transition here supplies missing policy or permission.

## 4. DIALOG — review, pending, result and focus

`closed → review → pending → closed(success) | error`, `review/error → closed(cancel)`.

| Current | Event → next | Guard and effect | Basis |
|---|---|---|---|
| closed | open → review | Existing display-authorized trigger; save opener; showModal; focus inside | O |
| review/error | cancel/Escape → closed | Not pending; no domain change; restore connected opener | O |
| review/error | confirm → pending | Existing ceremony and valid required controls; server rechecks | P validity; O pending |
| pending | confirm/Escape → pending | No duplicate/no false cancellation; buttons disabled, status + aria-busy | O |
| pending | confirmed success → closed | Close only after callback success; focus return if possible | O |
| pending | failure → error | Persistent focused inline alert; stale reveals refresh | O |
| error | edit → review | Keep non-secret correction context; ceremony unchanged | P |
| error/stale | refresh → request | Existing reload, no automatic mutation replay | O |
| closed | opener absent → safe focus | Logical surviving record/main target, not detached control | P gap |

Sources: `ConfirmDialog.astro:37–85`; `dialog.ts:35–65,78–142`.
This generic dialog is `method="dialog"`, **not a native mutation POST baseline**.
Do not substitute it for a real server POST or change signature applicability.
The bound confirm click prevents default then invokes `run(dialog)` without an
explicit `checkValidity/reportValidity`; required reason enforcement must be
checked at each callback/server and cannot be assumed from `required` alone.
Focus restoration only handles a connected opener; vanished-opener fallback
claimed in CA-00 is not present in this helper.

## 5. AUTH — native sign-in, session recovery and logout

`signed-out → authenticating → signed-in | rejected | throttled | unavailable`.

| Current | Event → next | Guard and effect | Basis |
|---|---|---|---|
| signed-out/rejected | valid submit → authenticating | Native POST; pending text/disabled button; no secret persistence | O |
| authenticating | second submit → authenticating | JS duplicate guard only; native server remains authority | O |
| authenticating | session established → signed-in | Cookie set by server; safeReturnTo; native 303 | O |
| authenticating | bad credentials → rejected | Generic non-enumerating error, password not re-rendered | O |
| authenticating | throttled → throttled | Only server-derived retryAfterSeconds; no invented countdown/unlock | O |
| authenticating | store unavailable → unavailable | Distinct safe copy; fail closed | O |
| rejected/throttled/unavailable | edit/retry → signed-out/authenticating | Operator retry still subject to server limits | P model |
| signed-in | session expiry/revocation → signed-out | Existing session recovery contract, no silent permission upgrade | P; not traced end-to-end |
| signed-in | logout → signing-out | Existing logout action, session-service invalidation | O action |
| signing-out | success → signed-out | Expired cookie + existing /login destination | O action; UI wiring not traced |
| signing-out | failure → unconfirmed | Do not claim session invalidated without confirmation; safe recovery | P gap |

Sources: `src/pages/login.astro:8–15,37–79`,
`src/actions/auth.ts:17–95,100–118`. Login uses 440px max panel/48px
controls (`login.astro:84,92–95`), not the generic 44px floor.
Do not add an artificial SSR authenticator or claim navigation failure is a
credential rejection. No JS bfcache/aborted-navigation recovery is established
by this inspection; the page sets its submitting flag until navigation.

## 6. EXPORT — pinned dataset, native attachment and stale recovery

`displayed → requesting → attachment-response | stale | denied | invalid | error`.

| Current | Event → next | Guard and effect | Basis |
|---|---|---|---|
| displayed | export CSV/XLSX → requesting | Existing native link with supported filters + displayed snapshot digest | O |
| requesting | valid authorized matching dataset → attachment-response | Re-run source/server scope; run/export permissions; attachment + no-store | O |
| requesting | changed digest → stale | 409 REPORT_DATASET_CHANGED; no substitute current dataset | O |
| requesting | missing session/permission → denied | Existing 401/403; no rows leaked | O |
| requesting | invalid query → invalid | Format and one 64-hex snapshot required, filters parsed server-side | O |
| requesting | missing report/unexpected failure → not-found/error | Existing safe endpoint response | O |
| stale | refresh report → displayed | Operator re-reviews new dataset before explicit new export | P |
| denied/invalid/error | recover/back → displayed/exited | Existing safe report/register destination; never report download success | P |
| attachment-response | browser saves/cancels → outside-app | No in-app proof of filesystem save, open, retention or deletion | Boundary |

Sources: `src/pages/reports/[reportCode].astro:21–32` (full long markup line
also read untruncated), `src/pages/reports/[reportCode]/export.ts:25–64`,
`src/modules/reporting/application/export-report.ts:31–74`.
There is no inspected in-page download FSM, completion toast, progress event,
or friendly 409 recovery panel. The endpoint returns JSON on error; documenting
the recovery proposal does not claim it is wired. A dataset digest is
request-local consistency, **not a retained durable report run**. Print is an
unapproved informational copy, not approval/release evidence.

## 7. BLOCK — informational policy barrier

`blocked → OPEN_ALLOWED_LINK → exited`; `blocked → REFRESH → blocked`.

| Current | Event → next | Guard and effect | Basis |
|---|---|---|---|
| blocked | OPEN_ALLOWED_LINK → exited | Only existing safe navigation links; leave without mutation | O |
| blocked | REFRESH → blocked | Native GET; no policy decision changed; render the barrier again, no synthetic pending stage | O |
| blocked | SUBMIT/CREATE → forbidden | No form/action is exposed by these barrier pages; no alternative creation button | O |

Guard source: `src/pages/quality/ncr/new.astro:8–12,19–30` explicitly
requires PD-15/PD-16 and preserves register/finding navigation. CAPA/Retest
remain the CA-F-* authority gates described above; this contract does not
implement those forms. Entry is the visible `DecisionStateCard`; exit is native
navigation. No read retry control or spinner is added to a static barrier.
Runtime rejection and safe-link navigation on this candidate: NOT RUN.

## Additional concern (not one of the requested seven): UNSAVED

`clean → dirty → warning → dirty(continue) | exited(discard)`;
`dirty → committed-clean → exited`.

| Current | Event → next | Guard and effect | Basis |
|---|---|---|---|
| clean | input/change → dirty | Eligible editable form; in-memory boolean only | O |
| clean | leave → exited | No warning when nothing changed | O |
| dirty | beforeunload → warning | Browser-owned discard/continue choice; no custom text promise | O |
| warning | continue → dirty | Keep page and inputs; no persistence | O browser contract, NOT VERIFIED |
| warning | discard → exited | Browser navigation; not a server undo/delete | O browser contract, NOT VERIFIED |
| dirty | enhanced submit → dirty | Intercepted attempt is not confirmed commit | O |
| dirty | commit event → committed-clean | qc:form-committed only after confirmed success | O |
| dirty | native non-intercepted submit → clean/navigation | Existing intentional POST baseline; failed response must retain values | O/P per route |
| attached | detach → detached | Remove listeners and dataset marker | O |

Sources: `unsaved-changes.ts:10–25,43–85`,
`enhance-with-classification.ts:113–125`. No autosave, Web Storage drafts,
IndexedDB, cross-tab recovery or signature/reauthentication targeting.
The helper marks dirty on any input/change, even if the user restores original
values; value-equality reconciliation is not implemented. Native beforeunload
reliability on mobile, bfcache and browser-disallowed prompts remains NOT VERIFIED.

## Precise gaps / parent integration checklist

1. **CA-00 evidence mismatch:** `audit/CA-00/report.md:52` says seven contracts
   DONE; its 100-line state-contracts file has five concern headings only
   (READ/FILTER/FORM/DIALOG/AUTH). EXPORT and BLOCK above are additions,
   explicitly proposed documentation, not proof of implemented machines.
2. **CA-00 overclaim:** latest filter-response arbitration, generic reconciliation,
   vanished-opener focus and universal 303/error preservation are not established
   across routes. Replace absolute claims only after route-level evidence.
3. **Mutation recovery is guidance, not a hard lock:** transitionMutation permits
   SUBMIT from non-pending/non-success states. The classified enhancer shows
   review-before-retry links but does not enforce a completed reconciliation read.
   This is not server-idempotency verification.
4. **Native/enhanced classification parity is incomplete:** `mutation-post.ts`
   coalesces stale/duplicate in conflict wording, whereas the enhanced helper
   distinguishes exact codes. Do not change domain policy to hide this UI gap.
5. **Dialog gaps:** confirm validity and vanished-opener focus require targeted
   callback/browser evidence. `method="dialog"` alone proves no mutation fallback.
6. **Export recovery is not yet an in-page flow:** native error response is JSON;
   browser file completion cannot be observed as a successful save by this page.
7. **Skill-read prerequisite remains partial:** 387 discovered, 11 local skills
   fully read plus using-superpowers invocation. Do not claim all-skill compliance.
8. **No acceptance claims:** route-wide wiring, populated scenarios, denied/missing
   parity, no-JS mutations, stale/duplicate/transport-loss journeys, keyboard/AT,
   zoom/reflow, runtime and server atomicity are NOT RUN here. Parent should
   re-read affected current sources before integrating while other agents work.

Suggested verification scenarios (NOT RUN): READ provider outage versus true zero;
FILTER invalid/apply/clear/back with JS off; FORM double-submit/stale/unknown outcome
without auto-replay and with the same request identity; DIALOG invalid reason,
pending Escape, failed callback and missing opener; AUTH bad credentials/throttle/
store outage/aborted navigation; EXPORT dataset change/denied snapshot; UNSAVED
clean/dirty/restored-original/native/enhanced success/failure and mobile leave.

`PASS ≠ RELEASED`. This proposal does not close policy, governance, AT, UAT,
WCAG conformance, full-route acceptance or production-readiness gaps.
