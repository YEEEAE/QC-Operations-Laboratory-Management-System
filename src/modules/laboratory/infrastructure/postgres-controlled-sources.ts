import type { Kysely } from 'kysely';
import { AppError } from '../../../shared/errors/app-error.js';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ControlledLabSources } from '../ports/controlled-sources.js';
import type { ControlledContext, LabTest } from '../domain/lab-test.js';

/** Reads only approved controlled definitions. It deliberately does not calculate official outcomes. */
export class PostgresControlledLabSources implements ControlledLabSources {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async resolve(templateVersionId: string, _actor: ActorContext): Promise<ControlledContext> {
    const version = await this.database.selectFrom('lab_test_template_versions').selectAll().where('id', '=', templateVersionId).where('state', '=', 'APPROVED').executeTakeFirst();
    if (!version || !version.method_reference || !version.content_hash) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const parameters = await this.database.selectFrom('lab_test_template_parameters').selectAll().where('template_version_id', '=', version.id).orderBy('position').execute();
    if (!parameters.length || parameters.some(parameter => !parameter.controlled_source_reference || !parameter.acceptance_rule_payload)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return { templateVersionId: version.id, versionNo: version.version_no, methodReference: version.method_reference, sourceReference: version.method_reference, contentHash: version.content_hash, requirementsReference: version.method_reference, source: { templateVersionId: version.id, templateId: version.template_id, versionNo: version.version_no, contentHash: version.content_hash }, documents: [], equipment: [], parameters: parameters.map(parameter => ({ id: parameter.id, code: parameter.parameter_code, label: parameter.label, dataType: parameter.data_type as 'NUMERIC'|'TEXT'|'BOOLEAN', unit: parameter.unit, required: parameter.required, sourceReference: parameter.controlled_source_reference!, criteria: parameter.acceptance_rule_payload as Record<string, unknown> })) };
  }
  async validateExecution(_test: LabTest, _actor: ActorContext): Promise<void> { /* Exact execution requirements are supplied by the approved provider. */ }
  async evaluate(_test: LabTest): Promise<{ result: 'PASS' | 'FAIL' | 'HOLD'; sourceReference: string; contentHash: string }> { throw new AppError('AUTHZ_DENIED', { userSafe: true }); }
}
