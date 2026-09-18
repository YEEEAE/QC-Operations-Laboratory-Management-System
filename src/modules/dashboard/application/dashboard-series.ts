import type { ReceivingTrend } from '../../quarantine/application/get-receiving-trend.js';
import type {
  DashboardSeries,
  DashboardSeriesUnavailableReason,
} from '../ports/dashboard-query.js';

/**
 * Shared contract text for a series this surface cannot plot.
 *
 * The wording is deliberately identical in every non-plotting state: nothing is
 * drawn, and no zero is offered in place of the missing series.
 */
const NOT_PLOTTED =
  'Nothing is plotted unless the server supplies an approved series for this surface; an unavailable provider is never shown as an empty chart or a zero.';

/** No supplied series for this scope. Never counts as empty. */
export function seriesNotSupplied(reason: DashboardSeriesUnavailableReason): DashboardSeries {
  const authorized = reason === 'NOT_AUTHORIZED';
  return {
    key: 'receiving-records-per-day',
    title: 'Receiving records per day',
    summary: '',
    unit: 'records',
    source: 'Quarantine receiving register',
    sourceHref: '/quarantine/receiving',
    grain: 'One calendar day of the receiving date (UTC), ascending',
    numerator: 'Receiving items you are allowed to read, per day',
    actorScope: 'Your authorized scope',
    windowLabel: 'Last 14 days ending on the current UTC server date',
    zeroPolicy: 'A day with no receiving records is a real count of zero.',
    state: 'NOT_SUPPLIED',
    reason,
    message: authorized
      ? `No trend series is available for this scope. Reading the receiving register needs the quarantine view permission. ${NOT_PLOTTED}`
      : `No trend series is available for this scope. ${NOT_PLOTTED}`,
    points: [],
  };
}

/** A supplied series could not be read this time. Never counts as empty. */
export function seriesUnavailable(): DashboardSeries {
  return {
    key: 'receiving-records-per-day',
    title: 'Receiving records per day',
    summary: '',
    unit: 'records',
    source: 'Quarantine receiving register',
    sourceHref: '/quarantine/receiving',
    grain: 'One calendar day of the receiving date (UTC), ascending',
    numerator: 'Receiving items you are allowed to read, per day',
    actorScope: 'Your authorized scope',
    windowLabel: 'Last 14 days ending on the current UTC server date',
    zeroPolicy: 'A day with no receiving records is a real count of zero.',
    state: 'UNAVAILABLE',
    reason: 'PROVIDER_UNAVAILABLE',
    message: `The trend series could not be read, so no trend is shown and no zero is offered in its place. ${NOT_PLOTTED}`,
    points: [],
  };
}

/**
 * Projects the approved receiving series onto this surface.
 *
 * `EMPTY` is an honest all-zero window: the series is supplied and readable, and
 * every day in it genuinely has no receiving records. It is not plotted (a flat
 * zero line claims a shape the data does not have) and it is never conflated
 * with `UNAVAILABLE`. Only `AVAILABLE` carries points.
 */
export function projectReceivingTrend(trend: ReceivingTrend): DashboardSeries {
  const points = trend.points.map((point) => ({ label: point.date, value: point.value }));
  const hasRecords = points.some((point) => point.value > 0);
  const shared = {
    key: trend.key,
    title: trend.title,
    unit: trend.unit,
    source: trend.source,
    sourceHref: trend.sourceHref,
    grain: trend.grain,
    numerator: trend.numerator,
    actorScope: trend.actorScope,
    windowLabel: trend.windowLabel,
    zeroPolicy: trend.zeroPolicy,
  };
  if (!hasRecords) {
    return {
      ...shared,
      summary: trend.summary,
      state: 'EMPTY',
      message: `The series was read successfully and every day in ${trend.from} – ${trend.to} has no receiving records. Nothing is plotted; this is a real zero, not missing data.`,
      points: [],
    };
  }
  return { ...shared, summary: trend.summary, state: 'AVAILABLE', message: '', points };
}
