# Mechanistic Protocol

Use this file when model internals are available or the user wants to implement the J-lens/J-space methodology.

## J-Lens Computation

For each layer l, estimate a matrix J_l mapping residual-stream directions at layer l to later residual-stream directions. The paper averages Jacobians over positions and a pretraining-like prompt corpus.

Default recipe:

- Sample about 1000 sequences of about 128 tokens from a pretraining-like distribution when compute allows.
- Cache residual stream h_l[t] for all layers and positions.
- Backpropagate from a later target residual stream z[t'] to h_l[t].
- Average over source positions, future/current target positions t' >= t, and prompts.
- Apply unembedding after normalization: lens(h_l) = softmax(W_U norm(J_l h_l)).

Practical variants:

- Penultimate target layer can reduce noisy final-block artifacts.
- Frozen-QK gradients isolate value-path movement from attention-pattern changes.
- Self-only target positions resemble logit lens more closely.
- Future-only target positions isolate cross-position broadcast.
- Mean aggregation is a reasonable default; median can reduce heavy-tail artifacts.
- As few as 10 prompts may beat lens baselines, but more data improves robustness.

## Reading

Use three read modes:

1. Ranked readout:
   - Sort vocabulary scores for a position and layer.
   - Inspect top-k tokens across workspace layers and positions.

2. Single-token probe:
   - Project activation onto a chosen J-lens vector.
   - Use when tracking specific risk or intermediate concepts.

3. Sparse decomposition:
   - Approximate an activation as a sparse nonnegative combination of J-lens vectors.
   - Use for occupancy, J-space component estimation, and non-redundant concept inventory.
   - Typical k in the paper is around 16-25 depending on task.

## Writing / Intervention

Use interventions to establish causality:

- Positive steering: h <- h + alpha v_token.
- Ablation: subtract or zero the component along v_token.
- Top-k J-space ablation: identify active J-lens vectors and remove their projections across selected layers/positions.
- Coordinate swap: read coordinates for source and target vectors, swap them, and write the difference back.
- Clamp: keep selected J-space coordinates fixed to clean-pass values while intervening elsewhere.

Coordinate swap sketch:

```text
V = [v_source, v_target]
c = pseudoinverse(V) h
c_swapped = swap(c)
h_patched = h + V (c_swapped - c)
```

Scale alpha if needed, but report it. Stronger swaps can increase success and also increase artifact risk.

## Layer Strategy

Use normalized depth labels if comparing models of different sizes.

- Early/sensory region: roughly first third; readouts may be noisy or token-local.
- Workspace region: middle; inspect for abstract, persistent, latent, or decision-relevant concepts.
- Motor region: final layers; readouts increasingly track next-token prediction.

Never assume the exact paper layer range transfers to a new architecture. Re-estimate boundaries using:

- next-token readout accuracy,
- readout kurtosis,
- autocorrelation of top readout tokens across positions,
- effective dimensionality of lens vectors,
- inter-lens agreement,
- task-specific causal depth sweeps.

## Causal Experiments From The Paper

Verbal report:
- Prompt model to think of an item from a category.
- Read J-lens before output.
- Swap chosen concept with target.
- Measure whether report changes.

Injected thought:
- Inject a concept on user-turn positions.
- Ask model to report if a thought was implanted.
- Check whether report changes only at introspection positions, not as a blind output impulse.

Internal reasoning:
- Use prompts with known unspoken intermediates.
- Read for intermediate concept before answer.
- Swap intermediate, not answer.
- Confirm the output follows the target intermediate.
- Compare timing against answer-vector swap to rule out answer smuggling.

Flexible generalization:
- Apply multiple functions to one argument.
- Swap the argument vector.
- Check whether downstream functions return target-argument answers.

Selectivity:
- Pair automatic and flexible tasks using the same latent variable.
- Swap or ablate the latent concept.
- Expect report/flexible tasks to move more than automatic continuation/anomaly tasks.

Workspace ablation:
- Remove top active J-space components across layer bands.
- Compare broad task battery.
- Expect stronger impairment on flexible generation/reasoning than shallow classification or extraction.

Broadcast:
- Measure MLP gain on J-space directions vs controls.
- Identify attention heads with both gain and label preservation.
- Ablate broadcast heads and measure J-lens recall plus behavior.

## Controls

Use at least two controls for any strong claim:

- Random directions with matched norm.
- Non-J-space remainder of same concept vector.
- Same source/target swap outside workspace layers.
- Layer-matched random attention heads.
- Prompt-matched no-risk examples.
- Logit lens and tuned lens comparisons.
- Output-token controls to separate intermediates from motor representations.

## Metrics

Readout:
- top-k rank,
- pass@k,
- normalized AUC over log k,
- token-probe score,
- occupancy,
- variance explained.

Causality:
- output KL after ablation,
- top-1 flip rate after swap,
- logprob difference for target answer,
- behavior score shift,
- rollback under concept ablation.

Alignment:
- risk-token top-k counts at decision positions,
- disclosure/fabrication/refusal/risk-action rate,
- response-start risk signal,
- eval-awareness signal and behavior dependence.

## Implementation Warnings

- J-lens vectors are token-indexed. Multi-token concepts may fragment.
- Strong readouts can be surface echoes; timing and intervention matter.
- The lens can miss concepts, especially early layers or non-tokenizable concepts.
- The J-space is a sparse subframe/union of cones, not a simple linear subspace.
- A high top-k token is not a proof of a plan.
- Automatic well-trained behaviors may bypass J-space monitoring.
