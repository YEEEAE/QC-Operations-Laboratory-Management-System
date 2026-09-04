import type { PermissionCode } from './permissions';
export interface AuthorizationPolicy {
  permission: PermissionCode;
  action: string;
  entityType: string;
  states: readonly string[];
}
const policies: readonly AuthorizationPolicy[] = [
  { permission: 'PERM-IDN-VIEW-SELF', action: 'VIEW', entityType: 'ACCOUNT', states: ['ACTIVE'] },
  { permission: 'PERM-IDN-CHANGE-OWN-PASSWORD', action: 'CHANGE_PASSWORD', entityType: 'ACCOUNT', states: ['ACTIVE'] },
  { permission: 'PERM-IDN-MANAGE-USERS', action: 'MANAGE', entityType: 'USER', states: ['ACTIVE', 'INACTIVE', 'DISABLED'] },
  { permission: 'PERM-IDN-ACTIVATE', action: 'ACTIVATE', entityType: 'USER', states: ['INACTIVE', 'DISABLED'] },
  { permission: 'PERM-IDN-DEACTIVATE', action: 'DEACTIVATE', entityType: 'USER', states: ['ACTIVE', 'INACTIVE'] },
  { permission: 'PERM-IDN-RESET-PASSWORD', action: 'RESET_PASSWORD', entityType: 'USER', states: ['ACTIVE', 'INACTIVE', 'DISABLED'] },
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
  { permission: 'PERM-ADM-ROLE-VIEW', action: 'VIEW', entityType: 'ROLE', states: ['ACTIVE'] },
  { permission: 'PERM-ADM-ROLE-ASSIGN', action: 'ASSIGN', entityType: 'ROLE', states: ['ACTIVE'] },
  { permission: 'PERM-ADM-PERMISSION-VIEW', action: 'VIEW', entityType: 'PERMISSION', states: ['ACTIVE'] },
  { permission: 'PERM-ADM-PERMISSION-ASSIGN', action: 'ASSIGN', entityType: 'ROLE', states: ['ACTIVE'] },
  { permission: 'PERM-ADM-SCOPE-ASSIGN', action: 'ASSIGN', entityType: 'USER', states: ['ACTIVE', 'INACTIVE', 'DISABLED'] },
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
