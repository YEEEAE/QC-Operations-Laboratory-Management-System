-- Owner decision 2026-09-23: equal QC data-entry creation across every
-- registered report/form surface, with no workflow approval/closure authority.
-- Grant/revoke role permissions only; existing records and audit history stay
-- untouched. `SYSTEM_OWNER` continues to receive all active grants via 0030.

INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code = 'EMPLOYEE'
  AND permission.active = TRUE
  AND permission.code IN (
    'PERM-TASK-VIEW',
    'PERM-TASK-CREATE',
    'PERM-TASK-EDIT',
    'PERM-TASK-COMMENT',
    'PERM-TASK-UPLOAD-EVIDENCE',
    'PERM-CAPA-VIEW',
    'PERM-CAPA-CREATE',
    'PERM-CAPA-EDIT',
    'PERM-DOC-CREATE',
    'PERM-DOC-EDIT-DRAFT',
    'PERM-DOC-SUBMIT',
    'PERM-EQP-CREATE',
    'PERM-CAL-CREATE',
    'PERM-CAL-EDIT-DRAFT',
    'PERM-CAL-SUBMIT',
    'PERM-CAL-UPLOAD-CERTIFICATE',
    'PERM-MNT-VIEW',
    'PERM-MNT-CREATE',
    'PERM-MNT-EDIT',
    'PERM-MNT-UPLOAD-EVIDENCE',
    'PERM-QUAR-START-INSPECTION'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Stage-1 authority belongs to Supervisor under the owner decision.
INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code = 'SUPERVISOR'
  AND permission.active = TRUE
  AND permission.code IN ('PERM-INSP-APPROVE', 'PERM-LAB-APPROVE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

DELETE FROM qc.role_permissions grant_row
USING qc.roles role, qc.permissions permission
WHERE grant_row.role_id = role.id
  AND grant_row.permission_id = permission.id
  AND role.code = 'EMPLOYEE'
  AND permission.code IN (
    'PERM-RREJ-CONFIRM-APPROVAL',
    'PERM-RREJ-FINALIZE',
    'PERM-RREJ-VOID'
  );

-- QCM is the final stage only. First-stage inspection/laboratory approval is
-- reserved for SUPERVISOR; the named system owner retains explicit authority.
DELETE FROM qc.role_permissions grant_row
USING qc.roles role, qc.permissions permission
WHERE grant_row.role_id = role.id
  AND grant_row.permission_id = permission.id
  AND role.code = 'MANAGER'
  AND permission.code IN ('PERM-INSP-APPROVE', 'PERM-LAB-APPROVE');
