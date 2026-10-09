# SOP-FRS-013 — design attachments

Status: **PROPOSED_NOT_IMPLEMENTED / NOT APPROVED**.
These attachments support `SOP-FRS-013-D0.1-System-Design-and-Page-Map.docx` as visual
review candidates only. They are not implementation, approval, or compliance evidence.

## Live application screenshots (current deployed build, 09 October 2026)

Authenticated read with the `yazeed` session (Administrator, System owner, global scope).
Viewport 1440×1000, CSS scale.

| Figure in SOP | File | Route |
| --- | --- | --- |
| 1 | `live-01-dashboard.png` | `/dashboard` |
| 2 | `live-02-work.png` | `/work` |
| 3 | `live-03-quarantine.png` | `/quarantine` |
| 4 | `live-04-receiving.png` | `/quarantine/receiving` |

These show a real but empty database: counts are real zeros, not failed sources.

## Proposed visual direction — Stitch candidates

Use these only to compare the current build with the proposed direction, and with any
other recreation (for example an Animation Maker recreation of the system documents).
Discard every invented label, protocol, compliance claim and fictional identity before
implementation.

Project: https://stitch.withgoogle.com/projects/17052786721710239621
Project ID: `17052786721710239621` (PRIVATE).
Design-system ID: `57132b5d39734ab0803f0bdaed62b4c1` (generated proposal, not adopted).

| Candidate | Screen ID | Screenshot | Exported code |
| --- | --- | --- | --- |
| Dashboard | `8572d13f2fda47c6889bf53d1d024e0d` | `01-dashboard.png` | `01-dashboard.html` |
| Receiving register | `a62dde5b28594404935fd31c413e4231` | `02-receiving-register.png` | `02-receiving-register.html` |
| Revised approval review | `33b666ee052d4a678b26913cbf479afe` | `03-approval-review.png` | `03-approval-review.html` |

## Evidence and boundaries

- Direct JSON-RPC MCP initialize and tools discovery returned HTTP 200. Bearer authentication returned HTTP 401 on create_project; X-Goog-Api-Key succeeded. No configuration changes or dependencies installed. Credentials were used only as authentication to the official Stitch endpoint, never included in prompts or exported files.
- New private project and three initial screens generated successfully. Approval review was revised through Stitch after visual inspection exposed invented scientific thresholds and compliance/signature claims. Initial approval screen `d08a50b1beb84471ad570c3fb47f2ad0` is superseded and **must not be used**; it remains in the remote project history. Its local exported files were replaced by the revised candidate.
- Each selected screen was retrieved directly with get_screen (HTTP 200); list_screens did not return the generated screens during this run.
- Six downloaded assets verified using HTTP MIME and PNG magic bytes / HTML document structure; PNG dimensions are 2560×2774, 2560×2840 and 2560×3400. SHA-256 values and byte counts are in `asset-manifest.json`. Screenshots were visually inspected.
- Only generic synthetic requirements were transmitted. No application source, controlled documents, real records or user credentials were uploaded as content.
- All screens visibly identify synthetic data and proposed/not implemented status. PASS and RELEASED are visually separated; dashboard unavailable metric has no number. Revised approval candidate shows no supplied signature evidence and requires fresh reauthentication without a bypass control.

## Outstanding visual/content findings — NOT accepted for implementation

Stitch added unsupported copy despite the constraints. Disclaimers do not validate it:

1. Dashboard: invented protocol `QOP-8802`, CFR/ISO compliance labels, “100% audited”, fictional named auditors, sampling details, emergency-hold controls and clipped upper navigation. These are generated fictional content, not real people, approved policy, operational capability or compliance evidence.
2. Register: invented `SOP-709`, ISO/cGMP labels, emergency-hold control, and noncanonical state vocabulary (`QUARANTINED`, `HOLD_PENDING_INVESTIGATION`, `REJECT` under inspection result). Map state labels only from approved application contracts before implementation. “Authorized for production” is synthetic copy, not actual authorization.
3. Revised approval: residual “regulatory policy” and “statutory release” wording is unsupported. Report approval must not be presented as release authorization. Stage progression and identity are illustrative only, not executed or verified.
4. Exported HTML is untrusted visual-reference code with external frontend dependencies; it was not executed or integrated into the application. Keyboard, responsive, runtime, security, WCAG, scientific acceptance, signatures and UAT are **NOT VERIFIED**.

Creation/download evidence: PASS. Full prompt/content fidelity: PARTIAL. Application implementation: NOT RUN. Approval/effectivity/release: NOT RECORDED. No SOP, Mind, application or Git configuration changes; no commit/push/deploy.

Stitch suggested further review of controls/hover states, audit-detail design, reauthentication-dialog design, evidence-summary layout, workflow-step styling and navigation. These suggestions were not executed beyond the documented approval-screen correction.
