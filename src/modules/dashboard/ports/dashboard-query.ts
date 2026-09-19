import type { ActorContext } from '../../../shared/authorization/types.js';

export type DashboardMetricTone = 'neutral' | 'warning' | 'danger' | 'success';

/**
 * Everything a displayed count must declare so it can be reconciled with the
 * register it links to:
 * - `numerator` says exactly what is counted and `denominator` names the
 *   population it is drawn from, so a count can never be read as a share of a
 *   population the reader cannot see;
 * - `grain` says what one counted row is, so two cards over the same table
 *   cannot mean different rows under the same word;
 * - `state` names the exact domain/workflow condition the count is filtered by;
 * - `actorScope` says whose records the numerator covers ("assigned to you",
 *   "authorized scope", …). A personal count is never presented under an
 *   authorized-scope label, or the reverse;
 * - `timeRange` is the observation window and `timezone` is the server clock
 *   every time window on this surface is resolved in. Non-UTC windows (for
 *   example "due today") are resolved once, server-side, in this clock;
 * - `freshness` says when the value is read. This surface only ever reports the
 *   current server snapshot; it never renders a historical or projected value;
 * - `drilldown` names the exact register filter the link applies, and `href`
 *   must open a register whose supported filters reproduce the same
 *   numerator/state/actorScope. A drill-down that cannot reproduce the count is
 *   a defect, not a presentation choice.
 */
export interface DashboardMetricDefinition {
  key: string;
  label: string;
  unit: 'records';
  /** The population the numerator is taken from. */
  denominator: string;
  /** What one counted row is. */
  grain: string;
  timeRange: 'current snapshot';
  /** The server clock every window on this surface is resolved in. */
  timezone: 'UTC';
  /** When the value is re-read, stated on the surface rather than assumed. */
  freshness: string;
  source: string;
  definition: string;
  numerator: string;
  state: string;
  actorScope: string;
  /** The exact register filter the drill-down applies, in query form. */
  drilldown: string;
  href: string;
  drilldownLabel: string;
  tone: DashboardMetricTone;
}

/**
 * Why a count has no number for this account.
 *
 * Only an authorization decision produces this state: the account may open the
 * dashboard but may not read this particular register. A read failure is a
 * different fact and withholds the whole snapshot (see `DashboardQuery`) rather
 * than being rendered as a zero.
 */
export interface DashboardCountUnavailable {
  reason: 'NOT_AUTHORIZED';
  message: string;
}

export interface DashboardMetric extends DashboardMetricDefinition {
  /** `null` means "not readable for this account", never zero. */
  value: number | null;
  unavailable?: DashboardCountUnavailable;
}

/**
 * One row of a real, already-authorized register read.
 *
 * The row's count and the item in the attention queue come from the *same*
 * read, so a count and its queue can never disagree, and `anchorAt` is a real
 * server timestamp the displayed age is derived from.
 */
export interface DashboardAttentionRow {
  id: string;
  title: string;
  state: string;
  href: string;
  /**
   * The real server timestamp the age is derived from. Absent when the record
   * carries no such timestamp (for example an approval work item with no
   * assignment date): the age then says so instead of inventing one.
   */
  anchorAt?: Date;
  /** `waiting`: how long the record has been waiting. `due`: how long a deadline is past. */
  anchor: 'waiting' | 'due';
  /** Row-level override when the row itself carries the severity (notifications). */
  severity?: DashboardAttention['severity'];
  /** Row-level override when the row itself carries the human reason. */
  reason?: string;
}

export interface DashboardAttention {
  id: string;
  title: string;
  summary: string;
  /** Why this item needs a human decision, in one sentence. */
  reason: string;
  /** Age derived from `anchorAt`, e.g. "Waiting 3 days" or "Due 2 days ago". */
  ageLabel: string;
  href: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  state: string;
}

export type DashboardAttentionSourceState = 'AVAILABLE' | 'NOT_AUTHORIZED';

/** The honesty record for one attention/action source on this surface. */
export interface DashboardAttentionSource {
  key: string;
  label: string;
  state: DashboardAttentionSourceState;
  message: string;
}

/**
 * One real source behind a dashboard action count.
 *
 * `read` returns the exact rows of a register the actor is allowed to read; the
 * displayed count is that array's length and the drill-down `href` is the same
 * register with the same supported filters. A bounded register instead returns
 * `{ total, rows }`: the register's own full match count for the displayed
 * number and its bounded page for the queue — never a second count query. A
 * missing permission yields an explicit `unavailable` state instead of a zero,
 * while any other read failure propagates and withholds the whole snapshot.
 */
export interface DashboardMetricSource {
  metric: DashboardMetricDefinition;
  /** Projecting the rows into the attention queue is optional per source. */
  attention?: { severity: DashboardAttention['severity']; reason: string };
  read(
    actor: ActorContext,
  ): Promise<
    readonly DashboardAttentionRow[] | { total: number; rows: readonly DashboardAttentionRow[] }
  >;
}

/**
 * One stage of the quarantine pipeline.
 *
 * Stages are projected from the Quarantine module's own overview use case — the
 * same read model that serves `/quarantine` — so no surface re-defines what
 * "awaiting inspection" or "HOLD" means and no second SQL counts the same rows.
 */
export interface DashboardFlowStage {
  key: string;
  label: string;
  value: number;
  definition: string;
  numerator: string;
  state: string;
  actorScope: string;
  href: string;
  drilldownLabel: string;
  tone: DashboardMetricTone;
}

export interface DashboardFlow {
  key: string;
  title: string;
  summary: string;
  source: string;
  sourceHref: string;
  actorScope: string;
  windowLabel: string;
  state: 'AVAILABLE' | 'NOT_AUTHORIZED';
  /** Honest, state-specific sentence; never a count when the state is not `AVAILABLE`. */
  message: string;
  stages: readonly DashboardFlowStage[];
}

export interface DashboardFlowSource {
  get(actor: ActorContext): Promise<DashboardFlow>;
}

/**
 * A data product this surface deliberately does not render.
 *
 * Recording the reason is what keeps the dashboard honest: the panel states
 * which operational questions it cannot answer yet instead of approximating
 * them with an invented number or an unsourced chart.
 */
export interface DashboardCoverageItem {
  key: string;
  label: string;
  state: 'AVAILABLE' | 'NOT_SUPPLIED';
  reason: string;
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
  flow: DashboardFlow;
  attention: DashboardAttention[];
  attentionSources: readonly DashboardAttentionSource[];
  activity: DashboardActivity[];
  /** The approved time series for this surface, or the honest reason there is none. */
  series: DashboardSeries;
  coverage: readonly DashboardCoverageItem[];
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

/** One actionable approval awaiting the actor's decision. */
export interface DashboardApprovalItem {
  id: string;
  title: string;
  state: string;
  /** When the work item was assigned; the basis of the displayed age. */
  assignedAt?: Date;
}

/**
 * The canonical actionable-approval projection, so the "Pending review" counter
 * and its drill-down can never disagree.
 */
export interface DashboardApprovalQueue {
  list(actor: ActorContext): Promise<readonly DashboardApprovalItem[]>;
}

export interface DashboardQuery {
  get(actor: ActorContext): Promise<DashboardReadModel>;
}
