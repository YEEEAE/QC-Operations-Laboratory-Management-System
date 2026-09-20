import type { ActorContext } from '../../../shared/authorization/types.js';
import { describeActorScope } from '../../../shared/authorization/scope-description.js';
import type { DashboardAttentionRow, DashboardMetricSource } from '../ports/dashboard-query.js';
import type {
  MyWorkCategory,
  MyWorkGroup,
  MyWorkItem,
  MyWorkQuery,
  MyWorkReadModel,
  MyWorkRegisterLink,
} from '../ports/my-work.js';
import { MY_WORK_GROUP_DEFINITIONS, MY_WORK_UNRESOLVED_SOURCES } from './my-work-definitions.js';

/**
 * QC-100-FINAL-022 — the bounded, role-aware "My work today" queue.
 *
 * The queue is a projection, never a second source of truth: every row comes
 * from the same domain-owned read model the dashboard already composes, and
 * every number is that register's own count. The only things this module adds
 * are the approved grouping, the next action, the responsible role and one
 * guarantee the raw registers cannot make — a record is listed once.
 */

/** The bounded page size for one group. The register total is still reported. */
export const MY_WORK_ITEM_LIMIT = 10;

/**
 * Group order and record-claim precedence, most urgent first.
 *
 * A record that qualifies for more than one group is listed once, under the
 * first group here. Counts stay per group — a task really is both assigned and
 * overdue — and each group states how many of its matches are listed higher up.
 */
export const MY_WORK_CATEGORY_ORDER: readonly MyWorkCategory[] = [
  'BLOCKED',
  'OVERDUE',
  'DUE_TODAY',
  'ASSIGNED',
];

const SEVERITY_RANK: Record<MyWorkItem['severity'], number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

/** The stable identity of a queue row: the record workspace it opens. */
function recordIdentity(row: DashboardAttentionRow): string {
  return row.href;
}

interface ResolvedSource {
  category: MyWorkCategory;
  sourceKey: string;
  label: string;
  present: boolean;
  /** The register's own full match count, or `null` when the account may not read it. */
  total: number | null;
  href: string;
  rows: readonly DashboardAttentionRow[];
}

export function myWorkSources(
  sources: readonly DashboardMetricSource[],
): readonly (DashboardMetricSource & { queue: NonNullable<DashboardMetricSource['queue']> })[] {
  return sources.filter(
    (
      source,
    ): source is DashboardMetricSource & {
      queue: NonNullable<DashboardMetricSource['queue']>;
    } => source.queue !== undefined,
  );
}

/**
 * Groups the register totals and the bounded rows by their approved category.
 *
 * A source the account may not read contributes no count (never a zero) and no
 * rows; the group then reports that it cannot be fully answered instead of
 * publishing a number that would understate the truth.
 */
export async function buildMyWork(
  sources: readonly DashboardMetricSource[],
  actor: ActorContext,
  readSource: (
    source: DashboardMetricSource,
    actor: ActorContext,
  ) => Promise<{ value: number | null; rows: readonly DashboardAttentionRow[] }>,
  now: Date,
): Promise<MyWorkReadModel> {
  const queueSources = myWorkSources(sources);
  const resolved: ResolvedSource[] = await Promise.all(
    queueSources.map(async (source) => {
      const read = await readSource(source, actor);
      return {
        category: source.queue.category,
        sourceKey: source.metric.key,
        label: source.metric.label,
        present: read.value !== null,
        total: read.value,
        href: source.metric.href,
        rows: read.rows,
      };
    }),
  );

  // A record is listed once, in the first group that matched it. The scan is
  // deterministic: category order, then registry order, then register order.
  const claimed = new Map<string, { category: MyWorkCategory; sourceKey: string }>();
  const itemsByCategory = new Map<MyWorkCategory, MyWorkItem[]>();
  const deferredByCategory = new Map<MyWorkCategory, number>();

  for (const category of MY_WORK_CATEGORY_ORDER) {
    const matches = resolved.filter(
      (entry) => entry.category === category && entry.present && entry.rows.length > 0,
    );
    const items: MyWorkItem[] = [];
    for (const entry of matches) {
      const source = queueSources.find((candidate) => candidate.metric.key === entry.sourceKey);
      const membership = source?.queue;
      if (!membership) continue;
      for (const row of entry.rows) {
        const identity = recordIdentity(row);
        const owner = claimed.get(identity);
        if (owner) {
          // Same record, already listed under a more urgent group: count it as
          // a deferral instead of rendering it twice.
          deferredByCategory.set(category, (deferredByCategory.get(category) ?? 0) + 1);
          continue;
        }
        const reason = row.reason ?? membership.reason;
        claimed.set(identity, { category, sourceKey: entry.sourceKey });
        items.push({
          key: `${entry.sourceKey}:${row.id}`,
          title: row.title,
          state: row.state,
          reason,
          nextAction: membership.nextAction,
          responsibleRole: row.responsibleRole ?? membership.responsibleRole,
          actorScope: source?.metric.actorScope ?? 'Your authorized scope',
          sourceKey: entry.sourceKey,
          sourceLabel: entry.label,
          href: row.href,
          registerHref: source?.metric.href ?? entry.href,
          anchorAt: row.anchorAt,
          anchor: row.anchor,
          ageLabel: ageLabel(row, now),
          severity: row.severity ?? source?.attention?.severity ?? 'INFO',
          merged: false,
        });
      }
    }
    itemsByCategory.set(category, items);
  }

  const groups: MyWorkGroup[] = MY_WORK_CATEGORY_ORDER.map((category) => {
    const definition = MY_WORK_GROUP_DEFINITIONS[category]!;
    const entries = resolved.filter((entry) => entry.category === category);
    const unreadable = entries.filter((entry) => !entry.present);
    const readable = entries.filter((entry) => entry.present);
    const registerLinks: MyWorkRegisterLink[] = readable.map((entry) => ({
      sourceKey: entry.sourceKey,
      label: entry.label,
      href: entry.href,
      count: entry.total ?? 0,
    }));
    const claimedByGroup = itemsByCategory.get(category) ?? [];
    const ordered = sortItems(claimedByGroup).slice(0, MY_WORK_ITEM_LIMIT);
    const deferred = deferredByCategory.get(category) ?? 0;
    return {
      definition,
      state: unreadable.length === 0 ? 'AVAILABLE' : 'NOT_AUTHORIZED',
      message: groupMessage(category, readable, unreadable, ordered, deferred),
      count:
        unreadable.length === 0
          ? readable.reduce((total, entry) => total + (entry.total ?? 0), 0)
          : null,
      registerLinks,
      items: ordered,
    };
  });

  return {
    generatedAt: now,
    scopeLabel: describeActorScope(actor),
    timezone: 'UTC',
    groups,
    unresolvedSources: MY_WORK_UNRESOLVED_SOURCES,
  };
}

/** Stable ordering: severity, then the real server timestamp, then the identity. */
export function sortItems(items: readonly MyWorkItem[]): MyWorkItem[] {
  return [...items].sort((left, right) => {
    const severity = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
    if (severity !== 0) return severity;
    const leftAt = left.anchorAt?.getTime();
    const rightAt = right.anchorAt?.getTime();
    if (leftAt !== undefined && rightAt !== undefined && leftAt !== rightAt) {
      return leftAt - rightAt;
    }
    // A row with no recorded timestamp sorts last, and the identity breaks
    // every remaining tie so two reads of the same data cannot reorder.
    if (leftAt === undefined && rightAt !== undefined) return 1;
    if (leftAt !== undefined && rightAt === undefined) return -1;
    return left.key < right.key ? -1 : left.key > right.key ? 1 : 0;
  });
}

const AGE_NOT_RECORDED = 'Age not recorded';

/** The displayed age, derived from a real server timestamp and never invented. */
export function ageLabel(row: DashboardAttentionRow, now: Date): string {
  if (!row.anchorAt) return AGE_NOT_RECORDED;
  const days = wholeUtcDaysBetween(row.anchorAt, now);
  if (row.anchor === 'due') {
    if (days <= 0) return 'Due today';
    return days === 1 ? 'Due 1 day ago' : `Due ${days} days ago`;
  }
  if (days <= 0) return 'Waiting since today';
  return days === 1 ? 'Waiting 1 day' : `Waiting ${days} days`;
}

function wholeUtcDaysBetween(from: Date, to: Date): number {
  const day = (moment: Date) =>
    Date.UTC(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate());
  return Math.round((day(to) - day(from)) / 86_400_000);
}

function groupMessage(
  category: MyWorkCategory,
  readable: readonly ResolvedSource[],
  unreadable: readonly ResolvedSource[],
  listed: readonly MyWorkItem[],
  deferred: number,
): string {
  if (unreadable.length > 0) {
    const names = unreadable.map((entry) => entry.label).join(', ');
    return `Your account does not have permission to read ${names}, so no total is shown for this group instead of a number that would understate it.`;
  }
  if (readable.length === 0) {
    return `Nothing in this system supplies the ${category.toLowerCase()} group yet.`;
  }
  const matched = readable.reduce((total, entry) => total + (entry.total ?? 0), 0);
  if (matched === 0) return 'No open record matches this group for your account.';
  const shown = listed.length;
  const deferredNote =
    deferred > 0
      ? ` ${deferred} of them ${deferred === 1 ? 'is' : 'are'} listed under a more urgent group above.`
      : '';
  const bounded =
    shown < matched
      ? ` The list below shows the ${shown} most urgent of them.`
      : ` All ${shown} are listed below.`;
  return `${matched} record${matched === 1 ? '' : 's'} match this group.${bounded}${deferredNote}`;
}

/**
 * The port implementation. It performs no SQL of its own: every read is the
 * owning module's register, so the queue cannot drift from the registers it
 * summarizes.
 */
export function createMyWorkQuery(
  sources: readonly DashboardMetricSource[],
  readSource: (
    source: DashboardMetricSource,
    actor: ActorContext,
  ) => Promise<{ value: number | null; rows: readonly DashboardAttentionRow[] }>,
): MyWorkQuery {
  return {
    get: (actor) => buildMyWork(sources, actor, readSource, new Date()),
  };
}
