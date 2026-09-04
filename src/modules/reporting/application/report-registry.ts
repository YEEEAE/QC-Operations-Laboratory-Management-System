import { AppError } from '../../../shared/errors/app-error.js';
import { QUARANTINE_AGING_REPORT, type ReportDefinition } from '../domain/report-definition.js';

const definitions = new Map([[QUARANTINE_AGING_REPORT.code, QUARANTINE_AGING_REPORT]]);
export class ReportRegistry {
  list(): readonly ReportDefinition[] { return [...definitions.values()]; }
  get(code: string): ReportDefinition {
    const definition = definitions.get(code);
    if (!definition) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return definition;
  }
}

