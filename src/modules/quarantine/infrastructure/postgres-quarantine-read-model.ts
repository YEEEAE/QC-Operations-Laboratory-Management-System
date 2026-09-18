import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { actorHasScope } from '../../../shared/authorization/scope-evaluator.js';
import type {
  QuarantineAdminReadModel,
  QuarantineAdminReader,
} from '../application/get-quarantine-admin.js';
import type {
  ReceivingTrendPoint,
  ReceivingTrendReader,
} from '../application/get-receiving-trend.js';

export class PostgresQuarantineReadModel implements QuarantineAdminReader, ReceivingTrendReader {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  /**
   * The receiving trend read model.
   *
   * The day of each point is formatted by PostgreSQL (`receiving_date::text`)
   * so the calendar day can never drift through a JavaScript time-zone
   * conversion, and the window is bounded in SQL. Rows are scope-checked with
   * the same evaluator the register uses, so the series counts exactly the rows
   * the register would return for the same day.
   */
  async get(input: {
    actor: ActorContext;
    from: string;
    to: string;
    ownership?: 'mine';
  }): Promise<readonly ReceivingTrendPoint[]> {
    const ownershipClause =
      input.ownership === 'mine' ? sql`AND created_by = ${input.actor.id}` : sql``;
    const rows = await sql<{
      id: string;
      created_by: string;
      workflow_state: string;
      date: string;
    }>`
      SELECT id::text AS id, created_by, workflow_state, receiving_date::text AS date
      FROM qc.receiving_items
      WHERE receiving_date >= ${input.from}::date AND receiving_date <= ${input.to}::date
      ${ownershipClause}
      ORDER BY receiving_date ASC, id ASC`.execute(this.db);
    const grant = input.actor.permissions.find(
      (permission) => permission.code === 'PERM-QUAR-VIEW',
    );
    const counts = new Map<string, number>();
    for (const row of rows.rows) {
      const visible = actorHasScope(
        input.actor,
        { type: 'RECEIVING_ITEM', id: row.id, state: row.workflow_state, ownerId: row.created_by },
        { ownerId: row.created_by },
        grant,
      );
      if (!visible) continue;
      counts.set(row.date, (counts.get(row.date) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, value]) => ({ date, value }));
  }
  async getAdmin(): Promise<QuarantineAdminReadModel> {
    const [templates, byState] = await Promise.all([
      sql<{
        id: string;
        code: string;
        name: string;
        active: boolean;
        current_version: string | null;
      }>`
        SELECT t.id::text, t.template_code AS code, t.name, t.active,
          (SELECT version_no FROM qc.inspection_template_versions v WHERE v.template_id = t.id AND v.state = 'APPROVED' ORDER BY v.effective_at DESC NULLS LAST LIMIT 1) AS current_version
        FROM qc.inspection_templates t ORDER BY t.template_code`.execute(this.db),
      sql<{
        state: string;
        value: number;
      }>`SELECT workflow_state AS state, count(*)::int AS value FROM qc.receiving_items GROUP BY workflow_state ORDER BY workflow_state`.execute(
        this.db,
      ),
    ]);
    return {
      generatedAt: new Date(),
      templates: templates.rows.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        active: t.active,
        currentVersion: t.current_version,
      })),
      receivingByState: byState.rows,
    };
  }
}
