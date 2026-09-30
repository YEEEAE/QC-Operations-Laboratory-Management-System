# QC-ADP26-06 — Findings → NCR → RCA → CAPA

**State: PARTIAL / NO-GO.** Source read paths are wired, but database-backed route acceptance, interactive accessibility and human acceptance are not complete. This is a new candidate: requested audit SHA `0b1bb21bb3b4eca77862dbba1da8623044e96355` does not match current HEAD `a5ae05df9f7d20f69b13195534afe414525b7c01`; evidence below is rebound to the current candidate and is not evidence for the requested SHA.

## Changed

- Added the missing RCA list/detail read dependency, then server-side scoped NCR, RCA and CAPA registers with state/source filters, human record labels, links among only visible related records, and context-specific next permitted read step.
- NCR and RCA detail pages load related records through existing scoped read use cases. Finding and CAPA detail now distinguish missing records from provider failure. Finding detail no longer points its “next” action to a register as though that were an allowed review transition.
- PD15 Finding→NCR criteria owner (QC), PD16 inspection FAIL consequence owner (QC/inspection), PD17 NCR closure owner (QMS), and PD18 CAPA effectiveness owner (quality-policy owner) are named on relevant surfaces. No transition, creation, effectiveness verdict, or closure was invented. Existing P-04 controlled Supervisor closure exception and its implementation were left unchanged.
- SQL behavior added by this work is SELECT-only using existing repositories and their owner/creator predicates. No schema, migration, constraint, transaction, audit, or outbox changes. Existing P-04 closure mutation is outside this read-path change and remains untested here.

## Candidate and environment evidence

| Item | Result |
|---|---|
| Requested audit SHA | `0b1bb21bb3b4eca77862dbba1da8623044e96355` — differs from candidate |
| Candidate HEAD | `a5ae05df9f7d20f69b13195534afe414525b7c01` |
| Candidate dirty fingerprint | `c62717196cad28cabe05ba54b4524fdc0f33179bb52902e33990c811bbea1b44` (`runId=a274e88d-b85a-4b2e-a2fa-3bde0050ce80`). The fingerprint was captured immediately before writing this evidence field; this documentation-only self-reference update is not included in its digest. Application source and build input were unchanged. |
| Node / pnpm | Build runtime Node `24.20.0`, pnpm `11.25.0` (contract Node `>=24.20.0 <25`). Shell default Node was `22.22.3`. |
| Source migration head | `0042_immutable_lab_equipment_usage` (source identity); applied schema NOT VERIFIED |
| Database | No production database used. PostgreSQL 18 isolated fixture NOT RUN/BLOCKED (no reachable local service/container runtime confirmed). |
| Build identity | `pnpm build` PASS; release `rel-0deb353299ce53a5`, build `local-a5ae05df9f7d`, migration source checksum `d9b2531390b4ee00516b9bea07de0e706c3b78c1b13d2925481b29a4ff5340ab`; `pnpm release:verify` PASS for current HEAD and dirty working tree. |

## Evidence

| Check | State | Evidence / limitation |
|---|---|---|
| Quality + journey unit regression | PASS | `pnpm exec vitest run tests/unit/quality tests/unit/ui/record-journey-contract.test.ts`: 8 files, 27 tests PASS on candidate before final documentation-only changes. |
| Broader quality/journey/design/register contract batch | FAIL | 35/38 PASS; 3 existing inventory/debt ratchets fail: raw hex in `src/ui/components/feedback/OperationalState.astro`, stale ad-hoc date inventory (a pre-existing task detail entry also stale), and documents register absent from bounded-register inventory. No policy/test relaxed. |
| Build and release identity | PASS | `pnpm build`, `pnpm release:identity`, `pnpm release:verify` with Node 24.20.0 after verification run above. Build reports pre-existing Zod comment/logger import/dynamic import and large Three.js chunk warnings. |
| Existing-row positive read with scoped related records | BLOCKED | Requires disposable PostgreSQL 18, bound actor/role/scope and populated fixture. Source wiring only is not runtime proof. |
| Existing-row denied access; unchanged row/audit/outbox | BLOCKED | No populated PG fixture/direct HTTP run. Added code performs no writes, but this is not database denial evidence. |
| Missing 404 vs provider outage 503 | PASS (source branch only) | Invalid/missing/out-of-scope primary record returns 404; provider read errors use 503 on RCA/NCR/Finding/CAPA detail. Browser/direct HTTP status NOT VERIFIED. |
| Concurrent mutation, rollback, replay | N/A for added reads; BLOCKED for existing writes | New paths are SELECT-only and define no transaction/idempotency key. Existing P-04 CAPA close requires its own write-path evidence and was not exercised. |
| Browser at 320/375/768/1440 CSS px and 200% | BLOCKED | Local preview bind failed with `EPERM` on `127.0.0.1:4321`; the unrelated cached browser page was closed without interaction. |
| Keyboard / assistive technology / human UAT | NOT VERIFIED | Not run; no human decision or UAT signature claimed. |

## Route handoff

Routes: `/quality`, `/quality/findings`, `/quality/findings/new`, `/quality/findings/[findingId]`, `/quality/ncr`, `/quality/ncr/new`, `/quality/ncr/[ncrId]`, `/quality/rca`, `/quality/rca/[rcaId]`, `/quality/capa`, `/quality/capa/new`, `/quality/capa/[capaId]`.

Source paths changed: NCR list/detail/new; RCA list/detail (including the new read dependency); CAPA list/detail/new; Finding list/detail. `/quality` and Findings new are not changed. Source implementation does not close the page cards: populated-record route proof, authorization denial proof, visual/keyboard/AT acceptance and owner decisions remain outstanding for the applicable routes. Do not claim a completed 12-route denominator from source inspection alone.

## Decisions and next authorized steps

- PD15: QC criteria owner must decide Finding→NCR eligibility/threshold; keep automated creation denied pending decision.
- PD16: QC/inspection policy owner must decide inspection FAIL consequence; do not create NCR automatically.
- PD17: QMS owner must decide NCR closure authority/workflow; unauthorized close remains denied.
- PD18: quality-policy owner must decide CAPA effectiveness criteria; do not infer effectiveness. Reconcile any absolute closure rule with approved P-04 before changing policy.
- Next evidence step: run isolated PostgreSQL 18 with bound role/state/scope fixtures; prove scoped positive read and existing-row denial leaves row/audit/outbox unchanged, then direct HTTP 404/503 and browser/keyboard/responsive checks on this exact candidate. Human owners supply decisions and UAT; no agent signature substitutes for them.
