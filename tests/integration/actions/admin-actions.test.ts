import { describe, expect, it } from 'vitest';
import { getAuthorizationPolicy } from '../../../src/shared/authorization/policy-registry.js';
describe('admin action contracts', () => {
  it('has explicit policies for administrative operations', () => { expect(getAuthorizationPolicy('PERM-ADM-ROLE-VIEW', 'VIEW', 'ROLE')).toBeDefined(); expect(getAuthorizationPolicy('PERM-ADM-PERMISSION-ASSIGN', 'ASSIGN', 'ROLE')).toBeDefined(); expect(getAuthorizationPolicy('PERM-ADM-SCOPE-ASSIGN', 'ASSIGN', 'USER')).toBeDefined(); });
});
