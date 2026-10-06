import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { getDatabase } from '../../../../shared/database/database.js';
import { ImportControlledInspectionSourcesUseCase } from './import-controlled-sources.js';
import { CreateTemplateUseCase } from '../../templates/application/create-template.js';

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
        sql<number>`(select count(*)::int from qc.inspection_item_templates m join qc.inspection_templates t on t.id=m.template_id where t.catalog_id=c.id and m.state='ACTIVE')`.as(
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
    if (!row || row.catalog_state !== 'ACTIVE')
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
});
