# CA-03 — UI state contracts

Modelled with `.agents/skills/state-machine`: one small machine per concern, explicit
events, guards taken from the existing server/source behaviour, and an exit from every
state. These are UI descriptions of behaviour already implemented in the application;
they are not a replacement business machine. SSR pages resolve directly to a rendered
state and do not gain a synthetic spinner.

Existing representations reused: `OperationalState`/`EmptyTableState`/
`ProviderUnavailableState`, `FormErrorSummary`, `ConfirmDialog`, `ESignatureDialog`,
`classifyActionResult`, `PolicyBlocker`, `DecisionStateCard`.

## READ — registers and detail reads

| Current | Event | Next | Guard | Effect / view |
|---|---|---|---|---|
| idle | LOAD | loading | existing read permission/route decision | start the existing read; no placeholder counts |
| loading / retrying | RESOLVE | ready / empty / filtered-empty | valid fresh response; zero rows with or without filters | render rows or the empty reason |
| loading / retrying | DENIED | denied | server denies; enumeration policy respected | render denial or the route's 404 contract |
| loading / retrying | NOT_FOUND | not-found | server allows existence disclosure | safe message and recovery link |
| loading / retrying | UNAVAILABLE | unavailable | existing failure classification | remove success numbers; sanitized provider message |
| loading / retrying | FAIL | error | non-sensitive classified error | safe message; no stack or endpoint |
| unavailable / error | RETRY | retrying | read-only retry; never a mutation | re-run the same read; no endless loop |
| ready / empty / filtered-empty | REFRESH | loading | same scope/filters | keep context; mark a stale snapshot |
| denied / not-found | LEAVE | exited | allowed safe route | navigate without disclosing hidden existence |

`loading → ready | empty | filtered-empty`; `unavailable | error → retrying → result`;
`denied | not-found → exited`.

## FILTER — register filters

| Current | Event | Next | Guard | Effect / view |
|---|---|---|---|---|
| applied | EDIT | editing | filter exists in source | draft only; results unchanged |
| editing | APPLY | loading | GET parameters supported | existing URL/action; no new server filter |
| editing | INVALID | editing | validation rejects | field-linked error; query retained |
| applied / editing | CLEAR | loading | this register's filters only | default URL per contract |
| loading | RESOLVE | applied | result belongs to latest request | rows/count/URL update together |
| loading | OBSOLETE_RESPONSE | loading | newer request exists | discard old result |
| loading | FAIL | failed | latest request failed | keep filters; announce failure |
| failed | EDIT / RETRY | editing / loading | read-only | correct or re-request |

## FORM — create/edit surfaces (including the three creation routes)

| Current | Event | Next | Guard | Effect / view |
|---|---|---|---|---|
| editing | SUBMIT | validating | action exists and is available | local validation is UX only; server revalidates |
| validating | INVALID | invalid | invalid field | linked summary; focus first error |
| invalid | EDIT | editing | user input | retain non-secret values |
| validating | VALID | submitting | declared eligibility; server is authority | one POST; `aria-busy` |
| submitting | SUBMIT_AGAIN | submitting | request pending | UI duplicate guard; server idempotency remains required |
| submitting | SUCCESS | success | confirmed server success | existing 303/refresh; no optimistic approval |
| submitting | VALIDATION_ERROR | invalid | server field errors | retain values; link messages |
| submitting | CONFLICT_STALE | stale | action uses `expectedVersion` | show `Refresh record`; no automatic replay |
| submitting | AUTHORIZATION_CHANGED | denied | server rejects current authority | stop; hide per source policy |
| submitting | DUPLICATE_COMMAND | duplicate | idempotency response | show stored result or conflict; no new intent |
| submitting | FAIL / TIMEOUT | failed | unconfirmed result | do not claim nothing changed; retain the intent key |
| failed / duplicate | RECONCILE | editing / success / stale | existing read/API | verify before a manual retry |
| stale | REFRESH | editing | latest version fetched | explain the re-review; never merge an old intent |
| denied | LEAVE | exited | safe route | exit without bypass |
| success | NAVIGATE | exited | server success destination | follow 303 and move focus |

`editing → validating → invalid → editing`; `validating → submitting → success → exited`;
`submitting → stale → refresh → editing`; `submitting → denied → exited`;
`submitting → failed | duplicate → reconcile`.

### Applied to the three creation routes (current source gate)

`context-loading → eligible | policy-blocked | source-unavailable → FORM`, then the
FORM machine above. In the current source **all three resolve to `policy-blocked`**:
the eligibility decision and record-number policy are missing (NCR/CAPA) and the
retest policy provider is `POLICY_SOURCE_REQUIRED`. The routes therefore render
`DecisionStateCard`, not a form. No spinner, no disabled pseudo-form, and no write.

## DIALOG — confirmations and decisions

| Current | Event | Next | Guard | Effect / view |
|---|---|---|---|---|
| closed | OPEN | review | trigger exists and is display-authorized | save opener; open and set focus |
| review | CANCEL / ESCAPE | closed | not pending | close; restore focus to opener |
| review | CONFIRM | submitting | source ceremony (reason/reauthentication) if applicable | call the existing action; do not change ceremony |
| submitting | ESCAPE / CONFIRM | submitting | request in flight | no second submit; no false cancel |
| submitting | SUCCESS | closed | confirmed server response | update view; restore focus if opener vanished |
| submitting | FAIL | error | classified failure | error inside dialog; FORM rules apply |
| error | EDIT | review | correction allowed by result | retain non-secret values |
| error | CANCEL | closed | no request in flight | close without domain change |

## AUTH — sign in

| Current | Event | Next | Guard | Effect / view |
|---|---|---|---|---|
| signed-out | SUBMIT | authenticating | valid inputs | existing native POST; never store the secret |
| authenticating | SUCCESS | signed-in | server session proven | existing safe `returnTo` only |
| authenticating | FAIL | sign-in-error | classified rejection/unavailability | generic message; re-enable |
| sign-in-error | EDIT | signed-out | no request in flight | re-enter; password not retained |
| signed-in | LOGOUT | signing-out | logout exists | existing route |
| signing-out | SUCCESS | signed-out | session invalidated | return to sign-in |

Note: the login panel is 440px wide and its controls are 48px high (project contract);
the rest of the authenticated surface keeps the 44px minimum.
