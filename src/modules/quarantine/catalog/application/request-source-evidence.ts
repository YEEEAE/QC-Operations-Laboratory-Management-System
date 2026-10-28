import type { Kysely } from 'kysely';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';

/** Records a pending source-evidence request without changing source readiness. */
export class RequestInspectionSourceEvidenceUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async execute(input: {
    actor: ActorContext;
    catalogId: string;
    sourceEvidenceId?: string;
    expectedResolutionVersion: bigint;
    reason: string;
    requestId: string;
  }): Promise<{ id: string; state: 'PENDING_SOURCE_EVIDENCE' }> {
    const reason = input.reason.trim();
    if (!reason || reason.length > 2000 || !input.requestId.trim())
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    authorize({
      actor: input.actor,
      permission: 'PERM-ADM-TEMPLATES',
      action: 'CREATE',
      entity: { type: 'INSPECTION_TEMPLATE_VERSION', id: input.catalogId, state: 'DRAFT' },
      scope: {},
      currentVersion: input.expectedResolutionVersion,
      expectedVersion: input.expectedResolutionVersion,
      businessCondition: input.actor.accountState === 'ACTIVE',
    }, { throwOnDeny: true });

    return this.db.transaction().execute(async (tx) => {
      const prior = await tx.selectFrom('inspection_report_source_evidence_requests')
        .selectAll().where('request_id', '=', input.requestId).executeTakeFirst();
      if (prior) {
        if (prior.catalog_id !== input.catalogId || prior.source_evidence_id !== (input.sourceEvidenceId ?? null) || prior.reason !== reason)
          throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
        return { id: prior.id, state: 'PENDING_SOURCE_EVIDENCE' as const };
      }

      const catalog = await tx.selectFrom('inspection_report_catalog').selectAll()
        .where('id', '=', input.catalogId).forUpdate().executeTakeFirst();
      if (!catalog) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (catalog.source_resolution_version !== input.expectedResolutionVersion)
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      if (!['NOT_DIGITIZED', 'NEEDS_SOURCE_RESCAN'].includes(catalog.source_document_status))
        throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
      if (input.sourceEvidenceId) {
        const evidence = await tx.selectFrom('inspection_report_source_evidence').select('id')
          .where('id', '=', input.sourceEvidenceId).where('catalog_id', '=', catalog.id)
          .executeTakeFirst();
        if (!evidence) throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
      }
      const pending = await tx.selectFrom('inspection_report_source_evidence_requests')
        .select('id').where('catalog_id', '=', catalog.id)
        .where('request_state', '=', 'PENDING_SOURCE_EVIDENCE').executeTakeFirst();
      if (pending) throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });

      const id = uuidv7();
      const audit = new PostgresAuditRepository(tx);
      const auditEventId = await audit.appendReturningId({
        actorType: 'USER', actorId: input.actor.id,
        subjectType: 'INSPECTION_REPORT_CATALOG', subjectId: catalog.id,
        action: 'SOURCE_EVIDENCE_REQUESTED', newState: 'PENDING_SOURCE_EVIDENCE',
        reason, requestId: input.requestId,
        payload: {
          catalogCode: catalog.doc_code,
          sourceStatus: catalog.source_document_status,
          sourceEvidenceId: input.sourceEvidenceId ?? null,
          expectedResolutionVersion: input.expectedResolutionVersion.toString(),
          state: 'PENDING_SOURCE_EVIDENCE',
        },
      });
      await tx.insertInto('inspection_report_source_evidence_requests').values({
        id, catalog_id: catalog.id, source_evidence_id: input.sourceEvidenceId ?? null,
        expected_resolution_version: input.expectedResolutionVersion,
        requested_source_status: catalog.source_document_status,
        request_state: 'PENDING_SOURCE_EVIDENCE', reason, actor_id: input.actor.id,
        request_id: input.requestId, audit_event_id: auditEventId,
      }).execute();
      return { id, state: 'PENDING_SOURCE_EVIDENCE' as const };
    });
  }
}
