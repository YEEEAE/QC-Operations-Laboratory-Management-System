import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import {
  classifyResolution,
  NO_APPROVED_TEMPLATE_MESSAGE,
  type MappedTemplateCandidate,
  type MappedTemplateResolution,
} from '../domain/inspection-item-mapping.js';

/**
 * QC-DATA-002 — Resolve the approved inspection template for a receiving item
 * deterministically through its controlled item code.
 *
 * Fail-closed:
 *  - a mapping without a current APPROVED template version never resolves;
 *  - zero candidates fail safely with the approved human message;
 *  - more than one candidate is ambiguous and requires an explicit authorized
 *    selection — the caller picks by templateVersionId and this use case
 *    verifies the selection is one of the resolved candidates.
 */
export interface ItemMappingReader {
  listCandidates(itemCode: string): Promise<MappedTemplateCandidate[]>;
}

export class PostgresItemMappingReader implements ItemMappingReader {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async listCandidates(itemCode: string): Promise<MappedTemplateCandidate[]> {
    const rows = await this.db
      .selectFrom('inspection_item_templates as mapping')
      .innerJoin('inspection_templates as template', 'template.id', 'mapping.template_id')
      .innerJoin('inspection_template_versions as version', 'version.template_id', 'template.id')
      .select([
        'template.id as templateId',
        'template.template_code as templateCode',
        'version.id as templateVersionId',
        'version.version_no as versionNo',
        'version.name as name',
      ])
      .where('mapping.item_code', '=', itemCode.trim())
      .where('mapping.state', '=', 'ACTIVE')
      .where('version.state', '=', 'APPROVED')
      .orderBy('version.effective_at', 'desc')
      .orderBy('template.template_code')
      .limit(50)
      .execute();
    // The join fans out across versions; keep only the newest approved version
    // per template so one mapping yields exactly one candidate.
    const byTemplate = new Map<string, MappedTemplateCandidate>();
    for (const row of rows)
      if (!byTemplate.has(row.templateId)) byTemplate.set(row.templateId, row);
    return [...byTemplate.values()];
  }
}

export class ResolveInspectionTemplateUseCase {
  constructor(private readonly reader: ItemMappingReader) {}

  async resolve(i: { actor: ActorContext; itemCode: string }): Promise<MappedTemplateResolution> {
    const candidates = await this.reader.listCandidates(i.itemCode);
    return classifyResolution(candidates);
  }

  /**
   * Verify an explicitly chosen candidate when the mapping is ambiguous.
   * The chosen templateVersionId must be one of the resolved candidates.
   */
  async verifyExplicitSelection(i: {
    actor: ActorContext;
    itemCode: string;
    templateVersionId: string;
  }): Promise<MappedTemplateCandidate> {
    const resolution = await this.resolve(i);
    const chosen = resolution.ambiguous.find(
      (candidate) => candidate.templateVersionId === i.templateVersionId,
    );
    if (!chosen)
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        messageKey: NO_APPROVED_TEMPLATE_MESSAGE,
      });
    return chosen;
  }
}

/**
 * Owner/authorized mapping administration (§33/§35). Controlled-correction
 * semantics: a mapping is never silently rewritten — changing a mapping means
 * STOPPING the active one and creating a new row, and both actions are
 * audited.
 */
export class ManageItemTemplateMappingUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async create(i: {
    actor: ActorContext;
    itemCode: string;
    templateId: string;
    effectiveFrom: string;
    requestId: string;
  }) {
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'CREATE',
        entityType: 'INSPECTION_ITEM_MAPPING',
        entity: { type: 'INSPECTION_ITEM_MAPPING', id: 'new', state: 'ACTIVE' },
        scope: {},
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      } as never,
      { throwOnDeny: true },
    );
    const itemCode = i.itemCode.trim();
    if (!itemCode) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    try {
      return await this.db.transaction().execute(async (tx) => {
        // One active mapping per item: the prior active row is stopped with an
        // audit trail, never deleted.
        const prior = await tx
          .selectFrom('inspection_item_templates')
          .selectAll()
          .where('item_code', '=', itemCode)
          .where('state', '=', 'ACTIVE')
          .execute();
        for (const row of prior)
          await tx
            .updateTable('inspection_item_templates')
            .set({ state: 'STOPPED', updated_by: i.actor.id, updated_at: new Date() })
            .where('id', '=', row.id)
            .execute();
        const id = uuidv7();
        await tx
          .insertInto('inspection_item_templates')
          .values({
            id,
            item_code: itemCode,
            template_id: i.templateId,
            state: 'ACTIVE',
            effective_from: i.effectiveFrom,
            created_by: i.actor.id,
            updated_by: i.actor.id,
          })
          .execute();
        for (const row of prior)
          await tx
            .insertInto('audit_events')
            .values({
              id: uuidv7(),
              actor_type: 'USER',
              actor_id: i.actor.id,
              subject_type: 'INSPECTION_ITEM_MAPPING',
              subject_id: row.id,
              action: 'MAPPING_SUPERSEDED',
              new_state: 'STOPPED',
              request_id: i.requestId,
              payload: { supersededBy: id },
            })
            .execute();
        await tx
          .insertInto('audit_events')
          .values({
            id: uuidv7(),
            actor_type: 'USER',
            actor_id: i.actor.id,
            subject_type: 'INSPECTION_ITEM_MAPPING',
            subject_id: id,
            action: 'MAPPING_CREATED',
            new_state: 'ACTIVE',
            request_id: i.requestId,
            payload: { itemCode, templateId: i.templateId },
          })
          .execute();
        return { id };
      });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError('SYSTEM_INTERNAL', { userSafe: true, cause: e });
    }
  }
}
