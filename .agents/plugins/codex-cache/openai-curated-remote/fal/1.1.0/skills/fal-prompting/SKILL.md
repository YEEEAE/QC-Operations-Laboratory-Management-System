---
name: fal-prompting
description: >
  Apply model-family-specific prompting for fal.ai endpoints after an endpoint
  has been selected. Use for GPT Image 2, Kling, Happy Horse, Seedance, product
  prompts, exact text, multi-prompt video, and prompt debugging.
---

# fal.ai Prompting

Use this after model selection. The goal is to write prompts that match the
model family, not generic "cinematic masterpiece" text.

## Universal Rules

- Visual facts beat prestige adjectives.
- Preserve one controlled variable per iteration.
- Inspect schema before assuming negative prompts, seeds, multi-image inputs,
  multi-prompt arrays, duration, audio, or camera controls exist.
- Keep exact text short and quoted when the model supports text.
- For product and character work, name the invariant explicitly in every prompt.
- For video, describe action over time, camera motion, framing, and ending.

## GPT Image 2

Use for exact text, packaging, posters, UI, premium stills, and complex image
composition.

Prompt structure:

1. Output type and composition.
2. Exact subject/product/character.
3. Style and medium.
4. Lighting, material, camera, color.
5. Text requirements, only if needed.
6. Guardrails: no extra logos, no unreadable text, preserve reference details.

GPT Image 2 benefits from structured, explicit prompts. It can handle longer
instructions than fast video models.

## Kling

Use for controlled video prompts when schema supports multi-prompt or element
controls.

Prompt structure:

1. Subject identity and first frame.
2. Shot type and camera motion.
3. Action sequence in temporal order.
4. Motion constraints.
5. Ending state.

Keep control fields schema-driven. Do not invent element fields without schema.

## Happy Horse

Use short natural-language prompts. Long production paragraphs usually hurt.

Good pattern:

`Handheld phone video, close shot of a runner tying neon shoes on wet pavement, soft morning light, quick push-in.`

Avoid stacking style tags or long guardrails. Put important action first.

## Seedance

Use for high-quality cinematic image-to-video and text-to-video. Build prompts
like a short shot direction:

- Subject/action.
- Camera motion.
- Environment.
- Lighting.
- Duration feel.
- What should not change.

For image-to-video, the uploaded frame is the anchor. The prompt should animate
the frame, not redesign it.

## Prompt Failure Fixes

- Product changed: switch to reference/edit workflow and tighten invariants.
- Text is wrong: use GPT Image 2, shorten text, or reserve safe space for
  external typography.
- Video drifts: reduce prompt scope, use image-to-video from an approved frame,
  shorten duration, or choose a model with stronger controls.
- Character identity drifts: use the character anchor wording and reference
  images in every step.
- Output is generic: replace style adjectives with concrete camera, light,
  materials, setting, and action.
