import { describe, expect, it } from 'vitest';
import { authorize } from '../../../src/shared/authorization/authorize.js';

describe('admin user lifecycle authorization', () => {
  it('denies an ADMIN role without the explicit identity permission', () => { const decision = authorize({ actor: { id: 'admin', accountState: 'ACTIVE', roles: ['ADMIN'], permissions: [] }, permission: 'PERM-IDN-DEACTIVATE', action: 'DEACTIVATE', entity: { type: 'USER', id: 'target', state: 'ACTIVE' }, scope: {}, currentVersion: 1, expectedVersion: 1, businessCondition: true }); expect(decision.allowed).toBe(false); expect(decision.code).toBe('AUTHZ_PERMISSION_MISSING'); });
});
