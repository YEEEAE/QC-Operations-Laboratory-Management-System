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

  it('links personal KPIs to the ownership filter their registers implement', () => {
    const query = read('src/modules/dashboard/infrastructure/postgres-dashboard-query.ts');
    expect(query).toContain('inspectionResult=HOLD&ownership=mine');
    expect(query).toContain('releaseState=RELEASED&ownership=mine');
    expect(query).toContain('finalResult=PASS&ownership=mine');
    for (const page of [
      'src/pages/quarantine/receiving/index.astro',
      'src/pages/quarantine/inspections/index.astro',
    ]) {
      const source = read(page);
      expect(source, page).toContain("params.get('ownership') === 'mine'");
      expect(source, page).toContain('ownership,');
      expect(source, page).toContain('Only mine');
    }
  });

  it('keeps the approval queue as one rollup feeding the counter and the queue', () => {
    const query = read('src/modules/dashboard/infrastructure/postgres-dashboard-query.ts');
    expect(query).toContain('DashboardApprovalQueue');
    expect(query).toContain('Approval is waiting for your decision');
    expect(query).toContain("severity: 'CRITICAL'");
    // Severity is derived, never hard-coded for every row.
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
    const topbar = read('src/ui/shell/Topbar.astro');
    expect(topbar).toContain('aria-label="Search authorized records (Control K)"');
    expect(topbar).toContain('<span>Search</span>');
  });

  it('keeps the icon-only shell controls at the 44px target size', () => {
    const topbar = read('src/ui/shell/Topbar.astro');
    // Icon-only search, notifications and approvals links must not collapse to
    // the icon width when their text is hidden at the mobile breakpoint.
    expect(topbar).toMatch(/\.search\{[^}]*min-inline-size:44px/);
    expect(topbar).toMatch(/\.top-link\{[^}]*min-inline-size:44px/);
  });
});
