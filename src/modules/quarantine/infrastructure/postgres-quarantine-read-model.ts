import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { QuarantineOverview, QuarantineOverviewReader } from '../application/get-quarantine-overview.js';
import type { QuarantineAdminReadModel, QuarantineAdminReader } from '../application/get-quarantine-admin.js';

export class PostgresQuarantineReadModel implements QuarantineOverviewReader, QuarantineAdminReader {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async get(input: { actor: ActorContext }): Promise<QuarantineOverview> {
    const actorId = input.actor.id;
    const counts = await sql<{ received_today: number; awaiting: number; under_inspection: number; hold: number; pass_not_released: number; released: number }>`
      SELECT
        count(*) FILTER (WHERE receiving_date = CURRENT_DATE)::int AS received_today,
        count(*) FILTER (WHERE workflow_state IN ('PENDING','READY_FOR_INSPECTION'))::int AS awaiting,
        count(*) FILTER (WHERE workflow_state = 'UNDER_INSPECTION')::int AS under_inspection,
        count(*) FILTER (WHERE workflow_state = 'HOLD' OR inspection_result = 'HOLD')::int AS hold,
        count(*) FILTER (WHERE inspection_result = 'PASS' AND release_system = FALSE)::int AS pass_not_released,
        count(*) FILTER (WHERE release_system = TRUE)::int AS released
      FROM qc.receiving_items WHERE created_by = ${actorId}`.execute(this.db);
    const attention = await sql<{ id: string; title: string; summary: string; href: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; state: string }>`
      SELECT id::text, receiving_no AS title,
        CASE WHEN inspection_result = 'PASS' AND release_system = FALSE THEN 'Inspection PASS is still not released' ELSE 'Receiving item requires attention' END AS summary,
        '/quarantine/receiving/' || id::text AS href,
        CASE WHEN workflow_state = 'HOLD' OR inspection_result = 'HOLD' THEN 'CRITICAL' ELSE 'WARNING' END AS severity,
        workflow_state AS state
      FROM qc.receiving_items
      WHERE created_by = ${actorId} AND (workflow_state IN ('PENDING','READY_FOR_INSPECTION','HOLD') OR (inspection_result = 'PASS' AND release_system = FALSE))
      ORDER BY updated_at DESC LIMIT 12`.execute(this.db);
    const distribution = await sql<{ state: string; value: number }>`SELECT workflow_state AS state, count(*)::int AS value FROM qc.receiving_items WHERE created_by = ${actorId} GROUP BY workflow_state ORDER BY workflow_state`.execute(this.db);
    const row = counts.rows[0] ?? { received_today: 0, awaiting: 0, under_inspection: 0, hold: 0, pass_not_released: 0, released: 0 };
    return { generatedAt: new Date(), scopeLabel: 'Your authorized Quarantine scope', metrics: [
      { key: 'received-today', label: 'Received today', value: row.received_today, definition: 'Receiving items created today in your authorized scope.', href: '/quarantine/receiving', tone: 'neutral' },
      { key: 'awaiting-inspection', label: 'Awaiting inspection', value: row.awaiting, definition: 'Items pending or ready for inspection.', href: '/quarantine/receiving?state=READY_FOR_INSPECTION', tone: 'warning' },
      { key: 'under-inspection', label: 'Under inspection', value: row.under_inspection, definition: 'Items currently in inspection workflow.', href: '/quarantine/receiving?state=UNDER_INSPECTION', tone: 'neutral' },
      { key: 'hold', label: 'HOLD', value: row.hold, definition: 'Items with a receiving or inspection hold.', href: '/quarantine/receiving?state=HOLD', tone: 'danger' },
      { key: 'pass-not-released', label: 'PASS / not released', value: row.pass_not_released, definition: 'Inspection PASS is separate from the Release System State.', href: '/quarantine/receiving?inspectionResult=PASS&releaseState=NO', tone: 'success' },
      { key: 'released', label: 'Released', value: row.released, definition: 'Items whose explicit Release System State is YES.', href: '/quarantine/receiving?state=RELEASED', tone: 'success' },
    ], attention: attention.rows, distributions: distribution.rows.map((row) => ({ label: row.state, value: row.value })) };
  }
  async getAdmin(input: { actor: ActorContext }): Promise<QuarantineAdminReadModel> {
    const [templates, byState] = await Promise.all([
      sql<{ id: string; code: string; name: string; active: boolean; current_version: string | null }>`
        SELECT t.id::text, t.template_code AS code, t.name, t.active,
          (SELECT version_no FROM qc.inspection_template_versions v WHERE v.template_id = t.id AND v.state = 'APPROVED' ORDER BY v.effective_at DESC NULLS LAST LIMIT 1) AS current_version
        FROM qc.inspection_templates t ORDER BY t.template_code`.execute(this.db),
      sql<{ state: string; value: number }>`SELECT workflow_state AS state, count(*)::int AS value FROM qc.receiving_items GROUP BY workflow_state ORDER BY workflow_state`.execute(this.db),
    ]);
    return { generatedAt: new Date(), templates: templates.rows.map((t) => ({ id: t.id, code: t.code, name: t.name, active: t.active, currentVersion: t.current_version })), receivingByState: byState.rows };
  }
}
