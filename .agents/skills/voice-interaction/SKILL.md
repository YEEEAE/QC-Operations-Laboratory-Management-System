---
name: voice-interaction
description: "Design voice interactions and speech interfaces that work for people with diverse speech patterns, accents, and communication styles. Use when designing voice commands, voice search, dictation, voice assistants, or any interface that accepts speech input. Triggers on: voice, speech, dictation, voice command, voice search, speech recognition, accent, stutter, speech disability, non-verbal, AAC, voice assistant, talk to type."
---

# Voice Interaction Design

Design voice interfaces that work for the full range of human speech —
including accents, speech disabilities, non-native speakers, and people
in noisy or quiet environments.

## Who This Is For

- People with motor disabilities who use voice as primary input
- People who stutter, have dysarthria, or other speech differences
- Non-native speakers with varied accents
- People in environments where typing is impractical
- Anyone who prefers voice to typing for certain tasks

## Core Principles

### Voice Should Never Be the Only Option
- Every voice interaction must have a text/touch/keyboard alternative
- Voice is an accelerator, not a gatekeeper
- Don't require voice for identity verification or critical actions
  unless an alternative exists

### Design for Speech Variation
- Support varied pacing — don't cut off slow speakers
- Allow generous silence before timing out
- Don't penalise repetition, filler words, or self-correction
- Support multiple phrasings for the same intent
  ("go back", "previous page", "take me back", "undo")

### Feedback Must Be Clear
- Confirm what the system heard (visual transcript)
- Make it easy to correct misrecognition
- Show when the system is listening vs. processing vs. waiting
- Never execute a destructive action on voice alone without
  confirmation

## Design Patterns

### Flexible Recognition
- Accept multiple ways to say the same command
- Don't require exact phrasing — intent matters more than syntax
- Support "did you mean?" clarification for ambiguous input
- Allow users to spell out words the system doesn't recognise

### Graceful Failure
- When recognition fails: show what was heard and offer correction
- Never respond with just "I didn't understand" — offer alternatives
- Provide a "type instead" option at every failure point
- After repeated failures: proactively suggest switching to text input

### Privacy and Control
- Clear visual/audio indicator when microphone is active
- Easy one-action mute/stop listening
- Don't record or transmit audio without explicit consent
- Allow users to review and delete voice data

## Assessment Questions

1. Can every voice-activated feature also be completed without voice?
2. Does the system handle varied speech patterns without frustration?
3. Is there clear feedback showing what the system heard?
4. Can users easily correct misrecognition?
5. Is it obvious when the system is listening?
