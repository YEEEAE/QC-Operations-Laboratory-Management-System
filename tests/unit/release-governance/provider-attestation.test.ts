import { describe, expect, it } from 'vitest';
import {
  parseProviderSignerPolicies,
  providerSignature,
  ProviderAttestationError,
  verifyProviderAttestation,
} from '../../../src/modules/release-governance/domain/provider-attestation.js';

const now = new Date('2026-09-24T12:00:00.000Z');
const secret = 'test-only-provider-secret-with-at-least-32-bytes';
const policy = {
  signerId: 'ci-release-bot',
  keyId: 'ci-key-2026-09',
  secret,
  provider: 'github-actions',
  approvalReference: 'OD-RELEASE-INGESTION-01',
  gates: ['ci', 'security', 'database', 'e2e'],
  environments: ['production'],
  maxEvidenceAgeSeconds: 3600,
};
const expectedIdentity = {
  releaseId: '01900000-0000-7000-8000-00000000aa01',
  gitSha: 'a'.repeat(40),
  buildId: 'build-1',
  applicationVersion: '1.0.0',
  migrationHead: '0039_laboratory_report_drafts',
  uatCycleId: 'UAT-1',
  releaseVersion: 4n,
};
const payload = (patch: Record<string, unknown> = {}) => ({
  signerId: policy.signerId,
  keyId: policy.keyId,
  nonce: 'replay-safe-nonce-0001',
  environment: 'production',
  identity: { ...expectedIdentity, releaseVersion: '4' },
  evidenceType: 'ci',
  status: 'PASS',
  immutableReference: 'https://github.com/example/repo/actions/runs/12345',
  observedAt: new Date(now.getTime() - 30_000).toISOString(),
  evidenceDigest: 'b'.repeat(64),
  ...patch,
});

function signed(body: unknown, options: { timestamp?: string; secretValue?: string } = {}) {
  const rawBody = JSON.stringify(body);
  const timestamp = options.timestamp ?? now.toISOString();
  return {
    rawBody,
    keyId: policy.keyId,
    timestamp,
    signature: providerSignature(options.secretValue ?? secret, timestamp, rawBody),
  };
}

describe('signed release provider evidence', () => {
  const policies = parseProviderSignerPolicies(JSON.stringify([policy]));

  it('accepts a fresh signature only for the exact candidate and approved scope', () => {
    const signature = signed(payload());
    const result = verifyProviderAttestation({ ...signature, policies, expectedIdentity, now });
    expect(result).toMatchObject({
      source: 'SIGNED_PROVIDER_ATTESTATION',
      signerId: policy.signerId,
      signerScope: policy.gates,
      evidenceType: 'ci',
      status: 'PASS',
      evidenceDigest: 'b'.repeat(64),
    });
    expect(result.signatureDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects a missing key, modified body, or stale request timestamp', () => {
    const signature = signed(payload());
    expect(() =>
      verifyProviderAttestation({
        ...signature,
        keyId: 'unknown-key',
        policies,
        expectedIdentity,
        now,
      }),
    ).toThrow(ProviderAttestationError);
    expect(() =>
      verifyProviderAttestation({
        ...signature,
        rawBody: signature.rawBody + ' ',
        policies,
        expectedIdentity,
        now,
      }),
    ).toThrow(ProviderAttestationError);
    const stale = signed(payload(), {
      timestamp: new Date(now.getTime() - 6 * 60_000).toISOString(),
    });
    expect(() => verifyProviderAttestation({ ...stale, policies, expectedIdentity, now })).toThrow(
      ProviderAttestationError,
    );
  });

  it('rejects an unapproved gate, target environment, evidence age, or candidate SHA', () => {
    const unsupportedGate = signed(payload({ evidenceType: 'uat' }));
    expect(() =>
      verifyProviderAttestation({ ...unsupportedGate, policies, expectedIdentity, now }),
    ).toThrow(ProviderAttestationError);
    const otherEnvironment = signed(payload({ environment: 'staging' }));
    expect(() =>
      verifyProviderAttestation({ ...otherEnvironment, policies, expectedIdentity, now }),
    ).toThrow(ProviderAttestationError);
    const oldEvidence = signed(
      payload({ observedAt: new Date(now.getTime() - 2 * 3600_000).toISOString() }),
    );
    expect(() =>
      verifyProviderAttestation({ ...oldEvidence, policies, expectedIdentity, now }),
    ).toThrow(ProviderAttestationError);
    const foreignSha = signed(
      payload({ identity: { ...expectedIdentity, releaseVersion: '4', gitSha: 'c'.repeat(40) } }),
    );
    expect(() =>
      verifyProviderAttestation({ ...foreignSha, policies, expectedIdentity, now }),
    ).toThrow(ProviderAttestationError);
  });

  it('requires owner-scoped signer configuration and bounded gate types', () => {
    expect(() => parseProviderSignerPolicies(undefined)).not.toThrow();
    expect(() =>
      parseProviderSignerPolicies(JSON.stringify([{ ...policy, secret: 'short' }])),
    ).toThrow(ProviderAttestationError);
    expect(() =>
      parseProviderSignerPolicies(JSON.stringify([{ ...policy, gates: ['uat'] }])),
    ).toThrow(ProviderAttestationError);
    expect(() => parseProviderSignerPolicies(JSON.stringify([policy, policy]))).toThrow(
      ProviderAttestationError,
    );
  });
});
