import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';

/**
 * One point of the receiving trend: a calendar day and how many receiving items
 * fell on it. Days with no receiving records are a true zero and are carried
 * explicitly, so the series never has to guess a gap.
 */
export interface ReceivingTrendPoint {
  date: string;
  value: number;
}

/**
 * The approved receiving time series.
 *
 * Grain/numerator/unit/window/zero policy are part of the contract so no
 * consumer can re-interpret the numbers:
 * - grain: one calendar day of the `receiving_date` column (UTC), ascending;
 * - numerator: receiving items the actor is allowed to read (the same
 *   authorized-scope set the receiving register returns, optionally narrowed to
 *   records the actor created) whose receiving date falls on that day;
 * - unit: records (counted), never a summed or converted quantity;
 * - window: a fixed trailing window of whole days ending on the current UTC
 *   server date;
 * - zero: a day with no receiving records is a real count of zero. The window
 *   is filled with every day, so a true zero is never confused with missing
 *   data (missing/unavailable data is withheld by the consumer instead).
 */
export interface ReceivingTrend {
  key: string;
  title: string;
  summary: string;
  unit: string;
  source: string;
  sourceHref: string;
  grain: string;
  numerator: string;
  actorScope: string;
  windowLabel: string;
  zeroPolicy: string;
  from: string;
  to: string;
  points: readonly ReceivingTrendPoint[];
}

export interface ReceivingTrendReader {
  get(input: {
    actor: ActorContext;
    from: string;
    to: string;
    ownership?: 'mine';
  }): Promise<readonly ReceivingTrendPoint[]>;
}

export const RECEIVING_TREND_WINDOW_DAYS = 14;

/** UTC calendar date of a moment, independent of the host time zone. */
export function utcDateOnly(moment: Date): string {
  return moment.toISOString().slice(0, 10);
}

/** Whole-day shift on an ISO date string (`YYYY-MM-DD`). */
export function shiftIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-');
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + days))
    .toISOString()
    .slice(0, 10);
}

export class GetReceivingTrendUseCase {
  constructor(
    private readonly reader: ReceivingTrendReader,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: { actor: ActorContext; ownership?: 'mine' }): Promise<ReceivingTrend> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-QUAR-VIEW',
        action: 'VIEW',
        entity: {
          type: 'QUARANTINE_DASHBOARD',
          id: 'receiving-trend',
          state: 'ACTIVE',
          ownerId: input.actor.id,
        },
        scope: { ownerId: input.actor.id },
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const to = utcDateOnly(this.now());
    const from = shiftIsoDate(to, -(RECEIVING_TREND_WINDOW_DAYS - 1));
    const observed = await this.reader.get({
      actor: input.actor,
      from,
      to,
      ownership: input.ownership,
    });
    const byDate = new Map(observed.map((point) => [point.date, point.value]));
    const points: ReceivingTrendPoint[] = [];
    for (let offset = 0; offset < RECEIVING_TREND_WINDOW_DAYS; offset += 1) {
      const date = shiftIsoDate(from, offset);
      points.push({ date, value: byDate.get(date) ?? 0 });
    }
    return {
      key: 'receiving-records-per-day',
      title: 'Receiving records per day',
      summary: `Receiving items per calendar day (UTC) over the last ${RECEIVING_TREND_WINDOW_DAYS} days ending ${to}. Days with no receiving records are a real zero.`,
      unit: 'records',
      source: 'Quarantine receiving register',
      sourceHref: '/quarantine/receiving',
      grain: 'One calendar day of the receiving date (UTC), ascending',
      numerator:
        input.ownership === 'mine'
          ? 'Receiving items you recorded that you are allowed to read, per day'
          : 'Receiving items in your authorized scope, per day',
      actorScope:
        input.ownership === 'mine'
          ? 'Records you created, inside your authorized scope'
          : 'Your authorized scope — every creator you are allowed to read',
      windowLabel: `${from} to ${to} (${RECEIVING_TREND_WINDOW_DAYS} days, current UTC server date)`,
      zeroPolicy:
        'Every day in the window is returned, so a zero is a real count of no receiving records for that day — never missing data.',
      from,
      to,
      points,
    };
  }
}
