import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { getDatabase } from '../../../../shared/database/database.js';
import { ImportControlledInspectionSourcesUseCase } from './import-controlled-sources.js';
import { CreateTemplateUseCase } from '../../templates/application/create-template.js';
import { ResolveInspectionSourceConflictUseCase } from './resolve-source-conflict.js';
import { RequestInspectionSourceEvidenceUseCase } from './request-source-evidence.js';

export interface CatalogSourceEvidenceSummary {
  id: string;
  status: string;
  docCode: string | null;
  title: string | null;
  revision: string | null;
  sourceFile: string;
  sourcePage: number | null;
  sourceSha256: string;
  contentSha256: string;
}

export interface CatalogTemplateSummary {
  id: string;
  state: string;
  versionNo: string;
  authoringOrigin: string;
  reportRevision: string | null;
  contentHash: string | null;
  sourceEvidenceId: string | null;
  approvedAt: string | null;
  effectiveAt: string | null;
}

export interface CatalogControlledDocumentSummary {
  id: string;
  documentNo: string;
  title: string;
  revision: string;
  state: string;
  contentHash: string | null;
  effectiveAt: string | null;
}

export interface CatalogSourceEvidenceRequestSummary {
  id: string;
  reason: string;
  recordedAt: string;
  actorId: string;
}

export class InspectionReportCatalog {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async search(i: { actor: ActorContext; search?: string; page?: number }) {
    if (i.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const search = (i.search ?? '').trim().slice(0, 120).toLowerCase();
    const requested = i.page ?? 1;
    const page = Number.isFinite(requested)
      ? Math.max(1, Math.min(1000, Math.floor(requested)))
      : 1;
    let q = this.db
      .selectFrom('inspection_report_catalog as c')
      .selectAll('c')
      .select([
        sql<number>`(select count(*)::int from qc.inspection_item_templates m join qc.inspection_templates t on t.id=m.template_id where t.catalog_id=c.id and m.state='ACTIVE' and m.approval_state='APPROVED')`.as(
          'mappingCount',
        ),
        sql<
          string | null
        >`(select v.state from qc.inspection_template_versions v join qc.inspection_templates t on t.id=v.template_id where t.catalog_id=c.id order by v.created_at desc,v.id desc limit 1)`.as(
          'digitalTemplateStatus',
        ),
        sql<
          string | null
        >`(select v.version_no from qc.inspection_template_versions v join qc.inspection_templates t on t.id=v.template_id where t.catalog_id=c.id order by v.created_at desc,v.id desc limit 1)`.as(
          'templateVersion',
        ),
        sql<CatalogSourceEvidenceSummary[]>`coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', e.id, 'status', e.status, 'docCode', e.doc_code,
            'title', e.source_title, 'revision', e.source_revision,
            'sourceFile', e.source_file, 'sourcePage', e.source_page,
            'sourceSha256', e.source_sha256, 'contentSha256', e.content_sha256
          ) order by e.created_at desc, e.id desc)
          from qc.inspection_report_source_evidence e where e.catalog_id=c.id
        ), '[]'::jsonb)`.as('sourceEvidenceRecords'),
        sql<CatalogTemplateSummary | null>`(
          select jsonb_build_object(
            'id', v.id, 'state', v.state, 'versionNo', v.version_no,
            'authoringOrigin', v.authoring_origin, 'reportRevision', v.report_revision,
            'contentHash', v.content_hash, 'sourceEvidenceId', v.source_evidence_id,
            'approvedAt', v.approved_at, 'effectiveAt', v.effective_at
          )
          from qc.inspection_template_versions v
          join qc.inspection_templates t on t.id=v.template_id
          where t.catalog_id=c.id
          order by v.created_at desc, v.id desc limit 1
        )`.as('actualDigitalTemplate'),
        sql<CatalogControlledDocumentSummary | null>`(
          select jsonb_build_object(
            'id', d.id, 'documentNo', d.document_no, 'title', d.title,
            'revision', v.revision, 'state', v.state, 'contentHash', v.content_hash,
            'effectiveAt', v.effective_at
          )
          from qc.document_identities d
          join qc.document_versions v on v.document_id=d.id
          where d.document_no=c.doc_code
          order by (v.state='EFFECTIVE') desc, v.created_at desc, v.id desc limit 1
        )`.as('controlledDocument'),
        sql<{
          id: string; version: string; reason: string; evidenceSourceFile: string;
          evidenceSourcePage: number | null; evidenceSourceSha256: string;
          evidenceContentSha256: string; recordedAt: string; actorId: string; ownerLoginIdentity: string;
        } | null>`(
          select jsonb_build_object(
            'id', r.id, 'version', r.resolution_version, 'reason', r.reason,
            'evidenceSourceFile', r.evidence_source_file, 'evidenceSourcePage', r.evidence_source_page,
            'evidenceSourceSha256', r.evidence_source_sha256,
            'evidenceContentSha256', r.evidence_content_sha256,
            'recordedAt', r.recorded_at, 'actorId', r.actor_id,
            'ownerLoginIdentity', r.owner_login_identity
          )
          from qc.inspection_report_source_resolutions r
          where r.catalog_id=c.id
          order by r.resolution_version desc limit 1
        )`.as('latestSourceResolution'),
        sql<CatalogSourceEvidenceRequestSummary | null>`(
          select jsonb_build_object(
            'id', r.id, 'reason', r.reason, 'recordedAt', r.recorded_at, 'actorId', r.actor_id
          )
          from qc.inspection_report_source_evidence_requests r
          where r.catalog_id=c.id and r.request_state='PENDING_SOURCE_EVIDENCE'
          order by r.recorded_at desc, r.id desc limit 1
        )`.as('pendingSourceEvidenceRequest'),
      ]);
    // Parameterized substring search; punctuation is not an SQL wildcard.
    if (search)
      q = q.where(
        sql<boolean>`position(${search} in lower(c.doc_code))>0 or position(${search} in c.normalized_search_title)>0`,
      );
    return q
      .orderBy('c.source_row_no')
      .limit(50)
      .offset((page - 1) * 50)
      .execute();
  }
  async resolveIdentity(i: { actor: ActorContext; catalogId: string }) {
    if (i.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const row = await this.db
      .selectFrom('inspection_report_catalog')
      .selectAll()
      .where('id', '=', i.catalogId)
      .executeTakeFirst();
    if (!row || row.catalog_state !== 'ACTIVE' || row.source_document_status !== 'MATCHED')
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return row;
  }
}
export class CreateCatalogTemplateUseCase {
  constructor(
    private readonly catalog: InspectionReportCatalog,
    private readonly create: CreateTemplateUseCase,
  ) {}
  async execute(i: {
    actor: ActorContext;
    catalogId: string;
    description?: string;
    reauthenticationSecret?: string;
    requestId: string;
  }) {
    const c = await this.catalog.resolveIdentity(i);
    return this.create.execute({
      ...i,
      templateCode: c.doc_code,
      name: c.official_title,
      versionNo: c.master_revision,
      draftOnly: true,
    });
  }
}
export const inspectionCatalogDependencies = () => ({
  catalog: new InspectionReportCatalog(getDatabase()),
  importSources: new ImportControlledInspectionSourcesUseCase(getDatabase()),
  resolveSourceConflict: new ResolveInspectionSourceConflictUseCase(getDatabase()),
  requestSourceEvidence: new RequestInspectionSourceEvidenceUseCase(getDatabase()),
});
