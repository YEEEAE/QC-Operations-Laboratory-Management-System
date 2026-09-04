import type { PermissionCode } from './permissions';
export interface AuthorizationPolicy {
  permission: PermissionCode;
  action: string;
  entityType: string;
  states: readonly string[];
}
const policies: readonly AuthorizationPolicy[] = [
  { permission: 'PERM-TASK-VIEW', action: 'VIEW', entityType: 'TASK', states: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] },
  { permission: 'PERM-TASK-CREATE', action: 'CREATE', entityType: 'TASK', states: ['DRAFT'] },
  { permission: 'PERM-TASK-CREATE', action: 'ACTIVATE', entityType: 'TASK', states: ['DRAFT'] },
  { permission: 'PERM-TASK-ASSIGN', action: 'ASSIGN', entityType: 'TASK', states: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'ON_HOLD'] },
  { permission: 'PERM-TASK-EDIT', action: 'UPDATE_DRAFT', entityType: 'TASK', states: ['DRAFT'] },
  { permission: 'PERM-TASK-EDIT', action: 'START', entityType: 'TASK', states: ['OPEN'] },
  { permission: 'PERM-TASK-EDIT', action: 'RESUME', entityType: 'TASK', states: ['ON_HOLD'] },
  { permission: 'PERM-TASK-BLOCK', action: 'HOLD', entityType: 'TASK', states: ['OPEN', 'IN_PROGRESS'] },
  { permission: 'PERM-TASK-COMPLETE', action: 'COMPLETE', entityType: 'TASK', states: ['IN_PROGRESS'] },
  { permission: 'PERM-TASK-REOPEN', action: 'REOPEN', entityType: 'TASK', states: ['COMPLETED'] },
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
  { permission: 'PERM-DASH-VIEW', action: 'VIEW', entityType: 'DASHBOARD', states: ['ACTIVE'] },
  { permission: 'PERM-DASH-MANAGEMENT', action: 'VIEW', entityType: 'DASHBOARD', states: ['ACTIVE'] },
  { permission: 'PERM-DASH-ADMIN', action: 'VIEW', entityType: 'DASHBOARD', states: ['ACTIVE'] },
  { permission: 'PERM-ADM-AUDIT-VIEW', action: 'VIEW', entityType: 'AUDIT_EVENT', states: ['ACTIVE'] },
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
  { permission: 'PERM-RPT-VIEW', action: 'VIEW', entityType: 'REPORT', states: ['ACTIVE'] },
  { permission: 'PERM-RPT-RUN', action: 'RUN', entityType: 'REPORT', states: ['ACTIVE'] },
  { permission: 'PERM-RPT-EXPORT', action: 'EXPORT', entityType: 'REPORT', states: ['ACTIVE'] },
  { permission: 'PERM-RPT-EXPORT-CSV', action: 'EXPORT', entityType: 'REPORT', states: ['ACTIVE'] },
  { permission: 'PERM-RPT-EXPORT-XLSX', action: 'EXPORT', entityType: 'REPORT', states: ['ACTIVE'] },
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
