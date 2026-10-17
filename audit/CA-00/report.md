# CA-00 — execution report

Date: 2026-10-17 · HEAD: `e62f44745d5936d89747209673c3035a9986b6db` · working tree dirty
(Node v24.20.0 / pnpm 11.25.0). No commit, push, merge, deploy or production write.

## Result

CAPA Variant A is now the authenticated and public presentation layer. The reference
was restored from Stitch and pinned locally. The three creation surfaces were rebuilt
in that language, but **their governed writes remain BLOCKED** because the required
decisions do not exist (PD-15, PD-16, PD-18 and the retest policy). No form, fake
persistence or hidden mutation was added.

## What changed

| File | Change |
|---|---|
| `src/ui/styles/capa-a.css` | New token/layout layer from the pinned reference. Canvas `#14181E`, panel `#252B34`, border `#383F4C`, text `#E8EDF5`, muted `#9BA3AF`, accent `#92B8F2`, inverse `#14181E`, warning `#D5A36F`; 12px cards / 8px controls; state-card anatomy; 720px max for short decision cards; dark re-authored background; control boundary token `#707A8C` (3.29:1). Sidebar values re-declared unchanged. |
| `src/ui/styles/global.css` | Imports the layer after the retained (now unused) Precision Light file. |
| `src/ui/layouts/AppLayout.astro` | `visualDirection="capa-a"`. Sidebar component, links, order, icons, permissions and behavior untouched. |
| `src/ui/layouts/AuthLayout.astro` | Passes `visualDirection` through to `BaseLayout`. |
| `src/ui/components/feedback/DecisionStateCard.astro` | New shared decision-state card: 44px actions, 720px max, amber policy callout, inline SVG (no Material Symbols). |
| `src/pages/quality/ncr/new.astro`, `.../capa/new.astro` | Rebuilt as decision-state cards. Source content preserved; only presentation and sentence-case copy adapted. |
| `src/pages/laboratory/tests/[labTestId]/retests/new.astro` | Same card; links back to the original test only when the id is a safe UUID. |
| `src/pages/login.astro` | CAPA A palette; login keeps its independent 3D background and 48px controls. Input boundary now 3:1. |
| `src/pages/404.astro`, `src/pages/500.astro` | Centered state card; fixed the previous 1.5 line-height heading gap. |
| `tests/unit/ui/capa-a-surface.test.ts` | Locks the layer contracts: sidebar preserved, no 264px rail, no CDN/remote assets, accent/inverse pair, 44px card actions, public surfaces, blocked creation routes. |
| `tests/unit/ui/precision-light-surface.test.ts` | Retargeted to the current layer (same invariants, new direction). |
| `tests/unit/ui/mutation-safety-contract.test.ts` | Ratchet shrink: `laboratory/tests/[labTestId]/execute.astro` now has two native POST forms, so it no longer belongs to the no-JS gap register. |

Artifacts: `audit/CA-00/reference/` (HTML + PNG), `source-manifest.json`,
`route-register.json` (88 Astro files = 86 screens + 2 redirects), `route-status.json`,
`state-contracts.md`, `ca-f-00-decision-matrix.md`, `execution-record.json`, and
before/after screenshots (`after-*.png`).

## Reference provenance

- Stitch project `1787344711919595236`, screen `b93297bebbbd41c69aa4bbcbea0e3b6f`,
  title “QC Universe — CAPA unavailable EXPLORE A (/quality/capa/new)”, 2560×2048.
- `get_screen` returned the HTML download and screenshot on 2026-10-17.
- Pinned SHA-256: HTML `03b26630…cbd289`, PNG `53b01364…e0cb91`.
- The 264px empty rail in the reference is exploration scaffolding and is not copied.
  Tailwind CDN, Material Symbols and Google Fonts from the reference are not imported.

## IDs and status

| ID | Status | Basis |
|---|---|---|
| CA-00 | PARTIAL | Visual layer + gates + delivery; full 86-page acceptance not run |
| CA-01 | DONE | Reference pinned; inventory recomputed on HEAD; 86/2 split matches `routes.ts` (which omits 404/500) |
| CA-02 | DONE | Token/layout layer; sidebar computed unchanged (`rgb(17,29,45)`, `rgb(242,246,249)`, teal accent) |
| CA-03 | DONE | Seven UI state contracts documented |
| CA-04 | PARTIAL | Pilot sample verified; not every pilot route |
| CA-05 | PARTIAL | Layer applies globally; per-page populated acceptance sampled |
| CA-06 | PARTIAL | 12 routes × 5 widths, axe, keyboard, forced colors, reduced motion, redirects |
| CA-07 | PARTIAL | Delivery package + route classification; no completion percentage |
| CA-F-00 | DONE | Field/guard matrix and gate verdicts |
| CA-F-01 | BLOCKED | PD-15/PD-16 + NCR numbering authority |
| CA-F-02 | BLOCKED | PD-18 + CAPA numbering/action-plan authority |
| CA-F-03 | BLOCKED | RetestPolicy source absent (`POLICY_SOURCE_REQUIRED`) |
| CA-F-04 | BLOCKED | All three writes blocked |

## Guards that keep the writes blocked

- `src/actions/ncr.ts` and `src/actions/capa.ts` throw `FORBIDDEN` on `create`.
- `CreateNcrUseCase` checks only `Boolean(findingId)`; `CreateCapaUseCase` only
  `Boolean(ncrId)`. Neither re-reads the source, checks eligibility or writes audit.
- `CreateRetestUseCase` defaults to a `RetestPolicy` that throws
  `POLICY_SOURCE_REQUIRED`; no provider is wired.
- `SOP-FRS-003 D0.1` (approved; effective date NOT ASSIGNED) §4.2–4.4/§4.7 states the
  initiation/CAPA-creation forms are not offered while PD-15/16/18 are unresolved and
  says not to substitute a hidden operation or database update.

## Verification (same candidate, final working tree)

| Command / check | Result |
|---|---|
| `pnpm typecheck` | **PASS** — 0 errors, 0 warnings, 118 hints |
| `pnpm exec astro build` | **PASS** — exit 0 |
| `pnpm build` | **PARTIAL** — Astro build + release identity PASS; `write-build-evidence` exits 1 because no verification run context exists (`Verification run context is absent…`). Tooling prerequisite, not a compile failure. |
| `pnpm test:architecture` | **PASS** — boundaries + canonical route registry |
| Focused vitest (11 files, incl. new layer test) | **PASS** — 98/98 |
| Browser sweep, 12 routes × 320/390/768/1024/1440 | **PASS** — 0 horizontal overflow, 0 interactive targets <44px, smallest text ≥12px |
| axe WCAG A/AA, 8 route/width pairs | **PASS** — 0 violations |
| Keyboard focus walk (`/quality/capa/new`) | **PASS** — visible 2px rings; skip link first; sidebar keeps its teal focus |
| Forced colors | **PASS** — Canvas/CanvasText/Highlight; card and callout borders retained |
| `prefers-reduced-motion` | **PASS** — media matches; sidebar transition 0s |
| Redirects `/` and `/laboratory` (unauthenticated) | **PASS** — 303 to `/login?returnTo=…` |
| 200%/400% browser zoom, screen reader, full 86-route populated matrix | **NOT RUN** — 320/768 widths used as reflow proxies only |

Contrast measured (sRGB WCAG): text/panel 12.12, text/canvas 15.15, muted/panel 5.60,
secondary/panel 8.71, link/panel 8.09, inverse/accent 8.79, warning/panel 6.31,
sidebar text/sidebar 15.62, control boundary/panel 3.29, focus/panel 7.03. Decorative
panel borders remain subtle by design and are not used to identify a control.

Route classification (`route-status.json`): 14 screens `VERIFIED_SAMPLE*`, 68 screens
`LAYER_APPLIED_NOT_VERIFIED`, 2 redirects `REDIRECT_TESTED_303`, `/500`
`ERROR_PAGE_NOT_ROUTABLE`. This is coverage naming, not an acceptance score.

## Remaining

1. Issue PD-15, PD-16, PD-18 and the retest policy (including numbering and assignment
   authority). Only then can CA-F-01/02/03 be implemented with server-side source
   rechecks, idempotency and audit atomicity, and CA-F-04 accepted per form.
2. Populated-record visual/permission acceptance for the 68 unsampled screens.
3. Real screen-reader test and exact 200%/400% browser zoom on the final candidate.
4. `pnpm build` evidence prerequisite (start a verification run) before treating the
   build as release evidence.

`PASS ≠ RELEASED`; `APPROVED ≠ EFFECTIVE`; nothing here is UAT, WCAG conformance,
production readiness or a functional completion percentage.
