import { describe, expect, it } from 'vitest';
import { isPermissionCode } from '../../../src/shared/authorization/permissions.js';
import { evaluateScope } from '../../../src/shared/authorization/scopes.js';

describe('authorization repository contracts', () => {
  it('accepts only canonical permission codes', () => { expect(isPermissionCode('PERM-ADM-PERMISSION-ASSIGN')).toBe(true); expect(isPermissionCode('PERM-ADMIN-BYPASS-ALL')).toBe(false); });
  it('keeps scoped access explicit', () => { expect(evaluateScope('SITE', 'actor', { type: 'USER', id: 'u', state: 'ACTIVE', siteId: 's1' }, { siteId: 's1' })).toBe(true); expect(evaluateScope('SITE', 'actor', { type: 'USER', id: 'u', state: 'ACTIVE', siteId: 's2' }, { siteId: 's1' })).toBe(false); });
});
