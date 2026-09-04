---
name: awesome-design-md
description: Use curated DESIGN.md references from VoltAgent/awesome-design-md and getdesign.md to choose, fetch, compare, or apply an inspiration design system for frontend work. Trigger when Codex needs a ready-made DESIGN.md, brand-inspired visual direction, UI style reference, design-system prompt, or to create/update a project DESIGN.md from examples such as Vercel, Linear, Apple, Stripe, Supabase, Claude, VoltAgent, Airbnb, Tesla, or other curated website styles.
---

# Awesome DESIGN.md — Full Skill Reference

Use this skill to select, fetch, compare, and apply a curated `DESIGN.md` reference from the VoltAgent `awesome-design-md` collection (69+ brand design systems).

## What is DESIGN.md?

[DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) is a concept introduced by Google Stitch — a plain-text design system document that AI agents read to generate consistent UI. It's a markdown file. No Figma exports, no JSON schemas, no special tooling.

| File | Who reads it | What it defines |
|------|-------------|-----------------|
| `AGENTS.md` | Coding agents | How to build the project |
| `DESIGN.md` | Design agents | How the project should look and feel |

Each DESIGN.md follows the [Stitch format](https://stitch.withgoogle.com/docs/design-md/format/) with 9 sections:

| # | Section | What it captures |
|---|---------|-----------------|
| 1 | Visual Theme & Atmosphere | Mood, density, design philosophy |
| 2 | Color Palette & Roles | Semantic name + hex + functional role |
| 3 | Typography Rules | Font families, full hierarchy table |
| 4 | Component Stylings | Buttons, cards, inputs, navigation with states |
| 5 | Layout Principles | Spacing scale, grid, whitespace philosophy |
| 6 | Depth & Elevation | Shadow system, surface hierarchy |
| 7 | Do's and Don'ts | Design guardrails and anti-patterns |
| 8 | Responsive Behavior | Breakpoints, touch targets, collapsing strategy |
| 9 | Agent Prompt Guide | Quick color reference, ready-to-use prompts |

---

## Core Workflow

1. Identify the requested inspiration style, brand, or UI category.
2. Read `references/catalog.md` when a matching style is not obvious or when comparing options.
3. Fetch the selected reference with `scripts/fetch_design_md.py`.
4. Save the result as `DESIGN.md` in the target project **only** when the user asks to apply or install it.
5. If adapting the reference, preserve concrete design tokens and rewrite only project-specific guidance.
6. For Arabic or RTL projects, add RTL-specific notes to the resulting `DESIGN.md` rather than copying LTR assumptions blindly.

---

## Selection Rules

### By Product Category

| Product type | Recommended brands |
|---|---|
| SaaS dashboards | Linear, Vercel, Supabase, Sentry, Intercom, Stripe, ClickHouse |
| AI products | Claude, Cohere, Mistral AI, Replicate, RunwayML, Together AI, VoltAgent, xAI |
| Developer tools | Cursor, Raycast, Warp, Expo, Superhuman, Lovable |
| Premium consumer / editorial | Apple, Airbnb, Nike, Ferrari, SpaceX, WIRED, The Verge, Tesla |
| E-commerce | Shopify, Nike, Meta, Starbucks, Airbnb |
| Fintech | Stripe, Revolut, Coinbase, Binance, Kraken, Mastercard, Wise |
| Documentation | Mintlify, MongoDB, HashiCorp |
| Creative / Design tools | Figma, Framer, Miro, Webflow, Airtable, Clay |
| Automotive luxury | BMW, Ferrari, Lamborghini, Bugatti, Tesla, Renault |
| Enterprise | IBM, HashiCorp, Vodafone |
| Media / Consumer tech | Spotify, Pinterest, PlayStation, Uber, NVIDIA |

### Saudi Arabic-First Enterprise Rule

For Saudi Arabic-first enterprise work, adapt **any** selected reference with:
- `lang="ar-SA"`, `dir="rtl"`
- Logical CSS properties (`margin-inline-start` instead of `margin-left`)
- Arabic typography (Noto Sans Arabic, IBM Plex Arabic, Cairo, Tajawal)
- Local trust signals (NCA, NDMO badges)

---

## Fetching References

### List all available slugs

```bash
python3 <skill-dir>/scripts/fetch_design_md.py --list
```

### Fetch by slug

```bash
python3 <skill-dir>/scripts/fetch_design_md.py vercel --output DESIGN.md
```

### Fetch by full URL

```bash
python3 <skill-dir>/scripts/fetch_design_md.py https://getdesign.md/design-md/supabase/DESIGN.md
```

### Save to project

```bash
python3 <skill-dir>/scripts/fetch_design_md.py stripe --output /path/to/project/DESIGN.md
```

### Compare two designs

```bash
python3 <skill-dir>/scripts/fetch_design_md.py --compare vercel linear.app
```

### Search catalog by keyword

```bash
python3 <skill-dir>/scripts/fetch_design_md.py --search "dark dashboard"
```

Network access may require user approval. If fetching fails, use the URL printed by the script and ask before falling back to a different source.

---

## Quick Reference URLs

The base URL pattern for all DESIGN.md files is:

```
https://getdesign.md/design-md/{slug}/DESIGN.md
```

You can also request new DESIGN.md files at: `https://getdesign.md/request`

---

## Output Guidance

When creating or modifying a project `DESIGN.md`, include:

- **Visual theme and atmosphere** — mood, density, design philosophy.
- **Color palette** — semantic names, hex values, and functional roles.
- **Typography rules** — font families, scale, weights, line-height.
- **Component styling rules** — buttons, cards, inputs, navigation, and states (hover, active, disabled, focus).
- **Layout principles** — spacing scale, grid, whitespace philosophy, responsive behavior.
- **Depth and elevation** — shadow system, surface hierarchy.
- **Do and don't guidance** — design guardrails and anti-patterns.
- **Agent prompt guide** — quick reference for future UI generation.

Keep the final file practical for agents. Avoid long brand history, legal claims, or unrelated marketing copy.

---

## RTL Adaptation Checklist

When applying a DESIGN.md to an Arabic RTL project:

- [ ] Replace `left`/`right` CSS with `inline-start`/`inline-end`.
- [ ] Mirror icon directions (arrows, chevrons).
- [ ] Set `direction: rtl` and `text-align: start`.
- [ ] Validate font rendering for Arabic glyphs.
- [ ] Adjust letter-spacing (typically reduce for Arabic).
- [ ] Test navigation flow from right-to-left.
- [ ] Ensure numeric/English fragments keep `dir="ltr"` inline.

---

## Source Repository

- **GitHub**: `https://github.com/VoltAgent/awesome-design-md`
- **Website**: `https://getdesign.md`
- **License**: MIT
- **Count**: 69+ curated DESIGN.md files
