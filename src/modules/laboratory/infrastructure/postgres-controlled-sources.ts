import type { Kysely } from 'kysely';
import { AppError } from '../../../shared/errors/app-error.js';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type {
  ApprovedLabTemplateOption,
  ControlledLabSources,
} from '../ports/controlled-sources.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import { evaluateControlledTest } from '../domain/controlled-evaluation.js';
import type { LabTest } from '../domain/lab-test.js';
import type { ControlledContext } from '../domain/lab-test.js';

/** Reads approved controlled definitions; outcomes require an explicit method-declared policy. */
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
  async resolve(templateVersionId: string, _actor: import('../../../shared/authorization/types.js').ActorContext | undefined, productCode?: string): Promise<ControlledContext> {
    const version = await this.database
      .selectFrom('lab_test_template_versions')
      .selectAll()
      .where('id', '=', templateVersionId)
      .where('state', '=', 'APPROVED')
      .where('approved_at', 'is not', null)
      .where('effective_at', 'is not', null)
      .where('effective_at', '<=', new Date())
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
        'identity.id as documentId',
        'identity.document_no as documentNo',
        'identity.document_type as documentType',
        'identity.title as title',
        'version.revision as revision',
        'version.effective_at as effectiveAt',
        'version.content_hash as contentHash',
        'version.approved_at as approvedAt',
        'version.reviewed_at as reviewedAt',
        'version.effective_until as effectiveUntil',
        'version.source_binding_verified as sourceBindingVerified',
        'version.state as state',
      ])
      .where('source.template_version_id', '=', version.id)
      .where('identity.active', '=', true)
      .where('version.approved_at', 'is not', null)
      .where('version.reviewed_at', 'is not', null)
      .where('version.source_binding_verified', '=', true)
      .where('version.effective_at', '<=', new Date())
      .where((eb) => eb.or([eb('version.effective_until', 'is', null), eb('version.effective_until', '>', new Date())]))
      .orderBy('identity.document_no')
      .orderBy('version.id')
      .execute();
    if (!linkedDocuments.length || linkedDocuments.some((document) => document.state !== 'EFFECTIVE'
      || !document.approvedAt || !document.reviewedAt || !document.effectiveAt || !document.contentHash))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!productCode?.trim() || !parameters.length)
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    const methodSpecifications = await this.database
      .selectFrom('lab_method_specifications as specification')
      .innerJoin('document_versions as source_version', 'source_version.id', 'specification.source_document_version_id')
      .innerJoin('document_identities as source_identity', 'source_identity.id', 'source_version.document_id')
      .innerJoin('lab_test_template_document_sources as template_source', (join) => join
        .onRef('template_source.document_version_id', '=', 'specification.source_document_version_id')
        .on('template_source.template_version_id', '=', version.id))
      .selectAll('specification')
      .where('specification.method_reference', '=', version.method_reference)
      .where('specification.product_code', '=', productCode.trim())
      .where('specification.state', '=', 'APPROVED')
      .where('specification.approved_at', 'is not', null)
      .where('specification.effective_at', '<=', new Date())
      .where((eb) => eb.and([
        eb.or([eb('specification.effective_until', 'is', null), eb('specification.effective_until', '>', new Date())]),
        eb('source_identity.active', '=', true), eb('source_version.state', '=', 'EFFECTIVE'),
        eb('source_version.approved_at', 'is not', null), eb('source_version.reviewed_at', 'is not', null),
        eb('source_version.source_binding_verified', '=', true),
        eb('source_identity.id', '=', eb.ref('specification.source_document_id')),
        eb('source_version.revision', '=', eb.ref('specification.source_revision')),
        eb('source_version.content_hash', '=', eb.ref('specification.source_content_hash')),
      ]))
      .execute();
    const specificationByParameter = new Map(
      methodSpecifications.map((specification) => [specification.parameter_code, specification] as const),
    );
    const selectedSpecifications = parameters.map((parameter) => specificationByParameter.get(parameter.parameter_code));
    if (selectedSpecifications.some((specification) => !specification))
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    if (methodSpecifications.length !== parameters.length ||
      selectedSpecifications.some((specification) => stableJson(specification!.sample_plan) !== stableJson(selectedSpecifications[0]!.sample_plan)))
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    const qualificationPolicy = selectedSpecifications[0]!.qualification_policy as Record<string, unknown>;
    if (selectedSpecifications.some((specification) => stableJson(specification!.qualification_policy) !== stableJson(qualificationPolicy)))
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    return {
      templateVersionId: version.id,
      versionNo: version.version_no,
      methodReference: version.method_reference,
      sourceReference: version.method_reference,
      contentHash: version.content_hash,
      requirementsReference: version.method_reference,
      productCode: productCode.trim(),
      methodSpecificationIds: selectedSpecifications.map((specification) => specification!.id),
      qualificationPolicy,
      samplePlan: selectedSpecifications[0]!.sample_plan as Record<string, unknown>,
      source: {
        templateVersionId: version.id,
        templateId: version.template_id,
        versionNo: version.version_no,
        contentHash: version.content_hash,
        evaluationPolicy:
          parameters.length &&
          parameters.every((parameter) => {
            const specification = specificationByParameter.get(parameter.parameter_code);
            const payload = specification?.acceptance_expression as Record<string, unknown> | null;
            const first = selectedSpecifications[0]!.acceptance_expression as Record<string, unknown> | null;
            return (
              payload?.evaluationPolicy &&
              stableJson(payload.evaluationPolicy) === stableJson(first?.evaluationPolicy)
            );
          })
            ? (parameters[0]!.acceptance_rule_payload as Record<string, unknown>).evaluationPolicy
            : null,
      },
      documents: linkedDocuments.map((document) => ({
        documentVersionId: document.documentVersionId,
        documentId: document.documentId,
        usageType: document.usageType,
        snapshot: {
          documentId: document.documentId,
          documentNo: document.documentNo,
          documentType: document.documentType,
          title: document.title,
          revision: document.revision,
          effectiveAt: document.effectiveAt?.toISOString() ?? null,
          contentHash: document.contentHash,
        },
      })),
      equipment: [],
      parameters: parameters.map((parameter) => {
        const specification = specificationByParameter.get(parameter.parameter_code)!;
        return {
          id: parameter.id,
          code: parameter.parameter_code,
          label: parameter.label,
          dataType: parameter.data_type as 'NUMERIC' | 'TEXT' | 'BOOLEAN',
          unit: specification.unit,
          required: parameter.required,
          sourceReference: `${specification.method_reference} · ${specification.source_revision} · ${specification.source_content_hash}`,
          criteria: specification.acceptance_expression as Record<string, unknown>,
          acceptanceRuleType: String((specification.acceptance_expression as Record<string, unknown>).ruleType ?? ''),
          precisionGuidance: String(specification.precision_scale),
          roundingReference: specification.source_revision,
          precisionScale: specification.precision_scale,
          validRange: specification.valid_range as Readonly<Record<string, unknown>> | null,
          unitConversionRules: (specification.acceptance_expression as Record<string, unknown>).conversionRules,
          calculationRule: specification.calculation_policy
            ? {
                ruleType: String((specification.calculation_policy as Record<string, unknown>).ruleType ?? ''),
                rulePayload: specification.calculation_policy,
              }
            : null,
        };
      }),
    };
  }
  async validateExecution(): Promise<void> {
    /* Exact execution requirements are supplied by the approved provider. */
  }
  async evaluate(test?: LabTest): Promise<{
    result: 'PASS' | 'FAIL' | 'HOLD' | 'NOT_EVALUATED';
    sourceReference: string;
    contentHash: string;
  }> {
    if (!test) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const evaluation = evaluateControlledTest(test);
    if (evaluation.result === 'NOT_EVALUATED') return { ...evaluation, sourceReference: test.context.sourceReference, contentHash: test.context.contentHash };
    const current = await this.resolve(test.context.templateVersionId, undefined, test.context.productCode);
    if (
      stableJson({ ...current, equipment: [] }) !== stableJson({ ...test.context, equipment: [] })
    )
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return evaluation;
  }
}
