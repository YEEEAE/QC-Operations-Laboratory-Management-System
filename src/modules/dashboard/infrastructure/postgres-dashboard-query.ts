import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DashboardQuery, DashboardReadModel } from '../ports/dashboard-query.js';

export class PostgresDashboardQuery implements DashboardQuery {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async get(actor: ActorContext): Promise<DashboardReadModel> {
    const [counts, attention, activity] = await Promise.all([
      sql<{ pending_review: number; hold_items: number; passed_inspections: number; released_items: number }>`
        SELECT
          (SELECT count(*) FROM qc.inspection_reports ir WHERE ir.state IN ('SUBMITTED','UNDER_REVIEW') AND (ir.author_id = ${actor.id} OR EXISTS (SELECT 1 FROM qc.approval_cases ac JOIN qc.approval_work_items wi ON wi.approval_case_id = ac.id WHERE ac.subject_type = 'INSPECTION_REPORT' AND ac.subject_id = ir.id AND wi.assigned_user_id = ${actor.id} AND wi.state IN ('PENDING','IN_PROGRESS'))))::int AS pending_review,
          (SELECT count(*) FROM qc.receiving_items WHERE inspection_result = 'HOLD' AND created_by = ${actor.id})::int AS hold_items,
          (SELECT count(*) FROM qc.inspection_reports WHERE final_result = 'PASS' AND (author_id = ${actor.id}))::int AS passed_inspections,
          (SELECT count(*) FROM qc.receiving_items WHERE release_system = TRUE AND (created_by = ${actor.id}))::int AS released_items
      `.execute(this.database),
      sql<{ id: string; title: string; summary: string; href: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; state: string }>`
        SELECT id::text, receiving_no AS title, 'Receiving item requires attention' AS summary, '/quarantine/receiving/' || id::text AS href, 'WARNING' AS severity, workflow_state AS state
        FROM qc.receiving_items WHERE inspection_result = 'HOLD' AND created_by = ${actor.id} ORDER BY updated_at DESC LIMIT 8
      `.execute(this.database),
      sql<{ id: string; action: string; subject_type: string; subject_id: string; summary: string; occurred_at: Date }>`
        SELECT id::text, action, subject_type, subject_id::text, COALESCE(reason, action) AS summary, occurred_at FROM qc.audit_events WHERE actor_id = ${actor.id} ORDER BY occurred_at DESC LIMIT 8
      `.execute(this.database),
    ]);
    const row = counts.rows[0] ?? { pending_review: 0, hold_items: 0, passed_inspections: 0, released_items: 0 };
    return {
      generatedAt: new Date(), scopeLabel: 'Authorized operational scope',
      metrics: [
        { key: 'pending-review', label: 'Pending review', value: row.pending_review, definition: 'Authorized inspection and approval work awaiting action.', href: '/approvals', tone: 'warning' },
        { key: 'hold-items', label: 'HOLD items', value: row.hold_items, definition: 'Authorized receiving items whose inspection result is HOLD.', href: '/quarantine/receiving?inspectionResult=HOLD', tone: 'danger' },
        { key: 'pass-inspections', label: 'Inspection PASS', value: row.passed_inspections, definition: 'Authorized inspection reports with final scientific result PASS.', href: '/quarantine/inspections', tone: 'success' },
        { key: 'released-items', label: 'Released items', value: row.released_items, definition: 'Authorized receiving items with release system state true; separate from PASS.', href: '/quarantine/receiving?workflowState=RELEASED', tone: 'success' },
      ],
      attention: attention.rows,
      activity: activity.rows.map((item) => ({ id: item.id, action: item.action, subjectType: item.subject_type, subjectId: item.subject_id, summary: item.summary, occurredAt: item.occurred_at })),
    };
  }
}
