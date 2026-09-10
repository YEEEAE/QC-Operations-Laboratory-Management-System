import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { mapAuditRowToView } from '../../../shared/audit/audit-query.js';
import type { DashboardQuery, DashboardReadModel } from '../ports/dashboard-query.js';

export class PostgresDashboardQuery implements DashboardQuery {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async get(actor: ActorContext): Promise<DashboardReadModel> {
    // F-07 predicate trace: the dashboard shell is gated by a DASH permission
    // in GetDashboardUseCase, while /audit requires PERM-ADM-AUDIT-VIEW in
    // AuditQueryService. The activity timeline below stays scoped to the
    // actor's own events (actor_id = actor.id) so it never leaks cross-actor
    // history to actors without audit permission. It shares the canonical
    // audit-read contract (same safe projection, same occurred_at DESC /
    // event_no DESC order, same allowlist mapper) so a qualifying event is
    // rendered identically on both surfaces.
    const [counts, attention, activityRows] = await Promise.all([
      sql<{
        pending_review: number;
        hold_items: number;
        passed_inspections: number;
        released_items: number;
      }>`
        SELECT
          (SELECT count(*) FROM qc.inspection_reports ir WHERE ir.state IN ('SUBMITTED','UNDER_REVIEW') AND (ir.author_id = ${actor.id} OR EXISTS (SELECT 1 FROM qc.approval_cases ac JOIN qc.approval_work_items wi ON wi.approval_case_id = ac.id WHERE ac.subject_type = 'INSPECTION_REPORT' AND ac.subject_id = ir.id AND wi.assigned_user_id = ${actor.id} AND wi.state IN ('PENDING','IN_PROGRESS'))))::int AS pending_review,
          (SELECT count(*) FROM qc.receiving_items WHERE inspection_result = 'HOLD' AND created_by = ${actor.id})::int AS hold_items,
          (SELECT count(*) FROM qc.inspection_reports WHERE final_result = 'PASS' AND (author_id = ${actor.id}))::int AS passed_inspections,
          (SELECT count(*) FROM qc.receiving_items WHERE release_system = TRUE AND (created_by = ${actor.id}))::int AS released_items
      `.execute(this.database),
      sql<{
        id: string;
        title: string;
        summary: string;
        href: string;
        severity: 'INFO' | 'WARNING' | 'CRITICAL';
        state: string;
      }>`
        SELECT id::text, receiving_no AS title, 'Receiving item requires attention' AS summary, '/quarantine/receiving/' || id::text AS href, 'WARNING' AS severity, workflow_state AS state
        FROM qc.receiving_items WHERE inspection_result = 'HOLD' AND created_by = ${actor.id} ORDER BY updated_at DESC LIMIT 8
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
    ]);
    const row = counts.rows[0] ?? {
      pending_review: 0,
      hold_items: 0,
      passed_inspections: 0,
      released_items: 0,
    };
    return {
      generatedAt: new Date(),
      scopeLabel: 'Authorized operational scope',
      metrics: [
        {
          key: 'pending-review',
          label: 'Pending review',
          value: row.pending_review,
          unit: 'records',
          timeRange: 'current snapshot',
          source: 'Inspection and approval queue',
          definition: 'Authorized inspection and approval work awaiting action.',
          href: '/approvals',
          drilldownLabel: 'Open review queue',
          tone: 'warning',
        },
        {
          key: 'hold-items',
          label: 'HOLD items',
          value: row.hold_items,
          unit: 'records',
          timeRange: 'current snapshot',
          source: 'Receiving inspection results',
          definition: 'Authorized receiving items whose inspection result is HOLD.',
          href: '/quarantine/receiving?inspectionResult=HOLD',
          drilldownLabel: 'Open HOLD records',
          tone: 'danger',
        },
        {
          key: 'pass-inspections',
          label: 'Inspection PASS',
          value: row.passed_inspections,
          unit: 'records',
          timeRange: 'current snapshot',
          source: 'Inspection reports',
          definition: 'Authorized inspection reports with final scientific result PASS.',
          href: '/quarantine/inspections',
          drilldownLabel: 'Open inspection reports',
          tone: 'success',
        },
        {
          key: 'released-items',
          label: 'Released items',
          value: row.released_items,
          unit: 'records',
          timeRange: 'current snapshot',
          source: 'Receiving release state',
          definition:
            'Authorized receiving items with release system state true; separate from PASS.',
          href: '/quarantine/receiving?workflowState=RELEASED',
          drilldownLabel: 'Open released records',
          tone: 'success',
        },
      ],
      attention: attention.rows,
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
