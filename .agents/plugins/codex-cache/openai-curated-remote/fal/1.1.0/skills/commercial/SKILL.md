---
name: commercial
description: >
  Plan and produce commercial image or video assets with fal.ai. Use for
  product photography, ads, e-commerce batches, product reveals, lifestyle
  commercials, background replacement, platform crops, and brand-safe prompts.
---

# Commercial Production

Use when the user wants advertising, product, brand, or e-commerce media.
Execution runs through the fal.ai MCP tools; this skill provides production
judgment, not another command layer.

Load `model-routing` when the model is not specified.

## Inputs To Collect

- Product: name, category, material, color, scale, logo/packaging rules.
- Goal: hero shot, PDP image, ad creative, product reveal, demo, lifestyle.
- Platform: square, vertical, landscape, banner, transparent background, print.
- Brand: premium, playful, clinical, athletic, minimal, natural, technical.
- Source media: packshot, logo, reference scene, prior generated asset.
- Constraints: preserve packaging, avoid new labels, no fake readable copy.

## Production Workflow

1. Choose the route: text-to-image, reference edit, product cleanup, or
   still-to-video reveal.
2. Use reference/edit workflows when product fidelity matters.
3. Build an approved still before video unless the user explicitly wants
   text-to-video exploration.
4. For e-commerce batches, keep one prompt skeleton and vary one axis at a
   time: background, crop, lighting, platform, or color treatment.
5. For text overlays, reserve clean space unless using a text-capable model
   with exact user-provided copy.

## Prompt Order

1. Product invariant: object, material, packaging, scale, logo rules.
2. Commercial role: hero, PDP, launch teaser, social ad, demo.
3. Setting: surface, background, props, environment.
4. Lighting: softbox, strip light, rim light, practicals, caustics.
5. Camera: angle, focal-length feel, macro, depth of field, motion.
6. Composition: safe zones, crop, negative space, platform.
7. Brand tone.
8. Guardrails: preserve logo/package, no extra text, no distorted labels.

## Model Choices

- Text-heavy ads/posters/UI: `openai/gpt-image-2`.
- Premium product stills: `openai/gpt-image-2`, then
  `fal-ai/nano-banana-pro`, then `fal-ai/nano-banana-2`.
- Product/reference edits: `fal-ai/nano-banana-pro/edit`, then
  `openai/gpt-image-2/edit`.
- Product reveal video: `bytedance/seedance-2.0/image-to-video`.
- Fast draft video: Grok Imagine Video endpoints.

## Quality Bar

- Product shape, logo, material, and color are stable.
- Generated text is absent or exact and intentional.
- Composition supports crop and external copy.
- Props support the product instead of competing with it.
- The final answer includes endpoint, request id when available, output URL,
  prompt summary, and any defects.
