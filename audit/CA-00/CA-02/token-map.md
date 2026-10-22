# CA-02 — token → consumer map

Date: 2026-10-17 · HEAD `7d46507c` (working tree dirty) · Node `v24.20.0` · pnpm `11.25.0`

This map documents the active presentation stack, its source, and every consumer that
depends on a semantic token. It is a source map, not a design approval.

## 1. Layer chain and scope

```
BaseLayout.astro
  └─ src/ui/styles/global.css
       ├─ tokens.css             primitives + semantic aliases (default dark system)
       ├─ motion.css             duration/easing tokens
       ├─ density.css            control/table density
       ├─ workspaces.css         workspace/table/print foundations
       ├─ precision-light.css    historical light direction (selector not active)
       └─ capa-a.css             ACTIVE direction, last in cascade
AppLayout.astro
  └─ BaseLayout visualDirection="capa-a"
       └─ <html data-visual-direction="capa-a">   ← declarations resolve here
```

`capa-a.css` is imported last. Its selectors are anchored to
`html[data-visual-direction='capa-a']`, which has higher specificity than `:root`
(`0,1,1` vs `0,1,0`), so its primitives replace the default palette without a
second stylesheet or a runtime theme switch.

`precision-light.css` still ships but its selector
`html[data-visual-direction='precision-light']` never matches the authenticated
shell. It is retained as an inactive historical direction, not a fallback theme.

## 2. Semantic roles and consumers

| Role | Token | Value | Source | Consumers |
|---|---|---|---|---|
| canvas | `--color-canvas` / `--surface-canvas` | `#14181E` | reference `capa-a.html` | `html`, `body`, `.system-content`, `.app-shell`, `.app-main`, `SystemBackground` base |
| panel | `--surface-panel` (`--color-surface-1`) | `#252B34` | reference | `.panel`, `.card`, `.identity`, `.state-card`, topbar, dialog, table headers, print reset |
| inset | `--surface-inset` (`--color-surface-2`) | `#2B323C` | reference surface-2 | inputs, code/pre wells, `--input-background`; declared in `tokens.css` and `precision-light.css` for completeness |
| raised | `--surface-raised` | `#2B323C` | reference | secondary controls, select backgrounds, hover rows |
| border (panel) | `--border-default` (`--color-border-default`) | `#383F4C` | reference | panel/card/table/dialog borders; decorative only |
| border (control) | `--control-border` | `#707A8C` | measured accessibility delta (3.29:1 on panel) | inputs, select, textarea, secondary buttons, dialog inputs |
| focus | `--focus-ring` / `--focus` | `#92B8F2` | reference accent | `:focus-visible` outlines, selected borders |
| text primary | `--text-primary` (`--color-text-primary`) | `#E8EDF5` | reference | body, headings, table cells, dialog text |
| text muted | `--text-muted` (`--color-text-muted`) | `#9BA3AF` | reference | labels, metadata, placeholder (5.08:1 on inset) |
| text inverse | `--color-text-inverse` / `--text-on-accent` | `#14181E` | reference | accent-filled labels, state-card primary, dialog primary/danger |
| accent | `--accent` (`--color-accent-primary`) | `#92B8F2` | reference | primary fills, current tab, state-card primary, links |
| accent hover | `--accent-hover` (`--color-accent-primary-hover`) | `#A6C5F5` | reference | primary hover, link text |
| accent active | `--accent-active` (`--color-accent-primary-active`) | `#7EA6E0` | **derived**, not in reference | pressed primary |
| warning | `--warning` (`--status-warning`) | `#D5A36F` | reference warning seed | HOLD/warning chips, callout icon and border |
| error | `--error` (`--status-error`) | `#E08585` | approved dark palette, **not** a CAPA A seed | `FAIL`, invalid fields, field errors, danger chips |
| success | `--success` (`--status-success`) | `#79AF70` | approved dark palette, **not** a CAPA A seed | `PASS`/APPROVED chips; `PASS != RELEASED` is preserved |
| released | `--status-released` | `#5FB3A6` | measured adjustment of approved `#4F9B91` | RELEASED chips and controlled-action text (5.26:1 on released bg) |
| sidebar | `--color-sidebar` + scoped aliases | `#111D2D` / `#F2F6F9` / `#5DD0D7` | preserved current sidebar | `Sidebar.astro`, `.app-sidebar`; never re-paletted by CAPA A |

`--status-*` backgrounds remain the approved dark palette values. Green, red and
teal are **not** claimed as extracted from the CAPA A reference; only the reference
seeds listed as “reference” above are.

## 3. Selector / specificity evidence

| Surface | Rule shape | Specificity | Measured result |
|---|---|---|---|
| html | `html[data-visual-direction='capa-a']` | `(0,1,1)` | palette resolves; `color-scheme: dark` |
| body | inherited from `html` + `body` rule in `global.css` | `(0,0,1)` | `color: rgb(232,237,245)`, `background: rgb(20,24,30)` |
| main | `html[data] .app-main` | `(0,2,1)` | `color: rgb(232,237,245)`; width 1128 at 1440 |
| sidebar | `html[data] .app-sidebar` | `(0,2,1)` | `background: rgb(17,29,45)`; `--text-primary: #f2f6f9`; `--color-accent-primary: #5dd0d7`; 264px real sidebar; 32 links |
| dialog | `html[data] dialog` | `(0,2,1)` | panel `rgb(37,43,52)`, text `rgb(232,237,245)`, close control `rgb(232,237,245)` |
| print | `@media print` + `html[data] …` | `(0,2,1)` / `(0,2,1)` | white page, `#111` text, table head `rgb(238,238,238)`, sidebar/topbar `display:none` |

The common source of a specificity surprise was Astro’s scoped page styles:
`.filters[data-astro] button[data-astro]` is `(0,4,1)`, higher than the layer’s
`(0,3,1)` accent rules. The layer therefore does **not** repaint plain secondary
buttons; it keeps its primary contract on `.button`, submit inputs and current tabs,
and page-level white labels were corrected at the source.

## 4. Inheritance on the required surfaces

| Surface | Inherits | Explicitly re-declared | Evidence |
|---|---|---|---|
| `html` | none | palette, `color-scheme` | computed `background: rgb(20,24,30)` |
| `body` | `font-family`, color, canvas | background/color in `global.css` | computed `color: rgb(232,237,245)` |
| `main` | font, color, logical spacing | width, padding-block, typography, table/control surfaces | `mainWidth=1128`, overflow 0 |
| `sidebar` | **nothing visual from main**; every palette token is re-declared | `#111D2D`, `#F2F6F9`, `#5DD0D7`, `--focus-ring: #8AE5E7` | computed + 32 links + same text length as before |
| `dialog` | font family | panel, border, input, button colors | close label `rgb(232,237,245)` on `rgb(43,50,60)` |
| print | none (screen palette suppressed) | white surfaces, `#111` text, `#999` borders, hidden sidebar/topbar | print screenshot + computed table head |

## 5. Measured contrast pairs

Ratios use WCAG relative luminance. Normal text threshold 4.5:1; large text and
control/focus boundaries 3:1.

| Pair | Ratio | Requirement | Result |
|---|---:|---|---|
| primary `#E8EDF5` / canvas `#14181E` | 15.15 | 4.5 | PASS |
| primary / panel `#252B34` | 12.12 | 4.5 | PASS |
| secondary `#C3CBD6` / canvas | 10.88 | 4.5 | PASS |
| muted `#9BA3AF` / canvas | 7.00 | 4.5 | PASS |
| muted / panel | 5.60 | 4.5 | PASS |
| muted / inset `#2B323C` | 5.08 | 4.5 | PASS |
| inverse `#14181E` / accent `#92B8F2` | 8.79 | 4.5 | PASS |
| inverse / accent hover `#A6C5F5` | 10.11 | 4.5 | PASS |
| inverse / accent active `#7EA6E0` | 7.14 | 4.5 | PASS |
| warning `#D5A36F` / panel | 6.31 | 4.5 | PASS |
| warning / warning bg `#3A3024` | 5.71 | 4.5 | PASS |
| error `#E08585` / panel | 5.34 | 4.5 | PASS |
| error / error bg `#3C2528` | 5.29 | 4.5 | PASS |
| success `#79AF70` / panel | 5.55 | 4.5 | PASS |
| success / success bg `#253A25` | 4.78 | 4.5 | PASS |
| released `#5FB3A6` / released bg `#1F3532` | 5.26 | 4.5 | PASS |
| control border `#707A8C` / panel | 3.29 | 3.0 | PASS |
| focus `#92B8F2` / panel | 7.03 | 3.0 | PASS |
| sidebar text `#F2F6F9` / `#111D2D` | 15.62 | 4.5 | PASS |
| sidebar muted `#AEBDCA` / `#111D2D` | 8.83 | 4.5 | PASS |
| sidebar accent `#5DD0D7` / `#111D2D` | 9.27 | 4.5 | PASS |

Decorative panel borders (`#383F4C` on canvas = 1.68:1) are not treated as control
boundaries. The control boundary uses `--control-border` instead.

## 6. Layout rules

- `.app-main` is `min(100% - 2 * var(--space-6), 1600px)` with `margin-inline:auto`.
  At 1440 it measured 1128px, i.e. the available workspace beside the real 264px
  sidebar, not an empty exploration rail.
- `.state-card` alone uses `max-inline-size: 720px`, confirmed by the reference for
  blocker/short-form cards. Dense registers and details keep the full main width.
- No fixed 264px margin/padding is introduced by `capa-a.css`; the only 264px
  measure belongs to the live sidebar track in `AppLayout.astro`.
- Dashboard/register grids remain their existing responsive grids; the layer only
  changes surfaces, borders, type and control states.

## 7. Type, numerals and assets

- `--font-latin` resolves to local `Inter`, then platform sans. `@font-face` uses
  `local('Inter')`; there is no network font request, CDN or silent download.
- Data surfaces (`table`, `time`, `output`, `dd`, KPI/flow values) use
  `font-variant-numeric: var(--numeric-figures)` (`tabular-nums`).
- Sizes come from the existing rem scale; no fluid clamp is introduced by the layer.

## 8. Logical properties, print, forced colors, motion

- Layer rules use `padding-block`, `border-block-end`, `margin-inline`,
  `max-inline-size`, `inset-*`; no physical left/right property is introduced.
- Print collapses `.app-shell`/`.app-workspace` to one flow (otherwise the hidden
  sidebar track squeezes the record), hides sidebar/topbar/background, and restates
  every panel, table cell, chip, input and button as white/`#111`.
- `forced-colors` maps sidebar text to `CanvasText`, focus to `Highlight`, and
  removes decorative shadows; form boundaries fall back to `ButtonBorder` from
  `global.css`.
- `prefers-reduced-motion` disables shell/sidebar transitions; the layer introduces
  no animation of its own.

## 9. Source fingerprints

| File | SHA-256 |
|---|---|
| `src/ui/styles/tokens.css` | `255719e9de7c8d5d7e9be121faf2d108d89de32457df607861f58f11bfb3c702` |
| `src/ui/styles/precision-light.css` | `f2a33cba6bb1780baadde5a809c01d7f598c8f0d94b05ba519fe3f41a0e3c8cf` |
| `src/ui/styles/global.css` | `2725baebb7bd0badead80138b33f6bce30229fdcbeb64fb926777780ffe413e0` |
| `src/ui/styles/capa-a.css` | `b3f96e5ce2bff614771abfc4faf9961b615af6c9100aca2de2d6e0505430233f` |
| `src/ui/layouts/BaseLayout.astro` | `c787db7277460f0008dcf6a1634e08647502a2d3f977cd0d128b253977a96c68` |
| `src/ui/layouts/AppLayout.astro` | `5b0bcc5723dc3a6f916c7c5d39aa127c14e89807ac86b81733f968356aeff982` |
| `src/ui/components/SystemBackground.astro` | `57d3be5eba6c6e6cd85355fb30babbe7083ab7639db523ff8bcae1d6cc90c419` |
| `audit/CA-00/reference/capa-a.html` | `03b26630a1374338cc522be466b9adcb760a56e99f2e83ef169538f969cbd289` |
