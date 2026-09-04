import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ReportDefinition, ReportFilters } from '../domain/report-definition.js';
export type ReportRow = Readonly<Record<string, string | number | boolean | null>>;
export interface ReportDataset { readonly definition: ReportDefinition; readonly columns: ReportDefinition['columns']; readonly rows: readonly ReportRow[]; }
export interface ReportQuery { run(definition: ReportDefinition, actor: ActorContext, filters: ReportFilters): Promise<ReportDataset>; }

