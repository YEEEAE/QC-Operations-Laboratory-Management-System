---
name: frontend-design
description: Design and build distinctive production-ready frontend interfaces with strong visual direction, polished layout, and intentional interaction design. Use when Codex needs to create or redesign pages, sections, dashboards, landing pages, SaaS screens, components, design systems, or HTML/CSS/React/Next.js UIs, especially when the user asks for better aesthetics, hierarchy, spacing, typography, motion, responsiveness, premium styling, or a more human visual experience. Trigger on requests mentioning UI, UX, redesign, dashboard, landing page, component design, تحسين الواجهة, تصميم واجهة, تجربة المستخدم, إعادة تصميم, صفحة هبوط, لوحة تحكم, أو تحسين الشكل العام.
---

# Frontend Design

Create interfaces that feel intentional, specific to the product, and ready to ship. Convert vague design requests into a concrete art direction, then implement working UI instead of stopping at abstract advice.

## Workflow

1. Define the brief before coding.
   Extract the user goal, target audience, conversion point, technical stack, constraints, and whether the project already has a design language.
2. Commit to one art direction.
   Name the direction in a short phrase such as `editorial contrast`, `industrial utility`, or `warm premium`. Decide typography, palette, spacing rhythm, motion style, and the single memorable visual device.
3. Build from hierarchy outward.
   Start with information order and responsive layout. Introduce design tokens or CSS variables early so the system stays coherent while the UI expands.
4. Add controlled moments of delight.
   Use one or two strong interactions, not noisy motion everywhere. Prefer meaningful entrances, hover reveals, layered backgrounds, or scroll transitions that reinforce the art direction.
5. Verify the finish.
   Check mobile layout, accessibility, loading states when relevant, empty states when relevant, and visual consistency before handing off.

## Core Rules

- Preserve the existing product language when working inside an established app or design system. Push quality upward without making the result feel imported from another brand.
- Prefer strong, deliberate choices over safe averages. Avoid generic dashboard chrome, default SaaS layouts, and color palettes that could belong to any template.
- Use expressive typography. Start with fonts already available in the project; if new fonts are justified, keep the pairing purposeful and the loading strategy lightweight.
- Use color, spacing, borders, and texture as a connected system. Define tokens first, then reuse them consistently.
- Build atmosphere in the background. Use gradients, meshes, patterns, grain, shapes, or depth when they support the concept. Do not default to flat blank canvases unless minimalism is the explicit direction.
- Keep motion intentional. One strong page-load sequence is usually better than many unrelated micro-animations.
- Treat Arabic and RTL as first-class when the product serves Arabic users. Use logical properties, correct alignment, balanced mixed-language typography, and mirrored layout behavior.
- Match technical complexity to the visual idea. Minimal interfaces still need rigor; maximal interfaces still need performance discipline.

## Delivery Expectations

- Ship code, not only recommendations, unless the user explicitly asks for strategy or critique.
- Keep styles scoped to the feature or component unless the task genuinely requires design-token or global-layer changes.
- Reuse project primitives when they exist. If the current primitives are the problem, improve them deliberately instead of bypassing them with one-off hacks.
- Keep frontend choices compatible with the stack. For React or Next.js, follow the repository patterns and avoid adding abstractions that are not already justified.
- When the brief is underspecified, state the chosen direction in one sentence and proceed.

## Reference Files

- Read `references/visual-directions.md` when the brief needs a fast art-direction starting point.
- Read `references/design-qa-checklist.md` before final delivery or when reviewing a frontend implementation.

## Avoid

- Generic AI-looking hero sections, cards, or dashboards.
- Purple-on-white defaults, timid gradients, or interchangeable font stacks.
- Random motion that does not reinforce hierarchy or mood.
- Styling that ignores performance, accessibility, or responsive behavior.
- Visual polish that breaks product clarity.
