# QC-100-CLOSURE-06 — Executable UAT Kit

## MASTER HEADER

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Target: `main`
- Kit HEAD: `1d0ef756e4e3ab76af5a1af8e5aadaedc3ccc7c5` (recompute with `git rev-parse HEAD` at execution; UAT evidence binds to the executed SHA, never to this line)
- Kit date: `2026-09-08`
- Normative bases: `Documents/UAT-ACCEPTANCE-PLAN.md` (foundation, §§ cited below), `audit/100-percent/USABILITY-STUDY-PACKAGE.md` (study protocol U-01–U-11)
- Status: **UAT EXECUTION REQUIRED — zero participant sessions have been executed in this session. Nothing below is a result.**

## 1. What this kit is

An operator-executable package. The facilitator runs real sessions with real
people on the staging/UAT environment, fills `uat/UAT-SESSION-RECORD.csv`,
logs failures in `uat/UAT-DEFECT-BACKLOG.csv`, updates
`uat/UAT-COVERAGE-MATRIX.csv`, and validates with
`uat/validate-uat-records.mjs`. No row in those files may be pre-filled,
invented, or copied from prior audits.

## 2. Entry criteria (UAT plan §67 — all must hold before session 1)

```text
[ ] Release candidate identified (Release ID + Git SHA + Build/Artifact ID + migration head)
[ ] UAT environment deployed from the exact candidate (staging/UAT, Asia/Riyadh clock)
[ ] Seeded synthetic accounts for §3 personas exist; no production credentials used
[ ] Synthetic records exist in draft, HOLD, approved, superseded, and audit-history states
[ ] No task requires an unresolved scientific limit or policy decision (else mark BLOCKED per §8)
[ ] Recorder consent + data-retention wording approved; no participant names in the dataset
[ ] Observer stop conditions defined (accidental production access, scope disclosure, attempted real signature)
```

## 3. Personas (UAT plan §10 — operator fills credentials at execution)

| Persona ID | Foundation role | Seeded account | Scope | Must be denied (negative control) |
|---|---|---|---|---|
| P-EMP | QC Employee | _(operator fills)_ | own team only | other teams' records, approvals, release |
| P-INSP | QC Inspector | _(operator fills)_ | assigned inspection queue | release authority, other-scope records |
| P-LAB | Laboratory User | _(operator fills)_ | assigned lab tests + linked equipment | approval decisions, release |
| P-SUP | Supervisor | _(operator fills)_ | team review queue | own-authored item approval (SoD) |
| P-MGR | Manager | _(operator fills)_ | wider review + reports | release without approved policy, SoD breach |
| P-ADM | Administrator | _(operator fills)_ | users/scopes/master data | business approval without explicit permission |
| P-AUD | Auditor | _(operator fills)_ | read + export permitted scope | any mutation, privileged diagnostics |

Never use a superuser persona that makes every scenario pass (UAT plan §10).

## 4. Functional task scripts (positive)

Read the **participant wording** verbatim. Never name buttons or routes.
**Facilitator-only** lines use real routes verified in `src/pages/**`.

### T-UAT-01 — Login, reach assigned work (all roles; maps U-01/U-02)

- Participant: "سجّل دخول بحساب الاختبار المسلّم لك وافتح الشغل المسند إليك."
- Facilitator-only: start at `/login`; expect landing on role queue (`/tasks` or `/dashboard`); no other scope visible.
- Success: authenticated as the right persona, assigned view reached, no cross-scope leak.
- Capture: all §7 fields; time starts at login submit, ends when assigned record list is visible.

### T-UAT-02 — Find assigned work, open correct record (P-EMP, P-INSP, P-LAB)

- Participant: "دور على المهمة المسندة لك اليوم وافتح سجلها الصحيح."
- Facilitator-only: `/tasks` → `/tasks/[taskId]`; seeded task assigned to this persona plus one decoy unassigned task.
- Success: correct record opened; decoy untouched.

### T-UAT-03 — Receiving inspection, stays non-release (P-INSP; Tier 1)

- Participant: "استلم الشحنة الجديدة في قائمتك وخلّص فحص الاستلام عليها بالأدلة المتوفرة."
- Facilitator-only: `/quarantine/receiving` → `/quarantine/receiving/new` (if permitted) → `/quarantine/inspections/[inspectionId]/execute` → submit for review. Controlled WI/SOP version must be displayed.
- Success: inspection completed via approved flow; item NOT in a released state.

### T-UAT-04 — HOLD workflow (P-INSP, P-SUP)

- Participant: "هالصنف عليه ملاحظة حجز — وضّح وش المحجوز ووش الخطوة الجاية."
- Facilitator-only: HOLD record in `/quarantine`; must appear in attention queue, visually distinct, release not implied.
- Success: participant states what is blocked and the required review/correction path.

### T-UAT-05 — PASS but NOT RELEASED (P-INSP, P-SUP, P-MGR; Tier 1)

- Participant: "نتيجة الفحص ناجحة — وش حالة الصنف الحين وهل انفسح استخدامه؟"
- Facilitator-only: record with inspection result PASS in `/quarantine/inspections/[inspectionId]/review`.
- Success: participant confirms release state is separate and NOT released; no automatic release assumed. Then see N-UAT-05.

### T-UAT-06 — Laboratory data entry (P-LAB; Tier 1)

- Participant: "سجّل ملاحظاتك المخبرية على العينة المسندة لك مع كل السياق المطلوب."
- Facilitator-only: `/laboratory/tests/[labTestId]/execute`; raw values + units + equipment/calibration context; criteria source shown; no invented limit.
- Success: raw value preserved, calculated value distinguished, evidence attached where required.

### T-UAT-07 — Finding (P-INSP, P-SUP)

- Participant: "وثّق هالملاحظة اللي شفتها على خط الاستلام واربطها بمصدرها."
- Facilitator-only: `/quality/findings/new` → `/quality/findings/[findingId]`; source/evidence linked; history preserved.

### T-UAT-08 — NCR (P-SUP, P-MGR)

- Participant: "افتح تقرير عدم مطابقة لهالحالة وتابع احتواءه والتحقيق فيه."
- Facilitator-only: `/quality/ncr`; containment/investigation fields; RCA/CAPA linkage; no closure if closure policy unresolved.

### T-UAT-09 — CAPA (P-SUP, P-MGR)

- Participant: "أنشئ إجراء تصحيحي مرتبط بعدم المطابقة وحدّث تقدمه."
- Facilitator-only: `/quality/capa`; owner/due dates; unauthorized closure must be denied.

### T-UAT-10 — Approval decision incl. SoD (P-SUP, P-MGR; Tier 1)

- Participant: "راجع طلب الاعتماد اللي في قائمتك واتخذ القرار المخوّل لك."
- Facilitator-only: `/approvals` → `/approvals/[approvalId]`; exact subject/version visible; SoD: author-own-approval must fail; stale version must block.

### T-UAT-11 — WI/SOP current vs superseded (all roles; Tier 1)

- Participant: "تأكد إنك شغال على أحدث نسخة من إجراء العمل وفرّقها عن النسخة القديمة."
- Facilitator-only: `/documents`; current effective version emphasized; superseded version still readable; normal edit of approved version must not silently mutate.

### T-UAT-12 — Calibration status, ineligible instrument (P-LAB, P-ADM)

- Participant: "اختر الجهاز المناسب لاختبارك وتأكد من حالة معايرته."
- Facilitator-only: `/assets/equipment` + `/assets/calibrations`; participant must identify the seeded overdue/ineligible instrument and refuse it.

### T-UAT-13 — Report/export scope + timestamp (P-SUP, P-MGR, P-AUD)

- Participant: "صدّر التقرير المسموح لك واذكر نطاقه وتاريخه."
- Facilitator-only: `/reports`; same authorized dataset on screen and in export; no out-of-scope rows; formula-injection-safe filename.

### T-UAT-14 — Audit history trace (P-AUD, P-MGR; Tier 1)

- Participant: "تتبع تاريخ هالسجل من إنشائه لين حالته الحالية."
- Facilitator-only: `/audit`; actor/action/entity/time/transition/version present; audit read-only.

## 5. Security / compliance negative scripts (Tier 1 — all must DENY server-side)

| ID | Attempt | Expected |
|---|---|---|
| N-UAT-01 | Unauthorized action: P-EMP attempts an approval/release action via direct action/API call | server-side denial, safe error, audit entry |
| N-UAT-02 | Wrong scope: P-INSP opens a cross-scope record via substituted ID/URL | denial, no data disclosure |
| N-UAT-03 | Wrong state: act on a record in a non-permitted state (e.g. approve a draft) | `wrong-state` denial, state unchanged |
| N-UAT-04 | Direct URL: unauthenticated or ungranted persona opens a protected route | redirect/denial, no content leak |
| N-UAT-05 | PASS ≠ RELEASED: attempt release of a PASS-not-released item without release authority | denial; release state unchanged |
| N-UAT-06 | Stale approval version: decide on version N after record moved to N+1 | `CONFLICT_STALE_VERSION`, no silent overwrite |

Record `requestId`/error reference for every denial; hiding a button is NOT a pass (UAT plan §18).

## 6. Accessibility scripts (Tier 2)

| ID | Script | Pass bar |
|---|---|---|
| A-UAT-01 | Keyboard-only: complete T-UAT-01→T-UAT-02 with keyboard alone | visible focus, sane order, dialog focus trapped/returned, errors announced |
| A-UAT-02 | RTL: repeat T-UAT-01 + T-UAT-10 in Arabic | sidebar/breadcrumbs/forms/tables/dialogs mirrored, mixed IDs readable |
| A-UAT-03 | Zoom 200% + 400% on inspection + lab entry | reflow, no horizontal scroll hiding actions, no clipped controls |
| A-UAT-04 | Reduced motion on landing + background surfaces | motion off, content intact, noWCAG-blocking animation |

## 7. Per-task capture contract (every row of `UAT-SESSION-RECORD.csv`)

`session_id, release_sha, environment, participant_role, task_id, start_time,
end_time, time_on_task_seconds, task_success(yes|no), error_count,
backtracking_count, failed_navigation_count, form_correction_count,
assistance(none|clarification|coaching), wrong_action_attempts,
confidence_1_to_5, seq_1_to_7, observations, severity(BLOCKER|CRITICAL|MAJOR|
MINOR|COSMETIC|NONE), participant_comments, scenario_status(PASS|FAIL|
BLOCKED|NOT EXECUTED|NOT APPLICABLE), task_accept_reject(ACCEPT|REJECT|
BLOCKED|NOT EXECUTED)`

Timestamps in `Asia/Riyadh` ISO-8601. Assistance beyond one neutral
clarification = `coaching` and must be noted.

## 8. After the operator supplies real results

1. Validate: `node audit/100-percent/uat/validate-uat-records.mjs --session <file> --release <SHA>`.
2. Analyze: medians/ranges per task, missing sessions, severity clustering. Never fabricate a success rate.
3. Defect backlog: every FAIL → one row in `UAT-DEFECT-BACKLOG.csv` with severity per UAT plan §64.
4. Fix reproducible software defects on a new commit (new release identity), then re-execute affected scenarios + regression scope (UAT plan §§65–66).
5. R-005 closes only when: all Tier 1 scenarios executed on the exact release candidate, zero unresolved Tier 1 FAIL, negatives pass server-side, accessibility UAT complete, and the UAT summary outcome is ACCEPTED by the designated authority.

## 9. Operator runbook (exact commands)

```bash
git rev-parse HEAD
node --version   # must satisfy >=24.20.0 <25
# 1. fill personas in §3, deploy exact candidate to staging/UAT
# 2. run sessions, append rows to audit/100-percent/uat/UAT-SESSION-RECORD.csv
# 3. validate:
node audit/100-percent/uat/validate-uat-records.mjs --session audit/100-percent/uat/UAT-SESSION-RECORD.csv --release "$(git rev-parse HEAD)"
# 4. log defects in audit/100-percent/uat/UAT-DEFECT-BACKLOG.csv
# 5. update statuses in audit/100-percent/uat/UAT-COVERAGE-MATRIX.csv (leave NOT EXECUTED until evidenced)
```

## 10. Current state

- Sessions executed in this task: **0**.
- Participant evidence: **NONE — UAT EXECUTION REQUIRED.**
- R-005: **remains OPEN.** This kit is preparation + evidence-processing tooling, not evidence.
