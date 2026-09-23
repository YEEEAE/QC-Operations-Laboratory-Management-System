# Accessibility, responsive, and transition recovery audit

**Date:** 2026-09-24  
**State:** PARTIAL — source change and focused contract checks only. This is not a WCAG conformance claim.

## Scope and source findings

The requested matrix covers authenticated core journeys at 320, 375, 414, 768, 1024, and 1440 CSS px, 200% browser zoom, text spacing, keyboard-only operation, VoiceOver/NVDA, axe, no-JavaScript mutation recovery, stale conflicts, and consequential-action previews.

At the start of this work, `tests/unit/ui/mutation-safety-contract.test.ts` listed nine transition/control surfaces without POST baselines. `src/pages/quarantine/receiving/[receivingId].astro` had already left that list. This change adds a true server POST path to `src/pages/documents/[documentId]/versions/new.astro`; the ratchet now lists eight remaining surfaces: admin role edit, change-request review, document-version submit, laboratory execute, laboratory review, CAPA close, daily reject-report, and document-version create (the latter was removed from the open list by this change).

The new revision POST re-runs the server action with the authenticated actor, redirects success with 303, preserves submitted values on failure, associates a validation correction with its field, and describes a stale conflict without resubmission. The existing JavaScript enhancement remains optional and uses a live status region.

## Verification performed

- `astro check`: **PASS**, 963 files, 0 errors, 0 warnings, 88 hints (Node 22.22.3 is outside the project Node 24.20 contract).
- Focused mutation-safety contract: **PASS**, 12/12 after updating the shrinking gap register and adding a server POST/recovery contract.
- `git diff --check`: **PASS**.

## Not verified / blockers

- Authenticated browser runs and real POSTs: **NOT RUN**. No E2E login identity/password are configured in the runtime; no external database was used.
- Viewport/zoom/text-spacing matrix and touch-target/contrast measurements: **NOT RUN** in a rendered authenticated browser.
- axe: **NOT RUN** on this change. Existing axe E2E requires authenticated fixtures.
- Keyboard-only interaction, focus return, VoiceOver, and NVDA: **NOT RUN**. These need manual browser/AT review; automation cannot substitute for human evidence.
- Human usability sessions: **NOT RUN**.
- Delete/VOID/signature impact previews and the other eight JS-only transition surfaces: **NOT CLOSED** by this change.

No WCAG-wide, production-readiness, or human acceptance claim is made. Follow-up requires a disposable authenticated database and named human AT reviewers, then the full requested viewport and action matrix on the same build.
