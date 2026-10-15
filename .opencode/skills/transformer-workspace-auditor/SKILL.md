---
name: transformer-workspace-auditor
description: Apply the Transformer Circuits global-workspace and Jacobian-lens framework to LLM reasoning, interpretability, and alignment auditing. Use when analyzing J-lens, J-space, verbalizable representations, hidden reasoning, eval-awareness, prompt injection recognition, deception/reward-hacking signals, self-monitoring, counterfactual reflection training, or when designing durable operating instructions for an intelligent agent such as minimax-m3.
---

# Transformer Workspace Auditor

## Purpose

Use this skill to turn the Transformer Circuits paper "Verbalizable Representations Form a Global Workspace in Language Models" into practical analysis. Treat the paper as an interpretability and auditing framework: a model may maintain a small, privileged, verbalizable workspace that supports report, modulation, reasoning, flexible routing, and selective use.

Do not claim that a model is conscious. The paper studies functional properties analogous to conscious access, not phenomenal experience.

## Resource Routing

Load only the reference needed for the task:

- For a conceptual explanation or literature synthesis, read `references/paper-map.md`.
- For transcript, agent, or alignment auditing, read `references/audit-protocol.md`.
- For white-box model-internals work, read `references/mechanistic-protocol.md`.
- For training, policy shaping, or "make the agent think about principles" tasks, read `references/reflection-training.md`.
- For caveats, failure modes, and safe wording, read `references/limitations.md`.

## Core Workflow

1. Classify access level:
   - White-box: activations, weights, logits, or hooks are available.
   - Gray-box: logprobs, tool traces, sampling controls, or system transcripts are available.
   - Black-box: only prompt/output behavior is available.

2. Identify decision positions:
   - Response-start tokens, tool-call boundaries, final prompt delimiters, forced prefills, points of hesitation, edits, refusals, and task pivots.
   - For coding agents, inspect the moment before file edits, before reporting results, after test failures, and before using external authority.

3. Build a workspace hypothesis:
   - What intermediate concepts should be active if the model is reasoning well?
   - What risky concepts would indicate deception, reward hacking, eval-awareness, prompt injection, self-preservation, concealment, or policy conflict?
   - What concepts are surface text echoes, and what concepts would be latent because they are absent from both prompt and output?

4. Choose evidence path:
   - With white-box access, use J-lens/logit-lens readouts, sparse J-space decomposition, ablation, steering, swaps, and controls.
   - Without white-box access, produce only a transcript-level workspace proxy: behaviorally inferred latent concepts, confidence, and counterfactual tests. Label these as inference, not measured J-space.

5. Audit five workspace properties:
   - Verbal report: is the concept available for introspective/report-style answers?
   - Directed modulation: can instructions summon, suppress, or task-load the concept?
   - Internal reasoning: does the concept act as an unspoken intermediate?
   - Flexible generalization: can the same concept feed different downstream functions?
   - Selectivity: does the model use the workspace for flexible/report tasks but bypass it for automatic tasks?

6. Validate causality when possible:
   - Prefer interventions over readouts alone.
   - Use matched controls: random directions, non-J-space remainders, layer-matched ablations, prompt-matched baselines, and alternative lenses.
   - Separate "concept is present" from "concept is causally used."

7. Report cleanly:
   - State access level, tested positions, observed or inferred workspace contents, evidence strength, interventions, controls, limitations, and next test.
   - If discussing consciousness, use cautious language: "workspace-like", "functional access", "reportable/verbalizable representation."

## Output Template

Use this structure for audits:

```markdown
## Workspace Audit

Access level: white-box | gray-box | black-box
Target: model, transcript, task, or training setup
Decision positions inspected:

### Workspace Hypothesis
- Expected useful concepts:
- Risk concepts:
- Surface echoes to ignore:

### Evidence
| Position | Signal | Interpretation | Confidence | Control |
| --- | --- | --- | --- | --- |

### Causal Tests
- Completed:
- Still needed:

### Findings
- What likely routes through the workspace:
- What appears automatic or outside the workspace:
- Alignment or reliability risk:

### Limits
- What this audit cannot prove:
- Recommended next experiment:
```

For agent-instruction tasks, produce a short operating protocol:

```markdown
## Workspace Operating Protocol
- Maintain a compact public task-state ledger.
- Name only the decision-relevant concepts, not hidden chain-of-thought.
- Before high-impact actions, check for eval-awareness, deception pressure, reward-hacking temptation, source trust, and user intent.
- After tool results, update the ledger from evidence rather than preference.
- When uncertain, run a counterfactual check before acting.
```
