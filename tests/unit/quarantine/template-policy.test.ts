import { describe, expect, it } from 'vitest';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import {
  describeTemplateActor,
  isEmployeeOnly,
  isTemplateAuthority,
} from '../../../src/modules/quarantine/templates/domain/template-policy.js';

const actor = (roles: string[]): ActorContext => ({
  id: '01900000-0000-7000-8000-000000000001',
  accountState: 'ACTIVE',
  roles,
  permissions: [{ code: 'PERM-ADM-TEMPLATES', scopes: ['GLOBAL'] }],
});

describe('template authority policy (P-06)', () => {
  it('recognizes Supervisor, Manager, and SYSTEM_OWNER (yazeed) as authorities', () => {
    expect(isTemplateAuthority(actor(['SUPERVISOR']))).toBe(true);
    expect(isTemplateAuthority(actor(['MANAGER']))).toBe(true);
    expect(isTemplateAuthority(actor(['SYSTEM_OWNER']))).toBe(true);
  });

  it('never treats Employee or Admin-only actors as authorities', () => {
    expect(isTemplateAuthority(actor(['EMPLOYEE']))).toBe(false);
    expect(isTemplateAuthority(actor(['ADMIN']))).toBe(false);
    expect(isTemplateAuthority(actor(['ADMIN', 'EMPLOYEE']))).toBe(false);
  });

  it('flags employee-only actors for the DRAFT-only path', () => {
    expect(isEmployeeOnly(actor(['EMPLOYEE']))).toBe(true);
    expect(isEmployeeOnly(actor(['SUPERVISOR']))).toBe(false);
    expect(isEmployeeOnly(actor(['ADMIN']))).toBe(false);
  });

  it('describes actors for UI disabled reasons', () => {
    expect(describeTemplateActor(actor(['SUPERVISOR']))).toBe('AUTHORITY');
    expect(describeTemplateActor(actor(['EMPLOYEE']))).toBe('EMPLOYEE');
    expect(describeTemplateActor(actor(['ADMIN']))).toBe('OTHER');
  });
});
