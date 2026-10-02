import { describe, expect, it, vi } from 'vitest';
import { getReleaseApprovalPageModel } from '../../../src/modules/release-governance/application/capability.js';
import type { ReleaseGovernanceRepository } from '../../../src/modules/release-governance/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

vi.mock('../../../src/config/runtime.js', () => ({
  getRuntimeConfig: () => ({ release: {} }),
}));

const actor: ActorContext = {
  id: 'manager-1',
  loginIdentity: 'manager',
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: [],
};

const candidate = {
  releaseId: '01900000-0000-7000-8000-00000000aa01',
  gitSha: 'a'.repeat(40),
  buildId: 'build-1',
  applicationVersion: '1.0.0',
  migrationHead: '0045_provider_attestation_nonce_replay_guard.sql',
  uatCycleId: 'UAT-1',
  uatStatus: 'UNKNOWN',
  residualRiskStatus: 'UNKNOWN',
  state: 'PENDING' as const,
  version: 1n,
  createdAt: new Date('2026-10-02T00:00:00.000Z'),
  updatedAt: new Date('2026-10-02T00:00:00.000Z'),
};

function repository(
  overrides: Partial<ReleaseGovernanceRepository> = {},
): Pick<
  ReleaseGovernanceRepository,
  'getCandidate' | 'getEvidence' | 'hasReconciledProductionGateDecision'
> {
  return {
    getCandidate: vi.fn().mockResolvedValue(candidate),
    getEvidence: vi.fn().mockResolvedValue({ gateRecords: [], riskRecords: [] }),
    hasReconciledProductionGateDecision: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe('release approval page read outcomes', () => {
  it('distinguishes candidate provider failure from a missing release', async () => {
    const model = await getReleaseApprovalPageModel(
      { actor, releaseId: candidate.releaseId },
      repository({ getCandidate: vi.fn().mockRejectedValue(new Error('database offline')) }),
    );

    expect(model).toMatchObject({
      candidateReadUnavailable: true,
      evidenceReadUnavailable: false,
      approvable: false,
      disabledReasons: ['CANDIDATE_PROVIDER_UNAVAILABLE'],
    });
    expect(model.candidate).toBeUndefined();
  });

  it('keeps evidence provider failure separate from a valid empty evidence result', async () => {
    const unavailable = await getReleaseApprovalPageModel(
      { actor, releaseId: candidate.releaseId },
      repository({ getEvidence: vi.fn().mockRejectedValue(new Error('database offline')) }),
    );
    const empty = await getReleaseApprovalPageModel(
      { actor, releaseId: candidate.releaseId },
      repository(),
    );

    expect(unavailable).toMatchObject({
      candidate,
      evidenceReadUnavailable: true,
      approvable: false,
    });
    expect(unavailable.disabledReasons).toContain('EVIDENCE_PROVIDER_UNAVAILABLE');
    expect(empty).toMatchObject({
      candidate,
      evidenceReadUnavailable: false,
      approvable: false,
    });
    expect(empty.disabledReasons).not.toContain('EVIDENCE_PROVIDER_UNAVAILABLE');
  });
});
