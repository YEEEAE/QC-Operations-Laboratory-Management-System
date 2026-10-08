# Owner-supplied role input — QC-LAUNCH-002

**Received:** 2026-10-09 (Asia/Riyadh; turn date only, exact message time is not recorded here).  
**Source:** User messages in the active Codex task and the user-provided untracked `صلاحيات.md` as observed at the initial review.  
**Evidence status:** USER-SUPPLIED INPUT. This transcription is not an electronic signature, a controlled document revision, or an independent QMS/Security/Release approval.

## Role/page/action direction

- **yazeed:** owner account with Admin features and Admin page visibility; may execute and approve any action in the system.
- **QCM:** sees all pages except Admin pages; may create reports and perform final approval.
- **Supervisor:** sees all pages except Admin and owner-specific pages; may perform initial approval before QCM.
- **QC / QC 2 / QC 3 / QC 4:** Employee personas; may create reports and perform ordinary work, but do not perform preliminary or final approvals; do not see Admin pages.

The initial role-direction input included a preference for a visual report approval mark without a handwritten signature. At the latest packet freeze, the untracked `صلاحيات.md` has SHA-256 `f9d92c4973524578b98fdfc78c0957228ce4293800ae0accee7ffe41ee3fcc08` and matches the global e-signature policy attachment; the initial 47-line role text is not present in that current file. The conversation transcription above preserves the role direction separately. A visual mark remains presentation only and cannot replace persisted e-signature evidence.

## Clarification about yazeed overrides

When asked whether yazeed's override includes electronic-signature, scientific-source, state/version and audit controls, the user answered:

> يشمل تجاوز جميع الضوابط، بما فيها المصدر العلمي والتوقيع وسجل التدقيق

This explicitly requests bypass of those controls, including e-signatures, scientific-source checks and audit. The active QC-LAUNCH-002 prompt requires the candidate to preserve those controls and requires controlled human decision evidence. Therefore the direction is recorded but is **NOT EFFECTIVE for implementation or scoring** until the required QMS/Security/Release disposition exists. No source, code, data, signature, permission, history or production resource was changed in response.

The request to bypass yazeed's electronic signature conflicts with the separate report-marker requirement and the current account-bound e-signature decision. A visible mark alone is not treated as approval evidence.

## Later user-supplied global signature policy

A later attachment, “GLOBAL ELECTRONIC SIGNATURE & APPROVAL POLICY”, was received 2026-10-09; SHA-256 `f9d92c4973524578b98fdfc78c0957228ce4293800ae0accee7ffe41ee3fcc08`. It is described by its author as an owner-approved functional requirement, but provides no controlled revision, effective date, or system e-signature record. Its newer direction requires explicit, justified, recorded owner overrides and approval signatures. This supersedes the earlier request for a *silent* yazeed bypass of signature/audit controls as the latest functional direction. It does not establish a controlled QMS permission or effective policy.

The new text does not specify a scientific-source exception or a complete action-specific override boundary. The earlier request that yazeed bypass the scientific source therefore remains unresolved and is not implemented. See `global-esign-policy-reconciliation.md` for the requirement-to-source crosswalk and gaps.
