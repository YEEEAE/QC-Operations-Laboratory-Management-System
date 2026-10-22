# CA-P-ASSETS-EQUIPMENT — CAPA A execution record

**State: PARTIAL** — the register presentation and source-derived read projection are implemented. Focused unit and PostgreSQL 18 integration checks passed through a temporary Docker Testcontainer. Same-candidate authenticated browser evidence, real populated-record comparisons, and the required viewport/accessibility matrix could not be collected: no authoritative populated equipment record was available in the disposable database. No production source was used.

## Candidate and reference

- Repository base: `a1c4c80c89d8232251f50a0e4ebaeadd91252be1` (`main`); local changes are listed in this record and were not committed.
- Applicable presentation source: `audit/CA-05/visual-decisions.md` (register hierarchy, English/LTR, sentence case, minimum 44px targets, 12px text, visible 2px focus, distinct authorization/provider/empty states).
- Reference asset: `audit/CA-00/reference/capa-a.png` is a blocked CAPA page reference, not an equipment-register screenshot. It supports the approved shell treatment only; no equipment-specific visual comparison is claimed.
- Sidebar is supplied by the existing `AppLayout`; no Sidebar source, navigation, policy, API, schema, or business-rule changes were made.

## Before / after inventory

| Area | Before | After |
| --- | --- | --- |
| Header | Equipment title and conditional Add equipment action | Preserved; purpose now describes source-recorded state and authorized use eligibility |
| Filters | GET search and operational state; applied chips | Preserved; invalid state value now states that it was not applied; chips reset page and preserve other query parameters |
| Read | `executePage`, page size 25; equipment number, name, model/serial, operational state, location, version | Same paged source read plus existing batched eligibility read; all original fields retained and current calibration, in-progress maintenance and source requirement flags shown |
| Eligibility | Not shown on register | Existing server assessment rendered as explicit text/reasons; status is not represented by color alone |
| Related records | Equipment detail link | Preserved; source calibration and maintenance links appear when the corresponding record is returned; existing detail route remains the history view |
| Empty/error | Provider unavailable vs empty | Preserved provider, filtered-empty and empty cases; main equipment denial redirects to `/404`; linked-source denial and provider failure each have their own aggregate notice and per-row text |
| Pagination | Existing Pagination | Preserved for confirmed register reads |
| Export / transitions | No page action observed | N/A: no export or equipment/calibration/maintenance transition existed on this page; no export, `MAKE_CURRENT`, or `VOID` action was added |
| Layout | Six-column register without linked-source details | Nine-column wide register in a named, keyboard-focusable horizontal scroll region; identifiers and long values wrap rather than clip |

## Reachable states and actions

| State / action | Source guard or transition | Surface behavior and evidence |
| --- | --- | --- |
| READ equipment | `ListEquipmentUseCase.executePage` → `PERM-EQP-VIEW`; server authorization remains authoritative | Existing list read retained. Denial is `/404`; source failure is `ProviderUnavailableState`. Runtime authorized/denied accounts: NOT RUN. |
| FILTER search/state | Native GET query to same list use case and `PERM-EQP-VIEW` | Search remains capped at 200 characters; supported states are source enum values. Valid filters render chips; invalid state says “State filter was not applied.” Unit contract PASS; browser behavior NOT RUN. |
| READ eligibility | `GetEquipmentEligibilityUseCase.assessMany` → source reads authorize equipment `PERM-EQP-VIEW`, calibration `PERM-CAL-VIEW`, maintenance `PERM-MNT-VIEW` | Existing eligibility reason and source state/due date are shown as text. If batch read fails, per-record existing read is attempted; denied and unavailable results remain distinguishable. Unit contract PASS; populated runtime record NOT RUN. |
| READ calibration/maintenance/history | Existing equipment detail and record routes; list/detail use cases guard `PERM-CAL-VIEW` and `PERM-MNT-VIEW` | Register links point to existing routes only. No new route or action. Runtime links NOT RUN. |
| Add equipment | Conditional link for active `PERM-EQP-CREATE`; `/assets/equipment/new` and `CreateEquipmentUseCase` retain their server authorization/native POST | Existing entry point only; not activated in browser due missing authorized session and database. |
| Export | No export control, action, or source on the existing page | N/A — not implemented. |
| `MAKE_CURRENT` / `VOID` | Policy-blocked operations are not page actions | N/A — not exposed or invoked. |
| Pending mutation / confirmation dialog | No mutation control or dialog in the register | N/A — no new workflow added. |
| EMPTY / FILTERED EMPTY / PROVIDER UNAVAILABLE | Existing list response/error classifier | Separate page states retained; static component contract PASS. |

### Existing functional debt outside this task

The existing equipment detail route records denied calibration, maintenance and history reads in flags that are not consumed by its panel rendering; a denied panel may therefore resemble an empty panel. This predates the register change and is outside this page-only CAPA A scope. No correction was made.

## Verification

| Check | Result |
| --- | --- |
| Focused tests: equipment register, calibration register, register contract, navigation permissions, eligibility | PASS — 5 files, 36 tests |
| Astro build using local Node 24.20.0 and installed local binaries | PASS; existing vendor/large-chunk warnings remain |
| `astro check` | FAIL — two unresolved imports in `audit/CA-P-500/committed-500.astro` and `audit/CA-P-500/workingtree-500.astro`; neither is a changed page |
| `pnpm` wrapper | BLOCKED — Corepack could not resolve `registry.npmjs.org` (`ENOTFOUND`); verification used installed local binaries directly |
| Graph refresh (`graphify update .`) | BLOCKED — `graphify` executable is unavailable in this environment |
| PostgreSQL 18 via temporary Docker Testcontainers | PASS — `tests/integration/assets/closure-008.test.ts` and `tests/integration/registers/bounded-registers.test.ts`: 2 files, 20 tests. No test fixtures were used as visual evidence. |
| Authenticated populated-record browser | BLOCKED — the temporary test database has no source-backed populated equipment record; no synthetic example was substituted. Production was not accessed. |
| Matched before/after screenshots and record data | NOT RUN — no live authorized populated equipment record was available; 404 sentinel was not substituted |
| 320/390/768/1024/1440px, keyboard/focus, 200%/400% zoom, reduced-motion/forced-colors, measured contrast, accessible and denied accounts | NOT RUN — requires the missing live authorized browser/runtime evidence. No responsive, WCAG, or contrast PASS is claimed. |
| `git diff --check` | PASS |

No API/schema/business rule, permission, signature, CSRF, expected-version, request-id, idempotency, Sidebar, or source mutation was introduced. No commit, push, merge, deploy, or production write occurred.
