import { describe, expect, it } from 'vitest';
import { GetReleaseIdentityUseCase } from '../../../src/modules/system-health/application/get-release-identity.js';
import type { ConfiguredReleaseIdentity } from '../../../src/config/release.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const viewer = (permissions: ActorContext['permissions']): ActorContext => ({
  id: '01900000-0000-7000-8000-000000000212',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions,
});

const verified: ConfiguredReleaseIdentity = {
  status: 'VERIFIED',
  releaseId: 'rel-0123456789abcdef',
  buildId: 'render-123',
  buildTimestamp: '2026-09-10T01:00:00.000Z',
  environment: 'production',
  gitSha: '0123456789abcdef0123456789abcdef01234567',
  migrationHead: '0018_rate_limit_windows',
};

describe('authorized release-identity read', () => {
  it('returns the server-derived identity verbatim for a permitted actor', () => {
    const view = new GetReleaseIdentityUseCase(verified).execute({
      actor: viewer([{ code: 'PERM-HLTH-VIEW', scopes: ['GLOBAL'] }]),
    });
    expect(view).toEqual(verified);
  });

  it('surfaces UNVERIFIED verbatim instead of upgrading a missing identity', () => {
    const view = new GetReleaseIdentityUseCase({ status: 'UNVERIFIED' }).execute({
      actor: viewer([{ code: 'PERM-HLTH-VIEW', scopes: ['GLOBAL'] }]),
    });
    expect(view).toEqual({ status: 'UNVERIFIED' });
  });

  it('denies actors without the explicit health-view permission', () => {
    expect(() => new GetReleaseIdentityUseCase(verified).execute({ actor: viewer([]) })).toThrow(
      /permission_missing/i,
    );
  });

  it('denies inactive accounts even with the permission granted', () => {
    const actor = viewer([{ code: 'PERM-HLTH-VIEW', scopes: ['GLOBAL'] }]);
    actor.accountState = 'DISABLED';
    expect(() => new GetReleaseIdentityUseCase(verified).execute({ actor })).toThrow(
      /authz_denied/i,
    );
  });
});
