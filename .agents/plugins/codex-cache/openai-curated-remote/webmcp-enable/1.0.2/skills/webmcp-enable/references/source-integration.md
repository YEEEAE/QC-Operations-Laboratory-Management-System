# Source integration

Use this path when the website's source is available for editing. Follow the shared API verification and safety rules in [the skill entrypoint](../SKILL.md).

## Locate the existing behavior

Trace each selected action from UI through validation, application state, and backend calls. Inspect the business function's callers. Wrap the existing behavior rather than adding a parallel state store. Do not import server-only functions, credentials, or administrative paths into the browser bundle.

Adapt to the existing language, framework, and installed dependencies. Add no SDK, polyfill, schema library, or hook package without a concrete need. In server-rendered applications, register after hydration/state readiness inside a client lifecycle; importing the module on the server must not access `document`. In CMS/template-driven sites, use the maintained template or supported extension point rather than editing generated output.

## Choose declarative or imperative per workflow

### Existing HTML forms

Prefer annotations when normal form semantics already express the task. Verify the target's [declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api), independently of imperative support.

- Add `toolname` and `tooldescription` to the form. Preserve labels, control `name` values, constraints, submit buttons, method/action, CSRF protection, and the existing handler. Use `toolparamdescription` only where it clarifies a parameter.
- Inspect the generated schema: types, required fields, enums, hidden/disabled controls, repeated names, custom widgets, and multiple submitters. Never promote a hidden token to a tool argument or remove CSRF protection to simplify the schema. If native inspection is unavailable, record this as an unresolved check, not a passed test.
- Without `toolautosubmit`, agent filling waits for human submission. Leave it off for consequential forms by default; use it only when automatic submission fits the intended task and authorization.
- For intercepted submissions, preserve the ordinary user path. Where supported, call `preventDefault()` and supply `respondWith()` the actual operation's promise during event dispatch, before any `await`. Handle validation failure and rejected/cancelled operations too; every invocation must settle. Detect event capabilities and reuse the existing handler, avoiding duplicate submissions.

If the inferred schema or submission lifecycle cannot express the workflow reliably, use an imperative wrapper. Do not replace the form solely to accommodate WebMCP.

### Application actions

Use an imperative tool for custom UI or operations with an existing callable application function. Verify the contract against the [draft](https://webmachinelearning.github.io/webmcp/) and [browser guide](https://developer.chrome.com/docs/ai/webmcp/imperative-api). A site's producer needs registration support; it need not expose page-side consumer methods to its own code.

Provide a name, description, input schema, and async callback. Names currently allow 1–128 ASCII letters, digits, underscores, hyphens, and periods. Execution receives parsed inputs and options including a cancellation signal. Return a JSON-serializable result; an MCP `content` envelope or `outputSchema` is not a mandatory browser contract. Use supported annotations, currently `readOnlyHint` and `untrustedContentHint`; do not copy unsupported MCP fields into a browser tool definition.

Let existing domain validators remain authoritative. Check the tool boundary for missing/wrong types, invalid identifiers, bounds, and unsafe coercion before effects. Keep schema constraints consistent with that behavior; do not snapshot a changing catalog as a permanent enum. Return only the task's useful fields and safe next steps on failure, not raw internal exceptions.

Resolve current user, route, target record, and permission at invocation rather than capturing stale snapshots. Await the domain operation and relevant UI update. Use existing version/idempotency controls when human and agent actions can race; a disabled button or tool annotation is no server-side guard. Forward execution cancellation to supported operations, checking it before effects without claiming a server commit was undone.

## Registration and application lifecycle

- Feature-detect registration before setup and catch rejection without breaking the ordinary UI. Preserve a sanitized setup reason or use the existing diagnostic hook so unsupported APIs, policy denial, and duplicate-name failures remain distinguishable. Missing page-side discovery/invocation methods limit testing; they are not grounds to skip supported registration.
- Own registrations with an `AbortController` tied to the page, route, or component lifetime. Await registration, release only owned tools, and clean up partial failure. Unmount during pending setup must not leave a late registration or an unhandled rejection.
- Avoid collisions with existing tools. Repeated renders, hot reloads, and development remounts must not accumulate tools or listeners. Use the existing lifecycle mechanism rather than a new global registry framework.
- Remove or refresh tools when a route/session makes them unavailable. Check prerequisites in in-flight calls too. Capture the intended record's identity before an asynchronous operation and avoid applying its result to a different screen. Registration cleanup and execution cancellation are distinct.

## Diagnose the failing layer

| Symptom | Check before changing code |
| --- | --- |
| No registration API | Browser support, client-only timing, secure context, native versus polyfilled runtime |
| Registration rejects | Error name/message, duplicate ownership, schema serialization, origin isolation, `tools` Permissions Policy |
| Registered but undiscoverable | Consumer support, owning frame/origin, client connection; do not re-register blindly |
| Callable but wrong/stale result | Current auth/record state, actual domain completion, UI synchronization, input encoding |

See [browser requirements](https://developer.chrome.com/docs/ai/webmcp). Keep same-origin defaults. Cross-origin use needs the relevant delegation and explicit origin exposure/selection, where supported; `allow="tools"` alone is not a universal discovery grant. Do not broaden headers or frame permissions to silence failures.

## Acceptance checks

Use the project's existing test runner when present; otherwise keep the check as small as the integration. A mocked registry can test ownership and callback behavior, but cannot establish browser schema synthesis or native compatibility.

Exercise normal UI and tool paths for the same action. Cover bad inputs with zero effects, session expiry, target changes during an async call, repeated mount/unmount, unmount during registration, and rejection cleanup. For forms, verify required fields, chosen submitter, confirmation, and response settlement on failure. Test registration-only runtimes separately from runtimes with discovery/invocation methods.

For native verification, discover the tool in the actual target browser, inspect its name/schema, invoke it with the verified calling convention, and observe the result in the application. Check cleanup removes it without disturbing unrelated tools. If browser or client testing is unavailable, list the exact untested steps; do not upgrade a mock pass to a compatibility claim.

Removal should revert only the added annotations, registrations, and related integration code, leaving the preexisting workflow intact.
