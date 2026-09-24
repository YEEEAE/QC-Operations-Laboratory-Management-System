import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext, PermissionGrant } from '../../../shared/authorization/types.js';
import { actorHasScope } from '../../../shared/authorization/scope-evaluator.js';
import { getDatabase } from '../../../shared/database/database.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { reportDraftSchema, type ReportDraftData } from '../domain/report-draft.js';
import { PostgresReportDraftRepository } from '../infrastructure/postgres-report-draft-repository.js';
import type { ReportDraftRepository } from '../ports/report-draft-repository.js';

const MAX_PG_BIGINT = 9_223_372_036_854_775_807n;
const repository = (): ReportDraftRepository => new PostgresReportDraftRepository(getDatabase());

function grantFor(actor: ActorContext, code: string): PermissionGrant | undefined {
  if (actor.accountState !== 'ACTIVE') return undefined;
  const grant = actor.permissions.find((permission) => permission.code === code);
  if (!grant || grant.active === false) return undefined;
  // A report draft has only an author/owner dimension. Other scope kinds cannot
  // be treated as GLOBAL or OWN without corresponding record context.
  if (!grant.scopes.some((scope) => scope === 'GLOBAL' || scope === 'OWN')) return undefined;
  return grant;
}

function canAccess(
  actor: ActorContext,
  code: string,
  row: { id: string; author_id: string; report_type: string },
): boolean {
  const grant = grantFor(actor, code);
  return Boolean(
    grant &&
    actorHasScope(
      actor,
      { type: 'LAB_REPORT_DRAFT', id: row.id, state: 'DRAFT', authorId: row.author_id },
      { ownerId: row.author_id },
      grant,
    ),
  );
}

export function createReportDraftOperations(reportDraftRepository: ReportDraftRepository) {
  return {
    async list(actor: ActorContext) {
      const grant = grantFor(actor, 'PERM-LAB-VIEW');
      if (!grant) throw new AppError('AUTHZ_DENIED');
      return reportDraftRepository.list({
        authorId: grant.scopes.includes('GLOBAL') ? undefined : actor.id,
        limit: 50,
      });
    },
    async get(actor: ActorContext, id: string) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
        throw new AppError('RESOURCE_NOT_FOUND');
      const row = await reportDraftRepository.get(id);
      if (!row || !canAccess(actor, 'PERM-LAB-VIEW', row)) throw new AppError('RESOURCE_NOT_FOUND');
      return { ...row, data: reportDraftSchema.parse(row.form_data) };
    },
    async save(input: {
      actor: ActorContext;
      id?: string;
      expectedVersion?: bigint;
      data: ReportDraftData;
      requestId: string;
    }) {
      const data = reportDraftSchema.parse(input.data);
      const id = input.id;
      if (!id) {
        if (!grantFor(input.actor, 'PERM-LAB-CREATE')) throw new AppError('AUTHZ_DENIED');
        const newId = uuidv7();
        await reportDraftRepository.create({
          id: newId,
          reportType: data.reportType,
          formData: data,
          authorId: input.actor.id,
          requestId: input.requestId,
        });
        return newId;
      }

      const grant = grantFor(input.actor, 'PERM-LAB-EDIT-DRAFT');
      if (!grant) throw new AppError('AUTHZ_DENIED');
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
        throw new AppError('RESOURCE_NOT_FOUND');
      const existing = await reportDraftRepository.get(id);
      if (!existing || !canAccess(input.actor, 'PERM-LAB-EDIT-DRAFT', existing))
        throw new AppError('RESOURCE_NOT_FOUND');
      if (existing.report_type !== data.reportType)
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      const expectedVersion = input.expectedVersion;
      if (expectedVersion === undefined || expectedVersion < 1n || expectedVersion >= MAX_PG_BIGINT)
        throw new AppError('VALIDATION_FAILED', { userSafe: true });

      await reportDraftRepository.update({
        id,
        authorId: grant.scopes.includes('GLOBAL') ? undefined : input.actor.id,
        reportType: existing.report_type,
        expectedVersion,
        formData: data,
        actorId: input.actor.id,
        requestId: input.requestId,
      });
      return id;
    },
  };
}

export async function listReportDrafts(actor: ActorContext) {
  return createReportDraftOperations(repository()).list(actor);
}
export async function getReportDraft(actor: ActorContext, id: string) {
  return createReportDraftOperations(repository()).get(actor, id);
}
export async function saveReportDraft(
  input: Parameters<ReturnType<typeof createReportDraftOperations>['save']>[0],
) {
  return createReportDraftOperations(repository()).save(input);
}
