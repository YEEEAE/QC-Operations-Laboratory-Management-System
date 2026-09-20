import type { Kysely } from 'kysely';
import { AppError } from '../../../shared/errors/app-error.js';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type {
  ApprovedLabTemplateOption,
  ControlledLabSources,
} from '../ports/controlled-sources.js';
import type { ControlledContext } from '../domain/lab-test.js';

/** Reads only approved controlled definitions. It deliberately does not calculate official outcomes. */
export class PostgresControlledLabSources implements ControlledLabSources {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async listApprovedTemplates(): Promise<readonly ApprovedLabTemplateOption[]> {
    const rows = await this.database
      .selectFrom('lab_test_template_versions')
      .select(['id', 'version_no', 'method_reference'])
      .where('state', '=', 'APPROVED')
      .orderBy('method_reference')
      .orderBy('version_no')
      .limit(200)
      .execute();
    // Only fully-specified approved versions are selectable: a template
    // without a method reference cannot be identified by an operator, and
    // content-hash completeness is still enforced by `resolve()` at create
    // time. No scientific values are invented or exposed here.
    return rows
      .filter((row) => Boolean(row.method_reference?.trim()))
      .map((row) => ({
        id: row.id,
        versionNo: row.version_no,
        methodReference: (row.method_reference as string).trim(),
      }));
  }
  async resolve(templateVersionId: string): Promise<ControlledContext> {
    const version = await this.database
      .selectFrom('lab_test_template_versions')
      .selectAll()
      .where('id', '=', templateVersionId)
      .where('state', '=', 'APPROVED')
      .executeTakeFirst();
    if (!version || !version.method_reference || !version.content_hash)
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const parameters = await this.database
      .selectFrom('lab_test_template_parameters')
      .selectAll()
      .where('template_version_id', '=', version.id)
      .orderBy('position')
      .execute();
    const linkedDocuments = await this.database
      .selectFrom('lab_test_template_document_sources as source')
      .innerJoin('document_versions as version', 'version.id', 'source.document_version_id')
      .innerJoin('document_identities as identity', 'identity.id', 'version.document_id')
      .select([
        'source.document_version_id as documentVersionId',
        'source.usage_type as usageType',
        'identity.document_no as documentNo',
        'identity.document_type as documentType',
        'identity.title as title',
        'version.revision as revision',
        'version.effective_at as effectiveAt',
        'version.content_hash as contentHash',
        'version.state as state',
      ])
      .where('source.template_version_id', '=', version.id)
      .orderBy('identity.document_no')
      .orderBy('version.id')
      .execute();
    if (linkedDocuments.some((document) => document.state !== 'EFFECTIVE'))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (
      !parameters.length ||
      parameters.some(
        (parameter) => !parameter.controlled_source_reference || !parameter.acceptance_rule_payload,
      )
    )
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return {
      templateVersionId: version.id,
      versionNo: version.version_no,
      methodReference: version.method_reference,
      sourceReference: version.method_reference,
      contentHash: version.content_hash,
      requirementsReference: version.method_reference,
      source: {
        templateVersionId: version.id,
        templateId: version.template_id,
        versionNo: version.version_no,
        contentHash: version.content_hash,
      },
      documents: linkedDocuments.map((document) => ({
        documentVersionId: document.documentVersionId,
        usageType: document.usageType,
        snapshot: {
          documentNo: document.documentNo,
          documentType: document.documentType,
          title: document.title,
          revision: document.revision,
          effectiveAt: document.effectiveAt?.toISOString() ?? null,
          contentHash: document.contentHash,
        },
      })),
      equipment: [],
      parameters: parameters.map((parameter) => ({
        id: parameter.id,
        code: parameter.parameter_code,
        label: parameter.label,
        dataType: parameter.data_type as 'NUMERIC' | 'TEXT' | 'BOOLEAN',
        unit: parameter.unit,
        required: parameter.required,
        sourceReference: parameter.controlled_source_reference!,
        criteria: parameter.acceptance_rule_payload as Record<string, unknown>,
      })),
    };
  }
  async validateExecution(): Promise<void> {
    /* Exact execution requirements are supplied by the approved provider. */
  }
  async evaluate(): Promise<{
    result: 'PASS' | 'FAIL' | 'HOLD';
    sourceReference: string;
    contentHash: string;
  }> {
    throw new AppError('AUTHZ_DENIED', { userSafe: true });
  }
}
