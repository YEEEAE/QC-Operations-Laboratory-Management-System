---
name: fal-workflow
description: >
  Design multi-step fal.ai media workflows for MCP execution. Use when the user
  wants model chaining, batch generation, fan-out/fan-in, frame bridging,
  narrated video, dataset creation, reusable pipeline logic, or workflow JSON.
---

# fal.ai Workflows

Use this skill when a single model call is not enough. A workflow is a planned
sequence of model calls with dependencies, retries, quality gates, and a final
manifest.

## Workflow Modes

- Cloud workflow JSON: use when the user wants a reusable graph asset.
- MCP-orchestrated workflow: use when the client should run a sequence now through
  the fal.ai MCP tools.

Do not call genmedia CLI from this plugin. If a source skill mentions CLI
orchestration, translate that intent into MCP tool usage.

## Planning Pattern

1. Define final deliverable and acceptance criteria.
2. Split into nodes: input assets, generation, utility transforms, edits,
   video/audio/3D steps, and final packaging.
3. Choose model per node with `model-routing`.
4. Capture dependencies: which output URL feeds which next input.
5. Inspect schema for each endpoint before building payloads.
6. Run independent expensive nodes async.
7. Poll async nodes without restarting completed work.
8. Gate each step: preserve identity/product, check duration, check format.
9. Return a manifest: node, endpoint, request id, inputs, output URLs, defects.

## Useful Patterns

- Anchor first: generate or upload a strong still, then drive edits/video from
  that approved asset.
- Fan-out: create several variants from the same anchor, then select one.
- Fan-in: combine product, logo, character, or style references into an edit.
- Frame bridge: generate first and last frame, then use image-to-video or
  supported controls to bridge motion.
- Audio-first: generate/upload voice first, then match visuals to duration.
- Utility cleanup: background removal, compression, upscaling, format
  conversion, segmentation, or OCR as deterministic nodes.

## Failure Handling

- 422/schema error: re-inspect schema and remove guessed fields.
- Product/identity drift: switch to reference/edit workflow.
- Video still running: keep polling the same request id.
- Bad prompt alignment: reduce prompt scope and change one variable at a time.
- Cost spike: reduce variants, duration, resolution, or use draft endpoints.
