import { describe, expect, it } from 'vitest';
import { getConfiguredReleaseIdentity } from '../../../src/config/release.js';

const complete = {
  SERVICE_VERSION: '0.1.0',
  RELEASE_ID: 'rel-0123456789abcdef',
  RELEASE_BUILD_ID: 'render-123',
  RELEASE_BUILD_TIMESTAMP: '2026-09-10T01:00:00.000Z',
  RELEASE_ENVIRONMENT: 'production',
  RELEASE_GIT_SHA: '0123456789abcdef0123456789abcdef01234567',
  RELEASE_MIGRATION_HEAD: '0018_rate_limit_windows',
};

describe('configured release identity', () => {
  it('accepts a complete sanitized build identity', () => {
    expect(getConfiguredReleaseIdentity(complete)).toMatchObject({
      status: 'VERIFIED',
      releaseId: complete.RELEASE_ID,
      buildId: complete.RELEASE_BUILD_ID,
      environment: 'production',
      gitSha: complete.RELEASE_GIT_SHA,
      migrationHead: complete.RELEASE_MIGRATION_HEAD,
    });
  });

  it('fails closed when identity fields are missing', () => {
    expect(getConfiguredReleaseIdentity({ RELEASE_ID: complete.RELEASE_ID })).toEqual({
      status: 'UNVERIFIED',
      releaseId: complete.RELEASE_ID,
    });
  });

  it('rejects malformed values without returning them as verified evidence', () => {
    expect(
      getConfiguredReleaseIdentity({
        ...complete,
        RELEASE_GIT_SHA: 'not-a-sha',
        RELEASE_BUILD_ID: 'build with spaces',
      }),
    ).toMatchObject({ status: 'UNVERIFIED' });
  });

  it('never exposes unrelated environment secrets', () => {
    expect(
      getConfiguredReleaseIdentity({ ...complete, SESSION_SECRET: 'secret-value' }),
    ).not.toHaveProperty('SESSION_SECRET');
  });
});
