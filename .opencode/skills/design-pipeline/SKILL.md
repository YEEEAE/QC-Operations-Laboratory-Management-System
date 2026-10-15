---
name: design-pipeline
description: |
  End-to-end design-to-code orchestrator for premium websites and apps. Runs a
  5-stage pipeline that coordinates brand foundation, taste selection, reference
  image generation, reference-to-code conversion, and output discipline. Use when the
  user asks to "design a landing page", "build a complete homepage from scratch",
  "make our marketing site premium", "redesign this site end-to-end", or wants a
  full journey from brand identity to shippable code. Do NOT use for single-
  section tweaks (use design-taste-frontend or frontend-design directly), copy/
  content edits only, or backend-only work — this skill is for the full journey.
---

# Design Pipeline

A meta-skill that orchestrates 12 focused design/engineering skills in sequence.
You do not re-implement their content — you **load each stage's skill** when that
stage starts and follow it. Your job is sequencing, gating, and verification
between stages.

## Companion skills (assumed installed)

All of these live in `~/.agents/skills/` (or `.agents/skills/` for project-level
skills). The orchestrator references them by name; do not duplicate their rules.

| Stage | Skill | Purpose |
|---|---|---|
| 1 — Brand | `brandkit`, `design-md`, `awesome-design-md`, `design-taste-frontend` | Build / analyze brand identity and DESIGN.md |
| 2 — Taste | `design-taste-frontend` (+v1 fallback), `gpt-taste`, `high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`, `redesign-existing-projects`, `frontend-design` | Pick the aesthetic direction and tokens |
| 3 — Images | `imagegen-frontend-web` (web) or `imagegen-frontend-mobile` (mobile) | Produce premium reference images, ONE per section |
| 4 — Code | `frontend-design` | Convert reference images to shippable code |
| 5 — Discipline | `full-output-enforcement` | Guarantee no truncation, complete delivery |

If a companion skill is missing, tell the user which one to install before
continuing. Do not silently substitute.

## Inputs to collect

Ask up front (don't guess these — wrong answers ruin the whole pipeline):

- **Mode**: `greenfield` (design from scratch) vs `redesign` (improve existing
  page — paste URL or screenshot).
- **Surface**: `web` (default), `mobile-app`, or both.
- **Page type**: `landing`, `homepage`, `product`, `pricing`, `dashboard`,
  `docs`, `blog`, `marketing`, `app-screen`.
- **Brand status**: `existing` (paste brand tokens / current site), `new`
  (build identity from scratch), or `inspired-by` (name 1-3 reference sites).
- **Aesthetic direction** (one of): premium-clean, editorial-minimalist,
  cinematic-dark, brutalist-industrial, motion-rich, trust-compliance (for
  Saudi regulatory content). If unsure, default to `premium-clean`.
- **Locale**: `ar-SA` (RTL mandatory), `en`, or bilingual — affects section
  ordering, copy direction, font choice.
- **Constraints**: performance budget (LCP/CLS/INP), accessibility (WCAG 2.2 AA
  default), color/dark-mode, framework (Astro / Next.js / Vite+React / vanilla).

If the user is vague, pick sensible defaults and state them before starting —
do not block on clarification when defaults are obvious.

## Procedure

Run the stages in order. Each stage has an entry gate (start) and an exit gate
(must pass before next stage). Do not skip a stage. Do not run stages in
parallel.

### Stage 0 — Mode + scope decision

Decide and announce:

- If `greenfield`: Stages 1 → 2 → 3 → 4 → 5.
- If `redesign`: skip Stage 1 (no brand build), start at Stage 2 with audit of
  the existing site (`design-md` on a screenshot or URL).
- If `mobile-app`: replace `imagegen-frontend-web` with `imagegen-frontend-mobile`
  in Stage 3.

Reason: this decision changes which companion skills load. Setting it up front
prevents Stage 3 from generating the wrong surface.

### Stage 1 — Brand foundation (greenfield only)

Goal: produce a `DESIGN.md` that downstream stages can read.

1. Load `brandkit`. Follow its premium brand-board output rules.
2. If the user named reference sites, also load `awesome-design-md` to pull
   matching DESIGN.md examples.
3. Synthesize one `DESIGN.md` covering: atmosphere, palette (1 accent max,
   saturation < 80%, no neon), typography (banned: `Inter` for premium; `Times
   New Roman` family for non-editorial; pure `#000000`), hero rules, motion
   philosophy, anti-patterns.

**Exit gate**: `DESIGN.md` exists at the project root and includes the 7
sections from `design-md`'s output format.

Reason: stages 3-4 read this file as ground truth. Skipping it forces them to
guess, which is exactly the generic look you're trying to avoid.

### Stage 2 — Taste selection

Goal: pick the aesthetic variant and tokens, write the page plan.

1. Load `design-taste-frontend` as the default scaffold (it's the most complete).
   Use `design-taste-frontend-v1` only if the user asks for v1 behavior explicitly.
2. Layer one variant skill on top based on the aesthetic direction chosen:
   - `premium-clean` → `design-taste-frontend` alone.
   - `editorial-minimalist` → + `minimalist-ui`.
   - `cinematic-dark` → + `high-end-visual-design`.
   - `brutalist-industrial` → + `industrial-brutalist-ui`.
   - `motion-rich` → + `gpt-taste` (GSAP, scroll triggers).
   - `trust-compliance` (Saudi regulatory pages) → `design-taste-frontend` with
     conservative tokens (calm palette, generous spacing, no neon).
3. If `redesign`, also load `redesign-existing-projects` for the audit-first
   workflow.
4. Output a **page plan**: list of sections in order, each with a 1-line purpose
   and which `imagegen` skill will produce its reference.

**Exit gate**: page plan approved by user (or auto-approved if mode is
greenfield and direction is clear).

Reason: the page plan is the contract with Stage 3. Without it, image
generation produces disconnected sections that don't stitch into a page.

### Stage 3 — Reference image generation

Goal: one premium reference image per section.

1. Load `imagegen-frontend-web` (or `-mobile`). Follow its rules strictly.
2. **Hard rule**: one image per section, separate horizontal image — never
   compress multiple sections into one board. A 8-section landing page produces
   8 images.
3. Use the `DESIGN.md` from Stage 1 as the prompt's design backbone.
4. Use the page plan from Stage 2 as the section order.
5. Compose variety: alternate left-text/right-image with right-text/left-image,
   mix hero scales (giant / mid / mini minimalist), vary CTA phrasing.
6. Save images under `design/<section-name>.png` in the project.

**Exit gate**: every section has its own image; palette/typography in each
matches `DESIGN.md`.

Reason: tiny compressed boards destroy section-level detail and force Stage 4
to invent. The "one image per section" rule is the difference between a
premium result and a generic AI look.

### Stage 4 — Image → code

Goal: shippable, production-grade implementation matching the references.

1. Load `frontend-design`. Follow its anti-slop rules (no `Inter`, no centered
   hero at high variance, no 3-equal-card grids, no emojis).
2. Process images **one section at a time** in page-plan order.
3. For each section, output: the markup, the scoped CSS (using the project's
   design tokens, not raw values), and any interaction script.
4. Stack sections in the same order as Stage 2's page plan.
5. Respect locale: `ar-SA` requires RTL, logical CSS properties, font choice
   that supports Arabic glyphs.

**Exit gate**: every section renders, matches its reference at desktop + mobile
viewports, uses design tokens (no raw hex/px), respects `prefers-reduced-motion`.

Reason: code quality here determines long-term maintainability. Cutting corners
with raw values or non-RTL-aware CSS forces rewrites later.

### Stage 5 — Output discipline + verification

Goal: complete, uncut delivery that matches the brief.

1. Load `full-output-enforcement`. Apply its no-truncation rules throughout
   Stages 3-4.
2. Run the project's verification commands (e.g. `npm run build`, `npm run
   verify:all`).
3. Run the project's SEO/perf checks if they exist (e.g. `npm run seo:all`,
   `npm run performance:budget`).
4. Produce the final summary in Saudi dialect (matching the project's voice).

**Exit gate**: build green, all audits pass, deliverables listed.

Reason: this stage is what separates "AI-generated mockup" from "shipped
product". Skipping it leaves the user with a half-built page and surprise
regressions.

## Output contract

A complete run delivers, in this order:

1. `DESIGN.md` at project root (Stage 1) — design system reference.
2. `<page-plan>.md` (Stage 2) — section list with purposes.
3. `design/*.png` — one reference image per section (Stage 3).
4. `<implementation files>` — markup + scoped CSS + scripts (Stage 4).
5. Final summary in Saudi dialect (Stage 5).

If the user only asked for part of the journey (e.g. "just generate the
reference images"), still produce the partial deliverables for the stages you
ran, and clearly mark which stages were skipped and why.

## Failure handling

- **Stage 1 produces a generic DESIGN.md**: that means the brand inputs were too
  thin. Ask 2-3 sharper brand questions (audience, competitor references,
  aesthetic mood words) and re-run Stage 1.
- **Stage 3 images don't match each other**: palette or scale drift. Re-load
  `DESIGN.md` and re-generate the offending sections with stricter color/typo
  guidance in the prompt.
- **Stage 4 code is bloated or uses raw values**: you skipped the project's
  design tokens. Re-read the token file and rewrite the section using
  `var(--token-name)` and BEM class names.
- **Stage 5 build fails**: never move on. Fix the failure before reporting
  done. If the failure is in a protected file (config, redirects), stop and
  ask the user.
- **Companion skill missing**: list the missing one(s), tell the user the
  install path, and pause. Do not substitute a weaker skill silently.
- **User changes direction mid-pipeline**: restart from the earliest affected
  stage. Do not patch forward.

## Examples

**Input 1 (greenfield)**: "صمم landing page لمنصة AI سلامة في السعودية، dark
cinematic feel، عربي."

Path: Stage 0 → `greenfield`, `web`, `landing`, `new`, `cinematic-dark`, `ar-SA`
→ Stage 1 loads `brandkit` + `awesome-design-md`, produces `DESIGN.md` with
off-black base, cyan accent (matching Saudi AI safety vibe), bilingual typo
→ Stage 2 loads `design-taste-frontend` + `high-end-visual-design`, page plan
with 6 sections (hero, problem, solution, compliance packs, demo CTA, footer)
→ Stage 3 loads `imagegen-frontend-web`, generates 6 separate horizontal
images under `design/`
→ Stage 4 loads `frontend-design`, builds each section as RTL-aware Astro
components
→ Stage 5 verifies build + audits, delivers Saudi-dialect summary.

**Input 2 (redesign)**: "حسّن صفحة /pricing/ الحالية، خلها premium."

Path: Stage 0 → `redesign`, `web`, `pricing` → skip Stage 1 → Stage 2 loads
`design-md` (audit current /pricing/), `redesign-existing-projects`,
`design-taste-frontend` → page plan for the new pricing layout
→ Stages 3-5 as above, scoped to pricing page only.

**Counter-example (do NOT trigger this skill)**: "غيّر لون الزر الأخضر في
الرئيسية للأزرق." → single-element tweak → use `design-taste-frontend` or
direct edit, not the full pipeline.
