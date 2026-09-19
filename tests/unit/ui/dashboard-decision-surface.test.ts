import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * QC-100-FINAL-005 dashboard decision-surface contract.
 *
 * Static guardrails for the parts that populated-PostgreSQL and browser suites
 * cannot keep from regressing during a copy or layout edit:
 * - every KPI declares its numerator, state, actor scope and time window;
 * - an authorization failure is never presented as a provider outage, and an
 *   unavailable provider never becomes a zero;
 * - the personal KPI drill-downs carry the ownership filter their registers
 *   actually implement;
 * - the definition disclosure meets the 44px target standard and metadata
 *   stays at or above the 12px readable floor.
 */
const root = fileURLToPath(new URL('../../..', import.meta.url));
const read = (file: string) => readFileSync(join(root, file), 'utf8');

describe('dashboard decision surface', () => {
  const dashboard = read('src/pages/dashboard/index.astro');
  const kpiCard = read('src/ui/charts/KpiCard.astro');
  const port = read('src/modules/dashboard/ports/dashboard-query.ts');

  it('defines the KPI contract on the read model, not in the page', () => {
    for (const field of ['numerator: string', 'state: string', 'actorScope: string']) {
      expect(port, field).toContain(field);
    }
    expect(port).toContain("unit: 'records'");
    expect(port).toContain("timeRange: 'current snapshot'");
  });

  it('forwards the whole contract to the KPI card', () => {
    for (const prop of [
      'numerator={metric.numerator}',
      'state={metric.state}',
      'actorScope={metric.actorScope}',
    ]) {
      expect(dashboard, prop).toContain(prop);
    }
    expect(kpiCard).toContain('numerator?: string');
    expect(kpiCard).toContain('Counts:');
    expect(kpiCard).toContain('Condition:');
  });

  it('separates an authorization failure from a provider outage', () => {
    expect(dashboard).toContain('accessDenied');
    expect(dashboard).toContain("error.category === 'AUTHORIZATION'");
    // The denied branch never claims a data outage, and the KPI grid is not
    // rendered for a denied account.
    expect(dashboard).toContain('!accessDenied && !providerUnavailable && <section class="kpis"');
    expect(dashboard).toContain('!accessDenied && <section class="dashboard-grid"');
    expect(dashboard).toContain('Your account cannot open the dashboard');
  });

  it('links personal counters to the ownership filter their registers implement', () => {
    const sources = read('src/modules/dashboard/application/dashboard-sources.ts');
    expect(sources).toContain('inspectionResult=HOLD&ownership=mine');
    expect(sources).toContain('state=RETURNED&ownership=mine');
    expect(sources).toContain('assignee=mine&due=overdue');
    expect(sources).toContain('assignee=mine&due=today');
    for (const page of [
      'src/pages/quarantine/receiving/index.astro',
      'src/pages/quarantine/inspections/index.astro',
    ]) {
      const source = read(page);
      expect(source, page).toContain("params.get('ownership') === 'mine'");
      expect(source, page).toContain('ownership,');
      expect(source, page).toContain('Only mine');
    }
    const tasksPage = read('src/pages/tasks/index.astro');
    expect(tasksPage).toContain("params.get('assignee') === 'mine'");
    expect(tasksPage).toContain("params.get('due')");
    expect(tasksPage).toContain('Only mine');
  });

  it('declares only drill-down links whose filters the target register parses', () => {
    const sources = read('src/modules/dashboard/application/dashboard-sources.ts');
    const pages: Readonly<Record<string, string>> = {
      '/approvals': 'src/pages/approvals/index.astro',
      '/notifications': 'src/pages/notifications.astro',
      '/quarantine/receiving': 'src/pages/quarantine/receiving/index.astro',
      '/quarantine/inspections': 'src/pages/quarantine/inspections/index.astro',
      '/tasks': 'src/pages/tasks/index.astro',
      '/assets/calibrations': 'src/pages/assets/calibrations/index.astro',
    };
    const hrefs = [...sources.matchAll(/href: '([^']+)'/g)].map((match) => match[1]!);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const url = new URL(href, 'http://localhost');
      const page = pages[url.pathname];
      expect(page, `no register mapped for ${href}`).toBeTruthy();
      const source = read(page!);
      for (const param of url.searchParams.keys()) {
        expect(source, `${href} → ${page} must parse ${param}`).toContain(`'${param}'`);
      }
    }
    // The task drill-downs are the only ones that use a due-date window, and
    // the tasks register is the page that implements it.
    expect(hrefs).toContain('/tasks?assignee=mine&due=overdue');
    expect(read(pages['/tasks']!)).toContain("'overdue'");
  });

  it('feeds each counter and its queue items from one read with a declared severity', () => {
    const sources = read('src/modules/dashboard/application/dashboard-sources.ts');
    expect(sources).toContain("severity: 'CRITICAL'");
    expect(sources).toContain('Approval is waiting for your decision');
    // The count is the source's own row count, so no second query can disagree
    // with what the queue lists, and a read failure is not a zero.
    const attention = read('src/modules/dashboard/application/dashboard-attention.ts');
    expect(attention).toContain('metric: { ...metric, value: rows.length }');
    expect(attention).toContain('NOT_AUTHORIZED');
    expect(attention).toContain('throw error;');
    const query = read('src/modules/dashboard/infrastructure/postgres-dashboard-query.ts');
    expect(query).toContain('DashboardMetricSource');
    expect(query).toContain('readMetricSource');
    expect(query).toContain('buildAttention');
    // Severeities are declared per source, never stamped onto rows in SQL.
    expect(query).not.toContain("'WARNING' AS severity");
  });

  it('keeps metadata readable and the definition target accessible', () => {
    expect(kpiCard).not.toMatch(/font-size:\s*1[01]px/);
    expect(kpiCard).toContain('var(--font-size-xs)');
    expect(kpiCard).toMatch(/\.definition summary\{[^}]*inline-size:44px/);
    expect(kpiCard).toMatch(/\.definition summary\{[^}]*block-size:44px/);
  });

  it('keeps the disclosure glyph decorative so the visible label matches its name', () => {
    // The disclosure carries an accessible name; its visible glyph must be
    // hidden from the name computation or the visible text ("i") would not be
    // contained in the accessible name (WCAG 2.5.3 label in name).
    expect(kpiCard).toContain('<span aria-hidden="true">i</span>');
    // The global search keeps its visible label inside the accessible name.
    // QC-100-FINAL-006: the name must contain every visible label text; the
    // parenthetical Control K aria-label broke label-content-name-mismatch
    // (WCAG 2.5.3), so the hint is folded into the name with a comma.
    const topbar = read('src/ui/shell/Topbar.astro');
    expect(topbar).toContain('aria-label="Search authorized records, Control K"');
    expect(topbar).not.toContain('aria-label="Search authorized records (Control K)"');
    expect(topbar).toContain('<span>Search</span>');
  });

  it('requires an approved series contract before anything is plotted', () => {
    for (const field of [
      'grain: string',
      'numerator: string',
      'actorScope: string',
      'windowLabel: string',
      'zeroPolicy: string',
    ]) {
      expect(port, field).toContain(field);
    }
    for (const state of ['AVAILABLE', 'EMPTY', 'UNAVAILABLE', 'NOT_SUPPLIED']) {
      expect(port, state).toContain(state);
    }
    // Only AVAILABLE carries points, so no consumer can plot an empty or
    // unavailable series as a flat zero line.
    const projection = read('src/modules/dashboard/application/dashboard-series.ts');
    expect(projection).toContain("state: 'AVAILABLE', message: '', points");
    expect(projection).toContain("state: 'EMPTY'");
    expect(projection).toContain("state: 'UNAVAILABLE'");
    expect(projection).toContain("state: 'NOT_SUPPLIED'");
    expect(projection).toContain('points: [],');
    // The series comes from the owning module's contract, not dashboard SQL.
    const dependencies = read('src/modules/dashboard/application/dependencies.ts');
    expect(dependencies).toContain('quarantineReadDependencies().receivingTrend');
    expect(dependencies).toContain("ownership: 'mine'");
  });

  it('plots only the available series and states every other state honestly', () => {
    expect(dashboard).toContain("import Chart from '../../ui/charts/Chart.astro'");
    expect(dashboard).toContain("dashboard.series.state === 'AVAILABLE' ? <Chart");
    expect(dashboard).toContain('{dashboard.series.message}');
    // Nothing numeric is rendered before a confirmed snapshot: the held value
    // carries the explicit unavailable series state, never a zero.
    expect(dashboard).toContain('emptyDashboard(actor)');
    expect(read('src/modules/dashboard/application/dashboard-empty.ts')).toContain(
      'seriesUnavailable()',
    );
    // The non-plotting copy states that nothing is drawn and no zero is offered.
    expect(read('src/modules/dashboard/application/dashboard-series.ts')).toContain(
      'No trend series is available',
    );
    expect(read('src/modules/dashboard/application/dashboard-series.ts')).toContain(
      'never shown as an empty chart or a zero',
    );
    // The coverage panel is data-driven: the page hard-codes no data claim, and
    // every unrendered data product states its own reason in the read model.
    expect(dashboard).toContain('dashboard.coverage.map');
    const sources = read('src/modules/dashboard/application/dashboard-sources.ts');
    for (const key of ['laboratory-workload', 'document-review', 'reject-analytics']) {
      expect(sources, key).toContain(`key: '${key}'`);
    }
    expect(sources).toContain("state: 'NOT_SUPPLIED'");
    expect(sources).toContain('no rejected quantity or trend is estimated here');
  });

  it('keeps the icon-only shell controls at the 44px target size', () => {
    const topbar = read('src/ui/shell/Topbar.astro');
    // Icon-only search, notifications and approvals links must not collapse to
    // the icon width when their text is hidden at the mobile breakpoint.
    expect(topbar).toMatch(/\.search\{[^}]*min-inline-size:44px/);
    expect(topbar).toMatch(/\.top-link\{[^}]*min-inline-size:44px/);
  });
});
