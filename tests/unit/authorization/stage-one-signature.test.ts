import { expect, it } from 'vitest';
import { createFinalApprovalCeremony } from '../../../src/modules/e-signatures/application/final-approval-ceremony.js';

it('binds a separately reauthenticated final approval signature to its previous version', async () => {
  const ceremony = createFinalApprovalCeremony({ verify: async () => true });
  const evidence = await ceremony.createFinalApprovalEvidence({
    actor: {
      id: 'supervisor',
      accountState: 'ACTIVE',
      roles: ['SUPERVISOR'],
      permissions: [{ code: 'PERM-ESIG-SIGN', scopes: ['GLOBAL'] }],
    },
    subjectType: 'LAB_TEST',
    subjectId: 'test',
    subjectVersion: 2n,
    currentState: 'PENDING_QCM_APPROVAL',
    action: 'FINAL_APPROVE',
    meaning: 'FINAL_APPROVE',
    snapshotHash: 'bound-snapshot',
    reauthenticationSecret: 'password',
    requestId: 'request',
  });
  expect(evidence.action).toBe('FINAL_APPROVE');
  expect(evidence.meaning).toBe('FINAL_APPROVE');
  expect(evidence.subjectVersion).toBe(2n);
  expect(evidence.actorId).toBe('supervisor');
});

it('rejects a failed reauthentication before producing evidence', async () => {
  const ceremony = createFinalApprovalCeremony({ verify: async () => false });
  await expect(ceremony.createFinalApprovalEvidence({
    actor: { id: 'supervisor', accountState: 'ACTIVE', roles: ['SUPERVISOR'], permissions: [] },
    subjectType: 'LAB_TEST', subjectId: 'test', subjectVersion: 2n,
    currentState: 'PENDING_QCM_APPROVAL', action: 'FINAL_APPROVE', meaning: 'untrusted meaning',
    snapshotHash: 'snapshot', reauthenticationSecret: 'wrong', requestId: 'request',
  })).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
});

it('binds the Supervisor stage approval to its own action and prior record version', async () => {
  const ceremony = createFinalApprovalCeremony({ verify: async () => true });
  const evidence = await ceremony.createFinalApprovalEvidence({
    actor: {
      id: 'supervisor',
      accountState: 'ACTIVE',
      roles: ['SUPERVISOR'],
      permissions: [{ code: 'PERM-ESIG-SIGN', scopes: ['GLOBAL'] }],
    },
    subjectType: 'INSPECTION_REPORT',
    subjectId: 'inspection',
    subjectVersion: 7n,
    currentState: 'UNDER_REVIEW',
    action: 'STAGE1_APPROVE',
    meaning: 'STAGE1_APPROVE',
    snapshotHash: 'inspection:inspection:v7:stage1-approval',
    reauthenticationSecret: 'password',
    requestId: 'stage-one-request',
  });
  expect(evidence).toMatchObject({
    action: 'STAGE1_APPROVE',
    meaning: 'STAGE1_APPROVE',
    subjectVersion: 7n,
    subjectType: 'INSPECTION_REPORT',
  });
});
