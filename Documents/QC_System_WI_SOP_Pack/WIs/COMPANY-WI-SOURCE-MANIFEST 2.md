# Company WI sources — received controlled copies

> **Status: `RECEIVED_CONTROLLED_COPY_NOT_QMS_VERIFIED`** — `approved: false`, `effective: false`.
> These are scanned company-controlled WI copies (Saudi Mais Co. for Medical Products) received from
> the owner. Original controlled copies were **not** altered. Adding them does **not** assert QMS
> approval or effectivity: **RD-019 / PD-13 / PD-32 remain OPEN**, and `PERM-DOC-APPROVE` stays
> `DENY UNTIL EXPLICITLY APPROVED`. Machine-readable manifest: `COMPANY-WI-SOURCE-MANIFEST.json`.

## Provenance
- Source scans: `audit/Wi.pdf` (18 pages), `audit/Wi2.pdf` (22 pages) — single scanned JPEG per page, 4284×5712.
- Page images are compressed 150-dpi renderings (`company-controlled-pages/<CODE>/`); per-product PDFs are built
  from those renderings. SHA-256 of every rendering and every PDF is bound in the JSON manifest.

## Documents

| # | Doc code | Rev | Date (printed) | Title (as printed) | Pages present | Missing | Per-product PDF |
|---|---|---|---|---|---|---|---|
| 1 | `WI-8-2-2-53` | 0 | 17.10.2020 | Production & Test Procedure for Semi Auto Biopsy Needle | 4/4 | — | `WI-8-2-2-53_..._Rev0.pdf` |
| 2 | `WI-8-2-2-16` | 8 | 19.11.2018 | Production & Test Procedure for Ureteric Catheter | 3/4 | **1** (PENDING) | `WI-8-2-2-16_..._Rev8.pdf` |
| 3 | `WI-8-2-2-06-1` | 00 | 05.12.2023 | Inspection Procedure for Endobronchial Tube (Chapter #04) | 11/11 | — | `WI-8-2-2-06-1_..._Rev00.pdf` |
| 4 | `WI-8-2-2-21` | 5 | 01.09.2023 | Production & Test Procedure for Sterile Blood Lines | 9/9 | — | `WI-8-2-2-21_..._Rev5.pdf` |
| 5 | `WI-8-2-2-5` | 7 | 01.09.2023 | Production & Test Procedure for Sterile Syringes (Chapter #04) | 4/5 | **3** (PENDING) | `WI-8-2-2-5_..._Rev7.pdf` |
| 6 | `WI-8-2-2-64` | 3 | 10.12.2022 | Production & Test Procedure for Hypodermic Needle | 4/4 | — | `WI-8-2-2-64_..._Rev3.pdf` |
| 7 | `WI-8-2-2-27` | 7 | 29.08.2020 | Production & Test Procedure for Guidel Air Way | 5/5 | — | `WI-8-2-2-27_..._Rev7.pdf` |

**Totals:** 7 documents, 40 page images, ~16.7 MB added.

## Open items
- **Missing pages supplied later by owner:** `WI-8-2-2-16` page 1/4 and `WI-8-2-2-5` page 3/5. Re-run the
  extractor when provided; the manifest marks them `missingPages`.
- **QMS verification required:** who approved, scope, SoD, effective date and signature mapping for WI/SOP.
- The two original scans remain in `audit/` and are **not** tracked in Git (large); the per-product PDFs and
  page images are the tracked additions.

## Notes on printed fields
- `preparedByPrinted` / `approvedByPrinted` in the JSON are transcribed from the printed footers where legible
  and are **not** identity-verified (e.g. QCM "Mr. Javeed Gafoor"; QAM "Mr. Salman Rashid"). For
  `WI-8-2-2-64` and `WI-8-2-2-27` these fields were not transcribed (null).
- Titles/footers are recorded exactly as printed; `Guidel Air Way` spelling is kept as printed (possibly
  "Guedel Airway").
