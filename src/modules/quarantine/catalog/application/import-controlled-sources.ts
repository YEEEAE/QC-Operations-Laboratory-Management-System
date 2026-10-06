import { createHash } from 'node:crypto';
import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import { stableJson } from '../../../../shared/json/stable-stringify.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import { isTemplateAuthority } from '../../templates/domain/template-policy.js';
import { controlledFormSchema } from '../domain/controlled-form.js';
import { matchControlledSource, type SourceStatus } from '../domain/source-match.js';
import master from '../master-rev14.json' with { type: 'json' };
import sources from '../source-evidence.json' with { type: 'json' };
import drafts from '../digitized-forms.json' with { type: 'json' };

export class ImportControlledInspectionSourcesUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async execute(i: { actor: ActorContext; requestId: string }) {
    if (!isTemplateAuthority(i.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'CREATE',
        entity: { type: 'INSPECTION_TEMPLATE_VERSION', id: 'new', state: 'DRAFT' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const forms = drafts.map((f) => controlledFormSchema.parse(f));
    return this.db.transaction().execute(async (tx) => {
      await sql`select pg_advisory_xact_lock(hashtextextended('qc:inspection:master-rev14',0))`.execute(
        tx,
      );
      const audit = new PostgresAuditRepository(tx);
      let imported = 0,
        duplicates = 0;
      const catalog = await tx
        .selectFrom('inspection_report_catalog')
        .selectAll()
        .orderBy('source_row_no')
        .forUpdate()
        .execute();
      if (
        catalog.length !== master.entries.length ||
        catalog.some((c) => {
          const expected = master.entries.find((e) => e.id === c.id);
          return (
            !expected ||
            expected.docCode !== c.doc_code ||
            expected.officialTitle !== c.official_title ||
            expected.masterRevision !== c.master_revision ||
            expected.sourceRowNo !== c.source_row_no ||
            c.source_sha256 !== master.sourceSha256
          );
        })
      )
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      const evidenceByCode = new Map<string, string>();
      for (const s of sources) {
        const entry = master.entries.find((e) => e.docCode === s.docCode);
        const computed = matchControlledSource(master.entries, {
          docCode: s.docCode,
          sourceTitle: s.sourceTitle,
          sourceRevision: s.sourceRevision,
          readable: s.status !== 'NEEDS_SOURCE_RESCAN',
        });
        if (computed !== s.status) throw new AppError('VALIDATION_FAILED', { userSafe: true });
        const prior = await tx
          .selectFrom('inspection_report_source_evidence')
          .selectAll()
          .where('source_sha256', '=', s.sourceSha256)
          .where('content_sha256', '=', s.contentSha256)
          .executeTakeFirst();
        let id = prior?.id;
        if (prior) {
          if (
            prior.doc_code !== s.docCode ||
            prior.status !== s.status ||
            prior.source_revision !== s.sourceRevision ||
            prior.source_title !== s.sourceTitle
          )
            throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        } else {
          id = uuidv7();
          await tx
            .insertInto('inspection_report_source_evidence')
            .values({
              id,
              catalog_id: entry?.id ?? null,
              doc_code: s.docCode,
              source_title: s.sourceTitle,
              source_revision: s.sourceRevision,
              source_file: s.sourceFile,
              source_page: s.sourcePage,
              source_sha256: s.sourceSha256,
              content_sha256: s.contentSha256,
              status: s.status as SourceStatus,
              resolution_status: s.resolutionStatus,
            })
            .execute();
          await audit.append({
            actorType: 'USER',
            actorId: i.actor.id,
            subjectType: 'INSPECTION_REPORT_SOURCE',
            subjectId: id,
            action: s.status === 'MATCHED' ? 'TEMPLATE_SOURCE_BOUND' : 'SOURCE_CONFLICT_DETECTED',
            requestId: i.requestId,
            payload: {
              docCode: s.docCode,
              sourcePage: s.sourcePage,
              sourceSha256: s.sourceSha256,
              status: s.status,
            },
          });
        }
        if (s.status === 'MATCHED' && id && !evidenceByCode.has(s.docCode))
          evidenceByCode.set(s.docCode, id);
      }
      for (const form of forms) {
        const c = catalog.find((e) => e.doc_code === form.docCode);
        const evidenceId = evidenceByCode.get(form.docCode);
        if (
          !c ||
          c.catalog_state !== 'ACTIVE' ||
          !evidenceId ||
          c.master_revision !== form.reportRevision
        )
          throw new AppError('VALIDATION_FAILED', { userSafe: true });
        const hash = createHash('sha256').update(stableJson(form)).digest('hex');
        let header = await tx
          .selectFrom('inspection_templates')
          .selectAll()
          .where('catalog_id', '=', c.id)
          .executeTakeFirst();
        if (!header)
          header = await tx
            .insertInto('inspection_templates')
            .values({
              id: uuidv7(),
              catalog_id: c.id,
              template_code: c.doc_code,
              name: c.official_title,
              description: null,
              active: true,
              created_by: i.actor.id,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        const prior = await tx
          .selectFrom('inspection_template_versions')
          .selectAll()
          .where('template_id', '=', header.id)
          .where('report_revision', '=', form.reportRevision)
          .executeTakeFirst();
        if (prior) {
          if (
            prior.content_hash !== hash ||
            stableJson(controlledFormSchema.parse(prior.digital_form)) !== stableJson(form)
          )
            throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
          duplicates++;
          continue;
        }
        const emptyDraft = await tx
          .selectFrom('inspection_template_versions')
          .selectAll()
          .where('template_id', '=', header.id)
          .where('version_no', '=', form.reportRevision)
          .forUpdate()
          .executeTakeFirst();
        if (
          emptyDraft &&
          (emptyDraft.state !== 'DRAFT' ||
            emptyDraft.content_hash ||
            emptyDraft.digital_form ||
            emptyDraft.source_evidence_id)
        )
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const version = emptyDraft
          ? await tx
              .updateTable('inspection_template_versions')
              .set({
                report_revision: form.reportRevision,
                source_evidence_id: evidenceId,
                digital_form: JSON.stringify(form),
                content_hash: hash,
                name: c.official_title,
                source_document: `${sources[0]!.sourceFile}#page=${sources.find((s) => s.docCode === form.docCode && s.status === 'MATCHED')!.sourcePage}`,
                version: BigInt(emptyDraft.version) + 1n,
              })
              .where('id', '=', emptyDraft.id)
              .returningAll()
              .executeTakeFirstOrThrow()
          : await tx
              .insertInto('inspection_template_versions')
              .values({
                id: uuidv7(),
                template_id: header.id,
                version_no: form.reportRevision,
                report_revision: form.reportRevision,
                state: 'DRAFT',
                effective_at: null,
                approved_at: null,
                approved_by: null,
                source_document: `${sources[0]!.sourceFile}#page=${sources.find((s) => s.docCode === form.docCode && s.status === 'MATCHED')!.sourcePage}`,
                source_evidence_id: evidenceId,
                digital_form: JSON.stringify(form),
                content_hash: hash,
                name: c.official_title,
                description: 'Controlled source transcription — review required',
                created_by: i.actor.id,
              })
              .returningAll()
              .executeTakeFirstOrThrow();
        for (const section of form.sections) {
          const sectionRow = await tx
            .insertInto('inspection_template_sections')
            .values({
              id: uuidv7(),
              template_version_id: version.id,
              section_code: section.code,
              title: section.title,
              position: form.sections.indexOf(section) + 1,
              instructions: null,
            })
            .returning('id')
            .executeTakeFirstOrThrow();
          for (const point of section.points)
            await tx
              .insertInto('inspection_template_points')
              .values({
                id: uuidv7(),
                section_id: sectionRow.id,
                point_code: point.key,
                label: point.label,
                requirement_text: point.requirementText,
                data_type: point.dataType,
                unit: point.unit ?? null,
                required: point.required,
                acceptance_rule_type: null,
                acceptance_rule_payload: null,
                source_reference: version.source_document,
                position: section.points.indexOf(point) + 1,
              })
              .execute();
        }
        await tx
          .updateTable('inspection_report_catalog')
          .set({ source_document_status: 'MATCHED', updated_at: new Date() })
          .where('id', '=', c.id)
          .execute();
        await audit.append({
          actorType: 'USER',
          actorId: i.actor.id,
          subjectType: 'INSPECTION_TEMPLATE_VERSION',
          subjectId: version.id,
          action: emptyDraft ? 'TEMPLATE_SOURCE_BOUND' : 'TEMPLATE_CREATED',
          newState: 'DRAFT',
          requestId: i.requestId,
          payload: { catalogId: c.id, sourceEvidenceId: evidenceId, contentHash: hash },
        });
        imported++;
      }
      await audit.append({
        actorType: 'USER',
        actorId: i.actor.id,
        subjectType: 'INSPECTION_REPORT_CATALOG',
        subjectId: master.entries[0]!.id,
        action: 'REPORT_CATALOG_IMPORTED',
        requestId: i.requestId,
        payload: {
          sourceListRevision: 14,
          sourceSha256: master.sourceSha256,
          validEntries: catalog.length,
          templatesCreated: imported,
          existingTemplates: duplicates,
        },
      });
      return {
        validEntries: catalog.length,
        templatesCreated: imported,
        existingTemplates: duplicates,
        sourcePages: sources.length,
      };
    });
  }
}
