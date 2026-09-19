import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type {
  DashboardAttention,
  DashboardAttentionRow,
  DashboardAttentionSource,
  DashboardMetric,
  DashboardMetricSource,
} from '../ports/dashboard-query.js';

/** The decision queue is a bounded, most-urgent-first slice of the real rows. */
export const ATTENTION_LIMIT = 10;

const SEVERITY_RANK: Record<DashboardAttention['severity'], number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

/**
 * The single sentence used whenever an account may not read one register.
 *
 * It is deliberately the same for every source so the surface never implies
 * that a permission decision is a provider outage, and never offers a zero.
 */
export const NOT_AUTHORIZED_COUNT_MESSAGE =
  'Your account does not have permission to read this register, so no count is shown instead of a zero.';

/** UTC midnight of a moment, so a day difference never depends on the host zone. */
export function utcDayStart(moment: Date): Date {
  return new Date(
    Date.UTC(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate(), 0, 0, 0, 0),
  );
}

/** Whole UTC days between two moments. */
export function utcDaysBetween(from: Date, to: Date): number {
  return Math.round((utcDayStart(to).getTime() - utcDayStart(from).getTime()) / 86_400_000);
}

/**
 * The displayed age of an attention row, derived from its real server
 * timestamp — never from a client clock and never invented.
 */
export const AGE_NOT_RECORDED = 'Age not recorded';

export function attentionAgeLabel(row: DashboardAttentionRow, now: Date): string {
  if (!row.anchorAt) return AGE_NOT_RECORDED;
  const days = utcDaysBetween(row.anchorAt, now);
  if (row.anchor === 'due') {
    if (days <= 0) return 'Due today';
    return days === 1 ? 'Due 1 day ago' : `Due ${days} days ago`;
  }
  if (days <= 0) return 'Waiting since today';
  return days === 1 ? 'Waiting 1 day' : `Waiting ${days} days`;
}

export interface DashboardMetricResult {
  metric: DashboardMetric;
  rows: readonly DashboardAttentionRow[];
  source: DashboardAttentionSource;
}

/** Narrowing guard: a bounded register read carries `{ total, rows }`; an
 * unbounded one is the row array itself. `Array.isArray` alone does not
 * narrow the union member for the compiler, so the guard is explicit. */
function isBoundedRead(
  read: readonly DashboardAttentionRow[] | { total: number; rows: readonly DashboardAttentionRow[] },
): read is { total: number; rows: readonly DashboardAttentionRow[] } {
  return !Array.isArray(read);
}

/**
 * Reads one metric source.
 *
 * An authorization decision is reported as an unavailable count (never a zero,
 * and no drill-down that would be refused). Every other read failure is left to
 * propagate: the caller withholds the whole snapshot rather than publishing a
 * number it could not confirm.
 */
export async function readMetricSource(
  source: DashboardMetricSource,
  actor: ActorContext,
): Promise<DashboardMetricResult> {
  const { metric } = source;
  try {
    const read = await source.read(actor);
    // Bounded registers report their own full match count (`total`) while the
    // attention queue samples the bounded page (`rows`); unbounded sources
    // return the rows directly and the count is the row count. Either way the
    // number is the register's own, never a second query's.
    const rows = isBoundedRead(read) ? read.rows : read;
    const value = isBoundedRead(read) ? read.total : read.length;
    return {
      metric: { ...metric, value },
      rows,
      source: { key: metric.key, label: metric.label, state: 'AVAILABLE', message: '' },
    };
  } catch (error) {
    if (error instanceof AppError && error.category === 'AUTHORIZATION') {
      return {
        metric: {
          ...metric,
          value: null,
          unavailable: { reason: 'NOT_AUTHORIZED', message: NOT_AUTHORIZED_COUNT_MESSAGE },
        },
        rows: [],
        source: {
          key: metric.key,
          label: metric.label,
          state: 'NOT_AUTHORIZED',
          message: NOT_AUTHORIZED_COUNT_MESSAGE,
        },
      };
    }
    throw error;
  }
}

/**
 * Projects the readable rows of every source into one attention queue.
 *
 * Each item carries a human reason, an age derived from a real timestamp, the
 * current state and a direct link, and the queue is bounded and ordered by real
 * severity (oldest first inside a severity band).
 */
export function buildAttention(
  results: readonly DashboardMetricResult[],
  sources: readonly DashboardMetricSource[],
  now: Date,
): DashboardAttention[] {
  const items: Array<{ item: DashboardAttention; anchorAt: Date }> = [];
  results.forEach((result, index) => {
    const declaration = sources[index]?.attention;
    if (!declaration) return;
    for (const row of result.rows) {
      const reason = row.reason ?? declaration.reason;
      items.push({
        anchorAt: row.anchorAt ?? now,
        item: {
          id: `${result.metric.key}:${row.id}`,
          title: row.title,
          summary: reason,
          reason,
          ageLabel: attentionAgeLabel(row, now),
          href: row.href,
          severity: row.severity ?? declaration.severity,
          state: row.state,
        },
      });
    }
  });
  return items
    .sort((left, right) => {
      const severity = SEVERITY_RANK[left.item.severity] - SEVERITY_RANK[right.item.severity];
      if (severity !== 0) return severity;
      // Inside one severity band the longest-waiting record comes first.
      return left.anchorAt.getTime() - right.anchorAt.getTime();
    })
    .slice(0, ATTENTION_LIMIT)
    .map((entry) => entry.item);
}
