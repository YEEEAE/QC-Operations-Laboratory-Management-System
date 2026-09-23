import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { getDatabase } from '../../../shared/database/database.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { reportDraftSchema, type ReportDraftData } from '../domain/report-draft.js';

function can(actor: ActorContext, code: string) {
  return (
    actor.accountState === 'ACTIVE' &&
    actor.permissions.some(
      (p) =>
        p.code === code &&
        p.active !== false &&
        (p.scopes.includes('GLOBAL') || p.scopes.includes('OWN')),
    )
  );
}

export async function listReportDrafts(actor: ActorContext) {
  if (!can(actor, 'PERM-LAB-VIEW')) throw new AppError('AUTHZ_DENIED');
  return getDatabase()
    .selectFrom('laboratory_report_drafts')
    .select(['id', 'report_type', 'updated_at', 'version'])
    .where('author_id', '=', actor.id)
    .orderBy('updated_at', 'desc')
    .limit(50)
    .execute();
}

export async function getReportDraft(actor: ActorContext, id: string) {
  if (!can(actor, 'PERM-LAB-VIEW')) throw new AppError('AUTHZ_DENIED');
  const row = await getDatabase()
    .selectFrom('laboratory_report_drafts')
    .selectAll()
    .where('id', '=', id)
    .where('author_id', '=', actor.id)
    .executeTakeFirst();
  if (!row) throw new AppError('RESOURCE_NOT_FOUND');
  return { ...row, data: reportDraftSchema.parse(row.form_data) };
}

export async function saveReportDraft(input: {
  actor: ActorContext;
  id?: string;
  expectedVersion?: bigint;
  data: ReportDraftData;
  requestId: string;
}) {
  if (!can(input.actor, input.id ? 'PERM-LAB-EDIT-DRAFT' : 'PERM-LAB-CREATE'))
    throw new AppError('AUTHZ_DENIED');
  const data = reportDraftSchema.parse(input.data);
  const db = getDatabase();
  return db.transaction().execute(async (tx) => {
    const id = input.id ?? uuidv7();
    if (input.id) {
      const changed = await tx
        .updateTable('laboratory_report_drafts')
        .set({
          report_type: data.reportType,
          form_data: data,
          updated_at: new Date(),
          version: (input.expectedVersion ?? 0n) + 1n,
        })
        .where('id', '=', id)
        .where('author_id', '=', input.actor.id)
        .where('version', '=', input.expectedVersion ?? 0n)
        .executeTakeFirst();
      if (!changed.numUpdatedRows) throw new AppError('CONFLICT_STALE_VERSION');
    } else {
      await tx
        .insertInto('laboratory_report_drafts')
        .values({
          id,
          report_type: data.reportType,
          form_data: data,
          author_id: input.actor.id,
        })
        .execute();
    }
    await tx
      .insertInto('audit_events')
      .values({
        id: uuidv7(),
        actor_type: 'USER',
        actor_id: input.actor.id,
        subject_type: 'LAB_REPORT_DRAFT',
        subject_id: id,
        action: input.id ? 'SAVE' : 'CREATE',
        old_state: input.id ? 'DRAFT' : null,
        new_state: 'DRAFT',
        reason: null,
        request_id: input.requestId,
        signature_id: null,
        payload: null,
      })
      .execute();
    return id;
  });
}
