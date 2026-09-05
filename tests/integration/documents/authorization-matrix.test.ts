import { describe, expect, it } from 'vitest';
import { authorize } from '../../../src/shared/authorization/authorize.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const entity = { type: 'DOCUMENT_VERSION', id: '01900000-0000-7000-8000-000000000031', state: 'IN_REVIEW', ownerId: '01900000-0000-7000-8000-000000000032', authorId: '01900000-0000-7000-8000-000000000032' };
const actor: ActorContext = { id: '01900000-0000-7000-8000-000000000033', accountState: 'ACTIVE', roles: ['SUPERVISOR'], permissions: [{ code: 'PERM-DOC-REVIEW', scopes: ['GLOBAL'] }, { code: 'PERM-APR-REVIEW', scopes: ['GLOBAL'] }] };

describe('controlled document authorization matrix', () => {
  it('denies approval without explicitly granted approval permissions', () => {
    expect(authorize({ actor, permission: 'PERM-DOC-APPROVE', action: 'APPROVE', entity, scope: {}, currentVersion: 1n, expectedVersion: 1n }).allowed).toBe(false);
  });
  it('denies self-review even when the review permissions exist', () => {
    const self = { ...actor, id: entity.authorId };
    expect(authorize({ actor: self, permission: 'PERM-DOC-REVIEW', action: 'REVIEW', entity, scope: {}, currentVersion: 1n, expectedVersion: 1n, sod: { actorId: self.id, authorId: entity.authorId } }).allowed).toBe(false);
  });
});
