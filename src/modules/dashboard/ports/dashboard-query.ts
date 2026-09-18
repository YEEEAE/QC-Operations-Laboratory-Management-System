import type { ActorContext } from '../../../shared/authorization/types.js';

export type DashboardMetricTone = 'neutral' | 'warning' | 'danger' | 'success';

/**
 * One KPI on the dashboard decision surface.
 *
 * Every field below is part of the KPI contract so the displayed number can be
 * reconciled with the register it links to:
 * - `numerator` says exactly what is counted.
 * - `state` names the exact domain/workflow condition the count is filtered by.
 * - `actorScope` says whose records the numerator covers ("created by you",
 *   "assigned to you", …). The dashboard never presents a personal count under
 *   an authorized-scope label, or the reverse.
 * - `timeRange` is the observation window. The dashboard only ever reports the
 *   current server snapshot; it never renders a historical or projected value.
 * - `href` must point at a route whose filters reproduce the same
 *   numerator/state/actorScope. A drill-down that cannot reproduce the count is
 *   a defect, not a presentation choice.
 */
export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  unit: 'records';
  timeRange: 'current snapshot';
  source: string;
  definition: string;
  numerator: string;
  state: string;
  actorScope: string;
  href?: string;
  drilldownLabel?: string;
  tone?: DashboardMetricTone;
}
export interface DashboardAttention {
  id: string;
  title: string;
  summary: string;
  href: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  state: string;
}
export interface DashboardActivity {
  id: string;
  action: string;
  subjectType: string;
  subjectId: string;
  summary: string;
  occurredAt: Date;
}
export interface DashboardReadModel {
  generatedAt: Date;
  scopeLabel: string;
  metrics: DashboardMetric[];
  attention: DashboardAttention[];
  activity: DashboardActivity[];
  /** The approved time series for this surface, or the honest reason there is none. */
  series: DashboardSeries;
}

/**
 * Why a series is not plotted.
 *
 * `NOT_SUPPLIED` means this scope has no supplied series (no approved provider
 * for the actor, or the provider is not composed for this deployment).
 * `PROVIDER_UNAVAILABLE`/`READ_FAILED` mean a supplied series could not be read
 * this time. Neither is `EMPTY`, and none of them may be rendered as a chart, a
 * flat line or a zero.
 */
export type DashboardSeriesUnavailableReason =
  'NOT_AUTHORIZED' | 'PROVIDER_NOT_COMPOSED' | 'PROVIDER_UNAVAILABLE' | 'READ_FAILED';
export type DashboardSeriesState = 'AVAILABLE' | 'EMPTY' | 'UNAVAILABLE' | 'NOT_SUPPLIED';

export interface DashboardSeriesPoint {
  label: string;
  value: number;
}

/**
 * An approved server-side time series.
 *
 * A series is only presentable when the server defines its grain, numerator,
 * unit and window, so every consumer states them next to the chart instead of
 * inventing a trend: `grain`, `numerator`, `actorScope`, `windowLabel` and the
 * zero policy travel with the points. `points` is empty for every state except
 * `AVAILABLE`, so no consumer can plot an empty or unavailable series.
 */
export interface DashboardSeries {
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
  state: DashboardSeriesState;
  reason?: DashboardSeriesUnavailableReason;
  /** Honest, state-specific sentence rendered in place of the chart. */
  message: string;
  points: readonly DashboardSeriesPoint[];
}

/**
 * Supplies the dashboard time series.
 *
 * The provider maps its own read failures onto the series state, because an
 * unavailable series must stay visible as unavailable instead of failing the
 * whole dashboard read (unlike the decision counters, which fail closed).
 */
export interface DashboardSeriesProvider {
  get(actor: ActorContext): Promise<DashboardSeries>;
}
/**
 * One actionable approval awaiting the actor's decision.
 *
 * This is deliberately the same projection the `/approvals` register renders,
 * so the "Pending review" counter and its drill-down can never disagree.
 */
export interface DashboardApprovalItem {
  id: string;
  title: string;
  state: string;
}
export interface DashboardApprovalQueue {
  list(actor: ActorContext): Promise<readonly DashboardApprovalItem[]>;
}
export interface DashboardQuery {
  get(actor: ActorContext): Promise<DashboardReadModel>;
}
