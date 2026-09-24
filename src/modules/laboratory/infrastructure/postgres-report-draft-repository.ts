import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ReportDraftRepository, ReportDraftRow } from '../ports/report-draft-repository.js';

export class PostgresReportDraftRepository implements ReportDraftRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  list(input: { authorId?: string; limit: number }): Promise<ReportDraftRow[]> {
    let query = this.db
      .selectFrom('laboratory_report_drafts')
      .selectAll()
      .orderBy('updated_at', 'desc')
      .orderBy('id', 'desc')
      .limit(Math.max(1, Math.min(input.limit, 100)));
    if (input.authorId) query = query.where('author_id', '=', input.authorId);
    return query.execute() as Promise<ReportDraftRow[]>;
  }

  async get(id: string): Promise<ReportDraftRow | undefined> {
    return this.db
      .selectFrom('laboratory_report_drafts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst() as Promise<ReportDraftRow | undefined>;
  }

  async create(input: {
    id: string;
    reportType: ReportDraftRow['report_type'];
    formData: ReportDraftRow['form_data'];
    authorId: string;
    requestId: string;
  }): Promise<void> {
    await this.db.transaction().execute(async (tx) => {
      await tx
        .insertInto('laboratory_report_drafts')
        .values({
          id: input.id,
          report_type: input.reportType,
          form_data: input.formData,
          author_id: input.authorId,
        })
        .execute();
      await tx
        .insertInto('audit_events')
        .values({
          id: uuidv7(),
          actor_type: 'USER',
          actor_id: input.authorId,
          subject_type: 'LAB_REPORT_DRAFT',
          subject_id: input.id,
          action: 'CREATE',
          old_state: null,
          new_state: 'DRAFT',
          reason: null,
          request_id: input.requestId,
          signature_id: null,
          payload: null,
        })
        .execute();
    });
  }

  async update(input: {
    id: string;
    authorId?: string;
    reportType: ReportDraftRow['report_type'];
    expectedVersion: bigint;
    formData: ReportDraftRow['form_data'];
    actorId: string;
    requestId: string;
  }): Promise<void> {
    await this.db.transaction().execute(async (tx) => {
      let update = tx
        .updateTable('laboratory_report_drafts')
        .set({
          form_data: input.formData,
          updated_at: new Date(),
          version: input.expectedVersion + 1n,
        })
        .where('id', '=', input.id)
        .where('report_type', '=', input.reportType)
        .where('version', '=', input.expectedVersion);
      if (input.authorId) update = update.where('author_id', '=', input.authorId);
      const changed = await update.executeTakeFirst();
      if (!changed.numUpdatedRows) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      await tx
        .insertInto('audit_events')
        .values({
          id: uuidv7(),
          actor_type: 'USER',
          actor_id: input.actorId,
          subject_type: 'LAB_REPORT_DRAFT',
          subject_id: input.id,
          action: 'SAVE',
          old_state: 'DRAFT',
          new_state: 'DRAFT',
          reason: null,
          request_id: input.requestId,
          signature_id: null,
          payload: null,
        })
        .execute();
    });
  }
}
