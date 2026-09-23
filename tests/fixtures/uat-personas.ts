/**
 * Controlled UAT personas for QC-100-FINAL-004 Task 4.
 *
 * No secrets live in this file. Passwords are injected exclusively through
 * environment variables at seed/run time and never logged, screenshotted,
 * or written to the audit report.
 *
 * - `yazeed` (SYSTEM_OWNER) is the existing operator-owned account and is
 *   NEVER created, reset, or mutated by the UAT seed (verify-only).
 * - The remaining five identities are disposable (`uat-*`) and mirror the
 *   approved UAT participant matrix:
 *     qcm        → MANAGER   (QCM final approval stage)
 *     supervisor → SUPERVISOR (first-stage approval + return/reject)
 *     qc-01/02/03 → EMPLOYEE  (QC data-entry users, shared TEAM work queue)
 * - Disposable records use the `UAT-` prefix and expire after 72h or on
 *   explicit cleanup (see scripts/uat/cleanup-uat-personas.ts).
 *
 * Policy note (owner-approved, 2026-09-19): QCM is the MANAGER role code in
 * code/DB; "QCM" is the UAT-context display name only. EMPLOYEE personas hold
 * creation/data-entry grants with zero approval/sign authority.
 */

export type UatPersonaId = 'system-owner' | 'qcm' | 'supervisor' | 'qc-01' | 'qc-02' | 'qc-03';

/** Scope kinds the seed may grant to a disposable UAT persona. */
export type UatScopeKind = 'GLOBAL' | 'TEAM' | 'OWN';

export interface UatPersona {
  id: UatPersonaId;
  /** Display name shown in UAT evidence only. */
  label: string;
  /** Login identity. For system-owner this is the existing `yazeed` account. */
  loginIdentity: string;
  /** Foundation role code assigned to disposable personas. */
  foundationRole: 'SYSTEM_OWNER' | 'SUPERVISOR' | 'MANAGER' | 'EMPLOYEE';
  /** Environment variable holding the one-time UAT password. */
  passwordEnvVar: string;
  /**
   * Scope grants provisioned at seed time. Derived from the authorization
   * contexts the UAT journeys actually execute (measured, not assumed):
   * creating a receiving/inspection authorizes against
   * `scope: { ownerId }` with no team context, so data entry needs `OWN`;
   * the two approval stages and the release actions authorize against
   * `scope: { ownerId, assigneeId }` for a record the approver neither owns
   * nor is assigned, so only `GLOBAL` satisfies them today. `TEAM` keeps the
   * shared `QC-UAT-TEAM` work-queue intent from Task 4.
   */
  scopes: readonly UatScopeKind[];
  /** TEAM scope value for the shared UAT work queue. */
  teamValue: string | null;
  /** Whether the seed script may create this account (false for yazeed). */
  seedManaged: boolean;
  /** Disposable marker; all seed-managed accounts expire (hours). */
  expiresAfterHours: number;
}

export const UAT_TEAM_VALUE = 'QC-UAT-TEAM';
export const UAT_RECORD_PREFIX = 'UAT-';
export const UAT_LOGIN_PREFIX = 'uat-';

export const UAT_PERSONAS: readonly UatPersona[] = [
  {
    id: 'system-owner',
    label: 'System owner (yazeed) — verify only',
    loginIdentity: 'yazeed',
    foundationRole: 'SYSTEM_OWNER',
    passwordEnvVar: 'QC_UAT_SYSTEM_OWNER_PASSWORD',
    scopes: ['GLOBAL'],
    teamValue: null,
    seedManaged: false,
    expiresAfterHours: 0,
  },
  {
    id: 'qcm',
    label: 'QCM',
    loginIdentity: 'uat-qcm',
    foundationRole: 'MANAGER',
    passwordEnvVar: 'QC_UAT_QCM_PASSWORD',
    scopes: ['GLOBAL', 'TEAM'],
    teamValue: UAT_TEAM_VALUE,
    seedManaged: true,
    expiresAfterHours: 72,
  },
  {
    id: 'supervisor',
    label: 'Supervisor',
    loginIdentity: 'uat-supervisor',
    foundationRole: 'SUPERVISOR',
    passwordEnvVar: 'QC_UAT_SUPERVISOR_PASSWORD',
    scopes: ['GLOBAL', 'TEAM'],
    teamValue: UAT_TEAM_VALUE,
    seedManaged: true,
    expiresAfterHours: 72,
  },
  {
    id: 'qc-01',
    label: 'QC 01',
    loginIdentity: 'uat-qc-01',
    foundationRole: 'EMPLOYEE',
    passwordEnvVar: 'QC_UAT_QC01_PASSWORD',
    scopes: ['OWN', 'TEAM'],
    teamValue: UAT_TEAM_VALUE,
    seedManaged: true,
    expiresAfterHours: 72,
  },
  {
    id: 'qc-02',
    label: 'QC 02',
    loginIdentity: 'uat-qc-02',
    foundationRole: 'EMPLOYEE',
    passwordEnvVar: 'QC_UAT_QC02_PASSWORD',
    scopes: ['OWN', 'TEAM'],
    teamValue: UAT_TEAM_VALUE,
    seedManaged: true,
    expiresAfterHours: 72,
  },
  {
    id: 'qc-03',
    label: 'QC 03',
    loginIdentity: 'uat-qc-03',
    foundationRole: 'EMPLOYEE',
    passwordEnvVar: 'QC_UAT_QC03_PASSWORD',
    scopes: ['OWN', 'TEAM'],
    teamValue: UAT_TEAM_VALUE,
    seedManaged: true,
    expiresAfterHours: 72,
  },
] as const;

export function getUatPersona(id: UatPersonaId): UatPersona {
  const persona = UAT_PERSONAS.find((entry) => entry.id === id);
  if (!persona) throw new Error(`Unknown UAT persona: ${id}`);
  return persona;
}

/** Env-var names only — used by .env.example and runbooks. No values here. */
export const UAT_PASSWORD_ENV_VARS = UAT_PERSONAS.map((persona) => persona.passwordEnvVar);
