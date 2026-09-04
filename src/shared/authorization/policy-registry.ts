import type { PermissionCode } from './permissions';
export interface AuthorizationPolicy {
  permission: PermissionCode;
  action: string;
  entityType: string;
  states: readonly string[];
}
const policies: readonly AuthorizationPolicy[] = [
  {
    permission: 'PERM-NOT-VIEW-OWN',
    action: 'VIEW',
    entityType: 'NOTIFICATION',
    states: ['ACTIVE'],
  },
  {
    permission: 'PERM-NOT-MARK-READ',
    action: 'MARK_READ',
    entityType: 'NOTIFICATION',
    states: ['ACTIVE'],
  },
  {
    permission: 'PERM-INSP-REVIEW',
    action: 'REVIEW',
    entityType: 'INSPECTION_REPORT',
    states: ['SUBMITTED', 'UNDER_REVIEW'],
  },
];
export function getAuthorizationPolicy(
  permission: PermissionCode,
  action: string,
  entityType: string,
): AuthorizationPolicy | undefined {
  return policies.find(
    (p) => p.permission === permission && p.action === action && p.entityType === entityType,
  );
}
