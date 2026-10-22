# CA-01 — reference extraction (observed vs proposed)

Date: 2026-10-17 · HEAD `567028c1` · Reference: Stitch `1787344711919595236` /
screen `b93297bebbbd41c69aa4bbcbea0e3b6f`, pinned at
`audit/CA-00/reference/capa-a.{html,png}`.

Method: the HTML literals were read directly; the same file was then served over a
local read-only HTTP server and measured at 1440×1000 and 390×844 with browser
computed styles. Everything below marked **OBSERVED** was read from the file and
confirmed by the browser. **PROPOSED** means it is not present in the reference and
was derived from the product's existing tokens or accessibility rules.

Live `get_screen` on 2026-10-17T02:09Z returned the same title and a
character-identical HTML (normalized hashes `fdc1f690` / `904da0fc`). The screenshot
download currently serves a 32,347-byte rendition, not the pinned 125,645-byte
2560×2048 PNG; the pinned PNG remains the visual reference.

## 1. Colour — OBSERVED

| Role | Value | Where it actually appears |
|---|---|---|
| canvas | `#14181E` | `body` background (HTML L41); computed `rgb(20,24,30)` |
| panel | `#252B34` | state card background (HTML L65); computed `rgb(37,43,52)` |
| border | `#383F4C` | card border, secondary button border, action divider (HTML L65, L95, L99) |
| text primary | `#E8EDF5` | body copy and headings (HTML L41, L57, L72) |
| text muted | `#9BA3AF` | breadcrumb, lede, policy detail (HTML L50, L60, L82) |
| accent | `#92B8F2` | primary action fill, focus ring (HTML L96) |
| accent hover | `#A6C5F5` | primary action hover class (HTML L96) |
| warning | `#D5A36F` | lock badge, callout border/text (HTML L68, L86, L90) |
| inverse | `#14181E` | primary action label (HTML L96) |

Observed alpha variants: selection `accent/30`; rail border `#252B34/40`; warning badge
`/10` fill + `/30` border; policy callout `/10` fill + `/40` border; body-secondary
text `/90`; muted separators `/50`; action divider `#383F4C/60`.

### Seed reconciliation

The delivery file seeds were `#14181E`, `#252B34`, `#E8EDF5`, `#92B8F2`, `#D5A36F`.
They are **historical seeds only**. The reference itself also uses `#383F4C`,
`#9BA3AF` and `#A6C5F5`; a palette built from the five seeds alone cannot reproduce
the card boundary, muted text or hover state. These three values are now recorded as
observed reference values, not as invented ones.

## 2. Type — OBSERVED

| Element | Measured | Source |
|---|---|---|
| family | Inter (400/500/600/700 loaded) | HTML L10 |
| `h1` | 24px / 600 / 32px / letter-spacing −0.6px | HTML L57, computed |
| `h2` | 20px / 500 / 28px | HTML L72, computed |
| body copy | 14px / 1.625 | `text-sm leading-relaxed`, HTML L78 |
| breadcrumb | 12px | HTML L50 |
| callout | 12px, then 13px at ≥640px | HTML L89 |
| action label | 14px / 500 | HTML L96, L99 |

No font weight outside 400/500/600/700 is observed. No display size above 24px is
observed on this screen.

## 3. Spacing — OBSERVED

At 1440×1000:

| Region | Measured |
|---|---|
| main padding | 48px block / 24px inline |
| content max width | 720px |
| header block gaps | 6px (`space-y-1.5`) |
| card offset | 24px (`mt-6`) |
| card padding | 32px (`sm:p-8`) |
| badge → heading gap | 14px (`gap-3.5`) |
| body paragraph offsets | 16px then 12px (`mt-4`, `mt-3`) |
| callout padding | 16px (`p-4`) |
| callout margin | 24px block (`my-6`) |
| actions padding above divider | 8px (`pt-2`) |
| action gap | 12px (`gap-3`) |
| action padding | 24px inline / 10px block |
| minimum action height | 44px |

At 390×844: main padding 32px/16px, card padding 24px, actions stack to a 308px
column, both actions remain 44px high.

## 4. Geometry and borders — OBSERVED

| Property | Measured |
|---|---|
| card radius | 12px (`rounded-xl`) |
| control/callout radius | 8px (`rounded-lg`) |
| icon box | 40×40px, 8px radius, 8px padding around a 22px glyph |
| border width | 1px everywhere |
| card shadow | `0 1px 2px rgb(0 0 0 / 5%)` |

## 5. Button states — OBSERVED

| State | Primary | Secondary |
|---|---|---|
| rest | `#92B8F2` fill, `#14181E` label | transparent, `#E8EDF5` label, `#383F4C` 1px border |
| hover | `#A6C5F5` fill | `#383F4C` at 50% fill |
| focus-visible | 2px `#92B8F2` ring, 2px offset, `#252B34` offset surface | same |
| active / pressed | **not present** | **not present** |
| disabled | **not present** | **not present** |
| loading | **not present** | **not present** |

The reference therefore proves only rest, hover and focus. Active, disabled and
loading treatments are **PROPOSED** from the existing product conventions
(`opacity: var(--disabled-opacity)` = 0.55, no second fill colour).

### Implemented derived states — PROPOSED, not reference

These were added to the presentation layer because the application already exposes
pressed/disabled/busy affordances and the reference provides no value for them. They
are derived, not copied.

| State | Applied value | Contrast / evidence |
|---|---|---|
| primary pressed | `--color-accent-primary-active: #7EA6E0`, same fill on border | 7.14:1 against `#14181E` label |
| secondary pressed | `--color-surface-active: #303845` | 10.05:1 with `#E8EDF5` text |
| disabled / `aria-disabled` | existing `opacity: 0.55` + `cursor: not-allowed` | computed 0.55 in browser |
| loading / `aria-busy` | `opacity: 0.85` + `cursor: progress`; no new spinner | computed 0.85 and `progress` |

Measured in the authenticated candidate: rest `rgb(146,184,242)`, hover
`rgb(166,197,245)`, pressed `rgb(126,166,224)`. The reference itself still has no
pressed, disabled or loading state.

## 6. Layout and exclusions — OBSERVED

- Two-column page: a 264px empty rail (`hidden lg:block`) plus a `flex-1` main area.
  The rail is exploration scaffolding and is excluded from the product.
- Card is centred inside a 720px container and capped at 720px.
- Reference is desktop-first with one `sm` breakpoint at 640px; no `md`/`lg` card
  change beyond the rail visibility.

## 7. Not in the reference (do not claim as reference fidelity)

- Sidebar, topbar, navigation, workspace shell — absent from this screen entirely.
- Breadcrumb is present; **no page-header divider** is present.
- Tables, registers, filters, pagination, tabs, dialogs, empty/loading/error states,
  toasts and tooltips — absent.
- Dark/light theme toggle, density control, RTL layout — absent.
- Any PASS/HOLD/RELEASED status chip — absent; the only semantic colour is the amber
  policy warning.

## 8. Proposed mapping to product tokens

| Proposed product token | Reference basis | Status |
|---|---|---|
| `--color-canvas` | `#14181E` | observed |
| `--color-surface-1` | `#252B34` | observed |
| `--color-border-default` | `#383F4C` | observed |
| `--color-text-primary` | `#E8EDF5` | observed |
| `--color-text-muted` | `#9BA3AF` | observed |
| `--color-accent-primary` | `#92B8F2` | observed |
| `--color-accent-primary-hover` | `#A6C5F5` | observed |
| `--control-border` | `#707A8C` | **proposed** — 3.29:1 control boundary; the reference's `#383F4C` is 1.63:1 on the panel and is not usable to identify an input/control |
| `--radius-lg` = 12px / `--radius-sm` = 8px | card / controls | observed |
| `--status-warning` | `#D5A36F` | observed |
| status pass/hold/released/danger hues | none on this screen | **proposed** from the existing approved dark status palette; not inferred from the reference |
