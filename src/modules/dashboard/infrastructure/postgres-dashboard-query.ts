import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { mapAuditRowToView } from '../../../shared/audit/audit-query.js';
import { describeActorScope } from '../../../shared/authorization/scope-description.js';
import { buildAttention, readMetricSource } from '../application/dashboard-attention.js';
import type {
  DashboardCoverageItem,
  DashboardFlowSource,
  DashboardMetricSource,
  DashboardQuery,
  DashboardReadModel,
  DashboardSeriesProvider,
} from '../ports/dashboard-query.js';

/** The activity timeline is a bounded, most-recent-first slice of the audit register. */
const ACTIVITY_LIMIT = 8;

export class PostgresDashboardQuery implements DashboardQuery {
  constructor(
    private readonly database: Kysely<DatabaseSchema>,
    /**
     * The real, already-authorized sources behind every displayed count.
     *
     * Each source reads its own register (or the owning module's use case) and
     * the displayed number is exactly the rows it returned, so a count and the
     * drill-down link that opens the same filters can never disagree. A source
     * that fails to read withholds the whole snapshot instead of becoming a
     * zero; a source the account may not read reports that explicitly.
     */
    private readonly metricSources: readonly DashboardMetricSource[],
    /**
     * The quarantine pipeline, projected from the Quarantine module's own
     * overview use case so this surface adds no second definition of the same
     * workflow states.
     */
    private readonly flow: DashboardFlowSource,
    /**
     * The approved time series. Unlike the decision counters above, an
     * unavailable series does not fail the whole read model: it is carried as an
     * explicit state so the trend panel says it is unavailable instead of
     * drawing an empty chart or a zero.
     */
    private readonly series: DashboardSeriesProvider,
    /** The data products this surface deliberately does not render, with reasons. */
    private readonly coverage: readonly DashboardCoverageItem[],
  ) {}

  async get(actor: ActorContext): Promise<DashboardReadModel> {
    // F-07 predicate trace: the dashboard shell is gated by a DASH permission
    // in GetDashboardUseCase, while /audit requires PERM-ADM-AUDIT-VIEW in
    // AuditQueryService. The activity timeline below stays scoped to the
    // actor's own events (actor_id = actor.id) so it never leaks cross-actor
    // history to actors without audit permission. It shares the canonical
    // audit-read contract (same safe projection, same occurred_at DESC /
    // event_no DESC order, same allowlist mapper) so a qualifying event is
    // rendered identically on both surfaces.
    const generatedAt = new Date();
    const [results, flow, activityRows, series] = await Promise.all([
      Promise.all(this.metricSources.map((source) => readMetricSource(source, actor))),
      this.flow.get(actor),
      this.database
        .selectFrom('audit_events')
        .select([
          'id',
          'event_no',
          'occurred_at',
          'actor_type',
          'actor_id',
          'subject_type',
          'subject_id',
          'action',
          'old_state',
          'new_state',
          'reason',
          'request_id',
          'signature_id',
        ])
        .where('actor_id', '=', actor.id)
        .orderBy('occurred_at', 'desc')
        .orderBy('event_no', 'desc')
        .limit(ACTIVITY_LIMIT)
        .execute(),
      this.series.get(actor),
    ]);
    return {
      generatedAt,
      // P2-6: a real, server-derived scope description, never a static label.
      scopeLabel: describeActorScope(actor),
      metrics: results.map((result) => result.metric),
      flow,
      attention: buildAttention(results, this.metricSources, generatedAt),
      attentionSources: results.map((result) => result.source),
      activity: activityRows.map((row) => {
        const view = mapAuditRowToView(row);
        return {
          id: view.id,
          action: view.action,
          subjectType: view.subjectType,
          subjectId: view.subjectId,
          summary: view.reason ?? view.action,
          occurredAt: view.occurredAt,
        };
      }),
      series,
      coverage: this.coverage,
    };
  }
}
