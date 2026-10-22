# CA-02 — tokens, layout and the Precision Light conflict

Date: 2026-10-17 · HEAD `7d46507c` (dirty working tree) · Node `v24.20.0` · pnpm `11.25.0`
Status: **PARTIAL** — layer contracts and sampled verification pass; the 86-route
visual matrix, manual AT and exact 200/400% zoom remain not run.

## 1. What changed

1. **Semantic roles made explicit.** `capa-a.css` now exposes
   `--surface-canvas`, `--surface-inset`, `--accent`, `--accent-hover`,
   `--accent-active`, `--warning`, `--error`, `--success`, `--focus` and
   `--text-on-accent` in addition to the existing role aliases. `--surface-inset`
   and `--control-border` also have global fallbacks in `tokens.css` (and
   `precision-light.css` for the inactive direction).
2. **Fixed white labels were corrected at the source.** All 41 page files that hard-
   coded `color:#fff` or `color:white` on an accent fill now use
   `var(--text-on-accent)`. The layer keeps a narrow `!important` guard only for
   `.button`, submit inputs and current tabs. A `:disabled` / `[aria-busy]` state now
   sets `cursor` with `!important` because page rules were overriding it.
3. **Component ownership restored.** The layer no longer paints every plain
   `button`: secondary/controlled/danger/ghost/icon/print/form-action variants keep
   their own surfaces. This fixed the register filter action (transparent outline,
   not a forced primary fill) and the filter-preset buttons (panel surface, not a
   light-blue fill).
4. **Dialog labels fixed.** The dialog rule no longer forces inverse text on every
   button. Cancel/close/refresh keep primary text; `.primary`, `.danger` and submit
   inputs take `--text-on-accent`.
5. **Measured contrasts corrected.** RELEASED moved from `#4F9B91` (3.98:1 on its
   background) to `#5FB3A6` (5.26:1); placeholder moved from `#7A828E` (3.33:1 on
   the inset) to `--text-muted` (5.08:1). Invalid fields and `.field-error` are now
   stated by the layer with `--border-invalid` / `--text-danger`.
6. **Print repaired.** The hidden sidebar’s grid track was still squeezing the
   record into a narrow column. Print now collapses `.app-shell`/`.app-workspace` to
   one flow, hides sidebar/topbar/background, and restates panels, table cells
   (including `tbody th`), chips, inputs and buttons as white/`#111`.
7. **Tabulur figures** are applied to `table`, `time`, `output`, `dd`, KPI/flow
   values and `[data-numeric]` via `--numeric-figures`.

No schema, API, business rule, route visibility, permission, action or signature
policy changed. The three creation surfaces remain the existing policy gates.

## 2. Files

| Area | Files |
|---|---|
| Tokens / layer | `src/ui/styles/tokens.css`, `src/ui/styles/precision-light.css`, `src/ui/styles/capa-a.css` |
| Page labels | 41 files under `src/pages/` (admin, approvals, assets, change requests, documents, laboratory, quality, quarantine, reject-reports, system, tasks, ai-advisory) — exact list: `git diff --name-only` |
| Contract test | `tests/unit/ui/capa-a-surface.test.ts` |
| Evidence | `audit/CA-02/` (this report, token map, Precision Light map, assumptions, comparison, before/after JSON, screenshot manifest) |

## 3. UI state contracts and guards

These are presentation states. They do not grant authority and are not a second
business state machine.

| State | Signal | Layer effect | Guard / source |
|---|---|---|---|
| rest | primary `.button`, submit input, current tab | accent fill + inverse label | page/action authority unchanged |
| hover | `:hover:not(:disabled)` | `#A6C5F5`; measured on `Open the CAPA register` | same control, no action change |
| focus | `:focus-visible` | 2px `#92B8F2` outline, 2px offset | `global.css` + layer; keyboard path preserved |
| disabled | native `disabled` or `aria-disabled="true"` | opacity `.55`, `cursor: not-allowed` | no submit/action bypass; server guards remain |
| pending | `aria-busy="true"` | opacity `.85`, `cursor: progress` | existing `role=status` / pending regions remain the source; no spinner or fake progress |
| error | `aria-invalid="true"`, `.field-error` | danger border + danger text (13px) | server validation/error codes unchanged |

Measured after the final build:

| State | Background | Text | Outline / opacity / cursor | Min height |
|---|---|---|---|---|
| primary rest | `rgb(146,184,242)` | `rgb(20,24,30)` | — | 44px |
| primary hover | `rgb(166,197,245)` | `rgb(20,24,30)` | — | 44px |
| primary focus | `rgb(166,197,245)` | `rgb(20,24,30)` | `solid 2px rgb(146,184,242)` | 44px |
| form button focus | `rgb(146,184,242)` | `rgb(20,24,30)` | `solid 2px rgb(146,184,242)` | 46px |
| busy (synthetic) | unchanged | unchanged | `.85` / `progress` | 46px |
| aria-disabled (synthetic) | unchanged | unchanged | `.55` / `not-allowed` | 46px |
| disabled (synthetic) | unchanged | unchanged | `.55` / `not-allowed` | 46px |
| error (synthetic) | inset `rgb(43,50,60)` | danger `rgb(224,133,133)` | border danger; 13px error text | — |

The disabled/busy/error values were applied to real controls to measure CSS; they
were not submitted and did not write data.

## 4. Before → after, same candidate

| Observation | Before | After |
|---|---|---|
| Sidebar | `rgb(17,29,45)`, `#F2F6F9`, `#5DD0D7`, 32 links | identical; text length differs only by page content (1040 vs 1028) |
| Main width @1440 | 1128px | 1128px |
| State card width | 720px | 720px |
| Overflow @1440/720 | 0 | 0 (360 not re-run in CA-02; CA-01 measured 0) |
| Dialog close label | `rgb(20,24,30)` on `rgb(43,50,60)` (unreadable) | `rgb(232,237,245)` on `rgb(43,50,60)` (12.12:1) |
| Print table head | dark `rgb(43,50,60)` | light `rgb(238,238,238)` with `#111` text |
| Print layout | squeezed by the hidden sidebar track | one full-width flow |
| Contrast scan (4 surfaces) | 0 failures | 0 failures |
| axe (dashboard/tasks/capa-new) | 0 violations | 0 violations |
| RELEASED pair | `#4F9B91` = 3.98:1 | `#5FB3A6` = 5.26:1 |
| Placeholder pair | `#7A828E` = 3.33:1 | `#9BA3AF` = 5.08:1 |

Screenshots were reviewed at 1440/1024/720, print and command-palette states, then
deleted at the user’s request. `screenshot-manifest.json` records the eight reviewed
files, sizes and SHA-256; `before/` has no PNGs (the capture predates the deletion and
only its JSON remains). The numeric comparison is in `comparison.json`.

## 5. Verification

| Command | Result | Notes |
|---|---|---|
| `pnpm exec vitest run tests/unit/ui/capa-a-surface.test.ts tests/unit/ui/design-token-contract.test.ts` | **PASS 23/23** | layer, tokens, contrast pairs, print, logical properties |
| `pnpm exec vitest run tests/unit/ui` | **451 pass / 7 fail** | failures are the pre-existing missing `Documents/*.md` consumers (`help-content-contract`, `record-journey-contract`, `visual-token-contract`); `capa-a` and `design-token` pass |
| `pnpm typecheck` | **PASS** | 0 errors, 118 hints |
| `pnpm test:architecture` | **PASS** | boundaries + route registry |
| `pnpm build` | **PASS** | run after `pnpm verification:begin`; artifact SHA in `dist/release-identity.json` |
| Playwright capture (`Node 24.20.0`) | **PASS** | authenticated `verify-employee`; 4 surfaces, 2 widths for dashboard/tasks, print + dialog; axe 0; contrast 0; overflow 0 |
| State probes | **PASS** | hover, focus, disabled, aria-disabled, aria-busy, error measured |
| Manual VoiceOver/NVDA | **NOT RUN** | no claim |
| Exact 200/400% zoom | **NOT RUN** | 720/360 widths are proxies, not browser zoom |
| Full 86-route populated matrix | **NOT RUN** | 68 screens remain `LAYER_APPLIED_NOT_VERIFIED` from CA-01 |
| `pnpm requirements:check` | **NOT RUN** | still blocked by the absent `audit/100-percent/POLICY-CLOSURE-MATRIX.md` |

## 6. Not changed / not claimed

- Sidebar structure, links, order, icons, permissions and behavior are untouched.
- No Tailwind CDN, Material Symbols, external font request or runtime theme script.
- No 264px empty rail was copied; the 264px measured width is the real sidebar.
- `PASS != RELEASED` and `APPROVED != EFFECTIVE` are preserved; no status is inferred.
- No WCAG AA conformance, UAT, release or production-readiness claim.
- No commit, push, merge, deploy or production write was performed.

## 7. Remaining

- Run the full populated 86-route visual matrix and manual AT on the same candidate.
- Obtain design-owner acceptance for the derived/assumed values in `assumptions.md`
  (pressed, disabled, busy, control border, RELEASED adjustment, print palette).
- Keep the creation forms blocked until their policy decisions (PD-15/PD-16/PD-18
  and the retest policy) are approved; CA-F-* remains the only write scope.
