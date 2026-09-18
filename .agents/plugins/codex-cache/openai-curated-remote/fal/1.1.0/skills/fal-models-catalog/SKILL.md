---
name: fal-models-catalog
description: >
  Navigate fal.ai model families by media modality and production role. Use
  when the user asks which model, endpoint, or model family is appropriate for
  image, video, audio, 3D, editing, training, restoration, try-on, or analysis.
---

# fal.ai Models Catalog

This is a curated routing layer for MCP clients. It should guide endpoint selection,
then execution should happen through the fal.ai MCP tools exposed by this
plugin. Do not shell out to genmedia CLI.

Use `model-routing` first for common production defaults. Use this skill when
the question is broader: comparing modalities, finding a category, choosing a
family, or explaining tradeoffs.

## Modality Map

- Text to image: campaign visuals, product stills, character concepts,
  editorial photography, posters, UI mockups, image typography.
- Image to image: edits, inpainting, reference preservation, style transfer,
  product placement, background replacement, upscaling, restoration.
- Text to video: cinematic clips, product reveals, narrative shots, social
  concepts, motion drafts.
- Image to video: animate an approved still, product hero motion, b-roll,
  talking-head source frames, first-frame continuity.
- Reference to video: stronger continuity from characters, products, or style
  references where supported.
- Text/audio to talking head: spokesperson, UGC creator, avatar, lip sync.
- Text to audio: narration, TTS, music, sound effects.
- Audio to text: transcription, subtitles, diarization, audio cleanup.
- Image/text to 3D: objects, characters, game assets, GLB/OBJ/PLY outputs.
- Image to text / vision: OCR, captioning, segmentation, detection, analysis.
- Training: LoRA and fine-tune style workflows, only when a dataset exists.

## Selection Pattern

1. Identify the artifact role: final commercial, draft, utility transform,
   analysis, training, or intermediate step.
2. If the user did not name a specific endpoint, call `recommend_model` before
   execution and use catalog search when the recommended list is too generic.
3. Choose modality and endpoint family.
4. Inspect schema before assuming fields such as `image_url`, `image_urls`,
   `reference_image_url`, `duration`, `aspect_ratio`, `seed`, `quality`,
   `audio_url`, or `enable_rigging`.
5. Check pricing when the job is long, high resolution, batched, video, audio,
   3D, or likely to be repeated.
6. For uncertain categories, use MCP catalog search and docs search, then
   choose from verified endpoints.

## Production Defaults

- Text-heavy stills: `openai/gpt-image-2`.
- Product stills and campaign heroes: `openai/gpt-image-2`,
  `fal-ai/nano-banana-pro`, `fal-ai/nano-banana-2`.
- Product/reference edits: `fal-ai/nano-banana-pro/edit`,
  `openai/gpt-image-2/edit`.
- Final-quality video: Seedance 2.0 text/image/reference video endpoints.
- Fast video drafts: Grok Imagine Video endpoints.
- Talking head: `veed/fabric-1.0`, `veed/fabric-1.0/text`,
  `fal-ai/creatify/aurora`, `fal-ai/sync-lipsync/v2`.
- Background removal: use catalog search for current Bria/background endpoints
  and inspect schema.
- 3D: prefer Meshy v6 class endpoints for rigging/animation when available.

## Avoid

- Choosing a model only because it is popular when the artifact role is clear.
- Using text-to-image when the user supplied a reference that must be preserved.
- Using cheap draft endpoints for final brand/product assets.
- Generating readable legal, medical, financial, or claim text unless the user
  supplies exact wording and the chosen model supports text well.
