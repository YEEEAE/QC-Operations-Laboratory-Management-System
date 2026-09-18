import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { mapAuditRowToView } from '../../../shared/audit/audit-query.js';
import { describeActorScope } from '../../../shared/authorization/scope-description.js';
import type {
  DashboardApprovalQueue,
  DashboardAttention,
  DashboardQuery,
  DashboardReadModel,
} from '../ports/dashboard-query.js';

/** The decision queue is a bounded, most-recent-first slice of the rollup. */
const ATTENTION_LIMIT = 8;
const SEVERITY_RANK: Record<DashboardAttention['severity'], number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

export class PostgresDashboardQuery implements DashboardQuery {
  constructor(
    private readonly database: Kysely<DatabaseSchema>,
    /**
     * The canonical actionable-approval projection. Injecting the same reader
     * that serves `/approvals` is what keeps the "Pending review" counter and
     * its drill-down in agreement (audit §8: one rollup feeds both the KPI
     * counters and the decision queue). If it fails, the whole read model
     * fails closed so the counter is withheld rather than shown as zero.
     */
    private readonly approvals: DashboardApprovalQueue,
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
    const [counts, holdRows, activityRows, approvals] = await Promise.all([
      sql<{
        hold_items: number;
        passed_inspections: number;
        released_items: number;
      }>`
        SELECT
          (SELECT count(*) FROM qc.receiving_items WHERE inspection_result = 'HOLD' AND created_by = ${actor.id})::int AS hold_items,
          (SELECT count(*) FROM qc.inspection_reports WHERE final_result = 'PASS' AND (author_id = ${actor.id}))::int AS passed_inspections,
          (SELECT count(*) FROM qc.receiving_items WHERE release_system = TRUE AND (created_by = ${actor.id}))::int AS released_items
      `.execute(this.database),
      sql<{
        id: string;
        title: string;
        summary: string;
        href: string;
        severity: 'CRITICAL';
        state: string;
      }>`
        SELECT id::text, receiving_no AS title, 'Receiving item is on HOLD' AS summary, '/quarantine/receiving/' || id::text AS href, 'CRITICAL' AS severity, workflow_state AS state
        FROM qc.receiving_items WHERE inspection_result = 'HOLD' AND created_by = ${actor.id} ORDER BY updated_at DESC
      `.execute(this.database),
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
        .limit(8)
        .execute(),
      this.approvals.list(actor),
    ]);
    const row = counts.rows[0] ?? {
      hold_items: 0,
      passed_inspections: 0,
      released_items: 0,
    };
    // A single decision queue: actionable approvals (the same set `/approvals`
    // lists) plus receiving items the actor recorded that are on HOLD. Both
    // branches carry a real severity instead of a hard-coded WARNING.
    const approvalAttention: DashboardAttention[] = approvals.map((item) => ({
      id: `approval:${item.id}`,
      title: item.title,
      summary: 'Approval is waiting for your decision',
      href: `/approvals/${item.id}`,
      severity: 'WARNING',
      state: item.state,
    }));
    const holdAttention: DashboardAttention[] = holdRows.rows.map((item) => ({
      id: `receiving:${item.id}`,
      title: item.title,
      summary: item.summary,
      href: item.href,
      severity: 'CRITICAL',
      state: item.state,
    }));
    const attention = [...approvalAttention, ...holdAttention]
      .sort((left, right) => SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity])
      .slice(0, ATTENTION_LIMIT);
    return {
      generatedAt: new Date(),
      // P2-6: a real, server-derived scope description. The previous value was a
      // static placeholder while every count below is filtered by actor.id.
      scopeLabel: describeActorScope(actor),
      metrics: [
        {
          key: 'pending-review',
          value: approvals.length,
          label: 'Pending review',
          unit: 'records',
          timeRange: 'current snapshot',
          source: 'My approvals queue',
          numerator: 'Actionable approval work items returned by the approvals queue',
          state: 'PENDING or IN_PROGRESS work item',
          actorScope: 'Assigned to you or your role',
          definition:
            'Approval work assigned to you or your role that is still actionable. This is the same set the approvals register lists.',
          href: '/approvals',
          drilldownLabel: 'Open my approvals',
          tone: 'warning',
        },
        {
          key: 'hold-items',
          label: 'HOLD items',
          value: row.hold_items,
          unit: 'records',
          timeRange: 'current snapshot',
          source: 'Receiving items you recorded',
          numerator: 'Receiving items you recorded whose inspection result is HOLD',
          state: 'inspection result = HOLD',
          actorScope: 'Created by you',
          definition: 'Receiving items you recorded whose inspection result is HOLD.',
          href: '/quarantine/receiving?inspectionResult=HOLD&ownership=mine',
          drilldownLabel: 'Open my HOLD records',
          tone: 'danger',
        },
        {
          key: 'pass-inspections',
          label: 'Inspection PASS',
          value: row.passed_inspections,
          unit: 'records',
          timeRange: 'current snapshot',
          source: 'Inspection reports you authored',
          numerator: 'Inspection reports you authored whose final scientific result is PASS',
          state: 'final result = PASS',
          actorScope: 'Authored by you',
          definition: 'Inspection reports you authored with final scientific result PASS.',
          href: '/quarantine/inspections?finalResult=PASS&ownership=mine',
          drilldownLabel: 'Open my PASS reports',
          tone: 'success',
        },
        {
          key: 'released-items',
          label: 'Released items',
          value: row.released_items,
          unit: 'records',
          timeRange: 'current snapshot',
          source: 'Receiving items you recorded',
          numerator: 'Receiving items you recorded whose release system state is true',
          state: 'release system state = true',
          actorScope: 'Created by you',
          definition:
            'Receiving items you recorded with release system state true; separate from PASS.',
          href: '/quarantine/receiving?releaseState=RELEASED&ownership=mine',
          drilldownLabel: 'Open my released records',
          tone: 'success',
        },
      ],
      attention,
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
    };
  }
}
