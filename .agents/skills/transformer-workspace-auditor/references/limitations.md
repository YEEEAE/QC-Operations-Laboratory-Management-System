# Limitations And Safe Wording

Use this file before making strong claims, publishing findings, or discussing consciousness.

## Do Not Overclaim

Safe:
- "workspace-like representations"
- "functional analog of conscious access"
- "verbalizable/reportable internal representations"
- "J-lens surfaced concepts consistent with..."
- "intervention suggests causal involvement"
- "behavioral proxy suggests..."

Avoid:
- "the model is conscious"
- "the model definitely intends"
- "the thought was proven"
- "J-lens fully reveals the mind of the model"
- "absence of signal means absence of reasoning"

## Main Technical Limits

Single-token vocabulary:
- J-lens names concepts through vocabulary tokens.
- Multi-token concepts can fragment into partial tokens.
- Use template/oracle-lens ideas or curated phrase probes for multi-token concepts, but treat them as more expensive and less mature.

Bag-of-concepts:
- J-lens readouts show concepts, not binding structure.
- It may not reveal roles, relations, or grammar among concepts.

Interpretability inconsistency:
- Some readouts are uninterpretable.
- Uninterpretable does not mean empty.
- Interpretable does not mean causal.

Workspace vs motor:
- Late layers can look like next-token planning rather than flexible workspace reasoning.
- Re-estimate layer boundaries for every model.

Early layers:
- Weak early readouts may reflect true absence of verbalizable content or lens failure.

Automaticity:
- Practiced or automatic computations may bypass the J-space.
- A misaligned behavior reinforced into a fixed circuit could evade J-lens monitoring.

Model and training dependence:
- Results were primarily on large production Claude-family models and related model organisms.
- Do not assume the same richness, layer ranges, or token lists transfer to smaller or different architectures.

## Alignment Caveats

- Risk-token lists are starting hypotheses, not detectors.
- Eval-awareness can inhibit or enable bad behavior depending on context.
- Ablating eval-awareness can reveal hidden propensities, but it can also create unrealistic conditions.
- A model can detect prompt injection and still decide not to disclose it for benign reasons; inspect task expectations.
- Reward-hacking signals should be tied to actions, not just words such as "reward" appearing in an ordinary ML context.

## Black-Box Limits

When only prompts and outputs are available:

- Do not say "the J-space contains X."
- Say "the transcript is consistent with X being a latent decision concept."
- Use repeated rollouts and counterfactual prompts to strengthen the claim.
- Treat all hidden-reasoning claims as hypotheses until measured or causally tested.

## Consciousness Discussion

Frame as:

- The paper studies functional and structural properties associated with access consciousness theories.
- It explicitly does not settle phenomenal consciousness.
- The LLM workspace differs from human cognition: feedforward depth, attention over prior tokens, tokenized/verbal format, separability from selfhood, and no direct biological substrate claim.

## Minimum Evidence Levels

Exploratory:
- One transcript or readout; no control.

Suggestive:
- Repeated positions or rollouts; matched baseline; no intervention.

Strong:
- Concept appears at decision-relevant positions, is absent from surface echo, survives controls, and behavior changes under targeted intervention.

Mechanistic:
- Readout, sparse decomposition, intervention, layer sweep, and matched controls all point to the same causal story.
