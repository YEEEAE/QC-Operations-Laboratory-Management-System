import type { PermissionCode } from '../../../shared/authorization/permissions.js';

export interface ReportColumn {
  readonly key: string;
  readonly label: string;
  readonly type?: 'text' | 'decimal' | 'date' | 'boolean';
}

/** Shared user filters. A report may use only the fields declared in its definition. */
export interface ReportFilters {
  readonly from?: string;
  readonly to?: string;
  readonly lot?: string;
  readonly itemCode?: string;
  readonly line?: string;
  readonly shift?: string;
  readonly status?: string;
  readonly workflowState?: string;
  readonly inspectionResult?: string;
  readonly releaseSystem?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
}

export type ReportCode =
  | 'receiving-inspection'
  | 'in-process'
  | 'laboratory'
  | 'daily-reject-issue-slip'
  | 'threshold-approvals'
  | 'focus-queue'
  | 'ncr'
  | 'capa-effectiveness'
  | 'calibration'
  | 'tasks-shift-handover'
  | 'quarantine-aging';

export interface ReportDefinition {
  readonly code: ReportCode;
  readonly title: string;
  readonly description: string;
  readonly source: string;
  readonly sourceTables: readonly string[];
  readonly sort: string;
  readonly status: 'UNAPPROVED_INFORMATIONAL_COPY';
  readonly viewPermission: PermissionCode;
  readonly runPermission: PermissionCode;
  readonly exportPermission: PermissionCode;
  readonly exportPermissions: Readonly<Record<'CSV' | 'XLSX', PermissionCode>>;
  /** Domain permission plus the exact actor-derived row scope used by the query. */
  readonly sourcePermission: PermissionCode;
  readonly authorizedScope: 'OWN' | 'OWN_OR_ASSIGNED';
  readonly filterKeys: readonly (keyof ReportFilters)[];
  readonly columns: readonly ReportColumn[];
  /** A truthful source or policy limitation, shown with the report and export. */
  readonly sourceLimitation?: string;
  readonly methodRevisionColumn?: string;
}

export interface ReportProvenance {
  readonly report: string;
  readonly generatedAt: string;
  readonly asOf: string;
  readonly generatedBy: string;
  readonly scope: string;
  readonly accessRule: string;
  readonly period: string;
  readonly filters: string;
  readonly count: number;
  readonly status: string;
  readonly source: string;
  readonly sourceTables: string;
  readonly sourceRecordIds: string;
  readonly methodRevisions: string;
  readonly limitation: string;
  readonly sort: string;
  readonly page: number;
  readonly pageSize: number;
  readonly datasetSnapshot: string;
}

const commonPermissions = {
  viewPermission: 'PERM-RPT-VIEW',
  runPermission: 'PERM-RPT-RUN',
  exportPermission: 'PERM-RPT-EXPORT',
  exportPermissions: { CSV: 'PERM-RPT-EXPORT-CSV', XLSX: 'PERM-RPT-EXPORT-XLSX' },
  status: 'UNAPPROVED_INFORMATIONAL_COPY',
} as const;

export const REPORT_DEFINITIONS: readonly ReportDefinition[] = [
  {
    ...commonPermissions,
    code: 'receiving-inspection',
    title: 'Receiving and inspection register',
    description: 'Receiving records and their linked inspection report states.',
    source: 'qc.receiving_items joined to qc.inspection_reports and controlled template revisions',
    sourceTables: ['qc.receiving_items', 'qc.inspection_reports', 'qc.inspection_template_versions'],
    sort: 'Receiving date descending, inspection record id ascending',
    sourcePermission: 'PERM-QUAR-VIEW',
    authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'lot', 'itemCode', 'status', 'workflowState', 'inspectionResult'],
    methodRevisionColumn: 'methodRevision',
    sourceLimitation: 'Inspection results are shown as recorded. This report does not calculate or approve a scientific result. Availability also depends on the inspected schema containing the linked template revision tables.',
    columns: [
      { key: 'receivingNo', label: 'Receiving number' }, { key: 'inspectionNo', label: 'Inspection number' },
      { key: 'docNo', label: 'Document number' }, { key: 'itemCode', label: 'Item code' },
      { key: 'description', label: 'Description' }, { key: 'lot', label: 'Lot' },
      { key: 'receivingDate', label: 'Receiving date', type: 'date' }, { key: 'workflowState', label: 'Receiving state' },
      { key: 'inspectionState', label: 'Inspection state' }, { key: 'inspectionResult', label: 'Recorded inspection result' },
      { key: 'methodRevision', label: 'Template revision' }, { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'in-process', title: 'In-process control register',
    description: 'Independent in-process runs, pinned work-instruction revisions and recorded handovers.',
    source: 'qc.in_process_runs joined to qc.in_process_handovers',
    sourceTables: ['qc.in_process_runs', 'qc.in_process_handovers'],
    sort: 'Run start descending, run id ascending', sourcePermission: 'PERM-INP-VIEW', authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'lot', 'itemCode', 'line', 'shift', 'status'], methodRevisionColumn: 'wiRevision',
    sourceLimitation: 'In-process runs are a separate record family, not incoming or final inspection. Values are transcribed from the pinned WI; no product release or scientific result is inferred. The source tables are introduced by migration 0077 and remain unavailable until that migration is applied to the target schema.',
    columns: [
      { key: 'runNo', label: 'Run number' }, { key: 'itemCode', label: 'Item code' }, { key: 'lot', label: 'Lot' },
      { key: 'productionLine', label: 'Production line' }, { key: 'shift', label: 'Shift' }, { key: 'state', label: 'Run state' },
      { key: 'wiDocumentNo', label: 'WI number' }, { key: 'wiRevision', label: 'WI revision' },
      { key: 'startedAt', label: 'Started at (UTC)' }, { key: 'handoverState', label: 'Latest handover state' },
      { key: 'productReleaseState', label: 'Product release state' }, { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'laboratory', title: 'Laboratory test register',
    description: 'Laboratory test states, linked receiving lots, and the method revision captured at execution.',
    source: 'qc.lab_tests joined to qc.lab_test_template_versions and qc.receiving_items',
    sourceTables: ['qc.lab_tests', 'qc.lab_test_template_versions', 'qc.receiving_items'],
    sort: 'Test creation descending, test id ascending', sourcePermission: 'PERM-LAB-VIEW', authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'lot', 'itemCode', 'status'], methodRevisionColumn: 'methodRevision',
    sourceLimitation: 'Scientific result and measurements are displayed only as stored. No missing limit, formula or method is supplied by this report.',
    columns: [
      { key: 'labTestNo', label: 'Lab test number' }, { key: 'state', label: 'Test state' },
      { key: 'scientificResult', label: 'Recorded scientific result' }, { key: 'itemCode', label: 'Item code' },
      { key: 'lot', label: 'Lot' }, { key: 'methodRevision', label: 'Method revision' },
      { key: 'createdAt', label: 'Created at (UTC)' }, { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'daily-reject-issue-slip', title: 'Daily reject and Issue Slip register',
    description: 'Daily reject entries and Issue Slip facts, with their recorded workflow and approvals.',
    source: 'qc.reject_reports, qc.daily_reject_entries, qc.reject_issue_slips and qc.issue_slip_approval_confirmations',
    sourceTables: ['qc.reject_reports', 'qc.daily_reject_entries', 'qc.reject_issue_slips', 'qc.issue_slip_approval_confirmations'],
    sort: 'Report date descending, report id ascending, entry position ascending', sourcePermission: 'PERM-RREJ-VIEW', authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'lot', 'itemCode', 'shift', 'status'],
    sourceLimitation: 'No threshold or disposition is inferred. Approval rows are recorded facts and do not establish an official approval or release.',
    columns: [
      { key: 'reportNo', label: 'Report number' }, { key: 'reportType', label: 'Report type' },
      { key: 'reportDate', label: 'Report date', type: 'date' }, { key: 'shift', label: 'Shift' },
      { key: 'status', label: 'Report state' }, { key: 'itemCode', label: 'Item code' }, { key: 'lot', label: 'Lot' },
      { key: 'rejectQty', label: 'Reject quantity', type: 'decimal' }, { key: 'quantityUnit', label: 'Quantity unit' },
      { key: 'paperFormula', label: 'Paper formula revision' }, { key: 'issueSlipApprovalStates', label: 'Issue Slip approval states' },
      { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'threshold-approvals', title: 'Reject threshold approval register',
    description: 'Recorded threshold decisions and linked approval request states.',
    source: 'qc.daily_reject_threshold_decisions joined to qc.reject_reports, qc.daily_reject_entries and qc.reject_limit_profiles',
    sourceTables: ['qc.daily_reject_threshold_decisions', 'qc.reject_reports', 'qc.daily_reject_entries', 'qc.reject_limit_profiles', 'qc.approval_cases'],
    sort: 'Decision creation descending, decision id ascending', sourcePermission: 'PERM-RREJ-VIEW', authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'lot', 'itemCode', 'shift', 'status'], methodRevisionColumn: 'formulaRevision',
    sourceLimitation: 'A decision or profile is not a released threshold policy unless its source and effective state are recorded. No projected rate or threshold is calculated. This report depends on migration 0075 being applied to the target schema.',
    columns: [
      { key: 'reportNo', label: 'Reject report number' }, { key: 'itemCode', label: 'Item code' },
      { key: 'lot', label: 'Lot' }, { key: 'decisionState', label: 'Threshold decision state' },
      { key: 'approvalState', label: 'Approval request state' }, { key: 'formulaRevision', label: 'Formula revision' },
      { key: 'sourceDigest', label: 'Source digest' }, { key: 'createdAt', label: 'Recorded at (UTC)' },
      { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'focus-queue', title: 'Manual Focus entry queue',
    description: 'QC Compliance entry and verification evidence recorded for reject reports.',
    source: 'qc.focus_compliance_entries joined to qc.reject_reports',
    sourceTables: ['qc.focus_compliance_entries', 'qc.reject_reports'],
    sort: 'Report date descending, entry id ascending', sourcePermission: 'PERM-RREJ-VIEW', authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'lot', 'itemCode', 'shift', 'status'],
    sourceLimitation: 'This internal queue does not connect to Focus or attest that a provider import occurred. No approved deadline is configured. Availability depends on migration 0058 being applied to the target schema.',
    columns: [
      { key: 'reportNo', label: 'Reject report number' }, { key: 'reportDate', label: 'Report date', type: 'date' },
      { key: 'itemCode', label: 'Item code' }, { key: 'lot', label: 'Lot' }, { key: 'status', label: 'Internal entry status' },
      { key: 'enteredAt', label: 'Entry recorded at (UTC)' }, { key: 'verifiedAt', label: 'Verification recorded at (UTC)' },
      { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'ncr', title: 'NCR register', description: 'Nonconformance records and their current recorded workflow state.',
    source: 'qc.ncrs joined to qc.findings', sourceTables: ['qc.ncrs', 'qc.findings'],
    sort: 'Created at descending, NCR id ascending', sourcePermission: 'PERM-NCR-VIEW', authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'lot', 'itemCode', 'status'],
    sourceLimitation: 'NCR records do not establish a disposition, CAPA effectiveness, or product release.',
    columns: [
      { key: 'ncrNo', label: 'NCR number' }, { key: 'title', label: 'Title' }, { key: 'state', label: 'NCR state' },
      { key: 'itemCode', label: 'Affected item code' }, { key: 'lot', label: 'Affected lot' },
      { key: 'findingNo', label: 'Finding number' }, { key: 'createdAt', label: 'Created at (UTC)' },
      { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'capa-effectiveness', title: 'CAPA effectiveness evidence register',
    description: 'CAPA requirements, action states, and recorded verification evidence.',
    source: 'qc.capas joined to qc.capa_actions', sourceTables: ['qc.capas', 'qc.capa_actions'],
    sort: 'CAPA creation descending, CAPA id ascending, action sequence ascending', sourcePermission: 'PERM-CAPA-VIEW', authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'status'],
    sourceLimitation: 'The source records action verification, not an approved effectiveness criterion or effectiveness conclusion. No score or percentage is computed.',
    columns: [
      { key: 'capaNo', label: 'CAPA number' }, { key: 'state', label: 'CAPA state' },
      { key: 'effectivenessRequired', label: 'Effectiveness required', type: 'boolean' },
      { key: 'actionSequence', label: 'Action sequence' }, { key: 'actionState', label: 'Action state' },
      { key: 'verificationState', label: 'Recorded verification state' }, { key: 'targetDate', label: 'Target date', type: 'date' },
      { key: 'createdAt', label: 'Created at (UTC)' }, { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'calibration', title: 'Calibration register', description: 'Calibration records linked to equipment and their recorded states.',
    source: 'qc.calibration_records joined to qc.equipment', sourceTables: ['qc.calibration_records', 'qc.equipment'],
    sort: 'Calibration date descending, calibration id ascending', sourcePermission: 'PERM-CAL-VIEW', authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'itemCode', 'status'],
    sourceLimitation: 'Calibration requirement flags and due-date policy remain source dependent; the report does not infer equipment eligibility.',
    columns: [
      { key: 'calibrationNo', label: 'Calibration number' }, { key: 'equipmentNo', label: 'Equipment number' },
      { key: 'equipmentName', label: 'Equipment name' }, { key: 'state', label: 'Calibration state' },
      { key: 'calibrationDate', label: 'Calibration date', type: 'date' }, { key: 'dueDate', label: 'Due date', type: 'date' },
      { key: 'result', label: 'Recorded result' }, { key: 'createdAt', label: 'Created at (UTC)' },
      { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'tasks-shift-handover', title: 'Tasks and shift handovers',
    description: 'Tasks created by or assigned to this account, plus in-process handover records owned by this account.',
    source: 'qc.tasks joined to qc.in_process_handovers and qc.in_process_runs',
    sourceTables: ['qc.tasks', 'qc.in_process_handovers', 'qc.in_process_runs'],
    sort: 'Task due date ascending, task id ascending; handover time descending, handover id ascending',
    sourcePermission: 'PERM-TASK-VIEW', authorizedScope: 'OWN_OR_ASSIGNED',
    filterKeys: ['from', 'to', 'line', 'shift', 'status'],
    sourceLimitation: 'Task and handover rows are separate record types. In-process handovers remain tied to their independent run and WI revision.',
    columns: [
      { key: 'recordType', label: 'Record type' }, { key: 'recordNo', label: 'Record number' },
      { key: 'title', label: 'Task or handover note' }, { key: 'state', label: 'Recorded state' },
      { key: 'line', label: 'Production line' }, { key: 'shift', label: 'Shift' },
      { key: 'dueAt', label: 'Due at (UTC)' }, { key: 'occurredAt', label: 'Recorded at (UTC)' },
      { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
  {
    ...commonPermissions,
    code: 'quarantine-aging', title: 'Quarantine aging register',
    description: 'Authorized receiving items with their current workflow and inspection states.',
    source: 'qc.receiving_items', sourceTables: ['qc.receiving_items'],
    sort: 'Receiving date descending, then stable record id ascending',
    sourcePermission: 'PERM-QUAR-VIEW', authorizedScope: 'OWN',
    filterKeys: ['from', 'to', 'lot', 'itemCode', 'workflowState', 'inspectionResult', 'releaseSystem'],
    sourceLimitation: 'This report shows recorded states only. It does not calculate a release decision or infer an aging threshold.',
    columns: [
      { key: 'receivingNo', label: 'Receiving number' }, { key: 'docNo', label: 'Document number' },
      { key: 'itemCode', label: 'Item code' }, { key: 'description', label: 'Description' },
      { key: 'lot', label: 'Lot' }, { key: 'qty', label: 'Quantity', type: 'decimal' },
      { key: 'receivingDate', label: 'Receiving date', type: 'date' }, { key: 'expiryDate', label: 'Expiry date', type: 'date' },
      { key: 'workflowState', label: 'Workflow state' }, { key: 'inspectionResult', label: 'Inspection result' },
      { key: 'releaseSystem', label: 'Release system state', type: 'boolean' }, { key: 'sourceRecordId', label: 'Source record ID' },
    ],
  },
];

export const QUARANTINE_AGING_REPORT = REPORT_DEFINITIONS.find((report) => report.code === 'quarantine-aging')!;
