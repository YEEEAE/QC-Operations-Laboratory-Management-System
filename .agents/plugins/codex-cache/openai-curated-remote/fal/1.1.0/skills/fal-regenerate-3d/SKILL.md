---
name: fal-regenerate-3d
description: >
  Build a polished 3D character-selector experience with fal.ai assets. Use
  for stylized characters, GLB generation, companion objects, PBR floor
  textures, video backgrounds, palette systems, and Three.js presentation.
---

# fal.ai 3D Experience Pipeline

Use when the user wants an end-to-end 3D showcase, roster, selector, or game
character experience. Execution of media assets runs through fal.ai MCP tools;
the final app is built in local code.

## Pipeline

1. Character stills: generate full-body front-facing designs with stable
   silhouettes and palette.
2. Character 3D: convert approved stills to GLB/OBJ/PLY with rigging or
   animation fields when supported.
3. Companion/object: generate matching prop or creature stills, then convert
   to 3D if needed.
4. Materials: generate/extract PBR floor or environment textures.
5. Backgrounds: generate loopable video or still environment per character.
6. App shell: Three.js scene, character selector, palette swaps, responsive UI.
7. Optimization: compress GLBs, reduce textures, lazy-load assets, test mobile.

## Inputs To Collect

- Experience theme and number of characters.
- Character archetypes, palettes, and environment biomes.
- Output format: static HTML, React app, game asset pack, GLB set.
- Rigging/animation needs.
- Budget/quality target and maximum asset size.

## Quality Bar

- GLBs load and render nonblank.
- Materials are not overlarge for the web target.
- Character identity matches source still.
- Selector UI is responsive and usable.
- The final answer includes all generated asset URLs, local files when present,
  and integration notes.
