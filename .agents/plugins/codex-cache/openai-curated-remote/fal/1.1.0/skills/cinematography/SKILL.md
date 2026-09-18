---
name: cinematography
description: >
  Design cinematic image and video prompts for fal.ai. Use for shot language,
  camera movement, lighting, lens choices, color grade, scene blocking,
  film texture, and production-ready visual direction.
---

# Cinematography

Use when the user needs concrete visual direction, not generic "cinematic"
prompting. Execution runs through fal.ai MCP tools.

## Inputs To Collect

- Subject and action.
- Medium: still, video, image-to-video, edit, storyboard frame.
- Genre and mood.
- Framing: close-up, medium, wide, overhead, POV, profile, locked-off.
- Camera motion: push-in, dolly, tracking, handheld, crane, drone.
- Lens feel: wide, normal, telephoto, macro, shallow/deep focus.
- Lighting: natural, practical, studio, noir, high key, low key, backlit.
- Output: aspect ratio, duration, first frame, last frame.

## Prompt Build

1. Subject/action.
2. Shot size and camera position.
3. Camera motion over time if video.
4. Lens/depth behavior.
5. Lighting source and direction.
6. Color palette and grade.
7. Texture: clean digital, film grain, archival, phone, broadcast.
8. Constraints: no identity/product drift, no fake text, no extra logos.

## Model Choices

- Premium still: `openai/gpt-image-2`, `fal-ai/nano-banana-pro`.
- Final video: Seedance 2.0 text/image video.
- Fast video draft: Grok Imagine Video.
- Multi-prompt/control-heavy shot: Kling v3.

## Quality Bar

- Prompt describes an actual camera setup.
- Motion is physically plausible.
- Lighting direction matches the setting.
- Video prompt has a beginning and ending state.
- Any referenced first frame is treated as an anchor, not redesigned.
