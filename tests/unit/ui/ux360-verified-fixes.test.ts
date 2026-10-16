import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  navigationCurrentState,
  navigationGroups,
  navigationUtilities,
} from '../../../src/ui/navigation/navigation.js';
import { parseFactoryDateTime } from '../../../src/shared/copy/format.js';

/**
 * QC-UX-360 — regression contracts for the six findings confirmed by the
 * 2026-10-16 authenticated read-only production inspection.
 *
 * Each suite fails if a fix is reverted. They assert behaviour and data, not
 * pixel output; browser/AT confirmation stays with the authenticated E2E suite.
 */

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');

/** WCAG relative luminance for a #rgb / #rrggbb colour. */
function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((character) => character + character)
          .join('')
      : value;
  const channels = [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (left, right) => right - left,
  );
  return (lighter! + 0.05) / (darker! + 0.05);
}

describe('UX-001 — readiness layers stay separate and the release decision leads', () => {
  const health = read('src/pages/system/health.astro');
  const controlCenter = read('src/pages/system/control-center.astro');

  it('leads the System health header with release readiness, not a workflow probe', () => {
    expect(health).toContain('Release readiness: ${view.qcReleaseReadiness.replace');
    expect(health).not.toContain('Required workflow readiness: READY');
    // The four layers are individually named in the status summary.
    expect(health).toContain('Application and database connectivity');
    expect(health).toContain('Database migration state');
    expect(health).toContain('Required workflow readiness');
    expect(health).toContain('QC release acceptance evidence');
    expect(health).toContain('not a release decision');
  });

  it('never presents the control-center connectivity probe as overall approval', () => {
    expect(controlCenter).toContain("title: overview ? 'Release readiness: NOT VERIFIED'");
    expect(controlCenter).not.toContain('Application and database connectivity: READY');
    expect(controlCenter).not.toContain('Application and database connectivity: NOT READY');
    // Connectivity and migration facts keep their own cards.
    expect(controlCenter).toContain('PostgreSQL');
    expect(controlCenter).toContain('DRIFT DETECTED');
  });
});

describe('UX-002 — the sidebar filter label meets WCAG AA contrast', () => {
  const precisionLight = read('src/ui/styles/precision-light.css');
  const block =
    /html\[data-visual-direction='precision-light'\] \.app-sidebar \{([\s\S]*?)\n\}/.exec(
      precisionLight,
    )?.[1];

  it('re-resolves the inherited text colour inside the sidebar', () => {
    expect(block, 'the sidebar palette block must exist').toBeTruthy();
    expect(block).toContain('color: var(--text-primary);');
  });

  it('keeps the "Find a page" label above the 4.5:1 AA ratio on the dark sidebar', () => {
    const foreground = /--color-text-primary:\s*(#[0-9a-fA-F]{3,8})/.exec(block!)?.[1];
    const background = /background:\s*(#[0-9a-fA-F]{3,8})/.exec(block!)?.[1];
    expect(foreground).toBeTruthy();
    expect(background).toBeTruthy();
    const ratio = contrastRatio(foreground!, background!);
    expect(ratio, `computed contrast ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    // And the previous defect must not come back: the document-level ink on the
    // sidebar surface was ~1.09:1.
    expect(contrastRatio('#14243b', background!)).toBeLessThan(2);
  });
});

describe('UX-003 — only the exact route claims the current page', () => {
  const sidebar = read('src/ui/shell/Sidebar.astro');

  it('classifies the containing section as an ancestor, not a current page', () => {
    expect(navigationCurrentState('/admin/users', '/admin/users')).toBe('current');
    expect(navigationCurrentState('/admin/users', '/admin')).toBe('ancestor');
    expect(navigationCurrentState('/quarantine/receiving', '/quarantine/receiving')).toBe(
      'current',
    );
    expect(navigationCurrentState('/quarantine/receiving', '/quarantine')).toBe('ancestor');
    expect(navigationCurrentState('/admin/roles', '/admin/users')).toBe('none');
    expect(navigationCurrentState('/audit', '/reports')).toBe('none');
  });

  it('keeps aria-current="page" and the visible chip on the exact route only', () => {
    expect(sidebar).toContain("aria-current={current ? 'page' : undefined}");
    expect(sidebar).toContain("const current = state === 'current';");
    expect(sidebar).toContain("const containsCurrent = state === 'ancestor';");
    expect(sidebar).toContain('{ active: current || containsCurrent }');
    expect(sidebar).toContain(
      '{current && <span class="current-indicator" aria-hidden="true">Current page</span>}',
    );
  });
});

describe('UX-004 — the skip link moves focus into the content landmark', () => {
  const layout = read('src/ui/layouts/AppLayout.astro');

  it('makes <main> programmatically focusable and focuses it on activation', () => {
    expect(layout).toContain('<main id="main-content" class="app-main" tabindex="-1">');
    expect(layout).toContain("skipLink?.addEventListener('click'");
    expect(layout).toContain("document.getElementById('main-content')?.focus()");
    // The landmark keeps its identity and the skip link stays first in the DOM.
    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain('data-skip-link');
  });
});

describe('UX-005 — the report table wraps headers and keeps its controls readable', () => {
  const report = read('src/pages/reports/[reportCode].astro');

  it('wraps header words instead of breaking them mid-word', () => {
    expect(report).toContain('th { overflow-wrap: break-word; vertical-align: bottom; }');
  });

  it('stops the row-density control from clipping its selected label', () => {
    expect(report).toContain('.density-control { flex: 0 0 auto; white-space: nowrap; }');
    expect(report).toContain(
      '.density-control select { flex: 0 0 auto; min-inline-size: 9.5rem; }',
    );
  });

  it('keeps the wide table scrollable and reachable from the keyboard', () => {
    expect(report).toContain('class="table-scroll" role="region" tabindex="0"');
    expect(report).toContain('id="report-table"');
    expect(report).toContain('<caption>');
  });

  it('applies word-boundary wrapping to all default tables, not just reports', () => {
    const globalCss = read('src/ui/styles/global.css');
    expect(globalCss).toContain('.app-main table th{overflow-wrap:break-word;word-break:normal}');
    expect(globalCss).toContain('--table-cell-padding-block');
    expect(globalCss).toContain('--table-cell-padding-inline');
  });

  it('makes overflowing shared table regions keyboard reachable without JS-only names', () => {
    const source = read('src/ui/client/scroll-regions.ts');
    const layout = read('src/ui/layouts/AppLayout.astro');
    expect(source).toContain("const REGION_SELECTOR = '.table-wrap, .table-scroll'");
    expect(source).toContain("region.setAttribute('tabindex', '0')");
    expect(source).toContain("region.setAttribute('role', 'region')");
    expect(source).toContain("region.setAttribute('aria-label'");
    expect(source).toContain('region.scrollWidth - region.clientWidth > 1');
    expect(layout).toContain("import { initScrollRegions, watchScrollRegions } from '../client/scroll-regions'");
  });

  it('keeps the dashboard workflow decorative connector accessible and motion-safe', () => {
    const dashboard = read('src/pages/dashboard/index.astro');
    expect(dashboard).toContain('.flow-stage:not(:last-child)::after');
    expect(dashboard).toContain('pointer-events:none');
    expect(dashboard).toContain('@media(hover:hover) and (prefers-reduced-motion:no-preference)');
    expect(dashboard).toContain('@media(prefers-reduced-motion:reduce)');
    expect(dashboard).toContain('@media(forced-colors:active)');
  });
});

describe('UX-006 — audit date filters declare and use the factory timezone', () => {
  const audit = read('src/pages/audit.astro');

  it('parses datetime-local boundaries as factory time (UTC+03:00)', () => {
    expect(parseFactoryDateTime('2026-10-16T09:30')?.toISOString()).toBe(
      '2026-10-16T06:30:00.000Z',
    );
    expect(parseFactoryDateTime('2026-10-16T09:30:00')?.toISOString()).toBe(
      '2026-10-16T06:30:00.000Z',
    );
    expect(parseFactoryDateTime('2026-01-01T00:00')?.toISOString()).toBe(
      '2025-12-31T21:00:00.000Z',
    );
    expect(parseFactoryDateTime('')).toBeUndefined();
    expect(parseFactoryDateTime(null)).toBeUndefined();
    expect(parseFactoryDateTime('16/10/2026 09:30')).toBeUndefined();
  });

  it('labels the filters with the authoritative zone and filters in it', () => {
    expect(audit).toContain("parseFactoryDateTime(params.get('from'))");
    expect(audit).toContain("parseFactoryDateTime(params.get('to'))");
    expect(audit).toContain('From ({FACTORY_TIME_ZONE_LABEL})');
    expect(audit).toContain('To ({FACTORY_TIME_ZONE_LABEL})');
    expect(audit).toContain('FACTORY_TIME_ZONE_OFFSET_LABEL');
  });
});

describe('sidebar preservation gate — the frozen navigation contract is unchanged', () => {
  it('keeps the ten canonical groups in order with their labels', () => {
    expect(navigationGroups.map((group) => group.id)).toEqual([
      'overview',
      'work',
      'quality',
      'quarantine',
      'laboratory',
      'assets',
      'governance',
      'insights',
      'administration',
      'system',
    ]);
    expect(navigationGroups.map((group) => group.label)).toEqual([
      'Overview',
      'Work',
      'Quality',
      'Quarantine',
      'Laboratory',
      'Assets',
      'Governance',
      'Insights',
      'Administration',
      'System',
    ]);
  });

  it('keeps every item, href, icon, and capability binding unchanged', () => {
    const flat = navigationGroups.flatMap((group) =>
      group.items.map((item) => `${group.id}/${item.id}:${item.label}:${item.href}:${item.icon}`),
    );
    expect(flat).toEqual([
      'overview/dashboard:Dashboard:/dashboard:dashboard',
      'work/my-work:My work today:/work:dashboard',
      'work/tasks:Tasks:/tasks:tasks',
      'quality/findings:Findings:/quality/findings:findings',
      'quality/ncr:NCR:/quality/ncr:ncr',
      'quality/rca:RCA:/quality/rca:rca',
      'quality/capa:CAPA:/quality/capa:capa',
      'quality/reject-reports:Reject Reports:/reject-reports:reject-reports',
      'quarantine/quarantine:Quarantine dashboard:/quarantine:quarantine',
      'quarantine/receiving:Receiving items:/quarantine/receiving:receiving',
      'quarantine/inspections:Inspection reports:/quarantine/inspections:inspections',
      'quarantine/quarantine-administration:Quarantine administration:/quarantine/admin:settings',
      'laboratory/laboratory:Laboratory tests:/laboratory/tests:laboratory',
      'assets/equipment:Equipment:/assets/equipment:equipment',
      'assets/calibrations:Calibration records:/assets/calibrations:calibration',
      'assets/maintenance:Maintenance:/assets/maintenance:maintenance',
      'governance/approvals:My approval queue:/approvals:approvals',
      'governance/changes:Change requests:/change-requests:change-requests',
      'insights/reports:Reports:/reports:reports',
      'insights/ai-advisory:AI advisory:/ai-advisory:ai-advisory',
      'administration/admin:Administration:/admin:administration',
      'administration/admin-users:Users:/admin/users:users',
      'administration/admin-roles:Roles:/admin/roles:roles',
      'administration/admin-permissions:Permissions:/admin/permissions:permissions',
      'administration/admin-scopes:Scopes:/admin/scopes:scopes',
      'system/audit:Audit history:/audit:audit',
      'system/health:System health:/system/health:health',
      'system/control-center:Control center:/system/control-center:settings',
      'system/backups:Backup and recovery:/system/backups:backups',
      'system/documents:Controlled documents:/documents:documents',
    ]);

    expect(
      navigationUtilities.map((item) => `${item.id}:${item.label}:${item.href}:${item.icon}`),
    ).toEqual([
      'notifications:Notifications:/notifications:notifications',
      'search:Search:/search:search',
      'account:Account settings:/account:account',
      'help:Operating guides:/help:help',
    ]);
  });

  it('keeps the quarantine administration capability gate unchanged', () => {
    const admin = navigationGroups
      .find((group) => group.id === 'quarantine')!
      .items.find((item) => item.id === 'quarantine-administration');
    expect(admin?.capability).toBe('PERM-ADM-TEMPLATES');
  });
});
