import { describe, expect, it } from 'vitest';
import type { AuthorizationInput } from '../../../src/shared/authorization/types';

describe('authorization input contract', () => {
  it('requires trusted actor and contextual decision inputs', () => {
    const input: AuthorizationInput = {
      actor: {
        id: 'actor-1',
        accountState: 'ACTIVE',
        permissions: [{ code: 'PERM-INSP-REVIEW', scopes: ['DOMAIN'] }],
        roles: ['EMPLOYEE'],
      },
      permission: 'PERM-INSP-REVIEW',
      action: 'REVIEW',
      entity: {
        type: 'INSPECTION_REPORT',
        id: 'report-1',
        state: 'SUBMITTED',
        authorId: 'author-1',
        domain: 'INSPECTION',
      },
      scope: { domain: 'INSPECTION' },
      currentVersion: 3,
      expectedVersion: 3,
      sod: { actorId: 'actor-1', authorId: 'author-1' },
      businessCondition: true,
    };

    expect(input.actor.id).toBe('actor-1');
    expect(input.expectedVersion).toBe(input.currentVersion);
  });
});
