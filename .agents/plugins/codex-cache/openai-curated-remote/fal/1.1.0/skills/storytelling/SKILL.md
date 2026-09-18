---
name: storytelling
description: >
  Build multi-shot narrative image, video, and audio workflows with fal.ai.
  Use for storyboards, shot lists, multi-prompt video, first-frame/last-frame
  pipelines, social stories, brand films, and sequence continuity.
---

# Storytelling

Use when the user wants a sequence, not a single asset. Execution runs through
fal.ai MCP tools.

Load `cinematography` for shot language and `character-design` when identity
continuity matters.

## Inputs To Collect

- Format: ad, short film, music video, documentary, tutorial, social story.
- Duration and aspect ratio.
- Number of shots or range.
- Main subject, character, product, or location.
- Continuity anchors: character, product, wardrobe, environment, color.
- Source media: first frame, reference image, product shot, audio track.
- Audio needs: narration, music, sound design, transcript, or no audio.

## Story Build

1. Beat sheet: what changes emotionally or informationally.
2. Shot list: one visual purpose per shot.
3. Continuity anchors: what must remain stable.
4. Model route: text-to-video, image-to-video, reference-to-video, or
   talking-head/audio path.
5. Keyframes: create or upload approved first frames when continuity matters.
6. Async execution per shot.
7. Review sequence order, duration, continuity, and artifact defects.

## Shot Prompt Pattern

For each shot:

- Shot number and purpose.
- Subject and action.
- Framing and camera movement.
- Lighting and environment.
- Continuity anchors.
- Ending state.
- What must not change.

## Model Choices

- Final high-quality shots: Seedance 2.0.
- Control-heavy video: Kling v3 when schema supports the needed controls.
- Brief simple motion: Happy Horse or fast video endpoints.
- Product/character continuity: use approved stills or reference-to-video.
- Voice/spoken story: use UGC/talking-head routes and align visuals to audio.

## Quality Bar

- Every shot has a narrative job.
- Continuity anchors are repeated and visible.
- The sequence can be edited together without random style drift.
- The final answer includes shot manifest, output URLs, endpoint IDs, and known
  issues.
