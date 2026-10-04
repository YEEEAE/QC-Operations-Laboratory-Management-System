import { expect, it } from 'vitest';
import { createFinalApprovalCeremony } from '../../../src/modules/e-signatures/application/final-approval-ceremony.js';

it('binds a separately reauthenticated stage-one signature to its previous version', async () => {
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
    currentState: 'UNDER_REVIEW',
    action: 'STAGE1_APPROVE',
    meaning: 'STAGE1_APPROVE',
    snapshotHash: 'bound-snapshot',
    reauthenticationSecret: 'password',
    requestId: 'request',
  });
  expect(evidence.action).toBe('STAGE1_APPROVE');
  expect(evidence.meaning).toBe('STAGE1_APPROVE');
  expect(evidence.subjectVersion).toBe(2n);
  expect(evidence.actorId).toBe('supervisor');
});

it('rejects a failed reauthentication before producing evidence', async () => {
  const ceremony = createFinalApprovalCeremony({ verify: async () => false });
  await expect(ceremony.createFinalApprovalEvidence({
    actor: { id: 'supervisor', accountState: 'ACTIVE', roles: ['SUPERVISOR'], permissions: [] },
    subjectType: 'LAB_TEST', subjectId: 'test', subjectVersion: 2n,
    currentState: 'UNDER_REVIEW', action: 'STAGE1_APPROVE', meaning: 'untrusted meaning',
    snapshotHash: 'snapshot', reauthenticationSecret: 'wrong', requestId: 'request',
  })).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
});
