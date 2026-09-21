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
