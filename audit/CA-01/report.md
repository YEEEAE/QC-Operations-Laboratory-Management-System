# CA-01 — delivery report

Date: 2026-10-17 · base `567028c1` · **HEAD moved externally to `c38d1877` (`update site`) at 06:42:46 while this task was running** · branch `main`
· Node v24.20.0 / pnpm 11.25.0 · this session performed no commit, push, merge, deploy or production write
· no `.env` sourced or printed · all database work on a disposable local PG 18.6.

## Result

| Item | State | Basis |
|---|---|---|
| Reference pinned and identity-verified | **DONE** | live `get_screen` returned the same title and character-identical HTML |
| Source manifest | **DONE** | `audit/CA-01/source-manifest.json` |
| Route register with source/static/runtime | **DONE** | `audit/CA-01/route-register.json` (88 files, 86 screens, 2 redirects) |
| Candidate vs original `/quality/capa/new` | **DONE** | `audit/CA-01/candidate-comparison.md` |
| Redirect destinations | **DONE** | unit tests + authenticated HTTP: `/`→`/dashboard`, `/laboratory`→`/laboratory/tests` |
| Authenticated screenshots on this HEAD | **DONE** | `audit/CA-01/candidate/*.png`, isolated session |
| Populated-record check | **DONE** | `VERIFY-AUTHZ-READONLY` task list + detail from the local DB |
| axe WCAG A/AA | **DONE** | 0 violations on 8 surfaces |
| 200%/400% zoom proxies | **DONE** | 720/360 CSS-px reflow, 0 overflow on every tested page |
| Screen-reader session | **NOT RUN** | AX tree checked; no VoiceOver/NVDA session claimed |
| Pressed/disabled/busy states | **DONE (derived)** | `capa-a.css` + unit test + measured browser states |
| CA-02 / visual implementation | **not blocked** | reference is available; layer already applied |
| NCR/CAPA/Retest writes | **BLOCKED** | PD-15/PD-16/PD-18 + retest policy absent |

`PASS ≠ RELEASED`. This is presentation and inventory evidence, not populated-record
acceptance of all 86 screens, WCAG conformance, UAT or production readiness.

## 1. Repository and toolchain

| Check | Result |
|---|---|
| `git rev-parse --abbrev-ref HEAD` | `main` |
| `git rev-parse HEAD` | base `567028c1`; external `update site` commit `c38d1877` appeared at 06:42:46 during the task (not created by this session) |
| `git status --short` at start | clean |
| `.nvmrc` / `.node-version` | `24.20.0` / `24.20.0` |
| `package.json` engines | `node >=24.20.0 <25`, `pnpm 11.25.0` |
| shell `node -v` | `v22.22.3` — **outside the project contract** |
| verification runtime | `v24.20.0` / `pnpm 11.25.0` via nvm |
| `.env` | not sourced, not printed, not modified |

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
| Prior failures | “Authentication required” and missing `live-downloads/capa_a.html` are **HISTORICAL**; `audit/QC-UNIVERSE-STITCH/` does not exist on this checkout |

Reference renders: `audit/CA-01/reference-renders/` (`reference-1440.png`,
`reference-390.png`). The five delivery seeds are historical; the reference also
contains `#383F4C`, `#9BA3AF` and `#A6C5F5`, recorded as observed values.

## 3. Route register

`audit/CA-01/route-register.json` — 88 Astro files:

| Class | Count | Meaning |
|---|---|---|
| `runtime` | 2 | `/` and `/laboratory`; server redirects, no design surface |
| `source` | 76 | reads/writes application state through a dependency, use case, register or POST action |
| `static` | 10 | fixed content or policy-derived presentation: `/404`, `/500`, `/admin`, `/admin/scopes`, `/ai-advisory`, `/help`, `/quality`, `/quality/capa/new`, `/quality/ncr/new`, `/laboratory/tests/[labTestId]/retests/new` |

| Reconciliation | Result |
|---|---|
| Astro files / screens / redirects | 88 / 86 / 2 |
| `routes.ts` entries | 86 |
| Declared routes with a missing file | 0 |
| Pages not declared in `routes.ts` | `/404`, `/500` (framework error pages) |
| Handoff §10.4 entries | 86 unique |
| Handoff minus pages / pages minus handoff | 0 / `/`, `/laboratory` |

New pages must be registered and classified; they must not be hidden to preserve 86.

## 4. UI states and guard sources

Descriptions of current behaviour, not an alternative business machine. Full tables:
`audit/CA-00/state-contracts.md`.

| Surface | States | Guard source |
|---|---|---|
| Reads / registers | idle → loading → ready / empty / filtered-empty / denied / not-found / unavailable / error → retry | `pageAccessDecision` (`middleware.ts` L212) + use-case authorization |
| Filters | applied → editing → loading → applied / failed; obsolete responses discarded | existing GET predicates; no new server filter |
| Creation surfaces | context-loading → **policy-blocked** in all three today | `DecisionStateCard`; `actions/{ncr,capa}.ts` throw `FORBIDDEN`; `RetestPolicy` throws `POLICY_SOURCE_REQUIRED` |
| Buttons | rest → hover → pressed → disabled; busy is an overlay | `capa-a.css`; busy/disabled are presentational only |
| Dialogs | closed → review → submitting → closed / error | `ConfirmDialog`/`dialog.ts`; ceremony unchanged |
| Sign-in | signed-out → authenticating → signed-in / sign-in-error | native POST to `actions.login`; session resolver |

Pressed, disabled and busy are **derived** states (the reference has none). Measured:
rest `#92B8F2`, hover `#A6C5F5`, pressed `#7EA6E0` (7.14:1 with inverse), disabled
opacity `0.55`, busy opacity `0.85` + `cursor: progress`.

## 5. Candidate comparison (`/quality/capa/new`)

Preserved: palette, card anatomy, 720px measure, 12/8px radii, 44px actions, action
hierarchy. Deltas: different breadcrumb trail (topbar `Home / Quality / CAPA / New
record` vs `Quality / CAPA Register / New CAPA`); header divider + 16px padding; icon
badge 44×44/10px vs 40×40/8px; `h1` tracking −0.01em vs −0.025em; `h2` line-height
not pinned; shadow 24% vs 5%; subtler divider; secondary boundary `#707A8C` (3.29:1)
instead of `#383F4C` (1.63:1); callout-to-actions 16px larger.

Not copied: the 264px empty rail, Tailwind CDN, Material Symbols, Google Fonts, and
any record number, role or permission the product does not have.

## 6. Authenticated evidence (same candidate)

Local disposable PostgreSQL 18.6: 49/49 migrations, 89 tables, 0 orphans. Foundation
authorization seeded; one local admin and six disposable `verify-*` personas created.
Passwords were generated into a 0600 ignored file and never printed. No `.env` was
sourced.

| Surface | 1440 / 720 / 360 overflow | min font | axe | AX tree |
|---|---|---|---|---|
| `/quality/capa/new` | 0 / 0 / 0 | 12px | 0 violations | 3 headings, 16 links, 1 main |
| `/quality/ncr/new` | 0 / 0 / 0 | 12px | 0 violations | 3 headings, 14 links, 1 main |
| `/laboratory/tests/[id]/retests/new` | 0 / 0 / 0 | 12px | 0 violations | 3 headings, 12 links, 1 main |
| `/tasks` | 0 / 0 / 0 | 12px | 0 violations | 3 headings, 17 links, 1 main |
| `/dashboard` | 0 / 0 / 0 | 12px | 0 violations | 22 headings, 68 links, 1 main |
| `/quality/capa` | 0 / 0 / 0 | 12px | 0 violations | 4 headings, 12 links, 1 main |
| `/404` | 0 / 0 / 0 | 14px | 0 violations | 1 heading, 1 link, 1 main |
| `/tasks/[taskId]` (populated) | 0 at 1440 | — | 0 violations | h1 = `Authorization read-only boundary fixture` |

- Redirects with a real session: `/` → `/dashboard`; `/laboratory` →
  `/laboratory/tests`. Both **PASS**.
- Populated record: `VERIFY-AUTHZ-READONLY` is visible in the task register and its
  detail page renders the real record (`/tasks/b82044e4-…`).
- Sidebar measured at 1440: 264px wide, `rgb(17,29,45)` background,
  `rgb(242,246,249)` text, 32 links. No empty 264px rail.
- 720/360 are the CSS-px equivalents of 200%/400% browser zoom on a 1440 window; this
  is a reflow proxy, not an OS-level zoom recording.

**Minor measured finding:** the creation pages contain 4 elements below the 44px
house target: three breadcrumb links (24px high) and the account `<summary>` (40px).
They meet WCAG 2.2 AA target-size minimum (24px) but not the project's 44px control
convention. This is recorded, not silently dropped or claimed as zero.

## 7. Commands and evidence

| Command / check | Result |
|---|---|
| `pnpm exec astro build` (Node 24.20.0) | **PASS** — exit 0 |
| `pnpm typecheck` | **PASS** — 0 errors, 118 hints |
| `pnpm test:architecture` | **PASS** |
| focused vitest (4 files incl. state + redirect contracts) | **PASS** — 27/27 |
| Route reconciliation (pages ↔ `routes.ts` ↔ handoff) | **PASS** — 88 = 86 + 2 |
| Live Stitch `get_screen` + HTML comparison | **PASS** — character-identical |
| `db:migrate` / `db:schema:check` on disposable PG 18.6 | **PASS** — 49/49, 89 tables, 0 orphans |
| Authenticated Playwright login + 8 surfaces | **PASS** |
| axe WCAG 2.0/2.1 A/AA + 2.2 AA | **PASS** — 0 violations on 8 surfaces |
| Reflow at 1440/720/360 | **PASS** — 0 overflow |
| Redirects with session | **PASS** — `/dashboard`, `/laboratory/tests` |
| Populated task register + detail | **PASS** |
| Pressed/disabled/busy computed states | **PASS** — values above |
| Screen-reader session (VoiceOver/NVDA) | **NOT RUN** |
| Full 86-route populated matrix | **NOT RUN** |

Inventory method limit: classification derives from frontmatter imports/calls and the
registries; bodies of all 88 pages were not re-read line by line. The three creation
pages, `DecisionStateCard`, `PageHeader`, `AppLayout`, both redirect pages and
`capa-a.css` were read in full.

## 8. Files

| Path | Purpose |
|---|---|
| `audit/CA-01/source-manifest.json` | provenance, identity verification, observed tokens |
| `audit/CA-01/route-register.json` | 88-route register and guards |
| `audit/CA-01/reference-extraction.md` | observed vs proposed vs derived states |
| `audit/CA-01/candidate-comparison.md` | candidate vs pinned source |
| `audit/CA-01/candidate/*.png` | authenticated candidate pages at 1440/720/360 + state captures |
| `audit/CA-01/candidate/evidence*.json` | machine-readable metrics, axe and AX results |
| `audit/CA-01/reference-renders/*.png` | reference renders for measurement |
| `audit/CA-01/execution-record.json` | task state and limits |
| `tests/unit/routing/design-route-boundaries.test.ts` | redirect destinations + 86-screen boundary |
| `tests/unit/ui/capa-a-surface.test.ts` | layer, gate and derived-state contracts |
| `src/ui/styles/capa-a.css` | derived pressed/disabled/busy states |

## 9. Remaining

1. Manual VoiceOver/NVDA session on the final candidate.
2. Full populated-record visual matrix for all 86 screens (only the pilot + tasks are
   covered here).
3. Decide whether breadcrumb/account affordances should meet the 44px house target
   (they meet WCAG 2.2 AA 24px today).
4. NCR/CAPA/Retest writes remain **BLOCKED** by PD-15/PD-16/PD-18 and the retest
   policy — no policy, number, role or threshold was invented.
5. `audit/CA-00/report.md` mentions `after-*.png` files absent from the checkout; that
   is a CA-00 documentation gap, not evidence used here.
