import type { PermissionCode } from './permissions';
export interface AuthorizationPolicy {
  permission: PermissionCode;
  action: string;
  entityType: string;
  states: readonly string[];
}
const policies: readonly AuthorizationPolicy[] = [
  ...(['FINDING','NCR','RCA','CAPA'].flatMap((entityType) => [{ permission: `PERM-${entityType === 'FINDING' ? 'FIND' : entityType}-VIEW`, action: 'VIEW', entityType, states: ['DRAFT','OPEN','UNDER_REVIEW','UNDER_INVESTIGATION','RCA_IN_PROGRESS','CAPA_IN_PROGRESS','IN_PROGRESS','SUBMITTED','APPROVED','RETURNED','AWAITING_VERIFICATION','EFFECTIVENESS_REVIEW','READY_FOR_CLOSURE','CLOSED','VOID'] }])) as AuthorizationPolicy[],
  { permission: 'PERM-FIND-CREATE', action: 'CREATE', entityType: 'FINDING', states: ['DRAFT'] }, { permission: 'PERM-FIND-EDIT', action: 'EDIT', entityType: 'FINDING', states: ['DRAFT','OPEN'] }, { permission: 'PERM-FIND-REVIEW', action: 'SUBMIT_REVIEW', entityType: 'FINDING', states: ['OPEN'] }, { permission: 'PERM-FIND-REVIEW', action: 'RETURN', entityType: 'FINDING', states: ['UNDER_REVIEW'] }, { permission: 'PERM-FIND-CLOSE', action: 'CLOSE', entityType: 'FINDING', states: ['UNDER_REVIEW'] }, { permission: 'PERM-FIND-VOID', action: 'VOID', entityType: 'FINDING', states: ['DRAFT','OPEN','UNDER_REVIEW'] },
  { permission: 'PERM-NCR-CREATE', action: 'CREATE', entityType: 'NCR', states: ['DRAFT'] }, { permission: 'PERM-NCR-EDIT', action: 'START_INVESTIGATION', entityType: 'NCR', states: ['OPEN'] }, { permission: 'PERM-NCR-EDIT', action: 'START_RCA', entityType: 'NCR', states: ['UNDER_INVESTIGATION'] }, { permission: 'PERM-NCR-EDIT', action: 'MOVE_TO_CAPA', entityType: 'NCR', states: ['RCA_IN_PROGRESS'] }, { permission: 'PERM-NCR-EDIT', action: 'READY_FOR_CLOSURE', entityType: 'NCR', states: ['CAPA_IN_PROGRESS'] }, { permission: 'PERM-NCR-CLOSE', action: 'CLOSE', entityType: 'NCR', states: ['READY_FOR_CLOSURE'] },
  { permission: 'PERM-RCA-EDIT', action: 'START', entityType: 'RCA', states: ['DRAFT','RETURNED'] }, { permission: 'PERM-RCA-SUBMIT', action: 'SUBMIT', entityType: 'RCA', states: ['IN_PROGRESS'] }, { permission: 'PERM-RCA-REVIEW', action: 'RETURN', entityType: 'RCA', states: ['SUBMITTED'] }, { permission: 'PERM-RCA-APPROVE', action: 'APPROVE', entityType: 'RCA', states: ['SUBMITTED'] },
  { permission: 'PERM-CAPA-CREATE', action: 'CREATE', entityType: 'CAPA', states: ['DRAFT'] }, { permission: 'PERM-CAPA-EDIT', action: 'START', entityType: 'CAPA', states: ['OPEN'] }, { permission: 'PERM-CAPA-CLOSE', action: 'CLOSE', entityType: 'CAPA', states: ['READY_FOR_CLOSURE'] },
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
  ...(['RECEIVING_ITEM'].flatMap((entityType) => [{ permission:'PERM-QUAR-VIEW', action:'VIEW', entityType, states:['PENDING','READY_FOR_INSPECTION','UNDER_INSPECTION','INSPECTION_COMPLETE','RELEASE_PENDING','RELEASED','HOLD','EXPIRED','CANCELLED'] }, { permission:'PERM-QUAR-CREATE', action:'CREATE', entityType, states:['PENDING'] }, { permission:'PERM-QUAR-EDIT', action:'EDIT', entityType, states:['PENDING','READY_FOR_INSPECTION','UNDER_INSPECTION','INSPECTION_COMPLETE','RELEASE_PENDING','HOLD'] }, { permission:'PERM-QUAR-START-INSPECTION', action:'START_INSPECTION', entityType, states:['READY_FOR_INSPECTION'] }, { permission:'PERM-QUAR-HOLD', action:'HOLD', entityType, states:['PENDING','READY_FOR_INSPECTION','UNDER_INSPECTION','INSPECTION_COMPLETE','RELEASE_PENDING'] }])) as unknown as AuthorizationPolicy[],
  { permission:'PERM-INSP-CREATE', action:'CREATE', entityType:'INSPECTION_REPORT', states:['DRAFT'] }, { permission:'PERM-INSP-VIEW', action:'VIEW', entityType:'INSPECTION_REPORT', states:['DRAFT','SUBMITTED','UNDER_REVIEW','RETURNED','APPROVED','REJECTED','VOID'] }, { permission:'PERM-INSP-EDIT-DRAFT', action:'EDIT', entityType:'INSPECTION_REPORT', states:['DRAFT'] }, { permission:'PERM-INSP-SUBMIT', action:'SUBMIT', entityType:'INSPECTION_REPORT', states:['DRAFT'] },
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
