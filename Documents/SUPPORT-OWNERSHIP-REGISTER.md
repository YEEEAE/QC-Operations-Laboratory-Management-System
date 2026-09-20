# Support ownership register & dependency list

**Task:** QC-100-FINAL-020 — support ownership register and dependency list
**Status:** CURRENT for the candidate working tree.

> This register records **functional ownership** for operational support, not
> named individuals. No real person is assigned without an explicit
> organizational agreement; every gap is recorded as `UNRESOLVED` with the
> decision owner that must close it. It does not create new policy, permissions,
> or authority.

## 1. Support tiers

| Tier | Function | Scope | Canonical authority |
| --- | --- | --- | --- |
| L1 — Operational | Employee / Supervisor | Task blockers, returned work, data entry, evidence, template/instruction gaps | `PERM-TASK-*`, domain create/edit/submit permissions |
| L2 — Review & quality | Supervisor → QCM (Manager) | Review decisions, HOLD/FAIL/exception, CAPA/NCR escalation, final approval | `PERM-INSP/LAB-*`, `PERM-APR-*`, `PERM-CAPA-*` |
| L3 — Administration | Admin | Accounts, roles/scopes, configuration, backups/restore drills, technical incidents | `PERM-IDN-*`, `PERM-ADM-*`, `PERM-BKP-*` |
| L4 — Platform & owner | Named system owner (`yazeed`) | System health, control center, production recovery authorization, protected owner grants | `YAZEED_ONLY` routes, `isNamedSystemOwner` |

Route reachability and authority are defined by
`Documents/ROLE-OPERATING-GUIDES.md` §1–§7 and the canonical documents it cites.

## 2. Ownership register

| Support area | Functional owner | Authority source | Naming status | Escalation target |
| --- | --- | --- | --- | --- |
| Task and workflow blockers (L1) | Supervisor role | `PERM-TASK-*` | `UNRESOLVED` — no named on-call | QCM |
| Receiving / Triage exception (L1→L2) | Supervisor role | `PERM-QUAR-*`, `PERM-INSP-*` | `UNRESOLVED` — no named on-call | QCM |
| Inspection / laboratory final decision (L2) | QCM (role `MANAGER`) | `PERM-APR-APPROVE`, `PERM-ESIG-SIGN` | `UNRESOLVED` — no named QCM on record | Named system owner |
| CAPA closure (L2) | Supervisor with `PERM-CAPA-CLOSE` | P-04 ceremony | `UNRESOLVED` | QCM |
| Member administration / access (L3) | Admin role | `PERM-IDN-*`, `PERM-ADM-*` | `UNRESOLVED` — no named service-desk owner | Named system owner |
| System health / readiness (L4) | Named system owner | `YAZEED_ONLY` `/system/health` | Named identity `yazeed` (canonical owner) | — |
| Backup / restore drill (L3) | Admin role | `PERM-BKP-VIEW/CREATE/VERIFY/RESTORE-DRILL` | `UNRESOLVED` | Named system owner |
| Production restore authorization (L4) | Named system owner | `PERM-BKP-RESTORE-PRODUCTION` + explicit authorization | Named identity `yazeed`; separate authorization required | — |
| Security / authentication incident (L3→L4) | Admin role → named owner | `PERM-ADM-SECURITY-CONFIG` | `UNRESOLVED` — incident commander not named | Named system owner |
| Data incident / privacy request | `UNRESOLVED` | privacy approvals still open (QC-100-FINAL-010) | `UNRESOLVED` — owner decision via 013/026 | Named system owner |
| AI advisory misuse / provider issue | Admin role | `PERM-AI-ADMIN` | `UNRESOLVED` — external-processing approval open | Named system owner |
| User-facing help content owner | This task (020) then successor | — | `UNRESOLVED` — no standing documentation owner agreed | Named system owner |

**Naming rule:** replacing an `UNRESOLVED` row with a person requires an
explicit organizational agreement; it must not be inferred from a login
identity, an audit record, or a seeded fixture.

## 3. Service-interruption contact path

Because no on-call rotation is formally agreed, the escalation path is
functional and documented, not contact-based:

1. L1 operational → Supervisor (operational coordination).
2. L2 review/quality → QCM; platform/technical faults are handed to Admin.
3. L3 technical → Admin; production-impacting or security incidents → named
   system owner.
4. L4 owner → decides production recovery authorization and platform posture.

Do not publish internal secrets, connection strings, raw diagnostics, session
data, or credential values through any support channel. The owner surfaces are
sanitized for exactly this reason.

## 4. Dependency list

External dependencies that must be closed by their owner before this guide can
be treated as fully verified. None of these may be converted into a passing
result by documentation alone.

| ID | Dependency | Owner (task) | Blocks | Status |
| --- | --- | --- | --- | --- |
| DEP-020-01 | Authenticated browser walkthrough of `/help` and every cited route, including denied/read-only states | 003 (E2E) | Guide "verified against current UI" claim | `NOT RUN` |
| DEP-020-02 | Accessibility review of `/help` (keyboard, screen reader, 200% zoom, forced colors) | 006 / 040 | Accessibility claim | `NOT RUN` |
| DEP-020-03 | Regression verification of route/navigation/register contracts after the new route | 002 / 027 | Release regression credit | pending this task's evidence |
| DEP-020-04 | Human UAT acceptance (real participants, frozen candidate) | 004 | UAT `UNVERIFIED` gate | `BLOCKED` (external human evidence) |
| DEP-020-05 | Production migration gate + credential rotation | operator / 015 | Any production claim | `BLOCKED` |
| DEP-020-06 | Trusted CI/security/E2E evidence ingestion | 013 / provider-ingestion (F-013-2) | Release gate evidence | `BLOCKED` |
| DEP-020-07 | Inspection result source decision (no official source; F-013-1) | QC/QMS then 013 | Inspection chain completion guidance | `OPEN` |
| DEP-020-08 | Lab reject decision authority source (PD-38) | 013 / 026 | Reject guidance completeness | `OPEN` |
| DEP-020-09 | UAT signer scope decision (TEAM manager vs GLOBAL) | 013 | Human sign-off guidance | `OPEN` |
| DEP-020-10 | Organizational naming of L1–L3 support owners | 013 / 026 | Every `UNRESOLVED` ownership row | `OPEN` |
| DEP-020-11 | Organization master-data scope (BD-019/BD-020, org scope §16) | 013 / 026 | Starting-data and operating setup guidance | `OPEN` |
| DEP-020-12 | Arabic/RTL product-scope decision | 013 (policy) / 006 (mirror) | Localized guide claim | `OPEN` |

## 5. Evidence handoff

- Requirement → implementation → evidence → dependency mapping is recorded in
  `audit/2026-09-20/QC-100-FINAL-020-role-operating-support-guides.md`.
- Regression/E2E/accessibility owners consume that record; final reconciliation
  is owned by 012.
- `PASS ≠ RELEASED`: a passing route/link contract does not release the guide,
  the build, or the product.
