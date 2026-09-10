import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ConfiguredReleaseIdentity } from '../../../config/release.js';

/**
 * Authorized sanitized build-identity read. Mirrors the authorization of the
 * system-health view (PERM-HLTH-VIEW): only explicitly permitted actors may
 * observe deployment identity, and the value is always the server-derived
 * configured identity — never anything accepted from the browser. An
 * UNVERIFIED identity is returned verbatim so callers fail closed instead
 * of receiving an upgraded claim.
 */
export class GetReleaseIdentityUseCase {
  constructor(private readonly release: ConfiguredReleaseIdentity = { status: 'UNVERIFIED' }) {}

  execute(input: { actor: ActorContext }): ConfiguredReleaseIdentity {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-HLTH-VIEW',
        action: 'VIEW',
        entity: { type: 'SYSTEM_HEALTH', id: 'release-identity', state: 'ACTIVE', domain: 'SYSTEM_OPERATION' },
        scope: { domain: 'SYSTEM_OPERATION' },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.release;
  }
}
