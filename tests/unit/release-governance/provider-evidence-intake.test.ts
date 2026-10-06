import { describe, expect, it, vi } from 'vitest';
import { IngestProviderEvidenceUseCase } from '../../../src/modules/release-governance/application/ingest-provider-evidence.js';
import { providerSignature } from '../../../src/modules/release-governance/application/verify-provider-attestation.js';

const candidate = {
  releaseId: 'release-1',
  gitSha: 'a'.repeat(40),
  buildId: 'build-1',
  applicationVersion: '1.0.0',
  migrationHead: '0041_release_evidence',
  uatCycleId: 'UAT-1',
  version: 1n,
  state: 'PENDING',
};

const secret = 'unit-test-provider-key-material-with-32-bytes-or-more';
const policy = {
  signerId: 'ci-release-bot',
  keyId: 'ci-key',
  secret,
  provider: 'github-actions',
  approvalReference: 'OD-RELEASE-INGESTION-01',
  gates: ['ci'],
  environments: ['production'],
  maxEvidenceAgeSeconds: 3600,
};

function signedInput(patch: Record<string, unknown> = {}) {
  const now = new Date();
  const rawBody = JSON.stringify({
    signerId: policy.signerId,
    keyId: policy.keyId,
    nonce: 'provider-intake-nonce-0001',
    environment: 'production',
    identity: {
      releaseId: 'release-1',
      gitSha: 'a'.repeat(40),
      buildId: 'build-1',
      applicationVersion: '1.0.0',
      migrationHead: '0041_release_evidence',
      uatCycleId: 'UAT-1',
      releaseVersion: '1',
    },
    evidenceType: 'ci',
    status: 'PASS',
    immutableReference: 'https://example.test/evidence/1',
    observedAt: new Date(now.getTime() - 1000).toISOString(),
    evidenceDigest: 'b'.repeat(64),
    ...patch,
  });
  const timestamp = now.toISOString();
  return {
    rawBody,
    keyId: policy.keyId,
    timestamp,
    signature: providerSignature(secret, timestamp, rawBody),
  };
}

describe('provider evidence intake use case', () => {
  it('records a verified candidate-bound attestation once', async () => {
    const record = vi.fn().mockResolvedValue({ evidenceId: 'evidence-1', replayed: false });
    const useCase = new IngestProviderEvidenceUseCase(
      {
        hasReconciledProductionGateDecision: vi.fn().mockResolvedValue(true),
        getCandidate: vi.fn().mockResolvedValue(candidate),
        record,
      },
      JSON.stringify([policy]),
    );

    await expect(useCase.execute(signedInput())).resolves.toMatchObject({
      result: { evidenceId: 'evidence-1', replayed: false },
      attestation: { source: 'SIGNED_PROVIDER_ATTESTATION', evidenceType: 'ci', status: 'PASS' },
    });
    expect(record).toHaveBeenCalledTimes(1);
  });

  it('rejects bad signatures and malformed bodies before any write', async () => {
    const record = vi.fn();
    const useCase = new IngestProviderEvidenceUseCase(
      {
        hasReconciledProductionGateDecision: vi.fn().mockResolvedValue(true),
        getCandidate: vi.fn().mockResolvedValue(candidate),
        record,
      },
      JSON.stringify([policy]),
    );
    const input = signedInput();

    await expect(useCase.execute({ ...input, signature: '0'.repeat(64) })).rejects.toThrow();
    await expect(useCase.execute({ ...input, rawBody: '{' })).rejects.toThrow();
    expect(record).not.toHaveBeenCalled();
  });

  it('accepts the maximum body size and rejects the first byte over the limit', async () => {
    const record = vi.fn().mockResolvedValue({ evidenceId: 'evidence-boundary', replayed: false });
    const useCase = new IngestProviderEvidenceUseCase(
      {
        hasReconciledProductionGateDecision: vi.fn().mockResolvedValue(true),
        getCandidate: vi.fn().mockResolvedValue(candidate),
        record,
      },
      JSON.stringify([policy]),
    );
    const input = signedInput();
    const maxBody = input.rawBody + ' '.repeat(32_768 - Buffer.byteLength(input.rawBody));
    const exactBoundary = {
      ...input,
      rawBody: maxBody,
      signature: providerSignature(secret, input.timestamp, maxBody),
    };
    await expect(useCase.execute(exactBoundary)).resolves.toMatchObject({
      result: { evidenceId: 'evidence-boundary' },
    });
    const oversizedBody = `${maxBody} `;
    await expect(
      useCase.execute({
        ...exactBoundary,
        rawBody: oversizedBody,
        signature: providerSignature(secret, input.timestamp, oversizedBody),
      }),
    ).rejects.toThrow();
    expect(record).toHaveBeenCalledTimes(1);
  });

  it('fails closed when signer policy is absent or the candidate is missing', async () => {
    const record = vi.fn();
    const absentPolicy = new IngestProviderEvidenceUseCase(
      {
        hasReconciledProductionGateDecision: vi.fn().mockResolvedValue(true),
        getCandidate: vi.fn(),
        record,
      },
      '',
    );
    await expect(absentPolicy.execute(signedInput())).rejects.toThrow();
    const missingCandidate = new IngestProviderEvidenceUseCase(
      {
        hasReconciledProductionGateDecision: vi.fn().mockResolvedValue(true),
        getCandidate: vi.fn().mockResolvedValue(undefined),
        record,
      },
      JSON.stringify([policy]),
    );
    await expect(missingCandidate.execute(signedInput())).rejects.toThrow();
    expect(record).not.toHaveBeenCalled();
  });
  it.each([
    'releaseId',
    'gitSha',
    'buildId',
    'applicationVersion',
    'migrationHead',
    'uatCycleId',
    'releaseVersion',
  ])('rejects a signed wrong %s before persistence', async (field) => {
    const record = vi.fn();
    const useCase = new IngestProviderEvidenceUseCase(
      {
        hasReconciledProductionGateDecision: vi.fn().mockResolvedValue(true),
        getCandidate: vi.fn().mockResolvedValue(candidate),
        record,
      },
      JSON.stringify([policy]),
    );
    const original = JSON.parse(signedInput().rawBody).identity;
    const identity = {
      ...original,
      [field]: field === 'gitSha' ? 'c'.repeat(40) : field === 'releaseVersion' ? '2' : 'other',
    };
    await expect(useCase.execute(signedInput({ identity }))).rejects.toMatchObject({
      reason: 'IDENTITY',
    });
    expect(record).not.toHaveBeenCalled();
  });

  it('rejects an already approved candidate before persistence', async () => {
    const record = vi.fn();
    const useCase = new IngestProviderEvidenceUseCase(
      {
        hasReconciledProductionGateDecision: vi.fn().mockResolvedValue(true),
        getCandidate: vi.fn().mockResolvedValue({ ...candidate, state: 'RELEASE_APPROVED' }),
        record,
      },
      JSON.stringify([policy]),
    );
    await expect(useCase.execute(signedInput())).rejects.toMatchObject({
      code: 'DOMAIN_INVALID_TRANSITION',
    });
    expect(record).not.toHaveBeenCalled();
  });
  it.each(['PASS', 'FAIL', 'PARTIAL', 'UNVERIFIED'])(
    'blocks signed %s assertions until the authority registry is approved',
    async (status) => {
      const record = vi.fn();
      const useCase = new IngestProviderEvidenceUseCase(
        {
          getCandidate: vi.fn().mockResolvedValue(candidate),
          hasReconciledProductionGateDecision: vi.fn().mockResolvedValue(false),
          record,
        },
        JSON.stringify([policy]),
      );
      await expect(useCase.execute(signedInput({ status }))).rejects.toMatchObject({
        reason: 'REGISTRY_NOT_APPROVED',
      });
      expect(record).not.toHaveBeenCalled();
    },
  );
});
