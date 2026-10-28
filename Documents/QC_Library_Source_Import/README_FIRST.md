# QC Universe — Curated source export from ChatGPT Library

Export date: 2026-10-28

This is a **source handoff**, not a set of approved templates. File content and document-control status must be verified by Codex against originals and company approval records. This archive contains QC-relevant user Library documents only; it **does not** represent every one of the 595 Library items.

## How to make this available to Codex

1. Download and extract this ZIP **locally** outside any public Git repository.
2. Move the extracted directory `QC_Library_Source_Import/` under your QC repository's `QC_Controlled_Forms_and_Operational_Evidence/` directory, or keep the extracted folder outside the repository and provide Codex its absolute local path.
3. **Do not git add/commit source materials** until ownership, license, confidentiality, data-protection, and controlled-document classification are approved. Standards PDFs may have licensing restrictions.
4. Open `CODEX_EXECUTION_PROMPT.md` in the extraction and paste it into Codex. Codex should discover and use the actual files (not pretend it has built-in Library access).

## Classification

- `01_Controlled_Documents/Work_Instructions/`: original work instructions (not automatically effective); inspect actual page headers for code and revision, and split process vs inspection *workflow references* without altering the original.
- `02_In_Process_Control_Templates/`: `F-823-i*` operating forms; preserve steps, shifts, process, layout, measurements, signatures, controls, and sampling text if actually present. Do not infer tests not approved.
- `03_Quarantine_Inspection_Source_Forms/`: no original `F-823-T` files found in the browsed Library, so the folder may remain empty. GitHub already contains a Rev14 **194-entry catalog** in `src/modules/quarantine/catalog/master-rev14.json` and **13 draft form JSONs** in `digitized-forms.json`. Do not promote them without matching originals and approvals.
- `04_Technical_Files/`: `TF-*` product/raw-material specifications.
- `05_Standards_ISO_AQL/`: ISO and BS EN ISO source reference editions, not automatic per-batch tests or acceptance limits.
- `06_SOP_and_Reject_Workflows/`: source procedures for controlled workflow reconstruction.
- `07_Review_Drafts_Gap_And_Closure/`: revised WIs, QC manager gap reports, closure registers and proposed forms; these are **uncontrolled drafts**, not effective operating instructions.
- `08_Operational_Forms_And_Focus/`: rejection/Focus supporting materials.
- `09_Source_Evidence_Archives/`: supporting archives; unpack separately after review and prevent ZIP slip/path traversal.

## Read-only provenance

- `SOURCE_MANIFEST.json` lists canonical original filenames, SHA-256, size, inferred classification and revision (if present in filename).
- `SOURCE_MANIFEST.csv` is importable into a spreadsheet.
- `DEDUPLICATED_ALIASES.csv` records exactly identical SHA-256 sources excluded from the folder.
- `NOT_TRANSFERRED.md` enumerates large or unavailable sources.

## Major risk flags

- Wound Drainage Set file title may imply Rev.5 while its page header states Rev.4. **Flag SOURCE_REVISION_CONFLICT**, do not resolve based solely on filename.
- `WI-8-2-2-29` includes receiving, raw-material, production, assembly, sterilization and final inspection in one source. Preserve the original whole WI, then link its relevant sections to separate workflows.
- The CVC QC gap-review source describes `F-823-i13`, `F-823-i13-2`, `F-823-i15` as In-Process controls, NOT Finished Goods inspection reports. Distinguish every inspection/qualification/routine check.
- The original `F-823-T*` editable report files were **not found** in ChatGPT Library inventory; use the existing repository catalog as an identity map, not as manufactured form evidence.
- The export does not establish ISO publication currency or licensing; keep edition and source evidence pinned.

**No source files were pushed to GitHub, no Neon SQL was run, and no QC app was modified by this export.**
