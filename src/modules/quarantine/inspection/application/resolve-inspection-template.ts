import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { AppError } from '../../../../shared/errors/app-error.js';
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
  async listCatalogContext(itemCode:string) {
    return this.db.selectFrom('inspection_item_templates as m').innerJoin('inspection_templates as t','t.id','m.template_id').innerJoin('inspection_report_catalog as c','c.id','t.catalog_id').select(['c.doc_code','c.official_title','c.master_revision','c.source_document_status']).where('m.item_code','=',itemCode.trim()).where('m.state','=','ACTIVE').where('m.approval_state','=','APPROVED').orderBy('c.doc_code').execute();
  }
  async listCandidates(itemCode: string): Promise<MappedTemplateCandidate[]> {
    const rows = await this.db
      .selectFrom('inspection_item_templates as mapping')
      .innerJoin('inspection_templates as template', 'template.id', 'mapping.template_id')
      .innerJoin('inspection_template_versions as version', 'version.id', 'mapping.template_version_id')
      .innerJoin('inspection_report_catalog as catalog', 'catalog.id', 'template.catalog_id')
      .select([
        'mapping.id as mappingRevisionId',
        'mapping.source_revision_id as sourceRevisionId',
        'mapping.source_reference as sourceReference',
        'mapping.effective_revision as effectiveRevision',
        'template.id as templateId',
        'template.template_code as templateCode',
        'version.id as templateVersionId',
        'version.version_no as versionNo',
        'catalog.official_title as name',
        'catalog.id as catalogId',
        'catalog.master_revision as reportRevision',
      ])
      .where('mapping.item_code', '=', itemCode.trim())
      .where('mapping.state', '=', 'ACTIVE')
      .where('mapping.approval_state', '=', 'APPROVED')
      .where('version.state', '=', 'APPROVED')
      .where('version.effective_at','<=',sql<Date>`CURRENT_TIMESTAMP`)
      .where('template.active', '=', true)
      .where('catalog.catalog_state', '=', 'ACTIVE')
      .where('catalog.source_document_status', '=', 'MATCHED')
      .whereRef('version.report_revision', '=', 'catalog.master_revision')
      .where('version.digital_form', 'is not', null)
      .where('mapping.effective_from', '<=', sql<string>`CURRENT_DATE`)
      .where(eb => eb.or([eb('mapping.effective_to','is',null),eb('mapping.effective_to','>=',sql<string>`CURRENT_DATE`)]))
      .orderBy('version.effective_at', 'desc')
      .orderBy('version.created_at', 'desc')
      .orderBy('version.id', 'desc')
      .orderBy('template.template_code')
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
    if(i.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED',{userSafe:true});
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
    const chosen = (resolution.unique ? [resolution.unique] : resolution.ambiguous).find(
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
