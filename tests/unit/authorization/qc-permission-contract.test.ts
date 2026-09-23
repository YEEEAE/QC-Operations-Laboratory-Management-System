/**
 * QC-100-FINAL-004 — QC data-entry permission contract.
 *
 * Item 2/3/4: QC 01/02/03 (role EMPLOYEE) can create EVERY report/form type
 * the system exposes to a QC data-entry user. Item 5: opening creation never
 * opens approval — no approve/sign/final grants may reach the EMPLOYEE
 * bundle. Item 6: Supervisor holds stage-1 approval only; the final
 * ceremony grant (PERM-APR-APPROVE) is MANAGER / named-owner only.
 */
import { describe, expect, it } from 'vitest';
import {
  APPROVED_PERMISSION_CODES,
  FOUNDATION_ROLE_PERMISSIONS,
} from '../../../db/seeds/common.js';
import {
  CREATE_ROUTES,
  CREATE_SURFACE_PERMISSION_MATRIX,
} from '../../../scripts/uat/scenario-support.js';

const EMPLOYEE = FOUNDATION_ROLE_PERMISSIONS.EMPLOYEE;
const SUPERVISOR = FOUNDATION_ROLE_PERMISSIONS.SUPERVISOR;
const MANAGER = FOUNDATION_ROLE_PERMISSIONS.MANAGER;

/** Creation/data-entry grants every QC data-entry user must hold. */
const QC_CREATE_GRANTS = [
  'PERM-INSP-CREATE',
  'PERM-LAB-CREATE',
  'PERM-QUAR-CREATE',
  'PERM-QUAR-EDIT',
  'PERM-FIND-CREATE',
  'PERM-NCR-CREATE',
  'PERM-CHG-CREATE',
  'PERM-RREJ-CREATE',
  'PERM-TASK-CREATE',
  'PERM-CAPA-CREATE',
  'PERM-DOC-CREATE',
  'PERM-EQP-CREATE',
  'PERM-CAL-CREATE',
  'PERM-MNT-CREATE',
  'PERM-QUAR-START-INSPECTION',
  'PERM-INSP-PRINT',
  'PERM-INSP-EXPORT',
  'PERM-LAB-PRINT',
  'PERM-LAB-EXPORT',
  'PERM-EQP-VIEW',
  'PERM-CAL-VIEW',
  'PERM-RPT-VIEW',
  'PERM-RPT-RUN',
  'PERM-RPT-EXPORT-CSV',
] as const;

/** Approval/signature/final grants that must never reach a QC data-entry user. */
const FORBIDDEN_FOR_QC = APPROVED_PERMISSION_CODES.filter(
  (code) =>
    code.includes('-APPROVE') ||
    code.includes('-REJECT') ||
    code.includes('-REVIEW') ||
    code.includes('-RETURN') ||
    code.includes('-RELEASE') ||
    code.includes('-VERIFY') ||
    code.includes('-CLOSE') ||
    code.startsWith('PERM-ESIG-SIGN') ||
    code.startsWith('PERM-APR-'),
);

describe('QC-100-FINAL-004 — EMPLOYEE (QC data entry) permission contract', () => {
  it('maps every registered create route to an explicit grant shared by QC 01/02/03', () => {
    expect(CREATE_SURFACE_PERMISSION_MATRIX.map((row) => row.route)).toEqual(CREATE_ROUTES);
    expect(new Set(CREATE_SURFACE_PERMISSION_MATRIX.map((row) => row.permission)).size).toBe(
      CREATE_SURFACE_PERMISSION_MATRIX.length,
    );
    for (const row of CREATE_SURFACE_PERMISSION_MATRIX) {
      expect(EMPLOYEE, `${row.route} requires ${row.permission}`).toContain(row.permission);
      expect(APPROVED_PERMISSION_CODES).toContain(row.permission);
    }
  });

  it('grants creation/data-entry for every report and form type', () => {
    for (const grant of QC_CREATE_GRANTS) {
      expect(EMPLOYEE, `EMPLOYEE missing ${grant}`).toContain(grant);
    }
  });

  it('grants no approval, review, return, reject, release, close or signature permission', () => {
    for (const code of FORBIDDEN_FOR_QC) {
      expect(EMPLOYEE, `EMPLOYEE must not hold ${code}`).not.toContain(code);
    }
    for (const forbidden of [
      'PERM-RREJ-CONFIRM-APPROVAL',
      'PERM-RREJ-FINALIZE',
      'PERM-RREJ-VOID',
    ]) {
      expect(EMPLOYEE, `EMPLOYEE must not hold ${forbidden}`).not.toContain(forbidden);
    }
  });

  it('keeps the final-approval ceremony grant out of the Supervisor bundle', () => {
    expect(SUPERVISOR).not.toContain('PERM-APR-APPROVE');
    // Stage-1 approval stays with Supervisor.
    expect(SUPERVISOR).toContain('PERM-INSP-APPROVE');
    expect(SUPERVISOR).toContain('PERM-LAB-APPROVE');
    expect(SUPERVISOR).toContain('PERM-ESIG-SIGN');
    expect(MANAGER).not.toContain('PERM-INSP-APPROVE');
    expect(MANAGER).not.toContain('PERM-LAB-APPROVE');
  });

  it('keeps QCM final approval grants separate from Supervisor stage-1 grants', () => {
    expect(MANAGER).toContain('PERM-APR-APPROVE');
    expect(MANAGER).not.toContain('PERM-INSP-APPROVE');
    expect(MANAGER).not.toContain('PERM-LAB-APPROVE');
    expect(MANAGER).toContain('PERM-ESIG-SIGN');
  });
});

/**
 * Pre-existing defect found while implementing QC-100-FINAL-004: the
 * review/return/reject use cases require the domain permission AND the
 * matching approval-module permission, but neither was granted to Supervisor
 * or Manager, so "Return for Correction" could never succeed for any account
 * except the named owner. These assertions lock the fix.
 */
describe('QC-100-FINAL-004 — stage review/return/reject grants', () => {
  const STAGE_GRANTS = [
    'PERM-INSP-REVIEW',
    'PERM-INSP-RETURN',
    'PERM-INSP-REJECT',
    'PERM-APR-REVIEW',
    'PERM-APR-RETURN',
    'PERM-APR-REJECT',
    'PERM-LAB-REVIEW',
    'PERM-LAB-RETURN',
  ] as const;

  it.each(['SUPERVISOR', 'MANAGER'] as const)('%s can review, return and reject', (role) => {
    for (const grant of STAGE_GRANTS) {
      expect(FOUNDATION_ROLE_PERMISSIONS[role], `${role} missing ${grant}`).toContain(grant);
    }
    expect(FOUNDATION_ROLE_PERMISSIONS[role]).toContain('PERM-LAB-REJECT');
  });

  it('does not hand the Supervisor the final approval ceremony', () => {
    expect(SUPERVISOR).not.toContain('PERM-APR-APPROVE');
    expect(MANAGER).toContain('PERM-APR-APPROVE');
  });

  it('keeps administration-only grants out of the QC data-entry bundle', () => {
    for (const code of [
      'PERM-IDN-MANAGE-USERS',
      'PERM-ADM-ROLE-ASSIGN',
      'PERM-ADM-PERMISSION-ASSIGN',
      'PERM-ADM-SYSTEM-CONFIG',
      'PERM-ADM-SECURITY-CONFIG',
      'PERM-BKP-RESTORE-PRODUCTION',
    ]) {
      expect(EMPLOYEE, `EMPLOYEE must not hold ${code}`).not.toContain(code);
    }
  });
});
