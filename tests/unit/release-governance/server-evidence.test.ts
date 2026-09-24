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
  ci: 'SIGNED_PROVIDER_ATTESTATION',
  security: 'SIGNED_PROVIDER_ATTESTATION',
  database: 'SIGNED_PROVIDER_ATTESTATION',
  e2e: 'SIGNED_PROVIDER_ATTESTATION',
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
    auditInfo: ['ci', 'security', 'database', 'e2e'].includes(evidenceType)
      ? {
          signerId: 'test-provider',
          signerKeyId: 'test-key',
          approvedScope: ['ci', 'security', 'database', 'e2e'],
          approvalReference: 'OD-TEST-01',
          deploymentEnvironment: 'test',
        }
      : {},
    ...(['ci', 'security', 'database', 'e2e'].includes(evidenceType)
      ? {
          evidenceDigest: 'b'.repeat(64),
          signerId: 'test-provider',
          signerKeyId: 'test-key',
          signerScope: ['ci', 'security', 'database', 'e2e'],
          signatureDigest: 'c'.repeat(64),
        }
      : {}),
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

  it('does not accept provider evidence without a signer scope and approval reference', () => {
    const unsigned = gates({
      auditInfo: {},
      evidenceDigest: null,
      signerId: null,
      signerKeyId: null,
      signerScope: null,
      signatureDigest: null,
    });
    expect(
      deriveReleaseEvidence(candidate, unsigned, [], new Date('2026-09-15T02:00:00Z')).gates.ci,
    ).toBe('UNVERIFIED');
    const unapproved = gates({
      auditInfo: {
        signerId: 'test-provider',
        signerKeyId: 'test-key',
        approvedScope: ['ci'],
        deploymentEnvironment: 'test',
      },
    });
    expect(
      deriveReleaseEvidence(candidate, unapproved, [], new Date('2026-09-15T02:00:00Z')).gates.ci,
    ).toBe('UNVERIFIED');
  });
});
