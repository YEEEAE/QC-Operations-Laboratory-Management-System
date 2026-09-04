import { describe, expect, it } from 'vitest';
import { navigationGroups, visibleNavigation } from '../../../../src/ui/navigation/navigation';
import { serializeChartQuery } from '../../../../src/ui/charts/chart-client';

describe('MASTER-016 UI contracts', () => {
  it('renders only capability-visible navigation groups without granting access', () => {
    const visible = visibleNavigation(['PERM-DASH-VIEW', 'PERM-APR-VIEW-OWN']);
    expect(visible.flatMap(group => group.items.map(item => item.href))).toEqual(['/dashboard', '/approvals']);
    expect(navigationGroups.length).toBeGreaterThan(1);
  });

  it('serializes chart points as display data, not executable query fragments', () => {
    expect(serializeChartQuery([{ label: 'Week 1', value: 4 }, { label: 'HOLD', value: 2 }])).toBe('Week%201:4,HOLD:2');
  });
});
