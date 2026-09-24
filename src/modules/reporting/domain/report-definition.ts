import type { PermissionCode } from '../../../shared/authorization/permissions.js';

export interface ReportColumn {
  readonly key: string;
  readonly label: string;
}
export interface ReportFilters {
  readonly from?: string;
  readonly to?: string;
  readonly lot?: string;
  readonly itemCode?: string;
  readonly workflowState?: string;
  readonly inspectionResult?: string;
  readonly releaseSystem?: boolean;
}
export interface ReportDefinition {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly source: 'QUARANTINE_RECEIVING';
  readonly sort: string;
  readonly status: 'UNAPPROVED_INFORMATIONAL_COPY';
  readonly viewPermission: PermissionCode;
  readonly runPermission: PermissionCode;
  readonly exportPermission: PermissionCode;
  readonly exportPermissions: Readonly<Record<'CSV' | 'XLSX', PermissionCode>>;
  readonly columns: readonly ReportColumn[];
}

export interface ReportProvenance {
  readonly report: string;
  readonly generatedAt: string;
  readonly generatedBy: string;
  readonly scope: string;
  readonly period: string;
  readonly filters: string;
  readonly count: number;
  readonly status: string;
  readonly source: string;
  readonly sort: string;
}

export const QUARANTINE_AGING_REPORT: ReportDefinition = {
  code: 'quarantine-aging',
  title: 'Quarantine receiving register',
  description: 'Authorized receiving items with their current workflow and inspection states.',
  source: 'QUARANTINE_RECEIVING',
  sort: 'Receiving date descending, then stable record id descending',
  status: 'UNAPPROVED_INFORMATIONAL_COPY',
  viewPermission: 'PERM-RPT-VIEW',
  runPermission: 'PERM-RPT-RUN',
  exportPermission: 'PERM-RPT-EXPORT',
  exportPermissions: { CSV: 'PERM-RPT-EXPORT-CSV', XLSX: 'PERM-RPT-EXPORT-XLSX' },
  columns: [
    { key: 'receivingNo', label: 'Receiving number' },
    { key: 'docNo', label: 'Document number' },
    { key: 'itemCode', label: 'Item code' },
    { key: 'description', label: 'Description' },
    { key: 'lot', label: 'Lot' },
    { key: 'qty', label: 'Quantity' },
    { key: 'receivingDate', label: 'Receiving date' },
    { key: 'expiryDate', label: 'Expiry date' },
    { key: 'workflowState', label: 'Workflow state' },
    { key: 'inspectionResult', label: 'Inspection result' },
    { key: 'releaseSystem', label: 'Release system state' },
  ],
};
