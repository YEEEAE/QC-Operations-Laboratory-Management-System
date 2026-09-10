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
      },
      { id: 'ncr', label: 'NCR', href: '/quality/ncr', icon: 'ncr' },
      { id: 'rca', label: 'RCA', href: '/quality/rca', icon: 'rca' },
      {
        id: 'capa',
        label: 'CAPA',
        href: '/quality/capa',
        icon: 'capa',
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
      },
      {
        id: 'receiving',
        label: 'Receiving items',
        href: '/quarantine/receiving',
        icon: 'receiving',
      },
      {
        id: 'inspections',
        label: 'Inspection reports',
        href: '/quarantine/inspections',
        icon: 'inspections',
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
      },
      {
        id: 'calibrations',
        label: 'Calibration',
        href: '/assets/calibrations',
        icon: 'calibration',
      },
      {
        id: 'maintenance',
        label: 'Maintenance',
        href: '/assets/maintenance',
        icon: 'maintenance',
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
      },
      {
        id: 'changes',
        label: 'Change requests',
        href: '/change-requests',
        icon: 'change-requests',
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
      },
      {
        id: 'ai-advisory',
        label: 'AI advisory',
        href: '/ai-advisory',
        icon: 'ai-advisory',
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
      },
      {
        id: 'documents',
        label: 'Controlled documents',
        href: '/documents',
        icon: 'documents',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/notifications',
        icon: 'notifications',
      },
      {
        id: 'search',
        label: 'Search',
        href: '/search',
        icon: 'search',
      },
      {
        id: 'account',
        label: 'Account',
        href: '/account',
        icon: 'account',
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
  const sectionLabels: Record<string, { label: string; href?: string }> = {
    quality: { label: 'Quality', href: '/quality' },
    quarantine: { label: 'Quarantine', href: '/quarantine' },
    laboratory: { label: 'Laboratory', href: '/laboratory' },
    assets: { label: 'Assets', href: '/assets' },
    documents: { label: 'Controlled documents', href: '/documents' },
    approvals: { label: 'My approvals', href: '/approvals' },
    'change-requests': { label: 'Change requests', href: '/change-requests' },
    reports: { label: 'Reports', href: '/reports' },
    admin: { label: 'Administration', href: '/admin' },
    system: { label: 'System' },
  };
  const matched = navigationGroups
    .flatMap((group) => group.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];

  const segments = pathname.split('/').filter(Boolean);
  const section = sectionLabels[segments[0] ?? ''];
  if (!matched && !section) return [];

  const crumbs: Array<{ label: string; href?: string }> = [];
  if (section && (!matched || (matched.label !== section.label && (pathname !== matched.href || !section.href)))) {
    crumbs.push({ label: section.label, href: section.href });
  }
  if (matched) {
    const isRecordWorkspace = pathname !== matched.href;
    crumbs.push({ label: matched.label, href: isRecordWorkspace ? matched.href : undefined });
  }

  const leaf = segments.at(-1);
  const suffix = leaf === 'new' ? 'New record' : leaf === 'review' ? 'Review' : leaf === 'execute' ? 'Execution' : undefined;
  if (suffix && crumbs.at(-1)?.label !== suffix) crumbs.push({ label: suffix });
  else if (matched && pathname !== matched.href && !suffix) crumbs.push({ label: 'Record detail' });
  return crumbs;
}
