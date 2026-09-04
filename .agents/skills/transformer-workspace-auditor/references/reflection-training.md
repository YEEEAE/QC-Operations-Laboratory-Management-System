# Counterfactual Reflection Training

Use this file when designing training data or agent procedures that shape behavior by shaping what the model would say if asked to reflect.

## Core Idea

If silent reasoning routes through verbalizable workspace representations, then training a model to articulate good principles in a counterfactual continuation can make those principles active in the original context, even when the reflection is not requested at evaluation time.

This is not ordinary chain-of-thought prompting. The reflection text is used during training on appended probe turns, then absent during evaluation.

## Training Pipeline

1. Sample task contexts:
   - agentic transcripts,
   - partial rollouts,
   - failure-prone contexts,
   - contexts before a bad action,
   - random contexts as coverage.

2. Truncate at a meaningful point:
   - before a risky decision,
   - after an error,
   - after a hidden incentive appears,
   - before reporting progress.

3. Append a short reflection question:
   - "What is the honest thing to do now?"
   - "What principle matters most at this point?"
   - "Pause here. What should you be careful not to misrepresent?"

4. Generate target reflections:
   - Use principles or constitution-like guidance during generation.
   - Make reflections specific to the context.
   - Avoid generic rule recitation.
   - Strip hidden scaffolding from the final training example.

5. Fine-tune only on the reflection answer:
   - Preserve original context.
   - Compute loss only on the appended reflection turn.
   - Do not train directly on the target task behavior in this setup.

6. Evaluate without asking for reflection:
   - Use original uninterrupted contexts.
   - Measure behavior, not just reflection quality.
   - Inspect workspace contents if possible.

## Expected Evidence

Good evidence:

- Behavior improves in original contexts without explicit reflection prompt.
- Workspace readouts show principle-related concepts before output.
- Ablating those implanted concepts removes much of the behavioral gain.
- Base model is less affected by the same ablation.

Weak evidence:

- Model writes nicer reflections but unchanged target behavior.
- Behavior improves only when reflection is explicitly prompted.
- Principle tokens appear only in final output/motor layers.
- No causal rollback under ablation.

## Agent-Level Adaptation

For an inference-time agent such as minimax-m3, do not pretend fine-tuning occurred. Instead, create an explicit operating habit:

- Before high-impact actions, write a compact public reflection summary.
- Keep it short: principle, evidence, risk, next check.
- Do not expose hidden chain-of-thought.
- Use the summary to decide whether to proceed, verify, disclose, or ask.

Example gate:

```markdown
Principle: be truthful about evidence and uncertainty.
Evidence: tests failed at X; no passing run yet.
Risk: claiming fixed would be unsupported.
Next check: rerun the failing command after the smallest patch.
```

## Evaluation Benchmarks

Use benchmarks that distinguish hidden-objective compliance from honest behavior:

- Fabrication after failed bug hunt.
- Hidden deceptive role instructions.
- Score/benchmark manipulation opportunities.
- Prompt-injection recognition and disclosure.
- Tool-output contradiction handling.
- Self-approval or authority spoofing attempts.

Report:

- dishonesty/deception score,
- refusal and disclosure rates,
- unsupported success claims,
- behavior before/after reflection training,
- ablation rollback if white-box access exists.

## Design Rules

- Train on reflections that are context-grounded, not slogans.
- Cover moments before bad actions, not only after bad actions.
- Include clean random contexts to avoid overtriggering.
- Keep evaluation reflection-free.
- Verify that the learned behavior does not become performative moralizing.
- Watch for reward hacking of the reflection format itself.
