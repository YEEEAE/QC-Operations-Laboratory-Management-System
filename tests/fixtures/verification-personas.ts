/**
 * Controlled verification personas for Prompt 13 (C-12).
 *
 * No secrets live in this file. Passwords are injected exclusively through
 * environment variables at seed/run time and never logged, screenshotted,
 * or written to the audit report.
 *
 * - `yazeed` (SYSTEM_OWNER) is an existing operator-owned account and is
 *   NEVER created, reset, or mutated by the verification seed.
 * - The remaining five identities are disposable (`verify-*`) and carry the
 *   minimum documented permissions/scopes for their role.
 * - Disposable records use the `VERIFY-` prefix and expire after 24h or on
 *   explicit cleanup (see scripts/verification/cleanup-verification-fixtures.ts).
 */

export type VerificationPersonaId =
  | 'system-owner'
  | 'supervisor'
  | 'manager'
  | 'admin-only'
  | 'employee'
  | 'least-privileged';

export interface VerificationPersona {
  id: VerificationPersonaId;
  label: string;
  /** Login identity. For system-owner this is the existing `yazeed` account. */
  loginIdentity: string;
  /** Foundation role code assigned to disposable personas. */
  foundationRole: 'SYSTEM_OWNER' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN' | 'EMPLOYEE' | 'NONE';
  /** Environment variable holding the one-time verification password. */
  passwordEnvVar: string;
  /** Scope granted at seed time (least privilege). */
  scope: 'GLOBAL' | 'TEAM' | 'OWN';
  /** Human-readable minimum permission summary (authoritative detail lives in the matrix doc). */
  minimumPermissions: readonly string[];
  /** Whether the seed script may create this account (false for yazeed). */
  seedManaged: boolean;
  /** Disposable marker; all seed-managed accounts expire. */
  expiresAfterHours: number;
}

export const VERIFICATION_PERSONAS: readonly VerificationPersona[] = [
  {
    id: 'system-owner',
    label: 'SYSTEM_OWNER (yazeed)',
    loginIdentity: 'yazeed',
    foundationRole: 'SYSTEM_OWNER',
    passwordEnvVar: 'QC_VERIFY_SYSTEM_OWNER_PASSWORD',
    scope: 'GLOBAL',
    minimumPermissions: [
      'PERM-IDN-VIEW-SELF',
      'PERM-HLTH-VIEW (health UI)',
      'PERM-ADM-USERS/ROLES/PERMISSIONS/SCOPES (member administration)',
      'P-05 authority (inspection/lab/release/retest/void/document with explicit permission)',
    ],
    seedManaged: false,
    expiresAfterHours: 0,
  },
  {
    id: 'supervisor',
    label: 'Supervisor verification account',
    loginIdentity: 'verify-supervisor',
    foundationRole: 'SUPERVISOR',
    passwordEnvVar: 'QC_VERIFY_SUPERVISOR_PASSWORD',
    scope: 'TEAM',
    minimumPermissions: [
      'Foundation SUPERVISOR grants (db/seeds/common.ts)',
      'PERM-CAPA-CLOSE (P-04, Supervisor-only)',
      'PERM-APR-APPROVE + PERM-ESIG-SIGN (P-05 ceremony)',
    ],
    seedManaged: true,
    expiresAfterHours: 24,
  },
  {
    id: 'manager',
    label: 'Manager verification account',
    loginIdentity: 'verify-manager',
    foundationRole: 'MANAGER',
    passwordEnvVar: 'QC_VERIFY_MANAGER_PASSWORD',
    scope: 'TEAM',
    minimumPermissions: [
      'Foundation MANAGER grants (db/seeds/common.ts)',
      'PERM-APR-APPROVE + PERM-ESIG-SIGN (P-05/P-07 ceremony)',
    ],
    seedManaged: true,
    expiresAfterHours: 24,
  },
  {
    id: 'admin-only',
    label: 'Admin-only verification account (no business approvals)',
    loginIdentity: 'verify-admin',
    foundationRole: 'ADMIN',
    passwordEnvVar: 'QC_VERIFY_ADMIN_PASSWORD',
    scope: 'GLOBAL',
    minimumPermissions: [
      'Foundation ADMIN grants minus business approvals',
      'Must NOT hold PERM-INSP-APPROVE / PERM-LAB-APPROVE / PERM-QUAR-RELEASE / PERM-DOC-APPROVE / PERM-CAPA-CLOSE',
    ],
    seedManaged: true,
    expiresAfterHours: 24,
  },
  {
    id: 'employee',
    label: 'Employee/member verification account',
    loginIdentity: 'verify-employee',
    foundationRole: 'EMPLOYEE',
    passwordEnvVar: 'QC_VERIFY_EMPLOYEE_PASSWORD',
    scope: 'OWN',
    minimumPermissions: ['Foundation EMPLOYEE grants (db/seeds/common.ts)'],
    seedManaged: true,
    expiresAfterHours: 24,
  },
  {
    id: 'least-privileged',
    label: 'Active user without sensitive permissions',
    loginIdentity: 'verify-least',
    foundationRole: 'NONE',
    passwordEnvVar: 'QC_VERIFY_LEAST_PASSWORD',
    scope: 'OWN',
    minimumPermissions: [
      'PERM-IDN-VIEW-SELF',
      'PERM-IDN-CHANGE-OWN-PASSWORD',
      'PERM-NOT-VIEW-OWN',
      'PERM-NOT-MARK-READ',
      'PERM-SRCH-USE',
      'PERM-DASH-VIEW (read-only dashboard)',
      'PERM-TASK-VIEW (read-only task list, global read visibility)',
    ],
    seedManaged: true,
    expiresAfterHours: 24,
  },
] as const;

export const VERIFICATION_RECORD_PREFIX = 'VERIFY-';

export const VERIFICATION_DISPOSABLE_RECORDS = [
  { kind: 'TASK', businessNo: 'VERIFY-TASK-001', purpose: 'read-only list/detail + validation-error scenario' },
  { kind: 'RECEIVING_ITEM', businessNo: 'VERIFY-RCV-001', purpose: 'read-only quarantine detail + release-denial target' },
  { kind: 'LAB_TEST', businessNo: 'VERIFY-LAB-001', purpose: 'read-only lab detail + approval-denial target' },
  { kind: 'DOCUMENT_VERSION', businessNo: 'VERIFY-DOC-001', purpose: 'authorized change-request selector target' },
  { kind: 'CAPA', businessNo: 'VERIFY-CAPA-001', purpose: 'P-04 close-denial target (non-terminal)' },
  { kind: 'INSPECTION_TEMPLATE_VERSION', businessNo: 'VERIFY-TMPL-001', purpose: 'F-10 lifecycle read-only target' },
] as const;

export function getPersona(id: VerificationPersonaId): VerificationPersona {
  const persona = VERIFICATION_PERSONAS.find((entry) => entry.id === id);
  if (!persona) throw new Error(`Unknown verification persona: ${id}`);
  return persona;
}

/** Env-var names only — used by .env.example and runbooks. No values here. */
export const VERIFICATION_PASSWORD_ENV_VARS = VERIFICATION_PERSONAS.map(
  (persona) => persona.passwordEnvVar,
);
