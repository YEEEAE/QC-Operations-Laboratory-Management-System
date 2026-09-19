import { describe, expect, it } from 'vitest';

import {
  UAT_PASSWORD_ENV_VARS,
  UAT_PERSONAS,
  UAT_RECORD_PREFIX,
  UAT_TEAM_VALUE,
} from '../../fixtures/uat-personas.js';
import { FOUNDATION_ROLE_PERMISSIONS } from '../../../db/seeds/common.js';

const APPROVAL_SIGN_GRANTS = [
  'PERM-APR-APPROVE',
  'PERM-APR-SIGN',
  'PERM-ESIG-SIGN',
  'PERM-INSP-APPROVE',
  'PERM-LAB-APPROVE',
  'PERM-QUAR-RELEASE',
  'PERM-DOC-APPROVE',
  'PERM-CAPA-CLOSE',
] as const;

describe('QC-100-FINAL-004 Task 4 UAT persona contract', () => {
  it('defines exactly six personas: yazeed verify-only + five disposable uat-* identities', () => {
    expect(UAT_PERSONAS).toHaveLength(6);
    const identities = UAT_PERSONAS.map((persona) => persona.loginIdentity);
    expect(new Set(identities).size).toBe(6);
    expect(identities).toContain('yazeed');
    const disposable = UAT_PERSONAS.filter((persona) => persona.loginIdentity !== 'yazeed');
    expect(disposable).toHaveLength(5);
    for (const persona of disposable) {
      expect(persona.loginIdentity.startsWith('uat-')).toBe(true);
      expect(persona.seedManaged).toBe(true);
      expect(persona.expiresAfterHours).toBe(72);
    }
  });

  it('never seed-manages yazeed', () => {
    const owner = UAT_PERSONAS.find((persona) => persona.loginIdentity === 'yazeed');
    expect(owner?.seedManaged).toBe(false);
    expect(owner?.foundationRole).toBe('SYSTEM_OWNER');
    expect(owner?.scope).toBe('GLOBAL');
  });

  it('has no secrets in source; passwords arrive only via QC_UAT_* env-var names', () => {
    const serialized = JSON.stringify(UAT_PERSONAS);
    expect(serialized).not.toMatch(/"password"\s*:|"passwordHash"|"secret"\s*:|"token"\s*:/i);
    for (const name of UAT_PASSWORD_ENV_VARS) {
      expect(name).toMatch(/^QC_UAT_[A-Z0-9_]+_PASSWORD$/);
      // The unit suite runs without secrets exported; guard against leakage.
      expect(process.env[name]).toBeUndefined();
    }
  });

  it('maps personas to the approved UAT matrix roles (QCM=MANAGER, supervisor=SUPERVISOR, 3× EMPLOYEE)', () => {
    const byId = new Map(UAT_PERSONAS.map((persona) => [persona.id, persona]));
    expect(byId.get('qcm')?.foundationRole).toBe('MANAGER');
    expect(byId.get('supervisor')?.foundationRole).toBe('SUPERVISOR');
    for (const id of ['qc-01', 'qc-02', 'qc-03'] as const) {
      expect(byId.get(id)?.foundationRole).toBe('EMPLOYEE');
    }
    for (const id of ['qcm', 'supervisor', 'qc-01', 'qc-02', 'qc-03'] as const) {
      expect(byId.get(id)?.scope).toBe('TEAM');
      expect(byId.get(id)?.teamValue).toBe(UAT_TEAM_VALUE);
    }
  });

  it('grants every EMPLOYEE persona zero approval/sign authority', () => {
    for (const permission of FOUNDATION_ROLE_PERMISSIONS.EMPLOYEE) {
      const isApprovalOrSign =
        permission.endsWith('-APPROVE') ||
        permission.startsWith('PERM-APR-') ||
        permission === 'PERM-ESIG-SIGN';
      expect(isApprovalOrSign, `${permission} must not be held by QC data entry`).toBe(false);
    }
    // Explicit negative pins for the two-stage chain.
    for (const forbidden of APPROVAL_SIGN_GRANTS) {
      expect(FOUNDATION_ROLE_PERMISSIONS.EMPLOYEE).not.toContain(forbidden);
    }
    // Creation parity must stay intact (QC data entry creates every type).
    for (const required of [
      'PERM-INSP-CREATE',
      'PERM-LAB-CREATE',
      'PERM-QUAR-CREATE',
      'PERM-RREJ-CREATE',
      'PERM-FIND-CREATE',
      'PERM-NCR-CREATE',
      'PERM-CHG-CREATE',
    ] as const) {
      expect(FOUNDATION_ROLE_PERMISSIONS.EMPLOYEE).toContain(required);
    }
  });

  it('keeps the QCM final-approval ceremony grant on MANAGER and off SUPERVISOR', () => {
    expect(FOUNDATION_ROLE_PERMISSIONS.MANAGER).toContain('PERM-APR-APPROVE');
    expect(FOUNDATION_ROLE_PERMISSIONS.SUPERVISOR).not.toContain('PERM-APR-APPROVE');
    // Supervisor stage approval remains a workflow event (no e-sign ceremony).
    expect(FOUNDATION_ROLE_PERMISSIONS.SUPERVISOR).toContain('PERM-INSP-APPROVE');
    expect(FOUNDATION_ROLE_PERMISSIONS.SUPERVISOR).toContain('PERM-ESIG-SIGN');
  });

  it('marks disposable records with the UAT- prefix contract', () => {
    expect(UAT_RECORD_PREFIX).toBe('UAT-');
  });
});
