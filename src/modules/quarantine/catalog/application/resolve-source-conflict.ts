import type { Kysely } from 'kysely';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { isNamedSystemOwner, SYSTEM_OWNER_LOGIN_IDENTITY } from '../../../../shared/authorization/p05-authority.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import { getDatabase, translateDatabaseError } from '../../../../shared/database/database.js';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';

/**
 * Records the named owner's scoped internal mapping decision separately from
 * the immutable source observation. This does not create a formal signature,
 * alter the scanned source, or approve a template.
 */
export class ResolveInspectionSourceConflictUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async execute(input: {
    actor: ActorContext;
    catalogId: string;
    sourceEvidenceId: string;
    expectedVersion: bigint;
    reason: string;
    requestId: string;
  }): Promise<{ resolutionId: string; version: bigint }> {
    if (!isNamedSystemOwner(input.actor) || !input.actor.permissions.some((permission) =>
      permission.code === 'PERM-ADM-TEMPLATES' && permission.active !== false))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const reason = input.reason.trim();
    if (!reason || reason.length > 2000 || !input.requestId.trim())
      throw new AppError('VALIDATION_FAILED', { userSafe: true });

    try {
      return await this.db.transaction().execute(async (tx) => {
        const prior = await tx.selectFrom('inspection_report_source_resolutions')
          .selectAll().where('request_id', '=', input.requestId).executeTakeFirst();
        if (prior) {
          if (prior.catalog_id !== input.catalogId || prior.source_evidence_id !== input.sourceEvidenceId ||
            prior.reason !== reason || prior.resolution_version !== input.expectedVersion + 1n)
            throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
          return { resolutionId: prior.id, version: prior.resolution_version };
        }

        const catalog = await tx.selectFrom('inspection_report_catalog').selectAll()
          .where('id', '=', input.catalogId).forUpdate().executeTakeFirst();
        if (!catalog) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        if (catalog.source_resolution_version !== input.expectedVersion)
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (!['SOURCE_TITLE_CONFLICT', 'SOURCE_REVISION_CONFLICT'].includes(catalog.source_document_status) ||
          catalog.catalog_state !== 'SOURCE_CONFLICT')
          throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });

        const evidence = await tx.selectFrom('inspection_report_source_evidence').selectAll()
          .where('id', '=', input.sourceEvidenceId).forShare().executeTakeFirst();
        if (!evidence || evidence.catalog_id !== catalog.id || evidence.status !== catalog.source_document_status ||
          !evidence.source_file.trim() || !evidence.source_sha256 || !evidence.content_sha256)
          throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });

        const version = input.expectedVersion + 1n;
        const resolutionId = uuidv7();
        const audit = new PostgresAuditRepository(tx);
        const auditEventId = await audit.appendReturningId({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'INSPECTION_REPORT_CATALOG',
          subjectId: catalog.id,
          action: 'SOURCE_CONFLICT_RESOLVED',
          oldState: catalog.source_document_status,
          newState: 'MATCHED',
          reason,
          requestId: input.requestId,
          payload: {
            scope: 'INTERNAL_SOURCE_MAPPING',
            ownerAuthority: 'SYSTEM_OWNER',
            ownerLoginIdentity: SYSTEM_OWNER_LOGIN_IDENTITY,
            signatureDeferred: true,
            catalogIdentity: {
              docCode: catalog.doc_code,
              officialTitle: catalog.official_title,
              masterRevision: catalog.master_revision,
              sourceListRevision: catalog.source_list_revision,
              sourceSha256: catalog.source_sha256,
            },
            sourceEvidence: {
              id: evidence.id,
              status: evidence.status,
              sourceFile: evidence.source_file,
              sourcePage: evidence.source_page,
              sourceSha256: evidence.source_sha256,
              contentSha256: evidence.content_sha256,
              observedDocCode: evidence.doc_code,
              observedTitle: evidence.source_title,
              observedRevision: evidence.source_revision,
            },
            resolutionVersion: version.toString(),
          },
        });

        await tx.insertInto('inspection_report_source_resolutions').values({
          id: resolutionId,
          catalog_id: catalog.id,
          source_evidence_id: evidence.id,
          resolution_version: version,
          previous_source_status: catalog.source_document_status,
          resolution_state: 'MATCHED_TO_CATALOG_IDENTITY',
          evidence_source_file: evidence.source_file,
          evidence_source_page: evidence.source_page,
          evidence_source_sha256: evidence.source_sha256,
          evidence_content_sha256: evidence.content_sha256,
          reason,
          actor_id: input.actor.id,
          owner_authority: 'SYSTEM_OWNER',
          owner_login_identity: SYSTEM_OWNER_LOGIN_IDENTITY,
          signature_deferred: true,
          request_id: input.requestId,
          audit_event_id: auditEventId,
        }).execute();

        const updated = await tx.updateTable('inspection_report_catalog').set({
          source_document_status: 'MATCHED',
          catalog_state: 'ACTIVE',
          source_resolution_version: version,
          updated_at: new Date(),
        }).where('id', '=', catalog.id)
          .where('source_resolution_version', '=', input.expectedVersion)
          .returning('id').executeTakeFirst();
        if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        return { resolutionId, version };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw translateDatabaseError(error);
    }
  }
}

export const resolveInspectionSourceConflict = () =>
  new ResolveInspectionSourceConflictUseCase(getDatabase());
