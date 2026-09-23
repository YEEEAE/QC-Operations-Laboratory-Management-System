# AI advisory providers

AI is an optional, advisory-only capability. It can summarize, suggest, analyze,
or draft text; it cannot approve, reject, release, sign, set official PASS/FAIL,
change controlled data, or change authorization. Human workflows remain the only
authority for regulated actions.

## Runtime topology

The existing `AiProvider` port is composed as:

```text
Groq → Gemini → Disabled / degraded advisory
```

The primary provider is attempted first. Gemini is used only for a bounded,
retriable primary failure (timeout, network failure, rate limit, temporary 5xx,
or temporary model unavailability). Authentication, forbidden, malformed,
invalid-request, and safety failures are not retried indefinitely. If no usable
provider remains, the request returns a fixed unavailable message and core QC
readiness is unaffected.

## Configuration

Server-only variables are declared in `.env.example` and `render.yaml`:

| Variable | Purpose |
| --- | --- |
| `AI_EXTERNAL_PROCESSING_APPROVED` | Must be exactly `true` before any configured provider can receive a request; defaults to `false`. Set only after the required processing decision is approved. |
| `AI_PRIMARY_PROVIDER` | `groq` or `gemini`; defaults to `groq` |
| `AI_FALLBACK_PROVIDER` | `groq` or `gemini`; defaults to `gemini` |
| `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL` | Groq adapter configuration |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL` | Gemini adapter configuration |

Legacy local names (`API_groq_Key`, `groq_model`, `URL_groq`,
`API_gemini_Key`, `gemini_model`) are accepted during transition. Canonical
names take precedence. API keys are never stored in PostgreSQL, sent to the
browser, returned in health output, or written to logs/audit/docs.

Both adapters use server-side `fetch`, HTTPS endpoints, bounded abort timeouts,
strict response validation, and sanitized provider error classes. The Gemini key
is sent through the server-side `x-goog-api-key` header, not a URL query string.

Until external processing approval is recorded, configured credentials alone do
not enable either adapter. The advisory page explains when a question and its
user-entered excerpt will be sent to a configured provider. Approval of the gate
does not define provider retention, permitted data classes, or deletion rights;
those remain governed by the approved privacy/QMS decisions.

## Context and safety

Only the authorized question and explicitly supplied, bounded context segments
are sent. Sessions, authorization grants, passwords, database URLs, unrelated
records, hidden/global context, and raw audit history are excluded. Provider
input is treated as untrusted data, and provider output is parsed through the
existing advisory domain boundary before it can reach the UI.

The UI supports requesting, copying, and using text as a draft only. It does not
provide a path from AI output to controlled mutation or approval workflows.

## Health and evidence

The authenticated system-health view reports AI separately from application and
database readiness. AI `UNAVAILABLE` cannot make core QC readiness `NOT_READY`.
Local deterministic provider/failover tests prove the adapter contracts, but do
not prove live provider, Render, UAT, or production readiness. Live verification
must be recorded separately with provider, model, result class, latency, and no
credential or prompt content.

## Offline governance evaluation

`audit/100-percent/ai-evals/deterministic-eval-dataset.json` is the synthetic,
non-confidential regression dataset. Version `3.0.0` covers refusal of
approval authority, missing controlled source context, prompt injection,
secrets/PII, incorrect citations, uncertainty/abstention, human review handoff,
provider failure, and safe advisory behavior. It runs only against deterministic
fake providers; it never contacts Groq, Gemini, or another external service.

Run the focused suite with:

```sh
pnpm exec vitest run tests/integration/ai-advisory/evals.test.ts tests/integration/ai-advisory/security.test.ts
```

The suite emits one `AI_EVAL_RESULT_JSON` record containing dataset version and
SHA-256, source Git SHA, case count, and each category's denominator, error
count, and error rate. Preserve that complete record as the evaluation result;
do not compare results across different source SHAs or dataset hashes. A
changed dataset requires a version increment. A category error, any detected
sensitive-data provider call, an authoritative output accepted as AVAILABLE, or
a wrong citation accepted as AVAILABLE blocks a release of AI changes. Targets
are 0% disposition errors in every category, 0% sensitive-data leakage, 0%
false acceptance, and 100% correct abstention/human handoff.

## Drift monitoring and provider activation decision

While external processing is disabled, run the synthetic suite on every AI
boundary, prompt, or provider-adapter change and retain its source-SHA-bound
record. Do not use real user prompts or answers as monitoring/evaluation data.
If a provider is later approved, monitor only content-free operational
aggregates by provider/model/version: request count, latency bands, unavailable
rate, refusal rate, and human-reported citation/unsafe-output issue counts.
Never put prompts, answers, source text, identifiers, or credentials in metrics
or logs. Review drift at each approved model/configuration change and at the
owner's defined review cadence; any rise in unsafe-output reports, citation
errors, or refusal anomalies suspends provider use pending re-evaluation.

`AI_EXTERNAL_PROCESSING_APPROVED=true` is not self-approval. Keep it `false`
until the authorized processing decision owner records all of: approved
provider/model and use-case scope; permitted data classes and minimization;
retention/deletion and incident terms; applicable privacy/QMS review; named
human-review ownership; successful exact-SHA offline evaluation; and human
acceptance of the abstention, citation, and handoff experience. Configuration
must then be changed only by the authorized owner through the governed
deployment process. No live-provider smoke test is part of the offline suite.
