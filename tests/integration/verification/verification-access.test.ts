import { describe, expect, it } from 'vitest';

import { authorize } from '../../../src/shared/authorization/authorize.js';
import { isP05Authority } from '../../../src/shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

function actor(
  id: string,
  roles: readonly string[],
  permissions: readonly string[],
  accountState: ActorContext['accountState'] = 'ACTIVE',
): ActorContext {
  return {
    id,
    accountState,
    roles,
    permissions: permissions.map((code) => ({
      code: code as ActorContext['permissions'][number]['code'],
      scopes: ['GLOBAL'] as const,
    })),
  };
}

const supervisor = actor(
  'verify-supervisor-actor',
  ['SUPERVISOR'],
  ['PERM-INSP-APPROVE', 'PERM-APR-APPROVE', 'PERM-CAPA-CLOSE', 'PERM-QUAR-RELEASE'],
);
const manager = actor(
  'verify-manager-actor',
  ['MANAGER'],
  ['PERM-INSP-APPROVE', 'PERM-APR-APPROVE', 'PERM-QUAR-RELEASE'],
);
const systemOwner = actor(
  'yazeed',
  ['SYSTEM_OWNER'],
  ['PERM-INSP-APPROVE', 'PERM-APR-APPROVE', 'PERM-QUAR-RELEASE'],
);
const adminOnly = actor('verify-admin-actor', ['ADMIN'], ['PERM-ADM-USERS']);
const employee = actor('verify-employee-actor', ['EMPLOYEE'], ['PERM-INSP-VIEW']);
const least = actor('verify-least-actor', [], ['PERM-TASK-VIEW']);
const inactiveSupervisor = actor(
  'verify-supervisor-actor',
  ['SUPERVISOR'],
  ['PERM-INSP-APPROVE', 'PERM-APR-APPROVE'],
  'DISABLED',
);

describe('C-12 server-side positive access and negative denial', () => {
  it('grants P-05 approval authority to supervisor, manager, and yazeed only', () => {
    expect(isP05Authority(supervisor)).toBe(true);
    expect(isP05Authority(manager)).toBe(true);
    expect(isP05Authority(systemOwner)).toBe(true);
    expect(isP05Authority(adminOnly)).toBe(false);
    expect(isP05Authority(employee)).toBe(false);
    expect(isP05Authority(least)).toBe(false);
    expect(isP05Authority(inactiveSupervisor)).toBe(false);
  });

  it('allows an authorized supervisor inspection approval (positive)', () => {
    const decision = authorize({
      actor: supervisor,
      permission: 'PERM-INSP-APPROVE',
      action: 'APPROVE',
      entity: { type: 'INSPECTION_REPORT', id: 'verify-inspection', state: 'UNDER_REVIEW' },
      scope: {},
      currentVersion: 3,
      expectedVersion: 3,
      sod: { actorId: supervisor.id, authorId: 'someone-else' },
      businessCondition: true,
    });
    expect(decision.allowed).toBe(true);
  });

  it('denies admin-only forged approval without a business permission (negative)', () => {
    const decision = authorize({
      actor: adminOnly,
      permission: 'PERM-INSP-APPROVE',
      action: 'APPROVE',
      entity: { type: 'INSPECTION_REPORT', id: 'verify-inspection', state: 'UNDER_REVIEW' },
      scope: {},
      currentVersion: 3,
      expectedVersion: 3,
      businessCondition: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('AUTHZ_PERMISSION_MISSING');
  });

  it('denies least-privileged forged release (negative)', () => {
    const decision = authorize({
      actor: least,
      permission: 'PERM-QUAR-RELEASE',
      action: 'RELEASE',
      entity: { type: 'RECEIVING_ITEM', id: 'verify-receiving', state: 'RELEASE_PENDING' },
      scope: {},
      currentVersion: 1,
      expectedVersion: 1,
      businessCondition: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('AUTHZ_PERMISSION_MISSING');
  });

  it('denies self-approval through SoD even for an authorized supervisor (negative)', () => {
    const decision = authorize({
      actor: supervisor,
      permission: 'PERM-INSP-APPROVE',
      action: 'APPROVE',
      entity: { type: 'INSPECTION_REPORT', id: 'verify-inspection', state: 'UNDER_REVIEW' },
      scope: {},
      currentVersion: 3,
      expectedVersion: 3,
      sod: { actorId: supervisor.id, authorId: supervisor.id },
      businessCondition: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('AUTHZ_SOD_VIOLATION');
  });

  it('denies stale-version replay even for an authorized manager (negative)', () => {
    const decision = authorize({
      actor: manager,
      permission: 'PERM-QUAR-RELEASE',
      action: 'RELEASE',
      entity: { type: 'RECEIVING_ITEM', id: 'verify-receiving', state: 'RELEASE_PENDING' },
      scope: {},
      currentVersion: 4,
      expectedVersion: 3,
      businessCondition: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('CONFLICT_STALE_VERSION');
  });

  it('denies wrong-state approval even with the right permission (negative)', () => {
    const decision = authorize({
      actor: supervisor,
      permission: 'PERM-INSP-APPROVE',
      action: 'APPROVE',
      entity: { type: 'INSPECTION_REPORT', id: 'verify-inspection', state: 'DRAFT' },
      scope: {},
      currentVersion: 1,
      expectedVersion: 1,
      businessCondition: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('AUTHZ_DENIED');
  });

  it('denies inactive accounts before any permission check (negative)', () => {
    const decision = authorize({
      actor: inactiveSupervisor,
      permission: 'PERM-INSP-APPROVE',
      action: 'APPROVE',
      entity: { type: 'INSPECTION_REPORT', id: 'verify-inspection', state: 'UNDER_REVIEW' },
      scope: {},
      currentVersion: 1,
      expectedVersion: 1,
      businessCondition: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('AUTHZ_DENIED');
  });
});
