# QC-DOC-360 — Codex execution using extracted ChatGPT Library files

Role: Principal Medical Device QC System Architect, Controlled-Document Engineer, PostgreSQL Schema Designer and Product UI Implementer.

## Source boundary

Use ACTUAL locally extracted files in:
`QC_Controlled_Forms_and_Operational_Evidence/QC_Library_Source_Import/`
(or ask the operator to provide the absolute extracted path if the directory is elsewhere).

The source package includes `SOURCE_MANIFEST.json`, provenance hashes and deduplicated aliases. **Do not claim access to the ChatGPT Library API**; the exported package is the actual source.

Inspect the repository HEAD and existing structure first. Work with existing code, not an imaginary blank system. Retain the existing Sidebar navigation hierarchy and English professional interface. Implement source-code modifications in place; do not push or deploy.

### Mandatory source-processing sequence

1. Traverse `SOURCE_MANIFEST.json` and physically open/read each canonical file completely, including multi-sheet XLSX, DOC/DOCX, ODT, PDF (including scanned PDF pages), and inside source ZIPs when safe. Preserve tables, units, formula structure, print layout, original headings, signatures and revision data. Never silently skip files. Maintain an import ledger with statuses `READABLE`, `PARTIAL`, `SCAN_REQUIRED`, `SOURCE_CONFLICT`, `UNAVAILABLE` and filename/hash/page/sheet details.
2. Determine actual **document code, revision, issue/effective date, product, process, scope, author, approver and source location** from the body and headers; filename is a candidate, never authority. Detect scanned text and flag for visual review without fabricating details. Deduplicate on SHA-256 but preserve alias filenames, source references and genuinely different revisions.
3. Sort by document purpose and controlling workflow, not only prefix; flag unexpected content for manual review:
   - `WI-8-2-2*`, `WI-DD*` => `Controlled Documents / Work Instructions`, linked to applicable product, operation, production line, in-process controls, and distinct incoming/final/lab/sterilization routes when source has such sections; original stays intact.
   - `F-823-i*` => `Work / In-Process Control Templates` with operation/shift/machine/lot, data entry, QC observations, version-pinned WI, reviewer/approval routing as supported by source.
   - `F-823-T*` => `Quarantine / Inspection Templates` only when the **actual original form** is available and matched to source catalog identity and revision, effective WI, item code mapping and approved source evidence.
   - `TF-*` and `*-PS` => `Controlled Documents / Technical Files and Product Specifications`, source of item/product dimensions only after approval.
   - ISO/BS EN ISO/AQL => `Controlled References / Standards`. Record standard number, edition, origin, scope, section, revision applicability; never turn design/qualification tests into routine In-Process or Quarantine fields without controlled internal routing and authorization.
   - SOP => `Controlled Documents / Procedures`; implement operational forms and safe workflow references only.
   - `Revised`, `DRAFT`, `Gap Analysis`, `Closure Register` => `Review & Change Requests`, source-linked **unapproved** proposed content, not an effective template.
   - Forms/images/archives => `Operational Evidence` with original file SHA-256 and explicit parent/source linking.
4. Existing GitHub assets to inspect and reuse:
   - `QC_Controlled_Forms_and_Operational_Evidence/`
   - `src/modules/quarantine/catalog/master-rev14.json` (194 catalog identities)
   - `src/modules/quarantine/catalog/digitized-forms.json` (13 drafted digitizations; not source originals)
   - `src/modules/quarantine/catalog/source-evidence.json`
   - `src/modules/quarantine/catalog/application/import-controlled-sources.ts`
   - `src/modules/quarantine/templates/`, `src/pages/quarantine/admin/`, `src/pages/quarantine/inspections/`
   - `src/modules/documents/`, `src/pages/documents/`
   - `src/pages/work/`, `src/modules/administration/`
   - existing controlled template/model mappings, migration files and applicable permissions.
5. Build actual controlled document ingestion and user-facing screens for all relevant categories. Use real database entities and migrations **as source files only**, with provenance, immutable original attachments, revision links, approver/audit state, source hash, product/Item Code, template revision, evidence images and source standards references.
6. For In-Process, build an independent working form/operations workspace based on actual `F-823-i` contents, without conflating with Quarantine Inspection. Preserve in-process step cadence, shift, machine, line, lot, product, counters and signatures where supported by the original. Do not create unrelated routine inspection tests.
7. For Quarantine, reuse the 194-entry Rev14 report **identity catalog**, but create/edit only source-backed digitized forms. A catalog item alone does NOT prove the original `F-823-T` document is available or legally approved. Do not fake generic templates for unmatched items. Expose `SOURCE MISSING`, `REVISION CONFLICT`, `PENDING REVIEW` and real controlled states.
8. For Technical Files and ISO, create evidence links from product/Item Code to exact source revision and applicability clause, control location (incoming, in-process, qualification, supplier, lab, final, sterilization), and unknown/approval status. Do not invent limits, tolerances, AQL, sampling quantities, material grades or scientific acceptance thresholds.
9. Link `WI-8-2-2-29` to `F-823-i27` / `i27A` as separate Stopcock manual/automation paths, `WI-8-2-2-11` to `F-823-i60` for Extension Tube, `WI-DD-02` to `F-823-i13` / `i13-2` for CVC, and other document pairs **only after body-level matching**. Preserve Revision mismatches as blockers, not silent auto-upgrades.
10. Use default-deny server authorization and existing document/template workflows. No auto-approval, no forged signature, no automatic effectiveness, no production release, no silent import into Neon. Draft source data and pending approvals remain restricted.
11. Implement clear source coverage views: by source file, product, category, digitization percentage **with denominator and evidence**, revision conflict, duplicate, missing source, approval state, published template count and out-of-scope ISO tests. All values must be computed, never hardcoded.
12. Before touching any existing company-controlled source in Git, check permission and keep originals intact. Do not commit licensed ISO PDFs, employee/company confidential artifacts, or source attachments to a public repo. Prefer a private authorized document store and governed metadata pointers. Never expose credentials.

### Execution restrictions

- Make code, migration source files, UI, controlled mappings and docs changes only.
- **No tests, build, lint, screenshots, E2E, automated visual capture or load testing.**
- **No database migrations executed**, no production DB changes, no deploy, no Git push.
- Preserve Sidebar and existing paths; add navigation within authorized sections without Sidebar restructuring.
- No fictional data, source file, revision, approval, product test result, ISO threshold or completion claim.
- Stop an individual source's activation on unresolved source conflict; continue with other safe changes.

### Final response

Return: total manifest files; fully processed/partial/unavailable counts; document type classification; per-source code/revision/product mapping; exact files/screens/actions/SQL migration files modified; source-backed templates drafted; unapproved/missing/revision-conflict counts; ISO applicability; and blocked items. Explicitly distinguish source-code changes from real staging DB state and any manual QMS approval still needed.

**Outcome: Functional, source-traceable QC Universe document library and configurable templates created from actual company files, never a false claim that all sources were available or effective.**
