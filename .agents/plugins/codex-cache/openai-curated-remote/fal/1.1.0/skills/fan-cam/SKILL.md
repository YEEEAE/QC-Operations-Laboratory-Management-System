---
name: fan-cam
description: >
  Create personalized live sports broadcast fan-cam videos with fal.ai. Use
  for realistic spectator cutaways, stadium crowd reactions, broadcast-style
  screenshots, scoreboard overlays, TV bugs, and identity-preserving fan
  reaction videos from a user photo.
---

# Fan Cam

Use when the user wants a personalized spectator video that feels like a live
sports broadcast cutaway. Execution runs through fal.ai MCP tools.

## Required Inputs

- User photo or approved portrait reference.
- Sport, team/event context, venue, and crowd mood.
- Reaction: shocked, celebrating, nervous, chanting, laughing, emotional.
- Broadcast format: close-up cutaway, crowd pan, scoreboard moment, replay.
- Duration and crop, usually 9:16 or 16:9.

## Production Pattern

1. Upload the portrait reference if local.
2. Generate a broadcast-still frame that preserves identity.
3. Use image-to-video from that approved frame.
4. Add sports broadcast details in prompt only when they are generic or
   user-provided. Do not invent real network marks or false event claims.
5. Review identity, crowd plausibility, scoreboard/text artifacts, and motion.

## Prompt Guardrails

- Keep the person recognizable from the reference.
- Use generic broadcast styling unless the user supplies exact rights-safe
  graphics.
- Avoid fake readable scoreboards unless the user supplies exact text.
- Keep motion natural: cheering, gasping, standing, waving, phone held up.

## Model Choices

- Identity-preserving frame: `openai/gpt-image-2/edit` or another strong edit
  endpoint after schema inspection.
- Broadcast video: Kling v3 image-to-video or Seedance image-to-video,
  depending on available controls and quality target.

## Quality Bar

- Person remains recognizable.
- Broadcast frame feels live, not posed studio content.
- Crowd and venue support the sport.
- Any text/logos are absent, generic, or explicitly provided.
