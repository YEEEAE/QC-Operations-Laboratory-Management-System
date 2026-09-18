---
name: marketing
description: >
  Plan campaign-level marketing asset production with fal.ai. Use for launch
  kits, campaign matrices, paid social variants, landing-page visuals, email
  and banner imagery, hook/proof/conversion assets, and creator ad packages.
---

# Marketing Production

Use when the user wants a campaign system rather than one isolated asset.
Execution runs through fal.ai MCP tools.

Load `commercial` for product-specific assets and `ugc` for creator-style ads.

## Inputs To Collect

- Objective: launch, acquisition, retargeting, education, event, activation.
- Audience: persona, market, use case, awareness level, objections.
- Offer: product, feature, bundle, trial, waitlist, event, promotion.
- Channels: paid social, organic, landing page, email, display, app.
- Required assets: stills, videos, thumbnails, hero image, carousel, banner.
- Brand rules: colors, logo, typography, tone, taboo visuals, competitors.
- Claims: exact approved copy, proof points, disclaimers, compliance limits.

## Campaign Matrix

Create a compact matrix before generation:

- Hook asset: first-frame attention.
- Proof asset: product, process, visible result, or supplied evidence.
- Context asset: audience use case.
- Conversion asset: clean end frame or layout-safe visual.
- Retention/reminder asset: variation for later touchpoints.

Each asset needs role, channel, crop, format, model route, prompt summary, and
guardrails.

## Prompt Order

1. Asset role and channel.
2. Product or subject invariant.
3. Audience context and use case.
4. Visual system: camera, lighting, composition, color, motion.
5. Copy handling: no generated text, safe space, or exact provided wording.
6. Variation axis.
7. Guardrails: no fake claims, extra logos, distorted UI, or fake proof.

## Model Choices

- Exact copy/key art: `openai/gpt-image-2`.
- Premium stills: `openai/gpt-image-2`, `fal-ai/nano-banana-pro`,
  `fal-ai/nano-banana-2`.
- Edits from product/logo/UI: `fal-ai/nano-banana-pro/edit`,
  `openai/gpt-image-2/edit`.
- Product/social video: Seedance 2.0 image-to-video or text-to-video.
- Creator ad: `veed/fabric-1.0`, `veed/fabric-1.0/text`, or
  `fal-ai/creatify/aurora`.

## Quality Bar

- Every asset maps to a campaign role and channel.
- Claims are supplied, observable, or removed.
- Variants differ by one clear axis.
- Safe zones work for platform UI and external overlays.
- Final answer includes a campaign manifest and defects.
