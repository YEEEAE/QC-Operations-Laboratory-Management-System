import { describe, expect, it } from 'vitest';
import { authorize } from '../../../src/shared/authorization/authorize.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const employee: ActorContext = { id: '01900000-0000-7000-8000-000000000001', accountState: 'ACTIVE', roles: ['EMPLOYEE'], permissions: [{ code: 'PERM-INSP-REVIEW', scopes: ['GLOBAL'] }] };
describe('Quarantine authorization matrix', () => {
  it('denies review without the dual approval permission', () => {
    expect(authorize({ actor: employee, permission: 'PERM-APR-REVIEW', action: 'REVIEW', entity: { type: 'INSPECTION_REPORT', id: '01900000-0000-7000-8000-000000000002', state: 'SUBMITTED', authorId: '01900000-0000-7000-8000-000000000003' }, scope: {}, currentVersion: 1n, expectedVersion: 1n }).allowed).toBe(false);
  });
  it('keeps release policy default-deny even if a permission grant is present', () => {
    const manager: ActorContext = { ...employee, roles: ['MANAGER'], permissions: [{ code: 'PERM-QUAR-RELEASE', scopes: ['GLOBAL'] }] };
    expect(authorize({ actor: manager, permission: 'PERM-QUAR-RELEASE', action: 'RELEASE', entity: { type: 'RECEIVING_ITEM', id: '01900000-0000-7000-8000-000000000002', state: 'RELEASE_PENDING', ownerId: manager.id }, scope: {}, currentVersion: 2n, expectedVersion: 2n, businessCondition: false }).allowed).toBe(false);
  });
});
