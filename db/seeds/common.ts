import { createHash } from 'node:crypto';
import { Pool } from 'pg';

export const FOUNDATION_ROLE_CODES = ['EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'ADMIN'] as const;

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

export function assertNonProductionSeedEnvironment(
  kind: 'development' | 'test',
  env = process.env,
): void {
  if (
    env.NODE_ENV !== kind ||
    env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true'
  ) {
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
