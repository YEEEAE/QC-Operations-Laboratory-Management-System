import type { PermissionCode } from '../../shared/authorization/permissions';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
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
        icon: '⌂',
        capability: ['PERM-DASH-VIEW', 'PERM-DASH-MANAGEMENT', 'PERM-DASH-ADMIN'],
      },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    items: [
      { id: 'tasks', label: 'Tasks', href: '/tasks', icon: '✓', capability: 'PERM-TASK-VIEW' },
    ],
  },
  {
    id: 'quality',
    label: 'Quality',
    items: [
      {
        id: 'findings',
        label: 'Findings',
        href: '/quality/findings',
        icon: '!',
        capability: 'PERM-FIND-VIEW',
      },
      { id: 'ncr', label: 'NCR', href: '/quality/ncr', icon: 'N', capability: 'PERM-NCR-VIEW' },
      { id: 'rca', label: 'RCA', href: '/quality/rca', icon: 'R', capability: 'PERM-RCA-VIEW' },
      { id: 'capa', label: 'CAPA', href: '/quality/capa', icon: 'C', capability: 'PERM-CAPA-VIEW' },
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
        icon: 'Q',
        capability: 'PERM-QUAR-VIEW',
      },
      {
        id: 'receiving',
        label: 'Receiving items',
        href: '/quarantine/receiving',
        icon: '↳',
        capability: 'PERM-QUAR-VIEW',
      },
      {
        id: 'inspections',
        label: 'Inspection reports',
        href: '/quarantine/inspections',
        icon: '▣',
        capability: 'PERM-INSP-VIEW',
      },
      {
        id: 'quarantine-administration',
        label: 'Quarantine administration',
        href: '/quarantine/admin',
        icon: '⚙',
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
        icon: '◌',
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
        icon: '▦',
        capability: 'PERM-EQP-VIEW',
      },
      {
        id: 'calibrations',
        label: 'Calibration',
        href: '/assets/calibrations',
        icon: '⌁',
        capability: 'PERM-CAL-VIEW',
      },
      {
        id: 'maintenance',
        label: 'Maintenance',
        href: '/assets/maintenance',
        icon: '⚙',
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
        icon: '◉',
        capability: 'PERM-APR-VIEW-ASSIGNED',
      },
      {
        id: 'changes',
        label: 'Change requests',
        href: '/change-requests',
        icon: '⇄',
        capability: 'PERM-CHG-VIEW',
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { id: 'reports', label: 'Reports', href: '/reports', icon: '▥', capability: 'PERM-RPT-VIEW' },
      {
        id: 'ai-advisory',
        label: 'AI advisory',
        href: '/ai-advisory',
        icon: '✦',
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
    id: 'system',
    label: 'System',
    items: [
      {
        id: 'audit',
        label: 'Audit history',
        href: '/audit',
        icon: '⌘',
        capability: 'PERM-ADM-AUDIT-VIEW',
      },
      {
        id: 'health',
        label: 'System health',
        href: '/system/health',
        icon: '♥',
        capability: 'PERM-HLTH-VIEW',
      },
      {
        id: 'backups',
        label: 'Backups',
        href: '/system/backups',
        icon: '⛁',
        capability: 'PERM-BKP-VIEW',
      },
      {
        id: 'documents',
        label: 'Controlled documents',
        href: '/documents',
        icon: '▤',
        capability: 'PERM-DOC-VIEW',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/notifications',
        icon: '●',
        capability: 'PERM-NOT-VIEW-OWN',
      },
      {
        id: 'search',
        label: 'Search',
        href: '/search',
        icon: '⌕',
        capability: 'PERM-SRCH-USE',
      },
      {
        id: 'account',
        label: 'Account',
        href: '/account',
        icon: '◎',
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
