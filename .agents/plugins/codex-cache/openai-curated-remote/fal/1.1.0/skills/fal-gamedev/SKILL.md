---
name: fal-gamedev
description: >
  Generate 2D game assets with fal.ai. Use for pixel-art characters, sprite
  sheets, walk cycles, RPG sprites, idle/attack/jump animations, transparent
  assets, parallax backgrounds, isometric maps, and game-ready visual packs.
---

# fal.ai Game Dev Assets

Use when the user wants 2D game art or asset packs. Execution runs through
fal.ai MCP tools.

## Asset Pipeline

1. Character concept: generate or edit a clean base character.
2. Sprite poses: create walk, idle, jump, attack, side/up/down/isometric views.
3. Cleanup: remove background and preserve transparent output when needed.
4. Backgrounds: generate parallax layers or isometric map assets.
5. Consistency pass: ensure palette, line weight, proportions, and camera angle
   match across all assets.

## Inputs To Collect

- Game genre and camera: platformer, RPG, isometric, top-down, side-scroller.
- Style: pixel art, hand-painted, vector, anime, low-poly render.
- Character description and palette.
- Needed animations and directions.
- Tile/grid constraints, transparent background, output size.
- Engine constraints if supplied.

## Prompt Guardrails

- Keep one character silhouette across all sprites.
- Specify camera angle and frame count expectations.
- Avoid text unless UI asset text is explicitly requested.
- Use consistent palette and lighting across the pack.
- For sprite sheets, reserve spacing between poses.

## Quality Bar

- Assets are readable at game scale.
- Directional sprites match perspective.
- Transparent assets do not leave halos when background removed.
- Background layers can parallax without obvious seams.
