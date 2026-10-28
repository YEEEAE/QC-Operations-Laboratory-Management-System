import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { isNamedSystemOwner } from '../../../../shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { assertSafeAuditPayload } from '../../../../shared/audit/audit-event.js';
import { stableJson } from '../../../../shared/json/stable-stringify.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import { AppError } from '../../../../shared/errors/app-error.js';

type MappingRecord = {
  id: string; item_code: string; template_id: string; template_version_id: string | null;
  source_revision_id: string | null; source_reference: string | null; effective_revision: string | null;
  source_sha256: string | null; effective_from: string; state: string; approval_state: string; created_by: string; version: bigint;
};

export class ManageItemTemplateMappingsUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async listApprovedItemSources(input: { actor: ActorContext }) {
    if (input.actor.accountState !== 'ACTIVE' || !input.actor.permissions.some((permission) =>
      permission.code === 'PERM-ADM-TEMPLATES' && permission.active !== false))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return this.db.selectFrom('master_data_import_revisions').select([
      'id', 'effective_revision', 'source_reference', 'content_sha256', 'source_file_reference',
    ]).where('dataset_key', '=', 'item').where('approval_state', '=', 'APPROVED')
      .orderBy('submitted_at', 'desc').limit(100).execute();
  }

  async list(input: { actor: ActorContext }): Promise<MappingRecord[]> {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!input.actor.permissions.some((permission) => permission.code === 'PERM-ADM-TEMPLATES' && permission.active !== false))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return this.db.selectFrom('inspection_item_templates as mapping')
      .leftJoin('master_data_import_revisions as source', 'source.id', 'mapping.source_revision_id').select([
      'mapping.id', 'mapping.item_code', 'mapping.template_id', 'mapping.template_version_id',
      'mapping.source_revision_id', 'mapping.source_reference', 'mapping.effective_revision',
      'source.content_sha256 as source_sha256', 'mapping.effective_from', 'mapping.state',
      'mapping.approval_state', 'mapping.created_by', 'mapping.version',
    ]).orderBy('mapping.created_at', 'desc').orderBy('mapping.id', 'desc').limit(100).execute();
  }

  async submit(input: {
    actor: ActorContext; itemCode: string; templateVersionId: string; sourceRevisionId: string;
    requestId: string;
  }): Promise<{ id: string }> {
    authorize({ actor: input.actor, permission: 'PERM-ADM-TEMPLATES', action: 'CREATE',
      entity: { type: 'INSPECTION_ITEM_MAPPING', id: 'new', state: 'ACTIVE' }, scope: {},
      currentVersion: 1n, expectedVersion: 1n, businessCondition: true }, { throwOnDeny: true });
    const itemCode = input.itemCode.trim();
    if (!itemCode || itemCode.length > 200)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.db.transaction().execute(async (tx) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${itemCode}, 0))`.execute(tx);
      const source = await tx.selectFrom('master_data_import_revisions').select([
        'id', 'dataset_key', 'content_sha256', 'source_reference', 'effective_revision', 'approval_state', 'records',
      ]).where('id', '=', input.sourceRevisionId).forUpdate().executeTakeFirst();
      if (!source || source.dataset_key !== 'item' || source.approval_state !== 'APPROVED'
        || !source.effective_revision || !source.source_reference
        || !Array.isArray(source.records)
        || (source.records as Array<Record<string, unknown>>).filter((record) => record.item_code === itemCode).length !== 1)
        throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });

      const version = await tx.selectFrom('inspection_template_versions as version')
        .innerJoin('inspection_templates as template', 'template.id', 'version.template_id')
        .innerJoin('inspection_report_catalog as catalog', 'catalog.id', 'template.catalog_id')
        .select(['version.template_id', 'version.id as version_id', 'version.state', 'version.report_revision',
          'version.effective_at', 'catalog.master_revision', 'catalog.catalog_state', 'catalog.source_document_status'])
        .where('version.id', '=', input.templateVersionId).forShare('version').executeTakeFirst();
      if (!version || version.state !== 'APPROVED' || !version.effective_at
        || version.catalog_state !== 'ACTIVE' || version.source_document_status !== 'MATCHED'
        || version.report_revision !== version.master_revision)
        throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });

      const duplicate = await tx.selectFrom('inspection_item_templates').select('id')
        .where('item_code', '=', itemCode).where('template_version_id', '=', input.templateVersionId)
        .executeTakeFirst();
      if (duplicate) throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
      const id = uuidv7();
      await tx.insertInto('inspection_item_templates').values({
        id, item_code: itemCode, template_id: version.template_id, template_version_id: input.templateVersionId,
        source_revision_id: source.id, source_reference: source.source_reference,
        effective_revision: source.effective_revision, state: 'STOPPED', approval_state: 'PENDING_SOURCE_APPROVAL',
        effective_from: sql`CURRENT_DATE`, effective_to: null, created_by: input.actor.id,
        updated_by: input.actor.id, approved_by: null, approved_at: null, superseded_by: null, version: 1n,
      }).execute();
      const auditId = uuidv7();
      const payload = { itemCode, templateVersionId: input.templateVersionId, sourceRevisionId: source.id,
        sourceSha256: source.content_sha256, sourceReference: source.source_reference, effectiveRevision: source.effective_revision };
      assertSafeAuditPayload(payload);
      await tx.insertInto('audit_events').values({ id: auditId, actor_type: 'USER', actor_id: input.actor.id,
        subject_type: 'INSPECTION_ITEM_MAPPING', subject_id: id, action: 'ITEM_TEMPLATE_MAPPING_SUBMITTED',
        old_state: null, new_state: 'PENDING_SOURCE_APPROVAL', request_id: input.requestId,
        payload: stableJson(payload) }).execute();
      await tx.insertInto('inspection_item_template_mapping_events').values({ id: uuidv7(), mapping_id: id,
        event_type: 'SUBMITTED', actor_id: input.actor.id, owner_authority: null, owner_login_identity: null,
        source_revision_id: source.id, content_sha256: source.content_sha256, request_id: input.requestId,
        audit_event_id: auditId, reason: 'QC user submitted an item-to-template mapping for owner review.' }).execute();
      return { id };
    });
  }

  async approve(input: { actor: ActorContext; mappingId: string; expectedVersion: bigint; reason: string; requestId: string }): Promise<void> {
    if (!isNamedSystemOwner(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const reason = input.reason.trim();
    if (!reason) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    await this.db.transaction().execute(async (tx) => {
      const mapping = await tx.selectFrom('inspection_item_templates').selectAll()
        .where('id', '=', input.mappingId).forUpdate().executeTakeFirst();
      if (!mapping) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      await sql`select pg_advisory_xact_lock(hashtextextended(${mapping.item_code}, 0))`.execute(tx);
      if (mapping.version !== input.expectedVersion) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      if (mapping.approval_state !== 'PENDING_SOURCE_APPROVAL' || !mapping.source_revision_id || !mapping.template_version_id)
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      const source = await tx.selectFrom('master_data_import_revisions').select(['content_sha256', 'approval_state', 'dataset_key'])
        .where('id', '=', mapping.source_revision_id).forShare().executeTakeFirst();
      if (!source || source.dataset_key !== 'item' || source.approval_state !== 'APPROVED')
        throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });

      const prior = await tx.selectFrom('inspection_item_templates').selectAll()
        .where('item_code', '=', mapping.item_code).where('state', '=', 'ACTIVE')
        .where('approval_state', '=', 'APPROVED').forUpdate().execute();
      for (const old of prior) {
        const oldSource = await tx.selectFrom('master_data_import_revisions').select('content_sha256')
          .where('id', '=', old.source_revision_id!).executeTakeFirstOrThrow();
        await tx.updateTable('inspection_item_templates').set({ state: 'STOPPED', approval_state: 'SUPERSEDED',
          effective_to: sql`GREATEST(effective_from, CURRENT_DATE - 1)`, superseded_by: mapping.id,
          updated_by: input.actor.id, updated_at: new Date(), version: sql`version + 1` }).where('id', '=', old.id).execute();
        await this.recordDecision(tx, old.id, old.source_revision_id!, oldSource.content_sha256,
          'SUPERSEDED', input.actor, input.requestId, reason, old.item_code);
      }
      await tx.updateTable('inspection_item_templates').set({ approval_state: 'APPROVED', state: 'ACTIVE',
        approved_by: input.actor.id, approved_at: new Date(), effective_from: sql`CURRENT_DATE`, updated_by: input.actor.id,
        updated_at: new Date(), version: sql`version + 1` })
        .where('id', '=', mapping.id).where('version', '=', input.expectedVersion).executeTakeFirstOrThrow();
      await this.recordDecision(tx, mapping.id, mapping.source_revision_id, source.content_sha256,
        'OWNER_APPROVED', input.actor, input.requestId, reason, mapping.item_code);
    });
  }

  async reject(input: { actor: ActorContext; mappingId: string; expectedVersion: bigint; reason: string; requestId: string }): Promise<void> {
    if (!isNamedSystemOwner(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const reason = input.reason.trim();
    if (!reason) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    await this.db.transaction().execute(async (tx) => {
      const mapping = await tx.selectFrom('inspection_item_templates').selectAll()
        .where('id', '=', input.mappingId).forUpdate().executeTakeFirst();
      if (!mapping) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (mapping.version !== input.expectedVersion) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      if (mapping.approval_state !== 'PENDING_SOURCE_APPROVAL' || !mapping.source_revision_id)
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      const source = await tx.selectFrom('master_data_import_revisions').select('content_sha256')
        .where('id', '=', mapping.source_revision_id).executeTakeFirstOrThrow();
      await tx.updateTable('inspection_item_templates').set({ approval_state: 'REJECTED',
        updated_by: input.actor.id, updated_at: new Date(), version: sql`version + 1` })
        .where('id', '=', mapping.id).where('version', '=', input.expectedVersion).executeTakeFirstOrThrow();
      await this.recordDecision(tx, mapping.id, mapping.source_revision_id, source.content_sha256,
        'OWNER_REJECTED', input.actor, input.requestId, reason, mapping.item_code);
    });
  }

  private async recordDecision(tx: Kysely<DatabaseSchema>, mappingId: string, sourceRevisionId: string,
    contentSha256: string, eventType: 'OWNER_APPROVED' | 'OWNER_REJECTED' | 'SUPERSEDED', actor: ActorContext,
    requestId: string, reason: string, itemCode: string): Promise<void> {
    const auditId = uuidv7();
    const payload = { itemCode, sourceRevisionId, contentSha256, authority: 'SYSTEM_OWNER', ownerLoginIdentity: 'yazeed' };
    assertSafeAuditPayload(payload);
    await tx.insertInto('audit_events').values({ id: auditId, actor_type: 'USER', actor_id: actor.id,
      subject_type: 'INSPECTION_ITEM_MAPPING', subject_id: mappingId,
      action: eventType === 'OWNER_APPROVED' ? 'OWNER_APPROVE_ITEM_TEMPLATE_MAPPING'
        : eventType === 'OWNER_REJECTED' ? 'OWNER_REJECT_ITEM_TEMPLATE_MAPPING' : 'SUPERSEDE_ITEM_TEMPLATE_MAPPING',
      new_state: eventType === 'OWNER_APPROVED' ? 'APPROVED' : eventType === 'OWNER_REJECTED' ? 'REJECTED' : 'SUPERSEDED', reason, request_id: requestId,
      payload: stableJson(payload) }).execute();
    await tx.insertInto('inspection_item_template_mapping_events').values({ id: uuidv7(), mapping_id: mappingId,
      event_type: eventType, actor_id: actor.id, owner_authority: 'SYSTEM_OWNER', owner_login_identity: 'yazeed',
      source_revision_id: sourceRevisionId, content_sha256: contentSha256, request_id: `${requestId}:${mappingId}`,
      audit_event_id: auditId, reason }).execute();
  }
}
