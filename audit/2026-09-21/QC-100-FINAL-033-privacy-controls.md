# QC-100-FINAL-033 — Privacy controls and understandable privacy UX

**Work state:** `PARTIAL`  
**Evidence state:** mixed: `PASS`, `BLOCKED`, and `NOT VERIFIED`  
**Audit comparison:** 2026-09-19 candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`; maturity `45.8%`, gates `0/19`, `NO-GO`. No score or 80-domain denominator change.

## Candidate and runtime identity

| Identity | Value |
| --- | --- |
| Frozen base commit | `0e9bdf28ae448ab2ebc197c567a05832ea88c07d` |
| Base source/test dirty fingerprint | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (clean source/test set before this task) |
| Final source/test dirty fingerprint | `d5b7f826d510c22a555f1c6f4e8ad878829fada7fd3f13196731487cb7e1dab3`; 13 paths, sorted `path NUL status NUL SHA256(file bytes)` records, LF-joined and SHA-256 hashed; excludes `audit/**` and `.agents/mind/**` |
| Runtime | Node `v22.22.3`, pnpm `11.25.0`; Node is below declared `>=24.20.0 <25` |
| Build / local identity | `astro build` PASS; build ID `qc-privacy-033-local`; release ID `rel-970f66a2b8acc936`; artifact SHA-256 `1da7d844aa6dd7bba66b1ede8bb4f5bbcfb6e0bb6df52c548aa328b79c49e82e`; local identity verification PASS. Dirty working tree; not production evidence. |
| Source schema | Migration head `0033_controlled_document_execution_context`; checksum `6b4cf38ab8974ba0dbb30fc4cccb766dac3351796f4d84eb5bf226de0d75c472`; applied schema `NOT VERIFIED` |
| Evidence time | 2026-09-21 02:33–02:35 Asia/Riyadh (2026-09-20 23:33–23:35 UTC) |

## Approved-flow inventory and requirement mapping

This is a derived inventory of source behavior and existing approved requirements, not a new privacy policy.

| Flow / purpose | Data and storage | Access, export, external processing, telemetry | Retention / deletion / correction status |
| --- | --- | --- | --- |
| Identity and session (`src/modules/identity`, `src/actions/account.ts`) | Login identity, display name, optional email, account state, password hash, session/reset credentials; identity/session database tables. Password/session secrets are classified `SECRET`. | Self-account read is checked by `PERM-IDN-VIEW-SELF`; admin profile correction requires `PERM-IDN-MANAGE-USERS`, expected version and audit record. Password changes remain a separate authenticated action. No identity values are placed in product analytics. | No self-service account deletion or profile edit. Admin profile correction exists; exact personal-data correction/deletion rights and identity/session retention remain with 013/026. Controlled history is not erased by this page. |
| Controlled QC records, evidence, signatures and audit | User-entered QC content, record identifiers, attachments, results and versioned snapshots stored in domain tables/object storage; audit/signature records are immutable or append-only under existing controls. | Domain authorization and scope/state/version/SoD checks remain on server use cases. Audit views are sanitized projections; report exports require view/run/export/format permissions and use the same server-side scoped dataset. | Controlled records are not hard-deleted after entering controlled lifecycle; draft deletion and record-class retention remain policy-dependent. Corrections use controlled domain workflows, preserving prior history. |
| Report viewing and CSV/XLSX export | Filter values can include lot/item identifiers; report rows include authorized QC data. Export bytes are returned as browser downloads and are not retained by the application as generated artifacts in this path. | Filters run server-side; export requires explicit permissions and the same owner scope. Formulas are neutralized in CSV/XLSX. Middleware logs canonical route templates, not query strings; product analytics has no report-content event. | Exported copies leave the app's access/correction controls. Local retention/deletion of downloaded copies is outside the app and not claimed. Report artifact retention decisions remain open where artifacts are persisted elsewhere. |
| Product analytics | Current internal optional outbox events cover global-search outcomes; only event metadata is stored. Search text, account/record IDs, QC content and credentials are prohibited. | `safeTrack` is non-critical; no external analytics exporter or dashboard is configured. Attribute values now must match low-cardinality allowlists; unknown/free-form values are dropped. | Exact analytics/security/observability retention and access classes remain pending policy; do not enable permanent collection or external export from this evidence. |
| Operational logs and telemetry | Request/trace/span IDs, canonical route templates, method/status/duration and operational event fields. Request body/query strings are not logged in the inspected middleware path. | Structured logger redacts credential, personal identifier, query, form, prompt, context and record-content fields. Telemetry route normalization discards query and fragment. | Exact log/trace retention remains `POLICY-DEPENDENT`; no deletion schedule inferred. |
| AI advisory | Question and explicitly typed excerpt are held in request/browser memory. Output is returned to the UI; no prompt/output persistence is present in the traced path. | Network providers can receive question/excerpt only when `AI_EXTERNAL_PROCESSING_APPROVED=true` and credentials/model are configured. Default is `false`; configured secrets alone no longer activate providers. Secret/PII-like detection and server authorization remain before provider calls. The page identifies the configured external provider and warns the form cannot verify pasted-source authorization. | External provider data handling, permitted classes, exact retention and provider-side deletion remain unapproved/unknown; provider-side copies are not promised deleted. AI prompt/output retention remains policy-dependent. |

## Item-by-item evidence

| Scoped item | State | Implementation and technical evidence | Unresolved dependency / owner |
| --- | --- | --- | --- |
| 1. Map flows, purpose, minimization, storage, access, export, external processing and telemetry | `PARTIAL` | Inventory above maps major existing paths, purpose, flow and limits. It records unknown retention, deletion and correction rules without assigning durations. The existing `Documents/DATA-GOVERNANCE-REGISTER-032.md`, `Documents/PRODUCT-ANALYTICS-MEASUREMENT-PLAN.md`, `Documents/DATA-MODEL.md`, `Documents/SECURITY-ARCHITECTURE.md`, and `Documents/AI-PROVIDERS.md` remain canonical sources. It is not a complete field-by-field classification of the entire schema because approved classifications are missing. | 013/026: field-level classification, retention/deletion/correction and AI-provider approval decisions. |
| 2. Approved minimization/redaction and access/correction/export controls; truthful history copy | `PARTIAL` | Provider credentials no longer enable Groq/Gemini without an explicit server-side approval flag. Search analytics now accepts only approved categorical values. Logger redaction covers personal identifiers and free-form request/AI/record fields. Account page describes admin-controlled corrections and retained history; report page explains browser downloads leave app access/correction controls. Existing permission/scope export and immutable audit/history controls remain intact. Focused unit/integration tests `62/62 PASS` initially cover redaction, provider failover failure, existing authorization, and export safety; final suite rerun below. | 013/026: correction/deletion and retention entitlement/policy. 002/027: exact-candidate database regression for existing scoped export and append-only history. |
| 3. Prevent form/query/record data entering logs, analytics, client storage or AI without approved need; test denied/cross-scope and failed provider | `PARTIAL` | No query string or request body is logged by the inspected middleware; route telemetry strips query/fragment. Analytics rejects unrecognized/free-form values. AI network path is disabled by default and remains authorization-checked, PII/secret-screened and failure-sanitized. Focused AI security tests passed; denied permissions produced zero provider calls. Logger and analytics negative tests assert sensitive content is absent. | `tests/integration/reporting/report-export-parity.test.ts` denied/cross-owner export cases were `BLOCKED` (8 skipped) because Testcontainers has no working runtime. 002/027 must run against disposable PostgreSQL 18; 003 must cover authenticated direct requests. |
| 4. Context-specific notices with truthful processing and choices | `PARTIAL` | AI page identifies that entered text may go to the configured external provider, says source authorization cannot be verified by the form, and explains the disabled state. Account page explains controlled admin correction and history. Report page explains downloaded copies are outside app access/correction controls. No promise of anonymity, provider deletion or account deletion is made. | 006/040: keyboard/screen-reader and browser accessibility checks. 003: authenticated page/direct-action E2E. 013/026: approved AI processing notice terms and external processor scope. |

## Technical verification

Evidence collected at 2026-09-21 02:28–02:35 Asia/Riyadh:

- Final focused AI, analytics, logger, privacy-copy and reporting checks: `9 files / 70 tests PASS`. This includes provider failure sanitization and no-call-on-denied authorization tests.
- Follow-up cross-scope export run: `16 tests PASS`; PostgreSQL parity suite `8 BLOCKED/SKIPPED` at setup because Testcontainers could not find a working container runtime. This is not a pass for cross-scope export behavior on this candidate.
- `pnpm typecheck`: `889 files / 0 errors / 0 warnings / 74 hints` (Node outside project runtime contract).
- `pnpm build`: `PASS` (Node outside project runtime contract; existing third-party/chunk warnings).
- `pnpm requirements:check`: `PASS`, domains remain `80`.
- Privacy notice copy contract: `3/3 PASS` (part of the final focused rerun).
- Prettier: modified TypeScript/Markdown sources formatted. `.env.example` and `.astro` files have no configured Prettier parser; the initial combined check therefore returned `FAIL` for tool support, not a formatting assertion. Astro pages compiled in the build.
- No AI provider request, production access, database migration, credential change, human acceptance or deployment was executed.

## Requirement → implementation → technical evidence → unresolved dependency

| Requirement | Implementation | Evidence | Remaining dependency |
| --- | --- | --- | --- |
| `REQ-SCOPE-005` / measurement plan: no data beyond approved analytics plan | Strict event/attribute/value allowlists; current search-only values; free-form values dropped | `tests/unit/shared/product-analytics.test.ts` | 013/026 approve retention class/access; 012 reconciliation |
| `REQ-SEC-005/006` / no secret or personal content in logs | Structured field redaction; middleware logs route template, never request URL/body | `tests/unit/shared/logger-privacy.test.ts`; middleware/source inspection | 002/027 exact-candidate security regression; log-retention decision 013/026 |
| `REQ-AIGV-004`, `REQ-AI-010` / AI processing and retention | External provider config requires explicit default-off approval gate; page gives provider/data notice | `tests/unit/ai-advisory/providers.test.ts`; `tests/integration/ai-advisory/security.test.ts` | 013/026 approved processor, data classes and retention; 003 authenticated E2E |
| `REQ-AUTHZ-007`, `REQ-AUDF-004` / scoped export and no history destruction | Existing server-side permissions/scope and immutable history preserved; report download notice added | `tests/integration/reporting/reports.test.ts`; `tests/unit/reporting/export-safety.test.ts`; candidate PG parity remains blocked | 002/027 PG18; 003 direct-request E2E; 013/026 export/personal-data decision |
| Account access/correction | Self-account read; admin-only versioned profile update and audit; no self-deletion claim | `src/modules/identity/application/get-account.ts`, `update-user.ts`; copy added | 013/026 decide correction/deletion entitlement and retention |

## Handoff

- **013 / 026:** decide field/classification mapping; personal-data correction/deletion rights; controlled-record exception/hold behavior; precise retention per class; export privacy; AI provider/controller-processing approval, allowed input classes, provider terms and retention. Do not set `AI_EXTERNAL_PROCESSING_APPROVED=true` until the approved decision is actually recorded.
- **002 / 027:** run exact-candidate migration/database, cross-owner report export, immutable-history and privacy negatives on disposable PostgreSQL 18. Source head is 0033; applied schema is not verified.
- **003:** authenticated direct-action/page E2E for AI disabled/approved-notice variants, permission-denied no-call, account correction guidance and report download boundaries.
- **006 / 040:** keyboard, screen-reader, responsive and notice readability checks on the candidate build.
- **012:** reconcile this item-by-item evidence and unresolved dependencies; preserve existing domains 59/63/73/75/76 and denominator 80.
- External human acceptance remains excluded; any mandatory human evidence remains an external dependency. `PASS ≠ RELEASED`; current audit comparison remains `NO-GO`, gates `0/19`.

**Next phase / required inputs:** 013/026 must first provide approved field classifications, correction/deletion and retention rules, export privacy decisions and AI processor scope/terms. Then 002/027 need this exact candidate's built artifact plus disposable PostgreSQL 18 for scope/history regressions; 003 needs authenticated fixtures; 006/040 need the exact candidate build for accessibility; 012 reconciles all evidence. Do not enable external processing without the recorded approval decision.
