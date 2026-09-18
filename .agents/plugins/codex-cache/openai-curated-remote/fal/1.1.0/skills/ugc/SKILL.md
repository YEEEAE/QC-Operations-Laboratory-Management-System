---
name: ugc
description: >
  Plan and produce UGC-style creator ads and social videos with fal.ai. Use for
  direct-to-camera creator scripts, talking-head ads, product demos,
  testimonials, founder clips, unboxing, reactions, before-after, faceless
  voiceover, and short vertical social videos.
---

# UGC Production

Use when the user wants creator-style content instead of polished studio ads.
Execution runs through fal.ai MCP tools.

## Inputs To Collect

- Product or offer.
- Format: direct-to-camera, demo, reaction, unboxing, founder, faceless b-roll.
- Speaker: supplied portrait/video, generated avatar, no face, or voiceover.
- Script source: exact script, bullets, offer copy, or ask to draft.
- Platform: TikTok, Reels, Shorts, paid social, landing page, prototype.
- Runtime/crop: usually 9:16; 6-15 seconds for hooks, 15-45 for ads.
- Source media: portrait, product image/video, logo, b-roll, audio.
- Claims: proof supplied, disclaimers, banned phrases.

## Script Shape

1. Hook: concrete tension, result, objection, or curiosity.
2. Context: why the speaker cares.
3. Product moment: visible use, demo, or comparison.
4. Proof: supplied metric, visible result, or sensory detail.
5. Turn: objection answered or before-after.
6. Close: soft CTA or final product frame.

Avoid fake testimonials and unsupported medical, financial, or performance
claims.

## Production Routes

- Portrait plus audio: `veed/fabric-1.0`.
- Portrait plus text: `veed/fabric-1.0/text`.
- Avatar with visual direction: `fal-ai/creatify/aurora`.
- Existing footage with new speech: `fal-ai/sync-lipsync/v2`.
- Product b-roll: `bytedance/seedance-2.0/image-to-video`.
- Hook frames/thumbnails: `openai/gpt-image-2` or `fal-ai/nano-banana-pro`.

## Quality Bar

- First 1-2 seconds have a clear hook.
- Spoken script fits runtime.
- Mouth motion is synced for speaking faces.
- Product/logo/packaging stay stable.
- Captions/text are not hallucinated inside the video.
- Claims are user-supplied or phrased as visible observations.
