import { describe, expect, it } from 'vitest';
import {
  assertDeployedIdentitySample,
  assertSameDeployedIdentity,
  type DeployedIdentityTriple,
} from '../../../src/shared/release/deployed-identity.js';

const sample = () => ({
  releaseId: 'rel-0123456789abcdef',
  buildId: 'render-123',
  gitSha: '0123456789abcdef0123456789abcdef01234567',
  buildTimestamp: '2026-09-10T01:00:00.000Z',
  environment: 'production',
});

const triple = (overrides: Partial<DeployedIdentityTriple> = {}): DeployedIdentityTriple => ({
  start: sample(),
  end: sample(),
  expected: sample(),
  ...overrides,
});

describe('deployed build-identity verification (C-11 fail-closed)', () => {
  it('accepts start, end, and evidence describing the same build', () => {
    expect(() => assertSameDeployedIdentity(triple())).not.toThrow();
  });

  it('compares Git SHAs case-insensitively', () => {
    const upper = triple({
      start: { ...sample(), gitSha: sample().gitSha.toUpperCase() },
    });
    expect(() => assertSameDeployedIdentity(upper)).not.toThrow();
  });

  it('fails closed when the start sample is missing a field', () => {
    const withoutSha = { ...sample(), gitSha: undefined };
    expect(() => assertDeployedIdentitySample(withoutSha)).toThrow(/gitSha/i);
    expect(() => assertSameDeployedIdentity(triple({ start: withoutSha }))).toThrow(/gitSha/i);
  });

  it('fails closed when any sample carries a malformed value', () => {
    expect(() =>
      assertDeployedIdentitySample({ ...sample(), releaseId: 'not-a-release' }),
    ).toThrow(/releaseId/i);
    expect(() =>
      assertDeployedIdentitySample({ ...sample(), buildTimestamp: 'yesterday' }),
    ).toThrow(/buildTimestamp/i);
    expect(() => assertDeployedIdentitySample({ ...sample(), environment: '' })).toThrow(
      /environment/i,
    );
  });

  it('fails closed when the end sample drifts (mid-run redeploy)', () => {
    const drifted = triple({
      end: { ...sample(), buildId: 'render-124' },
    });
    expect(() => assertSameDeployedIdentity(drifted)).toThrow(
      /buildId.*changed during the live run/i,
    );
  });

  it('fails closed when the deployed build differs from the evidence package', () => {
    const alternates = {
      releaseId: 'rel-aaaaaaaaaaaaaaaa',
      buildId: 'render-124',
      gitSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      buildTimestamp: '2026-09-11T01:00:00.000Z',
      environment: 'staging',
    } as const;
    for (const field of ['releaseId', 'buildId', 'gitSha', 'buildTimestamp', 'environment'] as const) {
      const mismatch = triple({
        expected: { ...sample(), [field]: alternates[field] },
      });
      expect(() => assertSameDeployedIdentity(mismatch)).toThrow(
        new RegExp(`${field}.*differs from the release evidence package`, 'i'),
      );
    }
  });

  it('never upgrades a missing identity into a pass', () => {
    expect(() => assertSameDeployedIdentity(triple({ start: {}, end: {}, expected: {} }))).toThrow(
      /not verifiable/i,
    );
  });
});
