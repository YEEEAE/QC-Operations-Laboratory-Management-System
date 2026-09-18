---
name: fal-recipes
description: >
  Use-case-driven fal.ai production recipes. Trigger for commercials, product
  photography, cinematic shots, character design, storyboards, talking heads,
  lip sync, virtual try-on, restoration, video with audio, realism, and other
  multi-step media outcomes.
---

# fal.ai Recipes

Recipes are production playbooks. They decide what to collect, what model
families to combine, and what quality bar to enforce. Execution stays in the
fal.ai MCP tools.

## Recipe Index

- Commercial/product: load `commercial`.
- Marketing campaign: load `marketing`.
- UGC/talking head: load `ugc`.
- Cinematic still/video: load `cinematography`.
- Character consistency: load `character-design`.
- Multi-shot story: load `storytelling`.
- Fan-cam sports broadcast: load `fan-cam`.
- 2D game assets: load `fal-gamedev`.
- 3D character selector experience: load `fal-regenerate-3d`.
- Endpoint choice: load `model-routing` and `fal-models-catalog`.
- Prompt family tuning: load `fal-prompting`.

## Standard Recipe Shape

1. Identify the final artifact and platform.
2. Collect only inputs that affect model choice or continuity.
3. Choose endpoint families with `model-routing`; when no endpoint was named,
   start with `recommend_model` and then apply the recipe quality bar.
4. Upload references before generation when fidelity matters.
5. Inspect schemas and pricing for the chosen endpoints.
6. Generate in stages: anchor stills first, then edits/video/audio/3D.
7. Use async jobs for video, audio, 3D, batches, and long-running utilities.
8. Review output against the skill quality bar before returning URLs/results.

## Common Multi-Step Patterns

Product ad:

- Reference product image.
- Product-faithful hero still.
- Optional cleanup/background removal.
- Image-to-video reveal from approved frame.
- Final manifest with endpoint, request id, prompt summary, and defects.

UGC ad:

- Script and hook.
- Creator portrait/avatar route.
- Product b-roll route.
- Talking-head or lip-sync generation.
- Optional cutdown variants by hook angle.

Story:

- Beat sheet.
- Shot list with continuity anchors.
- Keyframes or first frames.
- Image-to-video per shot.
- Optional narration/audio.

Character:

- Identity anchor.
- Reference sheet.
- Outfit/expression/action variants.
- Optional image-to-video with identity guardrails.

## Quality Bar

Do not return a recipe as complete until the result matches the requested
artifact role. If the model output misses the role, adjust the route before
adding more variants.
