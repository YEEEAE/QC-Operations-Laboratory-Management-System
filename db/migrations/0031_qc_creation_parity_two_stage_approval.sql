-- QC-100-FINAL-004: QC data-entry creation parity + two-stage approval chain.
--
-- Owner-approved policy (2026-09-19):
--   * QC data-entry users (EMPLOYEE: QC 01 / QC 02 / QC 03) create EVERY
--     report/form type (items 2–4). No approval/sign grant is added (item 5).
--   * Inspection and laboratory approval become two-stage (item 6):
--       UNDER_REVIEW --(Supervisor stage approval)--> PENDING_QCM_APPROVAL
--       PENDING_QCM_APPROVAL --(QCM = MANAGER, or named owner, final approval
--       with the binding e-signature)--> APPROVED (locked)
--     The Supervisor stage approval is a workflow event, not a formal
--     e-signature (owner decision, 2026-09-19).
--   * SUPERVISOR loses the final-approval ceremony grant PERM-APR-APPROVE
--     (held by MANAGER / the named owner only).
--
-- All statements are idempotent. Grant inserts never mutate records,
-- approvals or audit history.

-- 1. EMPLOYEE creation/data-entry parity (grant-only).
INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code = 'EMPLOYEE'
  AND permission.active = TRUE
  AND permission.code IN (
    'PERM-INSP-CREATE',
    'PERM-INSP-PRINT',
    'PERM-INSP-EXPORT',
    'PERM-LAB-CREATE',
    'PERM-LAB-PRINT',
    'PERM-LAB-EXPORT',
    'PERM-QUAR-VIEW',
    'PERM-QUAR-CREATE',
    'PERM-QUAR-EDIT',
    'PERM-EQP-VIEW',
    'PERM-CAL-VIEW',
    'PERM-RPT-VIEW',
    'PERM-RPT-RUN',
    'PERM-RPT-EXPORT-CSV',
    'PERM-FIND-VIEW',
    'PERM-FIND-CREATE',
    'PERM-FIND-EDIT',
    'PERM-FIND-SUBMIT',
    'PERM-NCR-VIEW',
    'PERM-NCR-CREATE',
    'PERM-NCR-EDIT',
    'PERM-NCR-SUBMIT'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 2. SUPERVISOR / MANAGER review·return·reject grants (pre-existing defect):
--    the review/return/reject use cases require the domain permission AND the
--    matching approval-module permission, but neither grant existed on those
--    roles, so "Return for Correction" could never succeed for any account
--    except the named owner. Grants only; the LAB reject policy gate stays
--    fail-closed until its policy is approved.
INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code IN ('SUPERVISOR', 'MANAGER')
  AND permission.active = TRUE
  AND permission.code IN (
    'PERM-INSP-REVIEW',
    'PERM-INSP-RETURN',
    'PERM-INSP-REJECT',
    'PERM-APR-REVIEW',
    'PERM-APR-RETURN',
    'PERM-APR-REJECT',
    'PERM-LAB-REVIEW',
    'PERM-LAB-RETURN',
    'PERM-LAB-REJECT'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. SUPERVISOR loses the final-approval ceremony grant (two-stage chain).
DELETE FROM qc.role_permissions grant_row
USING qc.roles role, qc.permissions permission
WHERE grant_row.role_id = role.id
  AND grant_row.permission_id = permission.id
  AND role.code = 'SUPERVISOR'
  AND permission.code = 'PERM-APR-APPROVE';

-- 4. New intermediate state for the two-stage approval chain.
ALTER TABLE qc.inspection_reports
  DROP CONSTRAINT inspection_reports_state_check,
  ADD CONSTRAINT inspection_reports_state_check
    CHECK (state IN (
      'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_QCM_APPROVAL',
      'RETURNED', 'APPROVED', 'REJECTED', 'VOID'
    ));

ALTER TABLE qc.lab_tests
  DROP CONSTRAINT lab_tests_state_check,
  ADD CONSTRAINT lab_tests_state_check
    CHECK (state IN (
      'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_QCM_APPROVAL',
      'RETURNED', 'APPROVED', 'REJECTED', 'VOID'
    ));
