import { describe, expect, it } from 'vitest';

import {
  assertReleaseIdentity,
  createReleaseIdentity,
  getPublicReleaseInfo,
  getServiceVersion,
  type ReleaseIdentityInput,
} from '../../../src/config/release.js';

const input = (overrides: Partial<ReleaseIdentityInput> = {}): ReleaseIdentityInput => ({
  applicationVersion: '0.1.0',
  buildId: 'ci-123-1',
  buildTimestamp: '2026-09-07T08:00:00.000Z',
  environment: 'ci',
  gitSha: '287ff86da338f72825457964547af59457d519d5',
  migrationHead: '0018_rate_limit_windows',
  workingTree: 'clean',
  ...overrides,
});

describe('release identity', () => {
  it('produces deterministic release metadata for the same inputs', () => {
    const first = createReleaseIdentity(input());
    const second = createReleaseIdentity(input());

    expect(first).toEqual(second);
    expect(first.releaseId).toMatch(/^rel-[0-9a-f]{16}$/);
    expect(first.gitSha).toBe(input().gitSha);
    expect(first.migrationHead).toBe('0018_rate_limit_windows');
  });

  it('refuses a dirty production identity', () => {
    expect(() =>
      createReleaseIdentity(input({ environment: 'production', workingTree: ' M app.ts' })),
    ).toThrow(/dirty working tree/i);
  });

  it('allows dirty metadata only when the environment is explicitly non-production', () => {
    expect(
      createReleaseIdentity(input({ environment: 'local', workingTree: ' M app.ts' })).dirty,
    ).toBe(true);
  });

  it('reports exact identity mismatches instead of treating them as equivalent', () => {
    const expected = createReleaseIdentity(input());
    const actual = { ...expected, gitSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };

    expect(() => assertReleaseIdentity(expected, actual)).toThrow(
      /gitSha mismatch.*expected.*actual/i,
    );
  });

  it('treats a service version change as an identity mismatch', () => {
    const expected = createReleaseIdentity(input({ serviceVersion: '0.1.0+build-a' }));
    const actual = { ...expected, serviceVersion: '0.1.0+build-b' };

    expect(() => assertReleaseIdentity(expected, actual)).toThrow(/serviceVersion mismatch/i);
  });

  it('exposes only safe service release fields', () => {
    const identity = createReleaseIdentity(input());
    const publicInfo = getPublicReleaseInfo(identity);

    expect(publicInfo).toEqual({
      service: { name: 'qc-operations-laboratory-management-system', version: '0.1.0' },
      release: {
        id: identity.releaseId,
        buildId: 'ci-123-1',
        gitSha: input().gitSha,
        migrationHead: '0018_rate_limit_windows',
        environment: 'ci',
      },
    });
    expect(JSON.stringify(publicInfo)).not.toMatch(/password|secret|token|database_url/i);
  });

  it('uses the release-bound service version and falls back to the safe application version', () => {
    expect(getServiceVersion({ SERVICE_VERSION: 'release-0.1.0' }, '0.1.0')).toBe('release-0.1.0');
    expect(getServiceVersion({}, '0.1.0')).toBe('0.1.0');
    expect(getServiceVersion({ SERVICE_VERSION: '  ' }, '0.1.0')).toBe('0.1.0');
  });
});
