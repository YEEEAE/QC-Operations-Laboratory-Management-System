import { describe, expect, it } from 'vitest';
import {
  deriveReleaseEvidence,
  RELEASE_GATE_KEYS,
  type ReleaseCandidateForEvidence,
} from '../../../src/modules/release-governance/domain/release-approval.js';

const candidate: ReleaseCandidateForEvidence = {
  releaseId: '01900000-0000-7000-8000-00000000aa01',
  gitSha: 'a'.repeat(40),
  buildId: 'build-1',
  applicationVersion: '1.0.0',
  migrationHead: '0022_server_release_evidence',
  uatCycleId: 'UAT-1',
  uatStatus: 'ACCEPTED',
  residualRiskStatus: 'ACCEPTED',
  state: 'PENDING',
  version: 4n,
  createdAt: new Date('2026-09-15T00:00:00Z'),
  updatedAt: new Date('2026-09-15T00:00:00Z'),
};
const sources: Record<string, string> = {
  ci: 'TRUSTED_CI',
  security: 'TRUSTED_SECURITY_SUITE',
  database: 'TRUSTED_DATABASE_PREFLIGHT',
  e2e: 'TRUSTED_PLAYWRIGHT',
  uat: 'SIGNED_UAT_CYCLE',
  signatures: 'E_SIGNATURE_STORE',
  criticalRisks: 'CONTROLLED_RISK_REGISTER',
  residualRisk: 'CONTROLLED_RISK_REGISTER',
};
const gates = (patch: Partial<Record<string, unknown>> = {}) =>
  RELEASE_GATE_KEYS.map((evidenceType, index) => ({
    ...candidate,
    evidenceType,
    status: 'PASS' as const,
    source: sources[evidenceType],
    immutableReference: 'attestation/' + evidenceType,
    observedAt: new Date('2026-09-15T01:00:00Z'),
    releaseVersion: 4n,
    evidenceVersion: BigInt(index + 1),
    recordedBy: 'trusted-service',
    auditInfo: {},
    ...patch,
  }));

describe('server-derived release evidence', () => {
  it('denies missing evidence, untrusted CI, missing UAT, and stale/foreign identity', () => {
    expect(
      deriveReleaseEvidence(candidate, [], [], new Date('2026-09-15T02:00:00Z')).gates.ci,
    ).toBe('UNVERIFIED');
    expect(
      deriveReleaseEvidence(
        candidate,
        gates({ evidenceType: 'ci', source: 'BROWSER' }),
        [],
        new Date('2026-09-15T02:00:00Z'),
      ).gates.ci,
    ).toBe('UNVERIFIED');
    expect(
      deriveReleaseEvidence(
        candidate,
        gates({ evidenceType: 'uat', status: 'UNVERIFIED' }),
        [],
        new Date('2026-09-15T02:00:00Z'),
      ).gates.uat,
    ).toBe('UNVERIFIED');
    expect(
      deriveReleaseEvidence(
        candidate,
        gates({ releaseVersion: 3n }),
        [],
        new Date('2026-09-15T02:00:00Z'),
      ).gates.ci,
    ).toBe('UNVERIFIED');
    expect(
      deriveReleaseEvidence(
        candidate,
        gates({ releaseId: '01900000-0000-7000-8000-00000000aa02' }),
        [],
        new Date('2026-09-15T02:00:00Z'),
      ).gates.ci,
    ).toBe('UNVERIFIED');
  });

  it('derives critical/open and high/unaccepted risks from controlled records only', () => {
    const base = {
      ...candidate,
      source: 'CONTROLLED_RISK_REGISTER',
      immutableReference: 'risk/1',
      observedAt: new Date('2026-09-15T01:00:00Z'),
      releaseVersion: 4n,
      evidenceVersion: 1n,
      recordedBy: 'risk-service',
      auditInfo: {},
    };
    const critical = deriveReleaseEvidence(
      candidate,
      gates(),
      [{ ...base, riskId: 'R-1', severity: 'CRITICAL' as const, status: 'OPEN' as const }],
      new Date('2026-09-15T02:00:00Z'),
    );
    expect(critical.risks[0]).toMatchObject({
      riskId: 'R-1',
      severity: 'CRITICAL',
      status: 'OPEN',
    });
    const high = deriveReleaseEvidence(
      candidate,
      gates(),
      [{ ...base, riskId: 'R-2', severity: 'HIGH' as const, status: 'OPEN' as const }],
      new Date('2026-09-15T02:00:00Z'),
    );
    expect(high.risks[0]).toMatchObject({ riskId: 'R-2', severity: 'HIGH', status: 'OPEN' });
  });
});
