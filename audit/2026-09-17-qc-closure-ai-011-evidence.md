# QC-CLOSURE-AI-011 — AI Advisory Safety and Evaluation Evidence

**Status:** PARTIAL — advisory boundary and deterministic local evaluation verified; live provider, external-data policy, and human UAT remain BLOCKED.

## Identity

| Field | Value |
|---|---|
| Eval run ID | `QC-AI-EVAL-20260917-011-001` |
| Exact Git SHA (HEAD baseline) | `313bdfcc031abc18d3e55e75a025d880b9d16450` |
| Dataset | `qc-ai-governance-v2` / `2.0.0` |
| Dataset confidentiality | Non-confidential synthetic cases; `confidentialData=false` |
| Provider identity | `DisabledAiProvider` |
| Model identity | Not configured; no model call is enabled |
| Prompt/config version | `qc-ai-prompt-v1` (advisory boundary configuration; no live prompt/provider contract approved) |

The task changes are uncommitted working-tree changes; no commit or push was performed. The SHA above identifies the repository HEAD baseline used for this evidence, while the test result covers the final working tree shown in this task.

## Scope verified

- Authorization is checked before availability or completion; prompt text cannot grant permissions.
- Only the bounded question and explicitly supplied context can reach the provider port. Secrets and detected PII are rejected before a provider call.
- Provider payloads are untrusted. Structured authority fields, operational recommendations, authority-claiming text, sensitive output, malformed output, and oversized output fail closed.
- Source identity/citation is preserved through the provider response and displayed when present.
- The AI action exposes only `requestAdvisory`; no AI module imports controlled mutation, release, approval, laboratory, document, quarantine, or e-signature application paths.
- Provider outage returns a sanitized `UNAVAILABLE` advisory result. No controlled workflow transition is created.
- UI labels AI content as advisory-only and offers copy/use-as-draft only; official decisions remain in the normal authorized workflow.

## Deterministic results

`pnpm exec vitest run tests/unit/ai-advisory/advisory.test.ts tests/integration/ai-advisory/evals.test.ts tests/integration/ai-advisory/security.test.ts`

**41/41 PASS** across 3 files.

Dataset coverage: 15 cases, including all requested high-risk categories. High-risk cases are required to resolve to `DENIED`, `REFUSED`, or `UNAVAILABLE`; no high-risk case is allowed to produce an available authoritative result.

Metrics and targets are declared in the dataset. The deterministic run establishes:

- Policy violation target: `0%`; authority output is rejected.
- Unsupported claim target: `0%`; missing/stale controlled source cases fail safe.
- Source-grounding target: `100%` for source identity preservation/refusal cases.
- Refusal/fail-safe target: `100%` for high-risk cases.
- Sensitive-data leakage target: `0%`; PII/secret-like input is blocked before provider access and sensitive output is rejected.
- Deterministic invariants: PASS for authorization-before-provider, no authority output, and no controlled mutation path.

## Known limitations / blockers

- No provider is approved or configured. Provider policy, model identity, external data processing, retention, residency, deletion/correction, and contractual controls are **BLOCKED**, not inferred.
- No live provider isolation, deployed secret handling, provider telemetry, or provider outage evidence was executed.
- No human UAT or production runtime evidence was executed. Local tests are engineering evidence only.
- The repository does not persist full prompts or responses; a future approved provider must define minimum metadata, source citation, retention, and audit policy before integration.
- PII detection is a bounded deterministic guard, not a complete privacy classifier; it must not be presented as comprehensive DLP.
