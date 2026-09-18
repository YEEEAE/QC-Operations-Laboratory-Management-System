# Browser adapters for URL-only websites

Use this path when only the running page is accessible. Apply the shared contracts in [the skill entrypoint](../SKILL.md). A local adapter changes the current browser document, not the hosted website or other users' sessions.

## Establish a permitted execution path

Inspect origin, route, frame, visible workflows, existing tools, and available browser tooling without consequential actions. When discovery exists, inspect descriptors and reuse equivalent tools from the intended frame. Otherwise report discovery as unavailable; do not require `getTools()` just to use supported registration. Never invent selectors or endpoints from a URL alone.

Use an already-permitted page-world execution facility, or deliver a reviewable script with manual instructions when inspection provides enough evidence. An extension's isolated world may not expose page JavaScript or registrations to the consumer; verify the realm rather than assuming shared globals. Inspection-only tooling cannot inject scripts or be bypassed through another transport.

Default to session-local execution with an explicit teardown function. Persistent userscripts, extensions, or injection on future visits require a separate request. For an already-requested bridge, verify its version, documented registration contract, origin permissions, and client connection. Its presence does not prove native support; never install one silently.

When the producer API is absent or policy denies registration, deliver feasible source and the concrete blocker. An available producer with no accessible consumer is a different outcome: it may register successfully but remain unverified. Neither a private registry nor ordinary browser automation substitutes for WebMCP.

## Bind tools to observed workflows

Keep a small fixed set of domain operations, scoped to the exact intended origin and applicable routes. Recheck that scope on each invocation; a long-lived SPA can move to another workflow without replacing the document.

Prefer an observed, intended page API when it is accessible and reproduces the UI's validation and permissions. Otherwise bind to the existing forms and controls. Use declarative attributes only for forms whose browser-generated schema and submission behavior can be verified; complex workflows usually need imperative wrappers. Follow [Source integration](source-integration.md) only for the relevant registration or form contract, not as permission to edit the site's source.

For DOM-backed actions:

- Choose targets by observed stable IDs, semantic attributes, labels, and relationships within the correct form/frame. Re-query each invocation and require expected match count, visibility, and editability. Validate target identity as well as selector uniqueness: a reused editor can represent a different record.
- Keep selectors and URLs internal to the adapter. Validate domain inputs before filling fields; never accept arbitrary selectors, JavaScript, or arbitrary fetch destinations from the caller.
- Check all inputs and preconditions before filling anything. Respect unrelated unsaved edits. With framework-controlled inputs, use observed input/change behavior and verify application acceptance, rather than assuming a DOM assignment updated state.
- Preserve validation and submitter behavior. Prefer the site's normal submit control or `requestSubmit()` when appropriate; raw `form.submit()` skips validation and submit listeners. Never replace a consequential review step with automatic submission.
- If the site requires trusted user activation, inaccessible frames, closed internals, or a challenge such as CAPTCHA, keep that step with the user and report the limitation. Do not bypass it or guess private endpoints.

## Prove completion, not just DOM activity

Decide how completion can be observed before choosing the action mechanism. Prefer an existing operation promise, documented completion event, or request/record identifier. If only DOM signals exist, observe before triggering the action and combine the relevant loading-to-settled transition with matching inputs/target and fresh results. A matching query attribute plus any mutation is insufficient: refreshing the same query can show “Loading…” while retaining old metadata.

Bound observation by timeout and cancellation. Recheck route/record identity while awaiting results, and avoid returning another workflow's content. Serializing adapter calls does not exclude concurrent human activity; use a site-provided operation identifier when available. If attribution is ambiguous, report an uncertain outcome rather than inventing a completion token or interpreting unrelated text changes as success.

Check destination state after navigation; an unloaded execution context or null result alone proves no business outcome. For prepare-only tools, return the pending review state. Never label preparation, a button click, or a submitted-but-unconfirmed mutation as completion; never automatically replay an uncertain mutation.

## Own and remove the adapter

Register through the verified surface and retain ownership handles. On reinjection reuse the owned instance or tear it down; never clear other tools or overwrite unrelated globals. When discovery is unavailable, let registration collisions fail without deleting the incumbent. Clean up partial failure and prevent a late pending setup from surviving teardown.

Teardown removes owned tools, listeners, observers, timers, and annotations. Restore prior attributes only while the adapter still owns their current values. Cancel owned result observation; unregistering a tool does not automatically cancel its running callback. Do not roll back user edits or claim to undo submitted requests.

Full document navigation normally loses session injection; returning through the back/forward cache may preserve it, so verify rather than assuming a fresh document. For SPAs, use observed routing signals or check route validity at invocation. Do not continually rescan the entire DOM just to keep speculative tools alive.

## Verify and describe the limits

Where supported, discover and invoke through the intended consumer and correct realm using the verified input convention. Select the descriptor by name and owning origin/frame; if identity remains ambiguous, stop that invocation. Mock registries and successful DOM clicks cannot establish native compatibility.

Test a safe operation, invalid inputs, missing/duplicate/disabled controls, target changes, repeated injection, and teardown during setup or execution. Exercise the same request twice with old results present, an intermediate loading update, and overlapping human activity. Preserve native validation and confirmation; use fixtures/staging for consequential effects.

Deliver the adapter source, supported origin/routes and workflows, installation-free session execution instructions, teardown instructions, and evidence of the checks actually run. State whether refresh or navigation needs reinjection, whether a bridge is involved, and what remains unsupported. Source without a usable execution path is **implemented but not installed or verified**, not a converted website.
