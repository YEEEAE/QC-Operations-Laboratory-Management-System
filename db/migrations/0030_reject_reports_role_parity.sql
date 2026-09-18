-- QC-100-FINAL-016 P2-16: Reject Report access parity for the roles whose
-- bundle is not re-asserted by the foundation seeds.
--
-- Migration 0026 granted the Reject Report baseline to EMPLOYEE, SUPERVISOR,
-- MANAGER and ADMIN. Two gaps remained on any environment that does not run the
-- foundation seeds again after that migration:
--
--   * SYSTEM_OWNER — the "explicit single-account full permission bundle" — had
--     no PERM-RREJ-* code at all. Its bundle is written by
--     scripts/access/grant-system-owner.ts, which runs on demand rather than on
--     deploy, so an owner granted before 0026 could read the Reject Reports
--     register but not create anything in it (live finding: /reject-reports/new
--     for the named owner reported that creation was not available).
--   * ADMIN had no PERM-RREJ-ADMIN-CORRECT, although db/seeds/common.ts asserts
--     that grant for ADMIN.
--
-- Both statements are idempotent and grant-only: they never mutate records,
-- approvals or audit history, and they change nothing for EMPLOYEE, SUPERVISOR
-- or MANAGER (administrative recovery stays with ADMIN and the named owner).
--
-- The SYSTEM_OWNER refresh covers the full active permission set, matching the
-- invariant its on-demand grant script enforces, so a deployed owner also picks
-- up any later module that ships new permission codes.

-- 1. Restore the declared SYSTEM_OWNER bundle for an owner role that already
--    exists in this database (a fresh database creates the role in the grant
--    script, which already grants every active permission).
INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code = 'SYSTEM_OWNER'
  AND permission.active = TRUE
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 2. ADMIN parity with the foundation seeds for the Reject Report codes.
INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code = 'ADMIN'
  AND permission.active = TRUE
  AND permission.code IN (
    'PERM-RREJ-VIEW',
    'PERM-RREJ-CREATE',
    'PERM-RREJ-EDIT',
    'PERM-RREJ-CONFIRM-APPROVAL',
    'PERM-RREJ-FINALIZE',
    'PERM-RREJ-VOID',
    'PERM-RREJ-ADMIN-CORRECT'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
