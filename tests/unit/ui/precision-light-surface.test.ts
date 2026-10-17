import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('CAPA Variant A presentation', () => {
  it('styles the authenticated shell without replacing its permission-filtered sidebar', () => {
    const layout = read('src/ui/layouts/AppLayout.astro');
    const base = read('src/ui/layouts/BaseLayout.astro');
    const styles = read('src/ui/styles/capa-a.css');
    expect(layout).toContain('visualDirection="capa-a"');
    expect(layout).toContain('<Sidebar actor={actor} />');
    expect(base).toContain('data-visual-direction={visualDirection}');
    expect(styles).toContain("html[data-visual-direction='capa-a'] .app-sidebar");
    expect(styles).toContain('--color-canvas: #14181e;');
    expect(styles).toContain('--color-text-primary: #e8edf5;');
  });

  it('sets the palette on the document element so body text and background follow it', () => {
    const styles = read('src/ui/styles/capa-a.css');
    // Declaring the palette only on `.app-shell` leaves `body` on the previous
    // dark tokens, so any element without its own colour renders unreadable
    // light-on-light text.
    expect(styles).toContain("html[data-visual-direction='capa-a'] body");
    expect(styles).toContain('color: var(--text-primary);');
    expect(styles).not.toContain(".app-shell[data-visual-direction='capa-a'] {");
  });

  it('presents priority counts from existing register-backed metrics without synthetic numbers', () => {
    const counts = read('src/ui/components/dashboard/DashboardCounts.astro');
    const dashboard = read('src/pages/dashboard/index.astro');
    expect(counts).toContain("'pending-review', 'tasks-due-today', 'tasks-overdue', 'hold-items'");
    expect(counts).toContain('value={metric.value}');
    expect(counts).toContain('href={metric.unavailable ? undefined : metric.href}');
    expect(dashboard.indexOf('class="priority-panel"')).toBeLessThan(
      dashboard.indexOf('<DashboardCounts metrics={dashboard.metrics} />'),
    );
  });

  it('keeps a zero-baseline two-dimensional chart and its accessible data table', () => {
    const chart = read('src/ui/charts/Chart.astro');
    expect(chart).toContain('const baseline = 194;');
    expect(chart).toContain('<line x1={left} y1={baseline}');
    expect(chart).toContain('<table class="data-alt">');
    expect(chart).toContain('{point.value}');
  });
});
