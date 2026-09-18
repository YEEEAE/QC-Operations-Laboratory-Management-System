---
name: model-routing
description: >
  Choose production-ready fal.ai endpoint IDs for MCP media workflows. Use
  with commercial, marketing, ugc, character-design, cinematography,
  storytelling, fal-recipes, and fal-workflow when the user has not named a
  specific model or asks which model to use.
---

# fal.ai Model Routing

Use this skill for curated endpoint choice. It is not a replacement for the
MCP tools. After choosing an endpoint, execute through the fal.ai MCP tools in
this plugin. Do not call the genmedia CLI from this MCP skill bundle.

## Routing Rules

1. If the user did not name a specific endpoint, call `recommend_model` first
   for a current catalog-ranked recommendation.
2. Use the curated endpoints in this skill to evaluate the recommendation and
   pick the artifact-appropriate route. If the recommendation is generic but
   the task is specialized, use `search_models` to verify a better endpoint.
3. Use live MCP discovery when the role is not covered, an endpoint is missing
   or deprecated, or the user asks to compare options.
4. Inspect the selected endpoint schema before using custom fields.
5. Check pricing when cost, batch size, video duration, 3D, or high-resolution
   output matters.
6. Do not invent endpoint IDs or schema fields.

## Image Generation

Generic/simple image generation:

- `fal-ai/flux-2/klein/9b`: default when the user asks for a basic image and
  does not name a model or require premium text rendering, brand fidelity, or
  final commercial quality.

Text-heavy image work:

- `openai/gpt-image-2`: best default for readable text, posters, packaging,
  diagrams, UI mockups, book covers, exact-copy layouts, and high-end stills.
  Use high quality when the result is final.
- `fal-ai/nano-banana-pro`: second choice when text is important but cost or
  availability matters.

Premium still images:

- `openai/gpt-image-2`: commercial realism, editorial photography, product
  scenes, character anchors, and high-quality concept art.
- `fal-ai/nano-banana-pro`: strong styled output and product-friendly images.
- `fal-ai/nano-banana-2`: cheaper strong alternative.

Fast draft images:

- `fal-ai/flux-2/klein/9b`: quick concepts, mood exploration, rough layouts.
  Do not use as final commercial delivery unless the user asks for speed/cost.

## Image Editing

Use for product edits, background replacement, inpainting, relighting, cleanup,
object changes, outfit changes, and reference-driven composition.

1. `fal-ai/flux-2/klein/9b/edit`: default for simple/generic image edits when
   the user does not name a model.
2. `fal-ai/nano-banana-pro/edit`
3. `openai/gpt-image-2/edit`
4. `fal-ai/bytedance/seedream/v5/lite/edit`

For product fidelity, prefer reference/edit workflows over text-only generation.

## Video

Highest quality video:

- Text to video: `bytedance/seedance-2.0/text-to-video`
- Image to video: `bytedance/seedance-2.0/image-to-video`
- Reference to video: `bytedance/seedance-2.0/reference-to-video`

Fast/lower-cost video:

- Text to video: `xai/grok-imagine-video/text-to-video`
- Image to video: `xai/grok-imagine-video/image-to-video`
- Video edit: `xai/grok-imagine-video/edit-video`

Multi-shot or control-heavy video:

1. `bytedance/seedance-2.0/text-to-video`
2. `bytedance/seedance-2.0/image-to-video`
3. `bytedance/seedance-2.0/reference-to-video`
4. `fal-ai/kling-video/v3/pro/text-to-video`
5. `fal-ai/kling-video/v3/pro/image-to-video`
6. `alibaba/happy-horse/text-to-video`
7. `alibaba/happy-horse/image-to-video`

Use Kling when multi-prompt, element controls, or stronger prompt structure are
needed. Use Happy Horse for brief, direct camera-language prompts.

## UGC And Talking Head

- Portrait plus audio: `veed/fabric-1.0`
- Portrait plus text: `veed/fabric-1.0/text`
- Avatar with visual direction: `fal-ai/creatify/aurora`
- Existing footage with new speech: `fal-ai/sync-lipsync/v2`
- Product b-roll: `bytedance/seedance-2.0/image-to-video`
- Fast b-roll draft: `xai/grok-imagine-video/image-to-video`

## Audio

Use live catalog discovery for current TTS, music, sound effect, transcription,
and cleanup endpoints. Audio model availability changes quickly, so inspect
schemas and pricing before execution.

## 3D

- Premium image-to-3D or character assets: use Meshy v6 class endpoints when
  available and inspect rigging/animation fields.
- Hunyuan/Tripo-style endpoints can be alternatives for faster drafts or
  different geometry outputs.
- Always run 3D jobs async and return model URLs plus any texture/material URLs.

## Quality Guardrail

Model choice is only valid if it matches the artifact role:

- Text-heavy deliverables need text-capable image models or external layout.
- Product deliverables need reference/edit workflows when packaging must hold.
- Talking-head deliverables need audio/script length checks.
- Story deliverables need continuity anchors across shots.
- 3D deliverables need output format, scale, material, and rigging checks.
