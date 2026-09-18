---
name: character-design
description: >
  Build consistent character designs and character media with fal.ai. Use for
  original characters, reference sheets, expression sheets, outfit variations,
  identity-preserving edits, and character-to-video workflows.
---

# Character Design

Use when the user wants to create, refine, or preserve a character. Execution
runs through fal.ai MCP tools.

The main objective is consistency: keep the anchor stable and vary only the
requested scene, expression, outfit, camera, or action.

## Inputs To Collect

- Character type: realistic, stylized, anime, mascot, fantasy, sci-fi.
- Identity anchor: age range, face shape, hair, eyes, build, posture, marks.
- Style: photo, 3D, illustration, manga, comic, game concept.
- Needed outputs: portrait, full body, turnaround, expressions, outfits, video.
- References: source image, approved design, costume, pose, style board.
- Consistency level: exploratory, pitch-ready, production continuity.

## Anchor System

Create a reusable anchor paragraph:

- Face and head shape.
- Hair and color.
- Eye shape/color.
- Body/build/posture.
- Clothing silhouette.
- Distinctive marks/accessories.
- Style and rendering constraints.

Repeat the anchor in every generation/edit/video prompt. Add only the changing
variable after the anchor.

## Production Routes

- First character concept: premium still image route.
- Reference sheet: one prompt skeleton, multiple poses/expressions.
- Outfit variants: preserve face/body anchor, vary only clothing.
- Scene/action variants: reference/edit route when identity must hold.
- Character video: approved still first, then image-to-video with anchor.

## Quality Bar

- Face, hair, body proportion, and style remain stable.
- Outfit or pose changes do not rewrite identity.
- Video preserves the approved first frame.
- Final answer includes anchor text so future runs can reuse it.
