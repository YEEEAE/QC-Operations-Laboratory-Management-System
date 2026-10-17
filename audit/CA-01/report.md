# CA-01 — delivery report

Date: 2026-10-17 · HEAD `567028c18bd3c25794a886fefd8e0a5f592e8529` · branch `main`
· working tree clean at start · Node v24.20.0 / pnpm 11.25.0 for verification
· no commit, push, merge, deploy, migration or production write · no `.env` sourced.

## Result

| Item | State | Basis |
|---|---|---|
| Reference pinned and identity-verified | **DONE** | live `get_screen` returned the same title and character-identical HTML |
| Source manifest | **DONE** | `audit/CA-01/source-manifest.json` |
| Route register with source/static/runtime | **DONE** | `audit/CA-01/route-register.json` (88 files, 86 screens, 2 redirects) |
| Candidate vs original `/quality/capa/new` | **DONE** | `audit/CA-01/candidate-comparison.md` |
| Redirect destinations tested | **DONE (unit)** | new `tests/unit/routing/design-route-boundaries.test.ts`; HTTP preview **BLOCKED** (invalid server env, 503) |
| Authenticated candidate screenshot on this HEAD | **NOT RUN** | no session and no environment bootstrapping; `.env` deliberately untouched |
| CA-02 / visual implementation | **not blocked by reference availability** | reference is available; CA-00 already applied the layer |

`PASS ≠ RELEASED`. The register classifies presentation source; it is not an
acceptance score and not populated-record coverage.

## 1. Repository and toolchain

| Check | Result |
|---|---|
| `git rev-parse --abbrev-ref HEAD` | `main` |
| `git rev-parse HEAD` | `567028c18bd3c25794a886fefd8e0a5f592e8529` |
| `git status --short` | empty (clean) |
| `.nvmrc` / `.node-version` | `24.20.0` / `24.20.0` |
| `package.json` engines | `node >=24.20.0 <25`, `pnpm 11.25.0` |
| shell `node -v` | `v22.22.3` — **outside the project contract** |
| verification runtime | `v24.20.0` / `pnpm 11.25.0` via nvm |
| `.env` | not sourced, not printed, not modified |

The shell default Node is outside the declared engine range. All verification below
was run under the pinned Node 24.20.0; results under 22.22.3 were not used.

## 2. Reference manifest

| Field | Value |
|---|---|
| Source | Stitch project `1787344711919595236`, screen `b93297bebbbd41c69aa4bbcbea0e3b6f` |
| Title | `QC Universe — CAPA unavailable EXPLORE A (/quality/capa/new)` |
| Size / device | 2560×2048 / DESKTOP |
| Live retrieval | `tools.stitch.get_screen`, 2026-10-17T02:09:13.854Z → 02:09:16.763Z, **AVAILABLE** |
| HTML | pinned SHA-256 `03b26630…cbd289`; live HTML character-identical (5,436 chars; normalized `fdc1f690` / `904da0fc`) |
| PNG | pinned SHA-256 `53b01364…e0cb91`, 125,645 bytes, 2560×2048 |
| Live screenshot download | 32,347 bytes — a smaller rendition; **not substituted** for the pinned PNG |
| Prior failures | “Authentication required” and missing `live-downloads/capa_a.html` are **HISTORICAL**; the `audit/QC-UNIVERSE-STITCH/` directory does not exist on this checkout |

Reference renders captured for measurement: `audit/CA-01/reference-renders/`
(`reference-1440.png`, `reference-390.png`).

## 3. Route register

`audit/CA-01/route-register.json` — 88 Astro files:

| Class | Count | Meaning |
|---|---|---|
| `runtime` | 2 | `/` and `/laboratory`; resolve a server redirect, render no design surface |
| `source` | 76 | reads or writes application state through a server dependency/use case/register/POST action |
| `static` | 10 | fixed content or authorization/policy-derived presentation only: `/404`, `/500`, `/admin`, `/admin/scopes`, `/ai-advisory`, `/help`, `/quality`, `/quality/capa/new`, `/quality/ncr/new`, `/laboratory/tests/[labTestId]/retests/new` |

Reconciliation:

| Check | Result |
|---|---|
| Astro files | 88 |
| Screens | 86 |
| Runtime redirects | 2 |
| `src/shared/routing/routes.ts` entries | 86 |
| Declared routes whose file is missing | 0 |
| Declared routes without a page file | 0 |
| Pages not declared in `routes.ts` | `/404`, `/500` (framework error pages) |
| Handoff §10.4 entries | 86, all unique |
| Handoff minus pages | 0 |
| Pages minus handoff | `/`, `/laboratory` (the two redirects) |

New pages added in the future must be registered in `routes.ts` and classified here;
they must not be hidden to keep the number 86. The 86 figure is the current measured
inventory, not a target.

## 4. UI states and guard sources

Behaviour descriptions of what exists today; not an alternative business machine.
Full tables: `audit/CA-00/state-contracts.md`.

| Surface | States | Guard source |
|---|---|---|
| Reads / registers | idle → loading → ready / empty / filtered-empty / denied / not-found / unavailable / error → retry | `pageAccessDecision` (`middleware.ts` L212) + use-case authorization; failure classification in the page |
| Filters | applied → editing → loading → applied / failed; obsolete responses discarded | existing GET parameters and register predicates; no new server filter |
| Creation surfaces (incl. the three) | context-loading → **policy-blocked** in all three today; FORM states documented for when authority exists | `DecisionStateCard` renders the stored blocker; `src/actions/{ncr,capa}.ts` throw `FORBIDDEN`; `RetestPolicy` throws `POLICY_SOURCE_REQUIRED` |
| Dialogs | closed → review → submitting → closed / error | `ConfirmDialog`/`dialog.ts`; server ceremony unchanged |
| Sign-in | signed-out → authenticating → signed-in / sign-in-error | native POST to `actions.login`; session resolver in middleware |

Guard sources per route are recorded in each register entry (`guard.central`,
`guard.page`, `guard.visibility`, `mutationGuard`).

## 5. Candidate comparison (`/quality/capa/new`)

The candidate preserves the reference palette, card anatomy, 720px measure, 12/8px
radii, 44px actions and action hierarchy. Documented deltas:

1. No breadcrumb; the product shows a section label instead.
2. `PageHeader` adds a divider and 16px bottom padding the reference does not have.
3. Icon badge 44×44 at 10px radius vs 40×40 at 8px.
4. `h1` tracking −0.01em vs −0.025em; `h2` line-height not pinned.
5. Card shadow 24% vs 5%; action divider subtler.
6. Secondary action boundary uses `#707A8C` (3.29:1) instead of `#383F4C` (1.63:1) —
   deliberate control-identification requirement.
7. Callout-to-actions spacing is 16px larger.

Not copied: the 264px empty rail, Tailwind CDN, Material Symbols, Google Fonts, and
any record number, role or permission that the product does not have.

## 6. Commands and evidence

| Command / check | Result |
|---|---|
| `pnpm exec astro build` (Node 24.20.0) | **PASS** — exit 0 |
| `pnpm exec vitest run tests/unit/routing/design-route-boundaries.test.ts tests/unit/identity/session-recovery.test.ts tests/unit/ui/register-surface-contract.test.ts tests/unit/ui/capa-a-surface.test.ts` | **PASS** — 4 files / 26 tests |
| `pnpm test:architecture` | **PASS** — boundaries + canonical route registry |
| Route reconciliation script (pages ↔ `routes.ts` ↔ handoff §10.4) | **PASS** — 88 = 86 + 2; 0 mismatches |
| Live Stitch `get_screen` + HTML comparison | **PASS** — same title, character-identical HTML |
| Browser computed styles at 1440×1000 and 390×844 | **PASS** — values recorded in `reference-extraction.md` |
| HTTP check of `/` and `/laboratory` on `astro preview` | **BLOCKED** — 503 `SERVICE_UNAVAILABLE`, `config.invalid_environment`; environment was not bootstrapped from `.env` |
| Authenticated candidate screenshot on `567028c1` | **NOT RUN** — no session |
| Axe / screen reader / 200–400% zoom on this HEAD | **NOT RUN** — CA-00 evidence is historical for its own candidate |

Inventory method limit: the 88-route classification is derived from each page's
frontmatter imports/calls, the route catalogue and the handoff manifest; page bodies
were not all re-read line by line. The three creation pages, `DecisionStateCard`,
`PageHeader`, `AppLayout`, the two redirect pages and `capa-a.css` were read in full.

Why the preview check is blocked: the middleware validates the server environment
before routing, so redirect pages also return 503 without configuration. Supplying a
synthetic database URL or sourcing `.env` would violate the task constraints. The
redirect destinations are instead locked by unit tests and by source inspection:

- `/` → `rootRedirectDestination(...)`: guest → `/login?returnTo=%2Fdashboard`;
  authenticated → `/dashboard`; external `returnTo` rejected.
- `/laboratory` → `return Astro.redirect('/laboratory/tests')`.

## 7. Files

| Path | Purpose |
|---|---|
| `audit/CA-01/source-manifest.json` | provenance, live identity verification, observed palette/type/geometry/button states |
| `audit/CA-01/route-register.json` | 88-route register with source/static/runtime classification and guards |
| `audit/CA-01/reference-extraction.md` | observed vs proposed tokens and states |
| `audit/CA-01/candidate-comparison.md` | `/quality/capa/new` candidate vs pinned source |
| `audit/CA-01/reference-renders/*.png` | reference rendered at 1440 and 390 for measurement |
| `audit/CA-01/execution-record.json` | this task's state and limits |
| `tests/unit/routing/design-route-boundaries.test.ts` | locks redirect destinations and the 86-screen manifest boundary |

## 8. Remaining

1. Authenticated screenshots and populated-record checks on the final candidate
   (session + isolated data required; not attempted here).
2. Axe, screen reader and exact 200%/400% zoom on the same HEAD.
3. The three creation writes remain **BLOCKED** by PD-15/PD-16/PD-18 and the retest
   policy — unchanged by this task.
4. `audit/CA-00/report.md` mentions `after-*.png` files that are not present in the
   checkout; that is a documentation gap in CA-00, not evidence used here.
