import { describe, expect, it } from 'vitest';
import {
  buildMyWork,
  myWorkSources,
  MY_WORK_ITEM_LIMIT,
} from '../../../src/modules/dashboard/application/my-work-queue.js';
import {
  MY_WORK_GROUP_DEFINITIONS,
  MY_WORK_UNRESOLVED_SOURCES,
} from '../../../src/modules/dashboard/application/my-work-definitions.js';
import type {
  DashboardAttentionRow,
  DashboardMetricSource,
} from '../../../src/modules/dashboard/ports/dashboard-query.js';
import type { MyWorkCategory } from '../../../src/modules/dashboard/ports/my-work.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

/**
 * QC-100-FINAL-022 item 2 — the queue contract, without a database.
 *
 * The integration suite proves the numbers against real registers; this suite
 * pins the behaviour that is easy to regress silently: one record listed once,
 * a deterministic order, and an unreadable source reported as unreadable
 * instead of as an empty group or a zero.
 */

const viewer: ActorContext = {
  id: 'viewer-1',
  loginIdentity: 'viewer',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [{ code: 'PERM-TASK-VIEW', scopes: ['GLOBAL'] }],
};

const NOW = new Date('2026-09-20T12:00:00.000Z');

function row(overrides: Partial<DashboardAttentionRow> & { id: string }): DashboardAttentionRow {
  return {
    title: overrides.id,
    state: 'OPEN',
    href: `/tasks/${overrides.id}`,
    anchor: 'due',
    ...overrides,
  };
}

interface SourceSpec {
  key: string;
  category: MyWorkCategory;
  rows: readonly DashboardAttentionRow[];
  href?: string;
  nextAction?: string;
  responsibleRole?: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  reason?: string;
}

function source(spec: SourceSpec): DashboardMetricSource {
  return {
    metric: {
      key: spec.key,
      label: `Label ${spec.key}`,
      unit: 'records',
      denominator: 'Every record',
      grain: 'One record',
      timeRange: 'current snapshot',
      timezone: 'UTC',
      freshness: 'Read now.',
      source: 'Test register',
      definition: 'Test',
      numerator: 'Records',
      state: 'OPEN',
      actorScope: 'Assigned to you',
      drilldown: 'test',
      href: spec.href ?? `/test/${spec.key}`,
      drilldownLabel: 'Open',
      tone: 'neutral',
    },
    attention: { severity: spec.severity ?? 'WARNING', reason: spec.reason ?? 'Waiting' },
    queue: {
      category: spec.category,
      reason: spec.reason ?? 'Waiting',
      nextAction: spec.nextAction ?? `Act on ${spec.key}`,
      responsibleRole: spec.responsibleRole ?? 'You',
    },
    read: async () => spec.rows,
  };
}

/** Narrows the two source shapes `Array.isArray` cannot separate on its own. */
function isBoundedRead(
  read:
    readonly DashboardAttentionRow[] | { total: number; rows: readonly DashboardAttentionRow[] },
): read is { total: number; rows: readonly DashboardAttentionRow[] } {
  return !Array.isArray(read);
}

/** The rows the synthetic register returns, whichever shape it used. */
async function rowsOf(s: DashboardMetricSource): Promise<readonly DashboardAttentionRow[]> {
  const read = await s.read(viewer);
  return isBoundedRead(read) ? read.rows : read;
}

/** Reads a synthetic source as the register would: the total is its own count. */
const readCounted = (total: number) => async (s: DashboardMetricSource) => ({
  value: total,
  rows: await rowsOf(s),
});

/** A source the account may not read: no count, no rows. */
const readDenied = async () => ({ value: null, rows: [] as readonly DashboardAttentionRow[] });

describe('My work today queue', () => {
  it('groups rows into the four approved categories in the declared order', async () => {
    const sources = [
      source({ key: 'a', category: 'ASSIGNED', rows: [row({ id: 't1' })] }),
      source({ key: 'o', category: 'OVERDUE', rows: [row({ id: 't2' })] }),
      source({ key: 'd', category: 'DUE_TODAY', rows: [row({ id: 't3' })] }),
      source({ key: 'b', category: 'BLOCKED', rows: [row({ id: 't4' })] }),
    ];
    const model = await buildMyWork(sources, viewer, readCounted(1), NOW);
    expect(model.groups.map((group) => group.definition.category)).toEqual([
      'BLOCKED',
      'OVERDUE',
      'DUE_TODAY',
      'ASSIGNED',
    ]);
    for (const group of model.groups) {
      expect(group.definition).toEqual(MY_WORK_GROUP_DEFINITIONS[group.definition.category]);
    }
    expect(model.timezone).toBe('UTC');
    expect(model.scopeLabel.length).toBeGreaterThan(0);
  });

  it('lists a record once, under its most urgent group, and reports the deferral', async () => {
    // The same task is both still open and past its due date: two sources with
    // the same record link, two groups, one listed item.
    const shared = row({ id: 'task-1', href: '/tasks/task-1' });
    const sources = [
      source({ key: 'tasks-assigned', category: 'ASSIGNED', rows: [shared], severity: 'INFO' }),
      source({ key: 'tasks-overdue', category: 'OVERDUE', rows: [shared], severity: 'CRITICAL' }),
    ];
    const model = await buildMyWork(sources, viewer, readCounted(1), NOW);
    const overdue = model.groups.find((group) => group.definition.category === 'OVERDUE')!;
    const assigned = model.groups.find((group) => group.definition.category === 'ASSIGNED')!;
    expect(overdue.items.map((item) => item.href)).toEqual(['/tasks/task-1']);
    expect(overdue.items[0]!.severity).toBe('CRITICAL');
    expect(assigned.items).toEqual([]);
    expect(assigned.count).toBe(1);
    expect(assigned.message).toContain('1 of them is listed under a more urgent group above');
  });

  it('carries reason, next action, responsible role and the source link on every item', async () => {
    const model = await buildMyWork(
      [
        source({
          key: 'approvals',
          category: 'ASSIGNED',
          rows: [
            row({
              id: 'case-1',
              href: '/approvals/case-1',
              anchor: 'waiting',
              anchorAt: new Date('2026-09-17T00:00:00.000Z'),
              responsibleRole: 'Manager',
              reason: 'Approval is waiting for your decision',
            }),
          ],
        }),
      ],
      viewer,
      readCounted(1),
      NOW,
    );
    const item = model.groups.find((g) => g.definition.category === 'ASSIGNED')!.items[0]!;
    expect(item.reason).toBe('Approval is waiting for your decision');
    expect(item.nextAction).toContain('Act on approvals');
    // The row's own recorded role wins over the source default.
    expect(item.responsibleRole).toBe('Manager');
    expect(item.href).toBe('/approvals/case-1');
    expect(item.registerHref).toBe('/test/approvals');
    expect(item.sourceKey).toBe('approvals');
    expect(item.ageLabel).toBe('Waiting 3 days');
  });

  it('falls back to the source role and says so when no timestamp is recorded', async () => {
    const model = await buildMyWork(
      [
        source({
          key: 'task',
          category: 'ASSIGNED',
          responsibleRole: 'You, as the named assignee',
          rows: [row({ id: 't1' })],
        }),
      ],
      viewer,
      readCounted(1),
      NOW,
    );
    const item = model.groups.find((g) => g.definition.category === 'ASSIGNED')!.items[0]!;
    expect(item.responsibleRole).toBe('You, as the named assignee');
    expect(item.ageLabel).toBe('Age not recorded');
  });

  it('publishes the register total while listing only the bounded, stable page', async () => {
    const rows = Array.from({ length: MY_WORK_ITEM_LIMIT + 5 }, (_, index) =>
      row({
        id: `t${String(index).padStart(2, '0')}`,
        anchorAt: new Date(NOW.getTime() - index * 60_000),
        anchor: 'waiting',
      }),
    );
    const sources = [source({ key: 'many', category: 'ASSIGNED', rows })];
    const first = await buildMyWork(sources, viewer, readCounted(rows.length), NOW);
    const second = await buildMyWork(sources, viewer, readCounted(rows.length), NOW);
    const firstGroup = first.groups.find((g) => g.definition.category === 'ASSIGNED')!;
    // The count is the register's own full total, not the bounded page length.
    expect(firstGroup.count).toBe(MY_WORK_ITEM_LIMIT + 5);
    expect(firstGroup.items).toHaveLength(MY_WORK_ITEM_LIMIT);
    expect(firstGroup.message).toContain(`shows the ${MY_WORK_ITEM_LIMIT} most urgent`);
    // Two reads of identical data produce an identical order.
    expect(second.groups.find((g) => g.definition.category === 'ASSIGNED')!.items).toEqual(
      firstGroup.items,
    );
  });

  it('breaks an exact tie on identity so the order is total', async () => {
    const sameMoment = new Date('2026-09-19T00:00:00.000Z');
    const rows = ['b', 'a', 'c'].map((id) =>
      row({ id, anchorAt: sameMoment, anchor: 'waiting', severity: 'WARNING' }),
    );
    const model = await buildMyWork(
      [source({ key: 'tie', category: 'ASSIGNED', rows })],
      viewer,
      readCounted(rows.length),
      NOW,
    );
    expect(
      model.groups
        .find((g) => g.definition.category === 'ASSIGNED')!
        .items.map((item) => item.href),
    ).toEqual(['/tasks/a', '/tasks/b', '/tasks/c']);
  });

  it('never turns an unreadable source into zero work', async () => {
    const sources = [
      source({ key: 'readable', category: 'ASSIGNED', rows: [row({ id: 'ok' })] }),
      source({ key: 'denied', category: 'ASSIGNED', rows: [row({ id: 'hidden' })] }),
    ];
    const read = async (s: DashboardMetricSource) =>
      s.metric.key === 'denied' ? readDenied() : readCounted(3)(s);
    const model = await buildMyWork(sources, viewer, read, NOW);
    const group = model.groups.find((g) => g.definition.category === 'ASSIGNED')!;
    // The group total would understate the truth, so no total is published.
    expect(group.count).toBeNull();
    expect(group.state).toBe('NOT_AUTHORIZED');
    expect(group.message).toContain('does not have permission to read');
    // Only the readable source's links are offered.
    expect(group.registerLinks.map((link) => link.sourceKey)).toEqual(['readable']);
  });

  it('reports a genuinely empty readable group as empty, not as missing', async () => {
    const sources = [source({ key: 'empty', category: 'DUE_TODAY', rows: [] })];
    const model = await buildMyWork(sources, viewer, readCounted(0), NOW);
    const group = model.groups.find((g) => g.definition.category === 'DUE_TODAY')!;
    expect(group.state).toBe('AVAILABLE');
    expect(group.count).toBe(0);
    expect(group.message).toContain('No open record matches');
  });

  it('sums the register totals across a group and exposes each register link', async () => {
    const sources = [
      source({ key: 's1', category: 'BLOCKED', rows: [], href: '/a' }),
      source({ key: 's2', category: 'BLOCKED', rows: [], href: '/b' }),
    ];
    const read = async (s: DashboardMetricSource) => readCounted(s.metric.key === 's1' ? 4 : 7)(s);
    const model = await buildMyWork(sources, viewer, read, NOW);
    const group = model.groups.find((g) => g.definition.category === 'BLOCKED')!;
    expect(group.count).toBe(11);
    expect(group.registerLinks).toEqual([
      { sourceKey: 's1', label: 'Label s1', href: '/a', count: 4 },
      { sourceKey: 's2', label: 'Label s2', href: '/b', count: 7 },
    ]);
  });

  it('keeps sources without queue membership out of the personal queue', () => {
    const declared = source({ key: 'unread', category: 'ASSIGNED', rows: [] });
    // A dashboard counter with no queue membership: it is never presented as
    // the reader's personal work.
    const counterOnly = {
      metric: declared.metric,
      attention: declared.attention,
      read: declared.read,
    } satisfies DashboardMetricSource;
    const membership = myWorkSources([declared, counterOnly]);
    expect(membership.map((entry) => entry.metric.key)).toEqual(['unread']);
  });

  it('records every unresolved source with a reason and an owner', () => {
    expect(MY_WORK_UNRESOLVED_SOURCES.length).toBeGreaterThan(0);
    for (const entry of MY_WORK_UNRESOLVED_SOURCES) {
      expect(entry.reason.length).toBeGreaterThan(20);
      expect(entry.owner.length).toBeGreaterThan(2);
    }
  });
});
