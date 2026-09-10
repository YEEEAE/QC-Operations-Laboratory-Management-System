import { createHash } from 'node:crypto';
import { Pool } from 'pg';

export const FOUNDATION_ROLE_CODES = ['EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'ADMIN'] as const;
export type FoundationRoleCode = (typeof FOUNDATION_ROLE_CODES)[number];

// Only codes explicitly declared by the approved permission matrix are seeded.
// Deprecated/forbidden pseudo-permissions are intentionally absent.
export const APPROVED_PERMISSION_CODES = [
  'PERM-IDN-VIEW-SELF',
  'PERM-IDN-CHANGE-OWN-PASSWORD',
  'PERM-IDN-MANAGE-USERS',
  'PERM-IDN-ACTIVATE',
  'PERM-IDN-DEACTIVATE',
  'PERM-IDN-RESET-PASSWORD',
  'PERM-IDN-REVOKE-SESSIONS',
  'PERM-ADM-ROLE-VIEW',
  'PERM-ADM-ROLE-ASSIGN',
  'PERM-ADM-PERMISSION-VIEW',
  'PERM-ADM-PERMISSION-ASSIGN',
  'PERM-ADM-SCOPE-ASSIGN',
  'PERM-TASK-VIEW',
  'PERM-TASK-CREATE',
  'PERM-TASK-EDIT',
  'PERM-TASK-ASSIGN',
  'PERM-TASK-REASSIGN',
  'PERM-TASK-COMMENT',
  'PERM-TASK-UPLOAD-EVIDENCE',
  'PERM-TASK-BLOCK',
  'PERM-TASK-COMPLETE',
  'PERM-TASK-REOPEN',
  'PERM-TASK-DELETE-DRAFT',
  'PERM-FIND-VIEW',
  'PERM-FIND-CREATE',
  'PERM-FIND-EDIT',
  'PERM-FIND-SUBMIT',
  'PERM-FIND-REVIEW',
  'PERM-FIND-CLOSE',
  'PERM-FIND-VOID',
  'PERM-NCR-VIEW',
  'PERM-NCR-CREATE',
  'PERM-NCR-EDIT',
  'PERM-NCR-SUBMIT',
  'PERM-NCR-REVIEW',
  'PERM-NCR-APPROVE',
  'PERM-NCR-CLOSE',
  'PERM-NCR-VOID',
  'PERM-RCA-VIEW',
  'PERM-RCA-CREATE',
  'PERM-RCA-EDIT',
  'PERM-RCA-SUBMIT',
  'PERM-RCA-REVIEW',
  'PERM-RCA-APPROVE',
  'PERM-CAPA-VIEW',
  'PERM-CAPA-CREATE',
  'PERM-CAPA-EDIT',
  'PERM-CAPA-ASSIGN-ACTION',
  'PERM-CAPA-COMPLETE-ACTION',
  'PERM-CAPA-VERIFY',
  'PERM-CAPA-APPROVE',
  'PERM-CAPA-CLOSE',
  'PERM-CAPA-VOID',
  'PERM-QUAR-VIEW',
  'PERM-QUAR-CREATE',
  'PERM-QUAR-EDIT',
  'PERM-QUAR-IMPORT',
  'PERM-QUAR-START-INSPECTION',
  'PERM-QUAR-HOLD',
  'PERM-QUAR-RELEASE',
  'PERM-QUAR-CORRECT',
  'PERM-QUAR-ARCHIVE',
  'PERM-INSP-VIEW',
  'PERM-INSP-CREATE',
  'PERM-INSP-EDIT-DRAFT',
  'PERM-INSP-ENTER-RESULT',
  'PERM-INSP-UPLOAD-EVIDENCE',
  'PERM-INSP-SUBMIT',
  'PERM-INSP-WITHDRAW',
  'PERM-INSP-REVIEW',
  'PERM-INSP-RETURN',
  'PERM-INSP-APPROVE',
  'PERM-INSP-REJECT',
  'PERM-INSP-VOID',
  'PERM-INSP-CORRECT',
  'PERM-INSP-PRINT',
  'PERM-INSP-EXPORT',
  'PERM-LAB-VIEW',
  'PERM-LAB-CREATE',
  'PERM-LAB-EDIT-DRAFT',
  'PERM-LAB-ENTER-SAMPLE',
  'PERM-LAB-ENTER-MEASUREMENT',
  'PERM-LAB-BULK-ENTRY',
  'PERM-LAB-UPLOAD-EVIDENCE',
  'PERM-LAB-SUBMIT',
  'PERM-LAB-REVIEW',
  'PERM-LAB-RETURN',
  'PERM-LAB-APPROVE',
  'PERM-LAB-REJECT',
  'PERM-LAB-RETEST',
  'PERM-LAB-AUTHORIZE-RETEST',
  'PERM-LAB-VOID',
  'PERM-LAB-CORRECT',
  'PERM-LAB-PRINT',
  'PERM-LAB-EXPORT',
  'PERM-EQP-VIEW',
  'PERM-EQP-CREATE',
  'PERM-EQP-EDIT',
  'PERM-EQP-CHANGE-STATUS',
  'PERM-EQP-DECOMMISSION',
  'PERM-EQP-UPLOAD-EVIDENCE',
  'PERM-EQP-CORRECT',
  'PERM-EQP-EXPORT',
  'PERM-CAL-VIEW',
  'PERM-CAL-CREATE',
  'PERM-CAL-EDIT-DRAFT',
  'PERM-CAL-SUBMIT',
  'PERM-CAL-REVIEW',
  'PERM-CAL-APPROVE',
  'PERM-CAL-VOID',
  'PERM-CAL-UPLOAD-CERTIFICATE',
  'PERM-MNT-VIEW',
  'PERM-MNT-CREATE',
  'PERM-MNT-EDIT',
  'PERM-MNT-COMPLETE',
  'PERM-MNT-UPLOAD-EVIDENCE',
  'PERM-DOC-VIEW',
  'PERM-DOC-CREATE',
  'PERM-DOC-EDIT-DRAFT',
  'PERM-DOC-SUBMIT',
  'PERM-DOC-REVIEW',
  'PERM-DOC-RETURN',
  'PERM-DOC-APPROVE',
  'PERM-DOC-REJECT',
  'PERM-DOC-REVISE',
  'PERM-DOC-SUPERSEDE',
  'PERM-DOC-ARCHIVE',
  'PERM-DOC-VOID',
  'PERM-DOC-DOWNLOAD',
  'PERM-APR-VIEW-ASSIGNED',
  'PERM-APR-REVIEW',
  'PERM-APR-RETURN',
  'PERM-APR-APPROVE',
  'PERM-APR-REJECT',
  'PERM-APR-VIEW-HISTORY',
  'PERM-ESIG-SIGN',
  'PERM-ESIG-VIEW-OWN',
  'PERM-ESIG-VIEW-AUDIT',
  'PERM-CHG-VIEW',
  'PERM-CHG-CREATE',
  'PERM-CHG-EDIT-DRAFT',
  'PERM-CHG-SUBMIT',
  'PERM-CHG-REVIEW',
  'PERM-CHG-RETURN',
  'PERM-CHG-APPROVE',
  'PERM-CHG-REJECT',
  'PERM-CHG-APPLY',
  'PERM-CHG-CANCEL',
  'PERM-BKP-VIEW',
  'PERM-BKP-CREATE',
  'PERM-BKP-VERIFY',
  'PERM-BKP-DOWNLOAD',
  'PERM-BKP-DELETE',
  'PERM-BKP-RESTORE-DRILL',
  'PERM-BKP-RESTORE-PRODUCTION',
  'PERM-NOT-VIEW-OWN',
  'PERM-NOT-MARK-READ',
  'PERM-NOT-ADMIN',
  'PERM-FILE-UPLOAD',
  'PERM-FILE-VIEW',
  'PERM-FILE-DOWNLOAD',
  'PERM-FILE-REMOVE-DRAFT',
  'PERM-FILE-REMOVE-CONTROLLED',
  'PERM-RPT-VIEW',
  'PERM-RPT-RUN',
  'PERM-RPT-EXPORT',
  'PERM-RPT-EXPORT-CSV',
  'PERM-RPT-EXPORT-XLSX',
  'PERM-RPT-EXPORT-PDF',
  'PERM-RPT-PRINT',
  'PERM-RPT-AUDIT',
  'PERM-RPT-MANAGEMENT',
  'PERM-RPT-ADMIN',
  'PERM-SRCH-USE',
  'PERM-DASH-VIEW',
  'PERM-DASH-MANAGEMENT',
  'PERM-DASH-ADMIN',
  'PERM-ADM-USERS',
  'PERM-ADM-ROLES',
  'PERM-ADM-PERMISSIONS',
  'PERM-ADM-SCOPES',
  'PERM-ADM-REFERENCE-DATA',
  'PERM-ADM-SYSTEM-CONFIG',
  'PERM-ADM-SECURITY-CONFIG',
  'PERM-ADM-TEMPLATES',
  'PERM-ADM-AUDIT-VIEW',
  'PERM-HLTH-VIEW',
  'PERM-HLTH-READINESS',
  'PERM-HLTH-DATABASE',
  'PERM-HLTH-MIGRATIONS',
  'PERM-HLTH-STORAGE',
  'PERM-HLTH-AUDIT',
  'PERM-HLTH-AI',
  'PERM-AI-USE',
  'PERM-AI-SUMMARIZE',
  'PERM-AI-SUGGEST',
  'PERM-AI-DRAFT',
  'PERM-AI-ADMIN',
] as const;
export type ApprovedPermissionCode = (typeof APPROVED_PERMISSION_CODES)[number];

/**
 * Only explicit ALLOW decisions from Documents/PERMISSION-MATRIX.md are
 * bootstrap grants. CONDITIONAL, POLICY, and DENY decisions stay ungranted
 * until the missing scope/policy is approved.
 */
export const FOUNDATION_ROLE_PERMISSIONS: Record<
  FoundationRoleCode,
  readonly ApprovedPermissionCode[]
> = {
  EMPLOYEE: [
    'PERM-IDN-VIEW-SELF',
    'PERM-IDN-CHANGE-OWN-PASSWORD',
    'PERM-INSP-VIEW',
    'PERM-INSP-EDIT-DRAFT',
    'PERM-INSP-ENTER-RESULT',
    'PERM-INSP-UPLOAD-EVIDENCE',
    'PERM-INSP-SUBMIT',
    'PERM-LAB-VIEW',
    'PERM-LAB-EDIT-DRAFT',
    'PERM-LAB-ENTER-SAMPLE',
    'PERM-LAB-ENTER-MEASUREMENT',
    'PERM-LAB-UPLOAD-EVIDENCE',
    'PERM-LAB-SUBMIT',
    'PERM-DOC-VIEW',
    'PERM-DOC-DOWNLOAD',
    'PERM-NOT-VIEW-OWN',
    'PERM-NOT-MARK-READ',
    'PERM-SRCH-USE',
    'PERM-FILE-UPLOAD',
    'PERM-FILE-VIEW',
    'PERM-FILE-DOWNLOAD',
    'PERM-CHG-CREATE',
    'PERM-CHG-EDIT-DRAFT',
    'PERM-CHG-SUBMIT',
    'PERM-ADM-TEMPLATES',
  ],
  SUPERVISOR: [
    'PERM-IDN-VIEW-SELF',
    'PERM-IDN-CHANGE-OWN-PASSWORD',
    'PERM-TASK-CREATE',
    'PERM-TASK-EDIT',
    'PERM-TASK-ASSIGN',
    'PERM-TASK-REASSIGN',
    'PERM-TASK-COMMENT',
    'PERM-TASK-UPLOAD-EVIDENCE',
    'PERM-TASK-BLOCK',
    'PERM-TASK-COMPLETE',
    'PERM-FIND-VIEW',
    'PERM-FIND-CREATE',
    'PERM-FIND-EDIT',
    'PERM-FIND-SUBMIT',
    'PERM-NCR-VIEW',
    'PERM-NCR-CREATE',
    'PERM-NCR-EDIT',
    'PERM-NCR-SUBMIT',
    'PERM-CAPA-VIEW',
    'PERM-CAPA-CREATE',
    'PERM-CAPA-EDIT',
    'PERM-CAPA-COMPLETE-ACTION',
    'PERM-QUAR-VIEW',
    'PERM-QUAR-CREATE',
    'PERM-QUAR-EDIT',
    'PERM-QUAR-START-INSPECTION',
    'PERM-INSP-VIEW',
    'PERM-INSP-CREATE',
    'PERM-INSP-EDIT-DRAFT',
    'PERM-INSP-ENTER-RESULT',
    'PERM-INSP-UPLOAD-EVIDENCE',
    'PERM-INSP-SUBMIT',
    'PERM-INSP-PRINT',
    'PERM-INSP-EXPORT',
    'PERM-INSP-APPROVE',
    'PERM-INSP-VOID',
    'PERM-LAB-VIEW',
    'PERM-LAB-CREATE',
    'PERM-LAB-EDIT-DRAFT',
    'PERM-LAB-ENTER-SAMPLE',
    'PERM-LAB-ENTER-MEASUREMENT',
    'PERM-LAB-UPLOAD-EVIDENCE',
    'PERM-LAB-SUBMIT',
    'PERM-LAB-PRINT',
    'PERM-LAB-EXPORT',
    'PERM-LAB-APPROVE',
    'PERM-LAB-RETEST',
    'PERM-LAB-AUTHORIZE-RETEST',
    'PERM-EQP-VIEW',
    'PERM-EQP-UPLOAD-EVIDENCE',
    'PERM-EQP-EXPORT',
    'PERM-CAL-VIEW',
    'PERM-CAL-UPLOAD-CERTIFICATE',
    'PERM-DOC-VIEW',
    'PERM-DOC-DOWNLOAD',
    'PERM-DOC-APPROVE',
    'PERM-DOC-VOID',
    'PERM-NOT-VIEW-OWN',
    'PERM-NOT-MARK-READ',
    'PERM-SRCH-USE',
    'PERM-FILE-UPLOAD',
    'PERM-FILE-VIEW',
    'PERM-FILE-DOWNLOAD',
    'PERM-CHG-VIEW',
    'PERM-CHG-CREATE',
    'PERM-CHG-EDIT-DRAFT',
    'PERM-CHG-SUBMIT',
    'PERM-ADM-TEMPLATES',
    'PERM-ESIG-SIGN',
    'PERM-APR-APPROVE',
    'PERM-QUAR-RELEASE',
  ],
  MANAGER: [
    'PERM-IDN-VIEW-SELF',
    'PERM-IDN-CHANGE-OWN-PASSWORD',
    'PERM-FIND-VIEW',
    'PERM-FIND-CREATE',
    'PERM-FIND-EDIT',
    'PERM-FIND-SUBMIT',
    'PERM-NCR-VIEW',
    'PERM-NCR-CREATE',
    'PERM-NCR-EDIT',
    'PERM-NCR-SUBMIT',
    'PERM-CAPA-VIEW',
    'PERM-CAPA-CREATE',
    'PERM-CAPA-EDIT',
    'PERM-QUAR-VIEW',
    'PERM-INSP-VIEW',
    'PERM-INSP-PRINT',
    'PERM-INSP-EXPORT',
    'PERM-INSP-APPROVE',
    'PERM-INSP-VOID',
    'PERM-LAB-VIEW',
    'PERM-LAB-PRINT',
    'PERM-LAB-EXPORT',
    'PERM-LAB-APPROVE',
    'PERM-LAB-RETEST',
    'PERM-LAB-AUTHORIZE-RETEST',
    'PERM-EQP-VIEW',
    'PERM-EQP-EXPORT',
    'PERM-CAL-VIEW',
    'PERM-DOC-VIEW',
    'PERM-DOC-DOWNLOAD',
    'PERM-DOC-APPROVE',
    'PERM-DOC-VOID',
    'PERM-NOT-VIEW-OWN',
    'PERM-NOT-MARK-READ',
    'PERM-SRCH-USE',
    'PERM-FILE-VIEW',
    'PERM-FILE-DOWNLOAD',
    'PERM-CHG-VIEW',
    'PERM-CHG-CREATE',
    'PERM-CHG-EDIT-DRAFT',
    'PERM-CHG-SUBMIT',
    'PERM-RPT-RUN',
    'PERM-RPT-EXPORT-CSV',
    'PERM-RPT-EXPORT-XLSX',
    'PERM-RPT-EXPORT-PDF',
    'PERM-ADM-TEMPLATES',
    'PERM-ESIG-SIGN',
    'PERM-APR-APPROVE',
    'PERM-QUAR-RELEASE',
  ],
  ADMIN: [
    'PERM-IDN-VIEW-SELF',
    'PERM-IDN-CHANGE-OWN-PASSWORD',
    'PERM-DASH-ADMIN',
    'PERM-IDN-MANAGE-USERS',
    'PERM-IDN-ACTIVATE',
    'PERM-IDN-DEACTIVATE',
    'PERM-IDN-RESET-PASSWORD',
    'PERM-IDN-REVOKE-SESSIONS',
    'PERM-ADM-ROLE-VIEW',
    'PERM-ADM-ROLE-ASSIGN',
    'PERM-ADM-PERMISSION-VIEW',
    'PERM-ADM-PERMISSION-ASSIGN',
    'PERM-ADM-SCOPE-ASSIGN',
    'PERM-ADM-USERS',
    'PERM-ADM-ROLES',
    'PERM-ADM-PERMISSIONS',
    'PERM-ADM-SCOPES',
    'PERM-ADM-REFERENCE-DATA',
    'PERM-ADM-SYSTEM-CONFIG',
    'PERM-ADM-SECURITY-CONFIG',
    'PERM-ADM-AUDIT-VIEW',
    'PERM-HLTH-VIEW',
    'PERM-HLTH-READINESS',
    'PERM-HLTH-DATABASE',
    'PERM-HLTH-MIGRATIONS',
    'PERM-HLTH-STORAGE',
    'PERM-HLTH-AUDIT',
    'PERM-HLTH-AI',
    'PERM-BKP-VIEW',
    'PERM-BKP-CREATE',
    'PERM-BKP-VERIFY',
    'PERM-BKP-RESTORE-DRILL',
    'PERM-NOT-VIEW-OWN',
    'PERM-NOT-MARK-READ',
    'PERM-NOT-ADMIN',
    'PERM-SRCH-USE',
    'PERM-DOC-VIEW',
    'PERM-DOC-DOWNLOAD',
    'PERM-CHG-VIEW',
    'PERM-CHG-CREATE',
    'PERM-CHG-EDIT-DRAFT',
    'PERM-CHG-SUBMIT',
    'PERM-RPT-ADMIN',
  ],
};

export interface FoundationAuthorizationCounts {
  roleCount: number;
  permissionCount: number;
  rolePermissionCount: number;
}

export function getFoundationAuthorizationCounts(): FoundationAuthorizationCounts {
  return {
    roleCount: FOUNDATION_ROLE_CODES.length,
    permissionCount: APPROVED_PERMISSION_CODES.length,
    rolePermissionCount: Object.values(FOUNDATION_ROLE_PERMISSIONS).reduce(
      (count, permissions) => count + permissions.length,
      0,
    ),
  };
}

export interface FoundationDriftReport {
  counts: FoundationAuthorizationCounts;
  issues: string[];
}

export async function inspectFoundationData(pool: Pool): Promise<FoundationDriftReport> {
  const [roles, permissions, grants] = await Promise.all([
    pool.query<{ code: string; active: boolean; is_system_role: boolean }>(
      'SELECT code, active, is_system_role FROM qc.roles ORDER BY code',
    ),
    pool.query<{ code: string; active: boolean }>(
      'SELECT code, active FROM qc.permissions ORDER BY code',
    ),
    pool.query<{ role_code: string; permission_code: string; is_system_role: boolean }>(
      `SELECT role.code AS role_code, permission.code AS permission_code,
              role.is_system_role AS is_system_role
       FROM qc.role_permissions grant_row
       JOIN qc.roles role ON role.id = grant_row.role_id
       JOIN qc.permissions permission ON permission.id = grant_row.permission_id
       ORDER BY role.code, permission.code`,
    ),
  ]);

  const issues: string[] = [];
  const roleByCode = new Map(roles.rows.map((row) => [row.code, row]));
  const permissionByCode = new Map(permissions.rows.map((row) => [row.code, row]));
  const expectedRoles = new Set<string>(FOUNDATION_ROLE_CODES);
  const expectedPermissions = new Set<string>(APPROVED_PERMISSION_CODES);
  const expectedGrants = new Set<string>();

  for (const roleCode of FOUNDATION_ROLE_CODES) {
    const role = roleByCode.get(roleCode);
    if (!role) issues.push(`missing role: ${roleCode}`);
    else if (!role.active) issues.push(`inactive required role: ${roleCode}`);
    else if (!role.is_system_role) issues.push(`non-system required role: ${roleCode}`);

    for (const permissionCode of FOUNDATION_ROLE_PERMISSIONS[roleCode]) {
      expectedGrants.add(`${roleCode}\u0000${permissionCode}`);
    }
  }

  for (const role of roles.rows) {
    if (role.is_system_role && !expectedRoles.has(role.code)) {
      issues.push(`unexpected system role: ${role.code}`);
    }
  }

  for (const permissionCode of APPROVED_PERMISSION_CODES) {
    const permission = permissionByCode.get(permissionCode);
    if (!permission) issues.push(`missing permission: ${permissionCode}`);
    else if (!permission.active) issues.push(`inactive required permission: ${permissionCode}`);
  }
  for (const permission of permissions.rows) {
    if (!expectedPermissions.has(permission.code)) {
      issues.push(`unexpected permission: ${permission.code}`);
    }
  }

  const actualGrants = new Set<string>();
  for (const grant of grants.rows) {
    const key = `${grant.role_code}\u0000${grant.permission_code}`;
    if (actualGrants.has(key))
      issues.push(`duplicate role_permission: ${grant.role_code}/${grant.permission_code}`);
    actualGrants.add(key);
    if (grant.is_system_role && !expectedGrants.has(key)) {
      issues.push(`forbidden role_permission: ${grant.role_code}/${grant.permission_code}`);
    }
  }
  for (const expectedGrant of expectedGrants) {
    if (!actualGrants.has(expectedGrant)) {
      const [roleCode, permissionCode] = expectedGrant.split('\u0000');
      issues.push(`missing role_permission: ${roleCode}/${permissionCode}`);
    }
  }

  return {
    counts: {
      roleCount: roles.rows.filter((row) => row.is_system_role).length,
      permissionCount: permissions.rows.length,
      rolePermissionCount: grants.rows.length,
    },
    issues,
  };
}

export function assertFoundationAuthorizationReady(report: FoundationDriftReport): void {
  if (report.issues.length > 0) {
    throw new Error(`Foundation authorization drift detected:\n- ${report.issues.join('\n- ')}`);
  }
}

export function assertNonProductionSeedEnvironment(
  kind: 'development' | 'test',
  env = process.env,
): void {
  if (env.NODE_ENV !== kind || env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true') {
    throw new Error(`Refusing ${kind} seed: explicit non-production guard is required.`);
  }
}

export async function seedFoundationData(pool: Pool): Promise<void> {
  const client = await pool.connect();
  await client.query('BEGIN');
  try {
    for (const code of FOUNDATION_ROLE_CODES) {
      await client.query(
        `INSERT INTO qc.roles (code, name, is_system_role, active)
         VALUES ($1, $2, TRUE, TRUE)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, is_system_role = TRUE, active = TRUE`,
        [code, code[0] + code.slice(1).toLowerCase()],
      );
    }
    for (const code of APPROVED_PERMISSION_CODES) {
      const [, domain, ...actionParts] = code.split('-');
      await client.query(
        `INSERT INTO qc.permissions (code, domain, action, risk_level, active)
         VALUES ($1, $2, $3, 'UNSPECIFIED', TRUE)
         ON CONFLICT (code) DO UPDATE SET domain = EXCLUDED.domain, action = EXCLUDED.action, active = TRUE`,
        [code, domain, actionParts.join('-')],
      );
    }
    for (const roleCode of FOUNDATION_ROLE_CODES) {
      const permissionCodes = FOUNDATION_ROLE_PERMISSIONS[roleCode];
      for (const permissionCode of permissionCodes) {
        await client.query(
          `INSERT INTO qc.role_permissions (role_id, permission_id)
           SELECT role.id, permission.id
           FROM qc.roles role
           CROSS JOIN qc.permissions permission
           WHERE role.code = $1 AND permission.code = $2
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [roleCode, permissionCode],
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function runSeed(kind: 'development' | 'test'): Promise<void> {
  assertNonProductionSeedEnvironment(kind);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for seeds.');
  const pool = new Pool({ connectionString: databaseUrl, application_name: `qc-${kind}-seed` });
  try {
    await seedFoundationData(pool);
  } finally {
    await pool.end();
  }
}

export function stableSeedUuid(label: string): string {
  const hex = createHash('sha256').update(`qc-seed:${label}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
}
