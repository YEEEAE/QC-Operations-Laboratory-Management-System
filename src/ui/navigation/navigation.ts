import type { PermissionCode } from '../../shared/authorization/permissions';
import type { IconName } from '../components/icon';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  capability?: PermissionCode | readonly PermissionCode[];
}
export interface NavigationGroup {
  id: string;
  label: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'dashboard',
        capability: ['PERM-DASH-VIEW', 'PERM-DASH-MANAGEMENT', 'PERM-DASH-ADMIN'],
      },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    items: [{ id: 'tasks', label: 'Tasks', href: '/tasks', icon: 'tasks' }],
  },
  {
    id: 'quality',
    label: 'Quality',
    items: [
      {
        id: 'findings',
        label: 'Findings',
        href: '/quality/findings',
        icon: 'findings',
        capability: 'PERM-FIND-VIEW',
      },
      { id: 'ncr', label: 'NCR', href: '/quality/ncr', icon: 'ncr', capability: 'PERM-NCR-VIEW' },
      { id: 'rca', label: 'RCA', href: '/quality/rca', icon: 'rca', capability: 'PERM-RCA-VIEW' },
      {
        id: 'capa',
        label: 'CAPA',
        href: '/quality/capa',
        icon: 'capa',
        capability: 'PERM-CAPA-VIEW',
      },
    ],
  },
  {
    id: 'quarantine',
    label: 'Quarantine',
    items: [
      {
        id: 'quarantine',
        label: 'Quarantine dashboard',
        href: '/quarantine',
        icon: 'quarantine',
        capability: 'PERM-QUAR-VIEW',
      },
      {
        id: 'receiving',
        label: 'Receiving items',
        href: '/quarantine/receiving',
        icon: 'receiving',
        capability: 'PERM-QUAR-VIEW',
      },
      {
        id: 'inspections',
        label: 'Inspection reports',
        href: '/quarantine/inspections',
        icon: 'inspections',
        capability: 'PERM-INSP-VIEW',
      },
      {
        id: 'quarantine-administration',
        label: 'Quarantine administration',
        href: '/quarantine/admin',
        icon: 'settings',
        capability: 'PERM-ADM-TEMPLATES',
      },
    ],
  },
  {
    id: 'laboratory',
    label: 'Laboratory',
    items: [
      {
        id: 'laboratory',
        label: 'Laboratory tests',
        href: '/laboratory/tests',
        icon: 'laboratory',
        capability: 'PERM-LAB-VIEW',
      },
    ],
  },
  {
    id: 'assets',
    label: 'Assets',
    items: [
      {
        id: 'equipment',
        label: 'Equipment',
        href: '/assets/equipment',
        icon: 'equipment',
        capability: 'PERM-EQP-VIEW',
      },
      {
        id: 'calibrations',
        label: 'Calibration',
        href: '/assets/calibrations',
        icon: 'calibration',
        capability: 'PERM-CAL-VIEW',
      },
      {
        id: 'maintenance',
        label: 'Maintenance',
        href: '/assets/maintenance',
        icon: 'maintenance',
        capability: 'PERM-MNT-VIEW',
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    items: [
      {
        id: 'approvals',
        label: 'My approvals',
        href: '/approvals',
        icon: 'approvals',
        capability: 'PERM-APR-VIEW-ASSIGNED',
      },
      {
        id: 'changes',
        label: 'Change requests',
        href: '/change-requests',
        icon: 'change-requests',
        capability: 'PERM-CHG-VIEW',
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: 'reports',
        capability: 'PERM-RPT-VIEW',
      },
      {
        id: 'ai-advisory',
        label: 'AI advisory',
        href: '/ai-advisory',
        icon: 'ai-advisory',
        capability: [
          'PERM-AI-USE',
          'PERM-AI-SUMMARIZE',
          'PERM-AI-SUGGEST',
          'PERM-AI-DRAFT',
          'PERM-AI-ADMIN',
        ],
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      {
        id: 'admin',
        label: 'Administration',
        href: '/admin',
        icon: 'administration',
        capability: ['PERM-ADM-USERS', 'PERM-ADM-ROLES', 'PERM-ADM-PERMISSIONS', 'PERM-ADM-SCOPES'],
      },
      {
        id: 'admin-users',
        label: 'Users',
        href: '/admin/users',
        icon: 'users',
        capability: ['PERM-ADM-USERS', 'PERM-IDN-MANAGE-USERS'],
      },
      {
        id: 'admin-roles',
        label: 'Roles',
        href: '/admin/roles',
        icon: 'roles',
        capability: ['PERM-ADM-ROLES', 'PERM-ADM-ROLE-VIEW'],
      },
      {
        id: 'admin-permissions',
        label: 'Permissions',
        href: '/admin/permissions',
        icon: 'permissions',
        capability: ['PERM-ADM-PERMISSIONS', 'PERM-ADM-PERMISSION-VIEW'],
      },
      {
        id: 'admin-scopes',
        label: 'Scopes',
        href: '/admin/scopes',
        icon: 'scopes',
        capability: ['PERM-ADM-SCOPES', 'PERM-ADM-SCOPE-ASSIGN'],
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        id: 'audit',
        label: 'Audit history',
        href: '/audit',
        icon: 'audit',
        capability: 'PERM-ADM-AUDIT-VIEW',
      },
      {
        id: 'health',
        label: 'System health',
        href: '/system/health',
        icon: 'health',
        capability: 'PERM-HLTH-VIEW',
      },
      {
        id: 'backups',
        label: 'Backups',
        href: '/system/backups',
        icon: 'backups',
        capability: 'PERM-BKP-VIEW',
      },
      {
        id: 'documents',
        label: 'Controlled documents',
        href: '/documents',
        icon: 'documents',
        capability: 'PERM-DOC-VIEW',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/notifications',
        icon: 'notifications',
        capability: 'PERM-NOT-VIEW-OWN',
      },
      {
        id: 'search',
        label: 'Search',
        href: '/search',
        icon: 'search',
        capability: 'PERM-SRCH-USE',
      },
      {
        id: 'account',
        label: 'Account',
        href: '/account',
        icon: 'account',
        capability: 'PERM-IDN-VIEW-SELF',
      },
    ],
  },
];

export function visibleNavigation(capabilities: readonly string[] = []) {
  const allowed = new Set(capabilities);
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.capability) return true;
        const required = Array.isArray(item.capability) ? item.capability : [item.capability];
        return required.some((permission) => allowed.has(permission));
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function routeBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  const matched = navigationGroups
    .flatMap((group) => group.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];

  if (!matched) return [];
  const isRecordWorkspace = pathname !== matched.href;
  return [{ label: matched.label, href: isRecordWorkspace ? matched.href : undefined }];
}
