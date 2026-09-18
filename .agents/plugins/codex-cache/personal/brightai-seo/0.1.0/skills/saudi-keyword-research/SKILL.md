---
name: saudi-keyword-research
description: Research and prioritize Saudi Arabic and English keywords for BRIGHTAI using DataForSEO, with explicit intent, city, funnel, and landing-page mapping.
---

# Saudi Keyword Research

Use this skill when the user asks for Saudi keyword research, keyword volume, CPC, competition, keyword clustering, or a content roadmap for BRIGHTAI.

## Workflow

1. Read `.agents/mind/01-mind-latest.md` before making recommendations. Use `https://brightai.live` as the canonical domain unless the mind says otherwise.
2. Check that the DataForSEO MCP server is available. Never ask the user to paste credentials and never print or store credentials.
3. Start from the user's seed topics and add Saudi modifiers: الرياض، جدة، الدمام، الخبر، مكة، المدينة، السعودية، SAR، رؤية 2030، PDPL، SDAIA، NCA ECC، أتمتة، شات بوت.
4. Query keyword data for Saudi Arabia and the appropriate Arabic/English language. Keep source, date, location, language, and endpoint with every metric.
5. Cluster by search intent: informational, commercial investigation, transactional, navigational, and local.
6. Map every cluster to an existing BRIGHTAI URL or mark it as a proposed page. Do not invent volume, CPC, difficulty, or ranking data; use `pending_credentials` when the API is unavailable.
7. Prioritize with a transparent score using demand, business fit, achievable competition, intent, and content gap. Explain the scoring inputs.
8. Return a concise table plus next actions and a CSV-ready dataset when the user asks for export.

## Guardrails

- Separate measured DataForSEO facts from strategic inference.
- Do not change source code or publish content unless the user explicitly asks.
- Preserve the canonical domain decision in the project mind.
- For every completed project task, update `.agents/mind/01-mind-latest.md` with actual work and verification.
