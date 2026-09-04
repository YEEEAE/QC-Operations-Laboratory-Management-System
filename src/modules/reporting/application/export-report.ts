import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ReportFilters } from '../domain/report-definition.js';
import type { ReportQuery } from '../ports/report-query.js';
import { csvBytes } from '../infrastructure/csv-exporter.js';
import { xlsxBytes } from '../infrastructure/xlsx-exporter.js';
import { ReportRegistry } from './report-registry.js';
import { RunReportUseCase } from './run-report.js';
export interface ExportResult { readonly filename: string; readonly mimeType: string; readonly bytes: Buffer; readonly rowCount: number; }
export class ExportReportUseCase {
  constructor(private readonly registry: ReportRegistry, private readonly query: ReportQuery) {}
  async execute(actor: ActorContext, code: string, format: 'CSV' | 'XLSX', filters: ReportFilters): Promise<ExportResult> {
    const definition = this.registry.get(code);
    const entity = { type: 'REPORT', id: definition.code, state: 'ACTIVE', ownerId: actor.id, domain: 'REPORTING' } as const;
    for (const permission of [definition.exportPermission, definition.exportPermissions[format]] as const) {
      const decision = authorize({ actor, permission, action: 'EXPORT', entity, scope: { domain: 'REPORTING' }, currentVersion: 1, expectedVersion: 1, businessCondition: true });
      if (!decision.allowed) throw new AppError(decision.code ?? 'AUTHZ_DENIED');
    }
    const dataset = await new RunReportUseCase(this.registry, this.query).execute(actor, code, filters);
    const bytes = format === 'CSV' ? csvBytes(dataset.rows, dataset.columns) : xlsxBytes(dataset.rows, dataset.columns);
    return { filename: `${definition.code}.${format.toLowerCase()}`, mimeType: format === 'CSV' ? 'text/csv; charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes, rowCount: dataset.rows.length };
  }
}
