import { describe, expect, it } from 'vitest';
import {
  APPROVED_PERMISSION_CODES,
  assertNonProductionSeedEnvironment,
  FOUNDATION_ROLE_CODES,
  FOUNDATION_ROLE_PERMISSIONS,
  getFoundationAuthorizationCounts,
  stableSeedUuid,
} from '../../db/seeds/common.js';
import { receivingFactory, taskFactory, userFactory } from '../helpers/factories.js';

describe('non-production seeds and deterministic factories', () => {
  it('defines a closed, explicit-ALLOW authorization foundation', () => {
    expect(FOUNDATION_ROLE_CODES).toEqual(['EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'ADMIN']);
    expect(Object.keys(FOUNDATION_ROLE_PERMISSIONS).sort()).toEqual(
      [...FOUNDATION_ROLE_CODES].sort(),
    );

    for (const permissions of Object.values(FOUNDATION_ROLE_PERMISSIONS)) {
      for (const permission of permissions) {
        expect(APPROVED_PERMISSION_CODES).toContain(permission);
      }
    }

    expect(FOUNDATION_ROLE_PERMISSIONS.ADMIN).toEqual(
      expect.arrayContaining([
        'PERM-IDN-MANAGE-USERS',
        'PERM-ADM-PERMISSION-ASSIGN',
        'PERM-ADM-SECURITY-CONFIG',
        'PERM-HLTH-DATABASE',
        'PERM-BKP-RESTORE-DRILL',
      ]),
    );
    expect(FOUNDATION_ROLE_PERMISSIONS.ADMIN).not.toContain('PERM-QUAR-RELEASE');
    expect(getFoundationAuthorizationCounts()).toEqual({
      roleCount: 4,
      permissionCount: APPROVED_PERMISSION_CODES.length,
      rolePermissionCount: expect.any(Number),
    });
  });

  it('requires an explicit environment guard and rejects production', () => {
    expect(() =>
      assertNonProductionSeedEnvironment('development', {
        NODE_ENV: 'development',
      } as NodeJS.ProcessEnv),
    ).toThrow();
    expect(() =>
      assertNonProductionSeedEnvironment('development', {
        NODE_ENV: 'production',
        QC_SEED_ALLOW_NON_PRODUCTION: 'true',
      } as NodeJS.ProcessEnv),
    ).toThrow();
    expect(() =>
      assertNonProductionSeedEnvironment('development', {
        NODE_ENV: 'development',
        QC_SEED_ALLOW_NON_PRODUCTION: 'true',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it('returns reproducible fixtures with explicit state/version/scope overrides', () => {
    expect(stableSeedUuid('same')).toBe(stableSeedUuid('same'));
    expect(taskFactory(2, { state: 'COMPLETED', version: 7, scope: 'site-a' })).toMatchObject({
      state: 'COMPLETED',
      version: 7,
      scope: 'site-a',
    });
    expect(receivingFactory(2, { inspection_result: 'PASS', release_system: false })).toMatchObject(
      { inspection_result: 'PASS', release_system: false },
    );
    expect(userFactory(2, { account_state: 'DISABLED' })).toMatchObject({
      account_state: 'DISABLED',
    });
  });
});
