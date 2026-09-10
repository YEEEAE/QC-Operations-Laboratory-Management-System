import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APPROVED_PERMISSION_CODES } from '../../../db/seeds/common.js';
import { visibleNavigation } from '../../../src/ui/navigation/navigation.js';

/**
 * Universal shell regression contract.
 *
 * No page may replace the global shell controls merely to show page-specific
 * context. The Dashboard keeps the universal Topbar/Sidebar and renders
 * "QC Operational Command Center" plus snapshot/scope content inside the page
 * body (safe extension area). These assertions fail fast if any page ever
 * overrides the topbar/sidebar slots again.
 *
 * Presentation only: server authorization, state machines, SoD,
 * E-Signature, audit, and concurrency rules always outrank visual guidance.
 * Counts are shown only from authorized server data; an unavailable count
 * stays absent and is never converted into a false zero.
 */

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');
const exists = (relative: string): boolean => existsSync(join(projectRoot, relative));

describe('universal shell preservation', () => {
  it('keeps the Dashboard on the universal shell with page context in the page body', () => {
    const dashboard = read('src/pages/dashboard/index.astro');
    expect(dashboard).toContain('AppLayout');
    expect(dashboard).not.toContain('slot="topbar"');
    expect(dashboard).not.toContain("slot='topbar'");
    expect(dashboard).not.toContain('slot="sidebar"');
    expect(dashboard).not.toContain("slot='sidebar'");
    // Page-specific command-center identity stays inside page content.
    expect(dashboard).toContain('OPERATIONAL COMMAND CENTER');
    expect(dashboard).toContain('page-head');
    // Authorized scope context flows into the universal Topbar.
    expect(dashboard).toContain('scope=');
    expect(dashboard).toContain('dashboard.scopeLabel');
    // English-only product decision: dashboard stays LTR English.
    expect(dashboard).toContain('locale="en"');
    expect(dashboard).toContain('direction="ltr"');
    expect(dashboard).not.toContain('locale="ar"');
  });

  it('keeps dashboard metrics decision-ready and fail-closed', () => {
    const dashboard = read('src/pages/dashboard/index.astro');
    const query = read('src/modules/dashboard/ports/dashboard-query.ts');
    expect(query).toContain("unit: 'records'");
    expect(query).toContain("timeRange: 'current snapshot'");
    expect(query).toContain('source: string');
    expect(dashboard).toContain('Attention data is unavailable');
    expect(dashboard).toContain('Activity data is unavailable');
    expect(dashboard).toContain('No trend series is available');
    expect(dashboard).toContain('Overdue due dates');
    expect(dashboard).toContain('drilldownLabel={metric.drilldownLabel}');
  });

  it('keeps every representative top-level group page on the universal shell', () => {
    const candidates = [
      'src/pages/dashboard/index.astro',
      'src/pages/tasks/index.astro',
      'src/pages/quality/findings/index.astro',
      'src/pages/quarantine/index.astro',
      'src/pages/quarantine/receiving/index.astro',
      'src/pages/laboratory/tests/index.astro',
      'src/pages/assets/equipment/index.astro',
      'src/pages/documents/index.astro',
      'src/pages/approvals/index.astro',
      'src/pages/change-requests/index.astro',
      'src/pages/reports/index.astro',
    ];
    const present = candidates.filter((file) => exists(file));
    // All listed representatives exist in this checkout.
    expect(present.length).toBe(candidates.length);
    for (const file of present) {
      const source = read(file);
      expect(source, file).toContain('AppLayout');
      expect(source, file).not.toContain('slot="topbar"');
      expect(source, file).not.toContain("slot='topbar'");
      expect(source, file).not.toContain('slot="sidebar"');
    }
  });

  it('exposes the full universal context set from the AppLayout default shell', () => {
    const layout = read('src/ui/layouts/AppLayout.astro');
    expect(layout).toContain('data-app-shell');
    expect(layout).toContain('data-sidebar-panel');
    expect(layout).toContain('data-app-workspace');
    expect(layout).toContain('data-skip-link');
    expect(layout).toContain('slot name="topbar"');
    expect(layout).toContain('<Topbar');
    expect(layout).toContain('breadcrumbs');
    expect(layout).toContain('routeBreadcrumbs(Astro.url.pathname)');
    expect(layout).toContain('activeCapabilities');
    // Authorized scope/count context passes through; defaults never fake a zero.
    expect(layout).toContain('props.scope');
    expect(layout).toContain('props.approvalCount');
    expect(layout).toContain('props.notificationCount');
    expect(layout).not.toContain('approvalCount = 0');
    expect(layout).not.toContain('notificationCount = 0');
    expect(layout).not.toContain('?? 0');
  });

  it('preserves every universal Topbar control on all pages using the shell', () => {
    const topbar = read('src/ui/shell/Topbar.astro');
    // Navigation toggle (mobile opener, also the Escape focus-return target).
    expect(topbar).toContain('data-navigation-toggle');
    expect(topbar).toContain('aria-label="Open navigation"');
    expect(topbar).toContain('aria-controls="primary-navigation"');
    expect(topbar).toContain('aria-expanded');
    // Breadcrumbs / current location + authorized scope context.
    expect(topbar).toContain('Breadcrumbs');
    expect(topbar).toContain('ScopeIndicator');
    // Global search.
    expect(topbar).toContain('data-global-search');
    expect(topbar).toContain('Search authorized records');
    expect(topbar).toContain('href="/search"');
    // Notifications + My Approvals shortcuts.
    expect(topbar).toContain('href="/notifications"');
    expect(topbar).toContain('href="/approvals"');
    expect(topbar).toContain('Approvals');
    expect(topbar).toContain('UserMenu');
    // Counts render only from authorized server numbers, never as false zero.
    expect(topbar).toContain("typeof approvalCount === 'number'");
    expect(topbar).toContain("typeof notificationCount === 'number'");
    expect(topbar).not.toContain('approvalCount = 0');
    expect(topbar).not.toContain('notificationCount = 0');
    // Contextual updates must not steal focus: no live regions, no autofocus,
    // no programmatic focus, and no client-side count fetching in the shell.
    expect(topbar).not.toContain('aria-live');
    expect(topbar).not.toContain('autofocus');
    expect(topbar).not.toContain('.focus(');
    expect(topbar).not.toContain('fetch(');
    // Mobile opener stays operable with a 40px target at the mobile breakpoint.
    expect(topbar).toContain('min-inline-size:40px');
    expect(topbar).toContain('@media(max-width:760px)');
    expect(topbar).toContain('display:inline-flex');
  });

  it('keeps collapsed desktop navigation labelled beyond title with non-color active state', () => {
    const sidebar = read('src/ui/shell/Sidebar.astro');
    expect(sidebar).toContain('aria-label="Primary navigation"');
    expect(sidebar).toContain('data-sidebar-toggle');
    expect(sidebar).toContain('aria-label="Collapse navigation"');
    expect(sidebar).toContain('aria-expanded');
    expect(sidebar).toContain('aria-label={item.label}');
    expect(sidebar).toContain("aria-current={isActive ? 'page' : undefined}");
    expect(sidebar).toContain('data-collapsed-tip');
    // Visible tooltip appears on both hover AND keyboard focus, not title-only.
    expect(sidebar).toContain(':hover::after');
    expect(sidebar).toContain(':focus-visible::after');
    // Active state pairs the accent bar with underline + weight (not color-only).
    expect(sidebar).toContain('box-shadow:inset');
    expect(sidebar).toContain('text-decoration:underline');
    // Forced-colors keeps the active state and collapsed tooltip perceivable.
    expect(sidebar).toContain('forced-colors');
    expect(sidebar).toContain('Highlight');
    // Mobile drawer keeps a clear in-drawer dismiss affordance.
    expect(sidebar).toContain('data-drawer-close');
    expect(sidebar).toContain('aria-label="Close navigation"');
    expect(sidebar).toContain('.drawer-close{display:grid}');
  });

  it('keeps mobile drawer keyboard, scroll, and breakpoint contracts in the shell script', () => {
    const layout = read('src/ui/layouts/AppLayout.astro');
    expect(layout).toContain('data-drawer-close');
    expect(layout).toContain('setMobileNav(false, { returnFocus: true })');
    expect(layout).toContain("event.key === 'Tab'");
    expect(layout).toContain("event.key === 'Escape'");
    expect(layout).toContain("document.body.style.overflow = 'hidden'");
    expect(layout).toContain("document.body.style.overflow = ''");
    expect(layout).toContain("mobileQuery.addEventListener?.('change'");
    // Reduced motion: transitions drop out and no smooth scrolling is forced.
    expect(layout).toContain('@media (prefers-reduced-motion: reduce)');
    expect(layout).toContain('transition:none');
    expect(layout).not.toContain('smooth');
  });

  it('hides owner-exclusive navigation without grants while keeping ordinary Tasks visible', () => {
    const granted = visibleNavigation(APPROVED_PERMISSION_CODES).flatMap((group) =>
      group.items.map((item) => item.href),
    );
    expect(granted).toContain('/system/health');
    expect(granted).toContain('/admin/users');
    const ungranted = visibleNavigation([]).flatMap((group) =>
      group.items.map((item) => item.href),
    );
    expect(ungranted).toContain('/tasks');
    expect(ungranted).not.toContain('/system/health');
    expect(ungranted).not.toContain('/admin');
    expect(ungranted).not.toContain('/admin/users');
  });
});
