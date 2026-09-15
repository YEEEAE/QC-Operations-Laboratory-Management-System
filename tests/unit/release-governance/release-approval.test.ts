import { describe, expect, it, vi } from 'vitest';
import { ApproveReleaseUseCase } from '../../../src/modules/release-governance/application/approve-release.js';
import {
  RELEASE_GATE_KEYS,
  evaluateGates,
  getReleaseApprovalCapability,
  type ReleaseGateEvidence,
  type ReleaseGateEvidenceRecord,
  type ReleaseRiskEvidenceRecord,
} from '../../../src/modules/release-governance/domain/release-approval.js';
import type {
  ReleaseCandidateRecord,
  ReleaseGovernanceRepository,
} from '../../../src/modules/release-governance/ports/repository.js';
import type { ReauthenticationVerifier } from '../../../src/modules/e-signatures/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const GIT_SHA = 'a'.repeat(40);
const RELEASE_ID = '01900000-0000-7000-8000-00000000aa01';

const candidate: ReleaseCandidateRecord = {
  releaseId: RELEASE_ID,
  gitSha: GIT_SHA,
  buildId: 'build-2026-09-10-001',
  applicationVersion: '1.4.0',
  migrationHead: '0021_release_governance',
  uatCycleId: 'UAT-2026-09-10-001',
  uatStatus: 'ACCEPTED',
  residualRiskStatus: 'ACCEPTED',
  state: 'PENDING',
  version: 3n,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const passGates: ReleaseGateEvidence = {
  ci: 'PASS',
  security: 'PASS',
  database: 'PASS',
  e2e: 'PASS',
  uat: 'PASS',
  signatures: 'PASS',
  criticalRisks: 'PASS',
  residualRisk: 'PASS',
};

const trustedEvidence = (): { gateRecords: ReleaseGateEvidenceRecord[]; riskRecords: ReleaseRiskEvidenceRecord[] } => ({
  gateRecords: RELEASE_GATE_KEYS.map((evidenceType, index) => ({
    evidenceType,
    status: 'PASS' as const,
    source: evidenceType === 'uat' ? 'SIGNED_UAT_CYCLE' : evidenceType === 'signatures' ? 'E_SIGNATURE_STORE' : evidenceType === 'criticalRisks' || evidenceType === 'residualRisk' ? 'CONTROLLED_RISK_REGISTER' : evidenceType === 'database' ? 'TRUSTED_DATABASE_PREFLIGHT' : evidenceType === 'e2e' ? 'TRUSTED_PLAYWRIGHT' : evidenceType === 'security' ? 'TRUSTED_SECURITY_SUITE' : 'TRUSTED_CI',
    immutableReference: 'evidence/' + evidenceType + '/1',
    observedAt: new Date(),
    releaseVersion: 3n,
    evidenceVersion: BigInt(index + 1),
    recordedBy: 'trusted-service',
    auditInfo: { source: 'test' },
    ...candidate,
  })),
  riskRecords: [],
});

const actor = (
  id: string,
  roles: string[],
  permissions: string[] = ['PERM-APR-APPROVE'],
): ActorContext => ({
  id,
  loginIdentity: 'test-user',
  accountState: 'ACTIVE',
  roles,
  permissions: permissions.map((code) => ({
    code: code as ActorContext['permissions'][number]['code'],
    scopes: ['GLOBAL'],
  })),
});
const manager = () => actor('mgr-1', ['MANAGER']);
const systemOwner = () => ({ ...actor('owner-uuid', ['SYSTEM_OWNER']), loginIdentity: 'yazeed' });

function makeRepo(overrides: Partial<ReleaseCandidateRecord> = {}, evidence = trustedEvidence()) {
  const current: ReleaseCandidateRecord = { ...candidate, ...overrides };
  return {
    getCandidate: vi.fn(async () => current),
    getEvidence: vi.fn(async () => evidence),
    approve: vi.fn(async (input: Parameters<ReleaseGovernanceRepository['approve']>[0]) => ({
      id: 'approval-1',
      releaseId: current.releaseId,
      approvedBy: input.actor.id,
      authority: input.actor.roles.includes('MANAGER') ? ('MANAGER' as const) : ('SYSTEM_OWNER' as const),
      gitSha: current.gitSha,
      buildId: current.buildId,
      applicationVersion: current.applicationVersion,
      migrationHead: current.migrationHead,
      uatStatus: input.uatStatus,
      residualRiskStatus: input.residualRiskStatus,
      signatureEvidenceId: input.signature.id,
      approvedAt: new Date(),
      requestId: input.requestId,
    })),
  } as unknown as ReleaseGovernanceRepository & { getCandidate: ReturnType<typeof vi.fn>; approve: ReturnType<typeof vi.fn> };
}

const verifier: ReauthenticationVerifier = { verify: vi.fn(async () => true) };

const baseInput = () => ({
  actor: manager(),
  releaseId: RELEASE_ID,
  expectedVersion: 3n,
  gitSha: GIT_SHA,
  buildId: candidate.buildId,
  applicationVersion: candidate.applicationVersion,
  migrationHead: candidate.migrationHead,
  uatCycleId: candidate.uatCycleId,
  gates: { ...passGates },
  risks: [],
  uatStatus: 'ACCEPTED',
  residualRiskStatus: 'ACCEPTED',
  reauthenticationSecret: 'secret',
  requestId: 'req-1',
});

describe('release gates (fail-closed, table-driven)', () => {
  it.each(RELEASE_GATE_KEYS)('gate %s must be PASS', async (gate) => {
    const evidence = trustedEvidence();
    evidence.gateRecords[RELEASE_GATE_KEYS.indexOf(gate)].status = 'FAIL';
    const repo = makeRepo({}, evidence);
    await expect(
      new ApproveReleaseUseCase(repo, verifier).execute({ ...baseInput(), requestId: `req-gate-${gate}` }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repo.approve).not.toHaveBeenCalled();
  });

  it('UNVERIFIED gate is denied and capability lists every failing gate', () => {
    const gates = { ...passGates, ci: 'UNVERIFIED', e2e: 'PARTIAL' } as ReleaseGateEvidence;
    expect(evaluateGates(gates).ok).toBe(false);
    const capability = getReleaseApprovalCapability({ actor: manager(), gates, risks: [] });
    expect(capability.canApprove).toBe(false);
    expect(capability.disabledReasons).toContain('GATE:ci');
    expect(capability.disabledReasons).toContain('GATE:e2e');
  });
});

describe('release authority (Manager OR yazeed/SYSTEM_OWNER)', () => {
  it.each([
    ['manager', actor('mgr-1', ['MANAGER']), true],
    ['system owner', systemOwner(), true],
    ['admin+manager', actor('adm-1', ['ADMIN', 'MANAGER']), true],
    ['admin alone', actor('adm-1', ['ADMIN']), false],
    ['employee', actor('emp-1', ['EMPLOYEE']), false],
    ['supervisor', actor('sup-1', ['SUPERVISOR']), false],
    ['inactive manager', { ...manager(), accountState: 'INACTIVE' } as ActorContext, false],
    ['manager without permission', actor('mgr-1', ['MANAGER'], []), false],
  ])('%s -> %s', async (_name, testActor, allowed) => {
    const repo = makeRepo();
    const promise = new ApproveReleaseUseCase(repo, verifier).execute({
      ...baseInput(),
      actor: testActor,
      requestId: `req-auth-${String(_name).replace(/\W+/g, '-')}`,
    });
    if (allowed) {
      const result = await promise;
      expect(result.approvedBy).toBe(testActor.id);
    } else {
      await expect(promise).rejects.toMatchObject({ code: expect.any(String) });
      expect(repo.approve).not.toHaveBeenCalled();
    }
  });

  it('system owner identity is exact: another SYSTEM_OWNER id is denied', async () => {
    const repo = makeRepo();
    await expect(
      new ApproveReleaseUseCase(repo, verifier).execute({
        ...baseInput(),
        actor: actor('someone-else', ['SYSTEM_OWNER']),
        requestId: 'req-auth-identity',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('does not use a literal id as the named owner identity', () => {
    expect(getReleaseApprovalCapability({ actor: actor('yazeed', ['SYSTEM_OWNER']), gates: passGates, risks: [] }).canApprove).toBe(false);
    expect(getReleaseApprovalCapability({ actor: systemOwner(), gates: passGates, risks: [] }).canApprove).toBe(true);
    expect(getReleaseApprovalCapability({ actor: { ...actor('owner-uuid', ['SYSTEM_OWNER']), loginIdentity: 'other-user' }, gates: passGates, risks: [] }).canApprove).toBe(false);
  });

  it('one authorized signer is sufficient', async () => {
    const repo = makeRepo();
    const result = await new ApproveReleaseUseCase(repo, verifier).execute({
      ...baseInput(),
      actor: systemOwner(),
      requestId: 'req-single-signer',
    });
    expect(result.authority).toBe('SYSTEM_OWNER');
  });
});

describe('server-owned identity and version', () => {
  it('stale expected version is denied', async () => {
    const repo = makeRepo();
    await expect(
      new ApproveReleaseUseCase(repo, verifier).execute({ ...baseInput(), expectedVersion: 2n, requestId: 'req-stale' }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
  });

  it('uses the candidate identity and ignores browser identity-shaped extras', async () => {
    const repo = makeRepo();
    const result = await new ApproveReleaseUseCase(repo, verifier).execute({
      ...baseInput(),
      requestId: 'req-browser-extra',
      ...( { gitSha: 'b'.repeat(40), buildId: 'tampered', applicationVersion: '9.9.9', migrationHead: 'old', uatCycleId: 'old', gates: {}, risks: [] } as object),
    } as typeof baseInput extends () => infer T ? T : never);
    expect(result.gitSha).toBe(GIT_SHA);
    expect(result.buildId).toBe(candidate.buildId);
  });
});

describe('residual-risk handling', () => {
  it('CRITICAL residual risk blocks a normal release', async () => {
    const evidence = trustedEvidence();
    evidence.riskRecords.push({ riskId: 'RISK-001', severity: 'CRITICAL', status: 'OPEN', source: 'CONTROLLED_RISK_REGISTER', immutableReference: 'risk/RISK-001/1', observedAt: new Date(), releaseVersion: 3n, evidenceVersion: 1n, recordedBy: 'risk-service', auditInfo: {}, ...candidate });
    const repo = makeRepo({}, evidence);
    await expect(
      new ApproveReleaseUseCase(repo, verifier).execute({
        ...baseInput(),
        requestId: 'req-critical',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('VERY_HIGH residual risk blocks fail-closed', async () => {
    const evidence = trustedEvidence();
    evidence.riskRecords.push({ riskId: 'RISK-002', severity: 'VERY_HIGH', status: 'OPEN', source: 'CONTROLLED_RISK_REGISTER', immutableReference: 'risk/RISK-002/1', observedAt: new Date(), releaseVersion: 3n, evidenceVersion: 1n, recordedBy: 'risk-service', auditInfo: {}, ...candidate });
    const repo = makeRepo({}, evidence);
    await expect(
      new ApproveReleaseUseCase(repo, verifier).execute({
        ...baseInput(),
        requestId: 'req-very-high',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('HIGH without acceptance is denied; HIGH with Manager acceptance passes', async () => {
    const deniedEvidence = trustedEvidence();
    deniedEvidence.riskRecords.push({ riskId: 'RISK-003', severity: 'HIGH', status: 'OPEN', source: 'CONTROLLED_RISK_REGISTER', immutableReference: 'risk/RISK-003/1', observedAt: new Date(), releaseVersion: 3n, evidenceVersion: 1n, recordedBy: 'risk-service', auditInfo: {}, ...candidate });
    const denied = makeRepo({}, deniedEvidence);
    await expect(
      new ApproveReleaseUseCase(denied, verifier).execute({
        ...baseInput(),
        requestId: 'req-high-denied',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });

    const allowedEvidence = trustedEvidence();
    allowedEvidence.riskRecords.push({ riskId: 'RISK-003', severity: 'HIGH', status: 'ACCEPTED', source: 'CONTROLLED_RISK_REGISTER', immutableReference: 'risk/RISK-003/2', observedAt: new Date(), releaseVersion: 3n, evidenceVersion: 2n, recordedBy: 'risk-service', auditInfo: {}, acceptance: { acceptedBy: 'mgr-1', authority: 'MANAGER', evidenceRef: 'EV-1', acceptedAt: '2026-09-10T00:00:00Z' }, ...candidate });
    const allowed = makeRepo({}, allowedEvidence);
    const result = await new ApproveReleaseUseCase(allowed, verifier).execute({
      ...baseInput(),
      requestId: 'req-high-allowed',
    });
    expect(result.releaseId).toBe(RELEASE_ID);
  });

  it('acceptance by a non-authority is denied', async () => {
    const evidence = trustedEvidence();
    evidence.riskRecords.push({ riskId: 'RISK-004', severity: 'MEDIUM', status: 'ACCEPTED', source: 'CONTROLLED_RISK_REGISTER', immutableReference: 'risk/RISK-004/1', observedAt: new Date(), releaseVersion: 3n, evidenceVersion: 1n, recordedBy: 'risk-service', auditInfo: {}, acceptance: { acceptedBy: 'emp-1', authority: 'MANAGER', evidenceRef: '', acceptedAt: '2026-09-10T00:00:00Z' }, ...candidate });
    const repo = makeRepo({}, evidence);
    await expect(
      new ApproveReleaseUseCase(repo, verifier).execute({
        ...baseInput(),
        requestId: 'req-acceptance-evidence',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });
});

describe('reauthentication and signature ceremony', () => {
  it('missing secret and failed verification are denied', async () => {
    const repo = makeRepo();
    await expect(
      new ApproveReleaseUseCase(repo, verifier).execute({ ...baseInput(), reauthenticationSecret: ' ', requestId: 'req-nosecret' }),
    ).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
    vi.mocked(verifier.verify).mockResolvedValueOnce(false);
    await expect(
      new ApproveReleaseUseCase(repo, verifier).execute({ ...baseInput(), requestId: 'req-badsecret' }),
    ).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
    expect(repo.approve).not.toHaveBeenCalled();
  });

  it('stores RELEASE_APPROVED with the required atomic fields', async () => {
    const repo = makeRepo();
    const result = await new ApproveReleaseUseCase(repo, verifier).execute({ ...baseInput(), requestId: 'req-success' });
    expect(result).toMatchObject({
      releaseId: RELEASE_ID,
      approvedBy: 'mgr-1',
      authority: 'MANAGER',
      gitSha: GIT_SHA,
      buildId: candidate.buildId,
      uatStatus: 'ACCEPTED',
      residualRiskStatus: 'ACCEPTED',
      requestId: 'req-success',
    });
    expect(result.signatureEvidenceId).toBeTruthy();
    expect(result.approvedAt).toBeInstanceOf(Date);
    const stored = repo.approve.mock.calls[0][0];
    expect(stored.signature.subjectType).toBe('RELEASE_CANDIDATE');
    expect(stored.signature.action).toBe('RELEASE_APPROVE');
    expect(stored.signature.requestId).toBe('req-success');
  });
});
