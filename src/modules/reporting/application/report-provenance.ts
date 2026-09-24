import type { ActorContext } from '../../../shared/authorization/types.js';
import type {
  ReportDefinition,
  ReportFilters,
  ReportProvenance,
} from '../domain/report-definition.js';

export function createReportProvenance(
  definition: ReportDefinition,
  actor: ActorContext,
  filters: ReportFilters,
  count: number,
  generatedAt: Date,
): ReportProvenance {
  const filterLabels: ReadonlyArray<readonly [keyof ReportFilters, string]> = [
    ['from', 'from'],
    ['to', 'to'],
    ['lot', 'lot'],
    ['itemCode', 'itemCode'],
    ['workflowState', 'workflowState'],
    ['inspectionResult', 'inspectionResult'],
    ['releaseSystem', 'releaseSystem'],
  ];
  const filterDescription = filterLabels
    .filter(([key]) => filters[key] !== undefined)
    .map(([key, label]) => `${label}=${String(filters[key])}`)
    .join('; ');

  return {
    report: `${definition.code} — ${definition.title}`,
    generatedAt: generatedAt.toISOString(),
    generatedBy: actor.loginIdentity ?? actor.id,
    scope: 'Records created by this account (OWN scope)',
    period: `${filters.from ?? 'All dates'} to ${filters.to ?? 'Present'}`,
    filters: filterDescription || 'No optional filters',
    count,
    status: 'UNAPPROVED REPORT COPY — informational; not a controlled record',
    source: 'qc.receiving_items',
    sort: definition.sort,
  };
}
