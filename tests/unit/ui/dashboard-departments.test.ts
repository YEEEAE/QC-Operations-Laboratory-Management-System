import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');

describe('dashboard department discoverability', () => {
  const dashboard = read('src/pages/dashboard/index.astro');

  it('renders permission-scoped departments from the canonical navigation tree', () => {
    expect(dashboard).toContain(
      "import { visibleNavigation, visibleNavigationUtilities } from '../../ui/navigation/navigation.js'",
    );
    expect(dashboard).toContain('const departments = visibleNavigation(actor)');
    expect(dashboard).toContain('const departmentTools = visibleNavigationUtilities(actor)');
    expect(dashboard).toContain('aria-labelledby="departments-title"');
    expect(dashboard).toContain('Operational areas');
  });

  it('does not hardcode a second navigation taxonomy', () => {
    // Department links come from group.items, not duplicated href literals.
    expect(dashboard).toContain('{departments.map((group) =>');
    expect(dashboard).toContain('{group.items.map((item) =>');
    expect(dashboard).not.toContain('slot="sidebar"');
    expect(dashboard).not.toContain('slot="topbar"');
  });

  it('keeps attention and queues before counts', () => {
    const attention = dashboard.indexOf('aria-labelledby="attention-title"');
    const queues = dashboard.indexOf('aria-labelledby="workflow-access-title"');
    const departments = dashboard.indexOf('aria-labelledby="departments-title"');
    const summary = dashboard.indexOf('<DashboardCounts metrics={dashboard.metrics}');
    expect(attention).toBeGreaterThan(-1);
    expect(queues).toBeGreaterThan(attention);
    expect(departments).toBeGreaterThan(queues);
    expect(summary).toBeGreaterThan(departments);
  });
});
