export interface NavigationItem { id: string; label: string; href: string; icon: string; capability?: string; }
export interface NavigationGroup { id: string; label: string; items: NavigationItem[]; }

export const navigationGroups: NavigationGroup[] = [
  { id: 'overview', label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: '⌂', capability: 'PERM-DASH-VIEW' }] },
  { id: 'work', label: 'Work', items: [{ id: 'tasks', label: 'Tasks', href: '/tasks', icon: '✓', capability: 'PERM-TASK-VIEW-OWN' }] },
  { id: 'quality', label: 'Quality', items: [
    { id: 'findings', label: 'Findings', href: '/quality/findings', icon: '!', capability: 'PERM-FIND-VIEW' },
    { id: 'ncr', label: 'NCR', href: '/quality/ncr', icon: 'N', capability: 'PERM-NCR-VIEW' },
    { id: 'rca', label: 'RCA', href: '/quality/rca', icon: 'R', capability: 'PERM-RCA-VIEW' },
    { id: 'capa', label: 'CAPA', href: '/quality/capa', icon: 'C', capability: 'PERM-CAPA-VIEW' },
  ] },
  { id: 'quarantine', label: 'Quarantine', items: [{ id: 'quarantine', label: 'Quarantine dashboard', href: '/quarantine', icon: 'Q', capability: 'PERM-QUAR-VIEW' }, { id: 'receiving', label: 'Receiving items', href: '/quarantine/receiving', icon: '↳', capability: 'PERM-REC-VIEW' }, { id: 'inspections', label: 'Inspection reports', href: '/quarantine/inspections', icon: '▣', capability: 'PERM-INSP-VIEW' }] },
  { id: 'laboratory', label: 'Laboratory', items: [{ id: 'laboratory', label: 'Laboratory tests', href: '/laboratory/tests', icon: '◌', capability: 'PERM-LAB-VIEW' }] },
  { id: 'assets', label: 'Assets', items: [{ id: 'equipment', label: 'Equipment', href: '/assets/equipment', icon: '▦', capability: 'PERM-EQUIP-VIEW' }, { id: 'calibrations', label: 'Calibration', href: '/assets/calibrations', icon: '⌁', capability: 'PERM-CAL-VIEW' }, { id: 'maintenance', label: 'Maintenance', href: '/assets/maintenance', icon: '⚙', capability: 'PERM-MAINT-VIEW' }] },
  { id: 'governance', label: 'Governance', items: [{ id: 'approvals', label: 'My approvals', href: '/approvals', icon: '◉', capability: 'PERM-APR-VIEW-OWN' }, { id: 'changes', label: 'Change requests', href: '/change-requests', icon: '⇄', capability: 'PERM-CR-VIEW' }] },
  { id: 'insights', label: 'Insights', items: [{ id: 'reports', label: 'Reports', href: '/reports', icon: '▥', capability: 'PERM-RPT-VIEW' }] },
  { id: 'system', label: 'System', items: [{ id: 'administration', label: 'Administration', href: '/administration', icon: '⚙', capability: 'PERM-ADM-VIEW' }, { id: 'health', label: 'System health', href: '/system/health', icon: '♥', capability: 'PERM-HLTH-VIEW' }, { id: 'backups', label: 'Backups', href: '/system/backups', icon: '⛁', capability: 'PERM-BKP-VIEW' }] },
];

export function visibleNavigation(capabilities: readonly string[] = []) {
  const allowed = new Set(capabilities);
  return navigationGroups.map(group => ({ ...group, items: group.items.filter(item => !item.capability || allowed.has(item.capability)) })).filter(group => group.items.length > 0);
}
