/**
 * QC-100-FINAL-004 two-stage contract.
 *
 * UNDER_REVIEW → (Supervisor stage approval) → PENDING_QCM_APPROVAL →
 * (QCM/owner final approval with binding e-signature) → APPROVED (locked).
 * No approval path leads UNDER_REVIEW → APPROVED.
 */
import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { getAuthorizationPolicy } from '../../../src/shared/authorization/policy-registry.js';
import { isFinalApprovalAuthority } from '../../../src/shared/authorization/p05-authority.js';
import { transitionInspection } from '../../../src/modules/quarantine/inspection/domain/inspection-state.js';
import { transitionLab } from '../../../src/modules/laboratory/domain/lab-state.js';

function stageActor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    id: 'actor-qc004',
    loginIdentity: 'test-actor',
    accountState: 'ACTIVE',
    roles: ['SUPERVISOR'],
    permissions: [
      { code: 'PERM-INSP-APPROVE', scopes: ['TEAM'] },
      { code: 'PERM-LAB-APPROVE', scopes: ['TEAM'] },
      { code: 'PERM-INSP-RETURN', scopes: ['TEAM'] },
      { code: 'PERM-LAB-RETURN', scopes: ['TEAM'] },
    ],
    ...overrides,
  };
}

describe('QC-100-FINAL-004 — registry states for the two-stage chain', () => {
  it('routes Supervisor stage approval through UNDER_REVIEW → PENDING_QCM_APPROVAL', () => {
    expect(transitionInspection('UNDER_REVIEW', 'APPROVE')).toBe('PENDING_QCM_APPROVAL');
    expect(transitionLab('UNDER_REVIEW', 'APPROVE')).toBe('PENDING_QCM_APPROVAL');
    expect(
      getAuthorizationPolicy('PERM-INSP-APPROVE', 'APPROVE', 'INSPECTION_REPORT')?.states,
    ).toEqual(['UNDER_REVIEW']);
    expect(getAuthorizationPolicy('PERM-LAB-APPROVE', 'APPROVE', 'LAB_TEST')?.states).toEqual([
      'UNDER_REVIEW',
    ]);
  });

  it('exposes the final approval only on PENDING_QCM_APPROVAL', () => {
    expect(transitionInspection('PENDING_QCM_APPROVAL', 'FINAL_APPROVE')).toBe('APPROVED');
    expect(transitionLab('PENDING_QCM_APPROVAL', 'FINAL_APPROVE')).toBe('APPROVED');
    expect(
      getAuthorizationPolicy('PERM-APR-APPROVE', 'APPROVE', 'INSPECTION_REPORT')?.states,
    ).toEqual(['PENDING_QCM_APPROVAL']);
    expect(getAuthorizationPolicy('PERM-APR-APPROVE', 'APPROVE', 'LAB_TEST')?.states).toEqual([
      'PENDING_QCM_APPROVAL',
    ]);
  });

  it('denies UNDER_REVIEW → APPROVED directly through either transition map', () => {
    expect(() => transitionInspection('UNDER_REVIEW', 'FINAL_APPROVE')).toThrowError(AppError);
    expect(() => transitionLab('UNDER_REVIEW', 'FINAL_APPROVE')).toThrowError(AppError);
  });

  it('reserves REOPEN for APPROVED', () => {
    expect(transitionInspection('APPROVED', 'REOPEN')).toBe('UNDER_REVIEW');
    expect(transitionLab('APPROVED', 'REOPEN')).toBe('UNDER_REVIEW');
    expect(() => transitionInspection('DRAFT', 'REOPEN')).toThrowError(AppError);
  });
});

describe('QC-100-FINAL-004 — final-approval authority separation', () => {
  it('rejects Supervisor and Admin as final approvers', () => {
    expect(isFinalApprovalAuthority(stageActor())).toBe(false);
    expect(isFinalApprovalAuthority(stageActor({ roles: ['ADMIN'] }))).toBe(false);
  });

  it('accepts the QCM (Manager) and the named owner', () => {
    expect(isFinalApprovalAuthority(stageActor({ roles: ['MANAGER'] }))).toBe(true);
    expect(
      isFinalApprovalAuthority(stageActor({ loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'] })),
    ).toBe(true);
  });
});
