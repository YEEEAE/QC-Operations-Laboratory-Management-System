import type { ActorContext } from '../../../shared/authorization/types.js';
import type {
  ReportDefinition,
  ReportFilters,
  ReportProvenance,
} from '../domain/report-definition.js';
import type { ReportDataset } from '../ports/report-query.js';

export function createReportProvenance(
  definition: ReportDefinition,
  actor: ActorContext,
  filters: ReportFilters,
  dataset: ReportDataset,
  generatedAt: Date,
  datasetSnapshot = 'NOT PROVIDED',
): ReportProvenance {
  const labels: ReadonlyArray<readonly [keyof ReportFilters, string]> = [
    ['from', 'from'], ['to', 'to'], ['lot', 'lot'], ['itemCode', 'itemCode'],
    ['line', 'line'], ['shift', 'shift'], ['status', 'status'],
    ['workflowState', 'workflowState'], ['inspectionResult', 'inspectionResult'],
    ['releaseSystem', 'releaseSystem'], ['page', 'page'], ['pageSize', 'pageSize'],
  ];
  const filterDescription = labels
    .filter(([key]) => filters[key] !== undefined)
    .map(([key, label]) => `${label}=${String(filters[key])}`)
    .join('; ');
  const methodKey = definition.methodRevisionColumn;
  const revisions = methodKey
    ? [...new Set(dataset.rows.map((row) => row[methodKey]).filter((value): value is string => typeof value === 'string' && value.length > 0))]
    : [];

  return {
    report: `${definition.code} — ${definition.title}`,
    generatedAt: generatedAt.toISOString(),
    asOf: dataset.asOf ?? generatedAt.toISOString(),
    generatedBy: actor.loginIdentity ?? actor.id,
    scope: `${definition.authorizedScope} source rows for the authenticated account`,
    accessRule: `${definition.viewPermission} + ${definition.runPermission} + ${definition.sourcePermission}`,
    period: `${filters.from ?? 'All dates'} to ${filters.to ?? 'Present'}`,
    filters: filterDescription || 'No optional filters',
    count: dataset.rows.length,
    status: 'UNAPPROVED REPORT COPY — informational; not a controlled record',
    source: definition.source,
    sourceTables: definition.sourceTables.join(', '),
    sourceRecordIds: dataset.sourceRowIds?.join(', ') || 'None on this page',
    methodRevisions: revisions.join(', ') || 'Not supplied by source rows',
    limitation: definition.sourceLimitation ?? 'No additional source limitation recorded.',
    sort: definition.sort,
    page: dataset.page ?? filters.page ?? 1,
    pageSize: dataset.pageSize ?? filters.pageSize ?? 50,
    datasetSnapshot,
  };
}
