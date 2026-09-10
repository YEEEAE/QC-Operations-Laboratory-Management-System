import type { PermissionCode } from './permissions.js';
import type { PermissionGrant } from './types.js';

/**
 * AVD-001/004: active authenticated members have global read access to
 * ordinary operational surfaces. This list intentionally contains read-only
 * capabilities only; health, identity administration, and mutation authority
 * remain explicit grants.
 */
export const UNIVERSAL_OPERATIONAL_READ_PERMISSIONS = [
  'PERM-IDN-VIEW-SELF',
  'PERM-TASK-VIEW',
  'PERM-FIND-VIEW',
  'PERM-NCR-VIEW',
  'PERM-RCA-VIEW',
  'PERM-CAPA-VIEW',
  'PERM-QUAR-VIEW',
  'PERM-INSP-VIEW',
  'PERM-LAB-VIEW',
  'PERM-EQP-VIEW',
  'PERM-CAL-VIEW',
  'PERM-MNT-VIEW',
  'PERM-DOC-VIEW',
  'PERM-APR-VIEW-ASSIGNED',
  'PERM-CHG-VIEW',
  'PERM-BKP-VIEW',
  'PERM-NOT-VIEW-OWN',
  'PERM-RPT-VIEW',
  'PERM-SRCH-USE',
  'PERM-DASH-VIEW',
  'PERM-ADM-AUDIT-VIEW',
] as const satisfies readonly PermissionCode[];

export function addUniversalOperationalReadPermissions(
  permissions: readonly PermissionGrant[],
) {
  const existing = new Set(permissions.map((permission) => permission.code));
  return [
    ...permissions,
    ...UNIVERSAL_OPERATIONAL_READ_PERMISSIONS.filter((code) => !existing.has(code)).map((code) => ({
      code,
      scopes: ['GLOBAL'] as const,
    })),
  ];
}
