# QC-UX-360 — Verified production UX findings: root cause, change, evidence

Candidate: `d62de16ac10da7d0b6b727c2c17e2817626387ed` (branch `main`, working tree dirty with this change set).
Findings source: authenticated read-only inspection on 2026-10-16 of `https://qclevel.top`.
Sidebar is frozen (`src/ui/navigation/navigation.ts`); only the permitted defects were corrected.

Verification environments used here:

- Browser: local Playwright Chromium against the built app (`node dist/server/entry.mjs`) at `127.0.0.1:4321`.
- Database: disposable local PostgreSQL 18.6 (`scripts/db/disposable-postgres.sh`, port 55432, `.tmp/`), never production.
- Login: disposable local named owner bootstrapped on that database (`pnpm bootstrap:admin` + `system-owner:reconcile`).
- Scripts: `.tmp/ux360-browser-check.mjs` (12 checks), `.tmp/ux360-responsive-check.mjs` (64 combinations). Both gitignored.

---

## UX-001 — HIGH — Conflicting operational readiness messaging

**Affected:** `/system/health`, `/system/control-center`

**Root cause.** Both pages put a *subsystem probe* in the single most prominent slot (the page-header banner). `/system/health` rendered a green `Required workflow readiness: READY` while the release layer on the same page was `BLOCKED`/`NOT VERIFIED`; the control center rendered `Application and database connectivity: READY` while QC acceptance was `NOT VERIFIED` and migration drift was detected. The concepts were listed separately further down the page, but the loudest indicator contradicted the authoritative one.

**Change (presentation only — no release-governance logic touched).**

- `src/pages/system/health.astro`: the header banner now derives from the authoritative release layer (`Release readiness: BLOCKED | NOT VERIFIED`); the status summary gained an explicit `Database migration state` layer and every subsystem row now states `not a release decision`. The summary grid became `repeat(auto-fit, minmax(13rem, 1fr))` to hold four layers.
- `src/pages/system/control-center.astro`: the header banner is now `Release readiness: NOT VERIFIED` (or `UNAVAILABLE` when the read fails). Connectivity and migration facts stay in their own cards and `dl`.

**Evidence (browser, 1440px):**

```
/system/health        200  banner="Release readiness: NOT VERIFIED"
  layers: Application and database connectivity=READY · Database migration state=IN SYNC ·
          Required workflow readiness=READY · QC release acceptance evidence=NOT VERIFIED
/system/control-center 200  banner="Release readiness: NOT VERIFIED"
```

**Migration drift — precise source (reported, not "fixed" by UI).** The shipped source head is `0048_inspection_template_authoring` (48 `.sql` files under `db/migrations/`). `PostgresMigrationStatus` (`src/modules/system-health/infrastructure/postgres-migration-status.ts`) compares the applied ledger to shipped files and reports `appliedHead`, `buildHead`, `pending[]` and `integrityMismatches[]`; the control center renders `pendingCount > 0` as `the database is at <appliedHead> while this build ships <buildHead>; pending migrations are not applied automatically`. The deployed report ("database is two migrations behind") therefore means the deployed ledger's applied head is **0046** while the build ships **0048**, i.e. `0047_task_references_occurrences` and `0048_inspection_template_authoring` are pending (or a ledger identity/checksum mismatch is present). Applying migrations is an operational action and was **not** performed, in production or anywhere else.

---

## UX-002 — MEDIUM — Sidebar search label contrast (1.09:1 → 15.62:1)

**Affected:** `/dashboard` (sidebar "Find a page")

**Root cause.** `precision-light.css` re-maps the text tokens on `.app-sidebar`, but `.app-shell` already *computed* `color: var(--text-primary)` from the document-level palette. A computed colour is inherited as-is and is never re-resolved against the child's variable overrides, so any sidebar text without its own `color` (the filter `<label>` is the only one) inherited `#14243b` on the `#111d2d` sidebar surface — 1.09:1.

**Change.** `src/ui/styles/precision-light.css`: added `color: var(--text-primary);` inside the `.app-sidebar` block so the inherited colour re-resolves inside the sidebar scope. One declaration, no structure/appearance change.

**Evidence.** Measured in the browser: label `rgb(242, 246, 249)` on `rgb(17, 29, 45)` = **15.62:1** (AA needs 4.5:1). Regression guard computes the ratio from the stylesheet and also asserts the old ink stays < 2:1, so the defect cannot silently return (`tests/unit/ui/ux360-verified-fixes.test.ts`).

---

## UX-003 — MEDIUM — Duplicate `aria-current="page"`

**Affected:** `/admin/users`, `/quarantine/receiving` (all nested routes)

**Root cause.** `Sidebar.astro` treated "prefix match" as current: on `/admin/users` both `/admin` and `/admin/users` rendered `aria-current="page"` plus a visible "Current page" chip.

**Change.** Added `navigationCurrentState(activePath, href) → 'current' | 'ancestor' | 'none'` in `src/ui/navigation/navigation.ts` and used it in `Sidebar.astro`: only the **exact** route gets `aria-current="page"` and the chip; a containing section keeps its `.active` styling (accent bar, underline, weight) so it stays visually identifiable as the section you are in. Group auto-expansion still treats an ancestor as "contains current".

**Evidence (browser):**

```
/admin/users            aria-current=["/admin/users"]              active=["/admin","/admin/users"]  chip=["/admin/users"]
/quarantine/receiving   aria-current=["/quarantine/receiving"]     active=["/quarantine","/quarantine/receiving"]  chip=["/quarantine/receiving"]
/dashboard              aria-current=["/dashboard"]                active=["/dashboard"]             chip=["/dashboard"]
```

---

## UX-004 — MEDIUM — Skip-to-main keyboard focus

**Affected:** `/dashboard` (all shelled pages)

**Root cause.** `<a class="skip-link" href="#main-content">` targeted a `<main>` with no `tabindex`. A fragment navigation moves the sequential-focus starting point in some engines but leaves `document.activeElement` on `<body>`, so the next Tab did not start inside the content.

**Change.** `src/ui/layouts/AppLayout.astro`: `<main id="main-content" class="app-main" tabindex="-1">`, an explicit `click` handler that calls `.focus()` on the landmark, and `.app-main:focus { outline: none; }` (the landmark is not interactive; the first control inside the content keeps its own visible focus ring).

**Evidence (browser, keyboard only):** first Tab stop is the skip link (`data-skip-link`), Enter moves focus → `document.activeElement.id === "main-content"`.

---

## UX-005 — MEDIUM — Report table readability and mobile clipping

**Affected:** `/reports/quarantine-aging` (shared report grid)

**Root cause.** `.app-main` sets `overflow-wrap: anywhere`, which is inherited by table cells and lets a column shrink to a single character — the mechanism behind `Description`, `Lot` and `Quantity` breaking inside the word. Separately, `global.css` sets `select { min-inline-size: 0 }`, so the row-density `<select>` in a flex row could shrink below its selected label and clip it.

**Change.** `src/pages/reports/[reportCode].astro`: `th { overflow-wrap: break-word; vertical-align: bottom; }` (headers now wrap only at word boundaries and the longest word forms the column's meaningful minimum), `.density-control` / `.density-control select` locked to `flex: 0 0 auto` with `min-inline-size: 9.5rem`, `.table-controls` wraps (column layout ≤600px), and the scroll container became an accessible region: `<div class="table-scroll" role="region" tabindex="0" aria-label="… 11 columns, scroll horizontally …">` with a `:focus-visible` ring. No column was removed; horizontal scrolling is preserved where genuinely required.

**Evidence (browser, 1440px).** `status=200 columns=11 overflow-wrap=break-word headersNarrowerThanLongestWord=[] density=152.0px ≥ selectedText=58.7px ("Standard")`, region present with `tabindex="0"`.
**Evidence (browser, 390px).** `pageOverflow=false tableScrollsInternally=true densityClipped=false columns=11` — the table owns its own horizontal scroll and the page itself does not overflow.

---

## UX-006 — LOW — Audit history timezone ambiguity

**Affected:** `/audit`

**Root cause.** The From/To inputs are `datetime-local`, which carry no offset, and the page parsed them with `new Date(value)` — i.e. in the unnamed **server process** timezone — while every rendered timestamp uses `formatDateTime` (`en-GB`, `Asia/Riyadh`). The zone that was actually applied was never stated.

**Change.**

- `src/shared/copy/format.ts`: added `parseFactoryDateTime()` (interprets `YYYY-MM-DDTHH:mm[:ss]` in the factory zone, UTC+03:00 — Riyadh has had no DST since 1950) plus `FACTORY_TIME_ZONE_LABEL` / `FACTORY_TIME_ZONE_OFFSET_LABEL`.
- `src/pages/audit.astro`: filters now use `parseFactoryDateTime`, the labels read `From (Asia/Riyadh)` / `To (Asia/Riyadh)`, a description-linked note states factory time `(Asia/Riyadh, UTC+03:00)`, and the active-filter summary renders boundaries with the shared formatter instead of a raw UTC ISO string.

No stored audit timestamp is changed; the change makes the *filter boundary's* instant explicit and consistent with the display contract.

**Evidence (browser).** `200 from="From (Asia/Riyadh)" type=datetime-local note="Dates and times are factory time (Asia/Riyadh, UTC+03:00); the "When" column is shown in the same zone."`
**Evidence (unit).** `parseFactoryDateTime('2026-10-16T09:30')` → `2026-10-16T06:30:00.000Z`; empty/invalid → `undefined`.

---

## Sidebar preservation gate

`tests/unit/ui/ux360-verified-fixes.test.ts` locks the whole presentation contract read from the source of truth:

- Group ids in order: `overview, work, quality, quarantine, laboratory, assets, governance, insights, administration, system`.
- Group labels in order: `Overview … System`.
- Every item's `group/id:label:href:icon` (30 items) and the 4 utilities.
- The `quarantine-administration` capability gate (`PERM-ADM-TEMPLATES`) is unchanged.

Result: **PASS** — no group, item, label, href, icon, order or capability changed. Route URLs, authorization visibility (`pageAccessDecision`) and the mobile drawer contract were not touched.
