# CA-01 — candidate vs original source: `/quality/capa/new`

Date: 2026-10-17 · HEAD `567028c1` · Candidate: `src/pages/quality/capa/new.astro`
(+ `DecisionStateCard`, `PageHeader`, `capa-a.css`).
Original source: `audit/CA-00/reference/capa-a.html` (pinned, identity verified).

This is a **presentation-source comparison**, not a functional acceptance. The page
renders an existing policy decision; it does not decide eligibility and has no write.

## 1. Structure

| Reference element | Reference | Candidate | Verdict |
|---|---|---|---|
| page shell | single `main`, no product sidebar | `AppLayout` sidebar + topbar + main | **EXPECTED** — the reference is an isolated exploration canvas; the product must keep its shell |
| 264px empty rail | HTML L43 | absent | **EXCLUDED** by contract |
| breadcrumb `Quality / CAPA Register / New CAPA` | HTML L50–56, `aria-label="Breadcrumb"` | `Topbar` renders `Home / Quality / CAPA / New record` from the navigation model | **DELTA** — trail, labels and placement differ (topbar vs page header) |
| `h1` “New CAPA” | HTML L57–59 | `PageHeader` slot heading, `new.astro` L16 | **MATCH** (text) |
| lede “Link the CAPA to an NCR or RCA.” | HTML L60–62 | `new.astro` L17, `.lede` L34 | **MATCH** (text) |
| header divider | none | `PageHeader.astro` L13 adds 1px bottom border + 16px padding | **DELTA** |
| status card | HTML L65–103 | `DecisionStateCard` L18–44 | **MATCH** (anatomy) |
| card heading | “Direct creation is not available.” | `new.astro` L20 | **MATCH** |
| icon | Material `lock`, 22px, 40×40 badge, 8px radius | inline SVG lock, 22px, 44×44 box, 10px radius (`capa-a.css` L345–356) | **DELTA** (allowed substitution; larger target) |
| body paragraph | HTML L78–80 | `new.astro` L29 | **ADAPTED** — same meaning, product wording |
| policy detail | HTML L82–84 (P-04) | `new.astro` L30, muted class | **MATCH** (text) |
| policy callout | HTML L86–93 | `DecisionStateCard` L31–38, `capa-a.css` L375–392 | **MATCH** (anatomy); copy adapted to `PD-18 · QC owner` |
| action row | HTML L95–102 | `capa-a.css` L394–409 | **MATCH** (divider, 12px gap, 44px min, row ≥640px / column below) |
| primary action | “Open the CAPA register” → `/quality/capa` | `new.astro` L25 | **MATCH** |
| secondary action | “Open NCR” → `/quality/ncr` | `new.astro` L26 | **MATCH** |

## 2. Tokens

| Property | Reference | Candidate | Verdict |
|---|---|---|---|
| canvas | `#14181E` | `--color-canvas: #14181e` (L20) | **MATCH** |
| panel | `#252B34` | `--color-surface-1: #252b34` (L23) | **MATCH** |
| border | `#383F4C` | `--color-border-default: #383f4c` (L29) | **MATCH** |
| text | `#E8EDF5` | `--color-text-primary: #e8edf5` (L31) | **MATCH** |
| muted | `#9BA3AF` | `--color-text-muted: #9ba3af` (L33) | **MATCH** |
| accent | `#92B8F2` | `--color-accent-primary: #92b8f2` (L36) | **MATCH** |
| accent hover | `#A6C5F5` | `--color-accent-primary-hover: #a6c5f5` (L37) | **MATCH** |
| warning | `#D5A36F` | `--status-warning: #d5a36f` (L51) | **MATCH** |
| inverse | `#14181E` | `--color-text-inverse: #14181e` (L35) | **MATCH** |
| card radius | 12px | `--radius-lg: 12px` (L113) | **MATCH** |
| control radius | 8px | `--radius-sm: 8px` (L111) | **MATCH** |
| card padding | 32px ≥640 / 24px below | L326 + L333–337 | **MATCH** |
| card max width | 720px | L324 | **MATCH** |
| card shadow | `0 1px 2px / 5%` | `--shadow-1: 0 1px 2px / 24%` (L116) | **DELTA** — darker on the product; visual weight only |
| control boundary | `#383F4C` on inputs/buttons | `--control-border: #707A8C` (L97) | **DELIBERATE DELTA** — 3.29:1 on panel vs 1.63:1; required to identify a control |
| secondary action border | `#383F4C` | `--control-border` via L437 | **DELIBERATE DELTA** (same reason) |
| secondary hover | `#383F4C/50` | `--color-surface-2` (`#2B323C`) L442 | **DELTA** — near-equivalent, not exact |
| action divider | `#383F4C/60` | `--color-border-subtle` (`#303845`) L401 | **DELTA** — subtler |
| primary action border | none | 1px same-colour border L426 | **NEGLIGIBLE** |

## 3. Type and spacing

| Property | Reference | Candidate | Verdict |
|---|---|---|---|
| `h1` | 24px/600/32px/−0.6px | 1.5rem/600/1.2/−0.01em (L174–180) | **DELTA** — tracking −0.24px vs −0.6px; line-height 28.8px vs 32px |
| `h2` | 20px/500/28px | 1.25rem/500 (L358–363); no line-height declared | **DELTA (risk)** — line-height not pinned; may resolve to ~1.2 rather than 1.4 |
| body | 14px/1.625 | `--font-size-md` = 14px (L368); line-height 1.55 (L192–194) | **DELTA** — 1.55 vs 1.625 |
| callout text | 12px → 13px at ≥640 | 0.8125rem (13px) fixed (L386) | **MINOR DELTA** — no 12px step below 640 |
| action label | 14px/500 | 14px/500 (L419–420) | **MATCH** |
| main block padding | 48px at ≥768 | 32px top / 48px bottom (L169–171) | **DELTA** — 16px less top padding |
| header→card offset | 24px, no divider | 24px margin + 16px header padding + 1px divider | **DELTA** — 40px plus a rule |
| callout→actions | 24px margin + 8px padding | 24px margin + 24px padding (L399–400) | **DELTA** — 16px more |
| action gap / height | 12px / 44px | 12px / 44px | **MATCH** |

Line references without a file prefix are `src/ui/styles/capa-a.css`.

## 4. Content and authority

| Check | Result |
|---|---|
| New record numbers / sequences invented | **NO** |
| Roles, thresholds or permissions imported from Stitch | **NO** |
| Reference copy that implies an action the product cannot perform | **NO** — the page says creation is unavailable and links to existing registers |
| Decision id and owner shown | `PD-18` + `QC owner`, matching `audit/CA-00/ca-f-00-decision-matrix.md` |
| P-04 statement preserved | yes, with the exact closure conditions |
| `SOP-FRS-003` prohibition respected | yes — no form, no hidden write |

## 5. Guards on this candidate

| Layer | Source | Behaviour |
|---|---|---|
| central route visibility | `src/middleware.ts` → `pageAccessDecision` → `src/shared/routing/page-access.ts` | unauthenticated → 303 to login with `returnTo`; registered route, no `YAZEED_ONLY` |
| page | `new.astro` L11–12 | `actor` absent → 303 `/login?returnTo=%2Fquality%2Fcapa%2Fnew` |
| write | `src/actions/capa.ts` | `create` throws `FORBIDDEN`; no action is referenced by this page |
| domain | `CreateCapaUseCase` | checks `Boolean(ncrId)` only — not sufficient for enablement |
| route declaration | `routes.ts` L89–95 | `RT-CAPA-002`, `conditional` |

## 5b. Derived interaction states

The reference proves rest, hover and focus only. The candidate now also defines
pressed, disabled and busy states so real controls do not fall back to browser
defaults:

| State | Candidate value | Measured | Contrast |
|---|---|---|---|
| primary pressed | `#7EA6E0` fill/border | `rgb(126,166,224)` | 7.14:1 with `#14181E` |
| secondary pressed | `#303845` | `rgb(48,56,69)` | 10.05:1 with `#E8EDF5` |
| disabled / `aria-disabled` | opacity `.55`, `cursor: not-allowed` | 0.55 | — |
| busy / `aria-busy` | opacity `.85`, `cursor: progress` | 0.85 | — |

These are **derived**, not reference fidelity, and change no behaviour: no spinner,
no new pending source, no submit guard. Evidence: `candidate/state-*.png` and
`tests/unit/ui/capa-a-surface.test.ts`.

## 6. Net verdict

The candidate preserves the reference's **card anatomy, palette, geometry and action
hierarchy**, while intentionally dropping the exploration rail and the remote
fonts/icons. It is **not pixel-identical**: it uses a different breadcrumb trail
(topbar `Home / Quality / CAPA / New record` vs `Quality / CAPA Register / New CAPA`),
adds a header divider, uses a larger icon badge, a darker shadow, a subtler divider
and a higher-contrast secondary boundary. No product authority, record number or
status is copied from the reference.

`LAYER_APPLIED` — not a fidelity score, not WCAG conformance and not visual acceptance
of populated records.
