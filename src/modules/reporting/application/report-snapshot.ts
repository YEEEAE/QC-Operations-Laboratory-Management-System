import { createHash } from 'node:crypto';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ReportFilters } from '../domain/report-definition.js';
import type { ReportDataset } from '../ports/report-query.js';

/** Request-local binding for an informational report copy; no retention is implied. */
export function reportSnapshotRef(
  dataset: ReportDataset,
  actor: ActorContext,
  filters: ReportFilters,
): string {
  const canonical = JSON.stringify({
    report: dataset.definition.code,
    actor: actor.id,
    filters: Object.fromEntries(
      Object.entries(filters).sort(([left], [right]) => left.localeCompare(right)),
    ),
    columns: dataset.columns,
    sourceRowIds: dataset.sourceRowIds ?? [],
    rows: dataset.rows,
  });
  return createHash('sha256').update(canonical).digest('hex');
}
