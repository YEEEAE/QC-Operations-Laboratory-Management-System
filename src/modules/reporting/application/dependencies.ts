import { getDatabase } from '../../../shared/database/database.js';
import { PostgresReportQuery } from '../infrastructure/postgres-report-query.js';
import { ExportReportUseCase } from './export-report.js';
import { ReportRegistry } from './report-registry.js';
import { RunReportUseCase } from './run-report.js';

export function reportingDependencies() {
  const registry = new ReportRegistry();
  const query = new PostgresReportQuery(getDatabase());
  return {
    registry,
    run: new RunReportUseCase(registry, query),
    exportReport: new ExportReportUseCase(registry, query),
  };
}
