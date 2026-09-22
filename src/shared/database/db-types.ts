import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface SchemaMigrationsTable {
  version: string;
  name: string | null;
  checksum: string;
  applied_at: Generated<Date>;
  execution_ms: number | null;
  runner_version: string | null;
}

export interface UsersTable {
  id: Generated<string>;
  login_identity: string;
  email: string | null;
  display_name: string;
  password_hash: string;
  account_state: string;
  must_change_password: Generated<boolean>;
  last_login_at: Date | null;
  created_at: Generated<Date>;
  created_by: string | null;
  updated_at: Generated<Date>;
  updated_by: string | null;
  version: Generated<bigint>;
}

export interface SessionsTable {
  id: Generated<string>;
  user_id: string;
  session_token_hash: string;
  created_at: Generated<Date>;
  last_seen_at: Date | null;
  expires_at: Date;
  revoked_at: Date | null;
  revoked_reason: string | null;
  version: Generated<bigint>;
}

export interface AuditEventsTable {
  id: Generated<string>;
  event_no: Generated<bigint>;
  occurred_at: Generated<Date>;
  actor_type: string;
  actor_id: string | null;
  subject_type: string;
  subject_id: string;
  action: string;
  transition_id: string | null;
  old_state: string | null;
  new_state: string | null;
  reason: string | null;
  request_id: string;
  signature_id: string | null;
  payload: unknown | null;
}

export interface OutboxEventsTable {
  id: Generated<string>;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: unknown;
  created_at: Generated<Date>;
  available_at: Generated<Date>;
  processed_at: Date | null;
  attempt_count: Generated<number>;
  last_error: string | null;
  dedupe_key: string | null;
}

export interface IdempotencyRecordsTable {
  id: Generated<string>;
  key: string;
  request_fingerprint: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response_payload: unknown | null;
  created_at: Generated<Date>;
  completed_at: Date | null;
}

export interface FilesTable {
  id: Generated<string>;
  original_filename: string;
  storage_key: string;
  storage_provider: string;
  mime_type: string;
  extension: string | null;
  size_bytes: number | bigint;
  sha256: string;
  uploaded_by: string;
  uploaded_at: Generated<Date>;
  state: string;
}

export interface EvidenceLinksTable {
  id: Generated<string>;
  file_id: string;
  subject_type: string;
  subject_id: string;
  evidence_type: string | null;
  description: string | null;
  linked_by: string;
  linked_at: Generated<Date>;
  removed_at: Date | null;
  removal_reason: string | null;
}

export interface NotificationsTable {
  id: Generated<string>;
  recipient_user_id: string;
  notification_type: string;
  severity: string;
  title: string;
  message: string;
  subject_type: string | null;
  subject_id: string | null;
  dedupe_key: string | null;
  created_at: Generated<Date>;
  read_at: Date | null;
}
export interface RolesTable {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  active: boolean;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface PermissionsTable {
  id: string;
  code: string;
  domain: string;
  action: string;
  description: string | null;
  risk_level: string;
  active: boolean;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}
export interface RolePermissionsTable {
  role_id: string;
  permission_id: string;
  granted_at: Generated<Date>;
  granted_by: string | null;
}
export interface UserRolesTable {
  id: Generated<string>;
  user_id: string;
  role_id: string;
  valid_from: Date | null;
  valid_until: Date | null;
  assigned_by: string;
  assigned_at: Generated<Date>;
  revoked_at: Date | null;
  revoked_by: string | null;
  reason: string | null;
}
export interface UserScopesTable {
  id: Generated<string>;
  user_id: string;
  scope_kind: string;
  scope_value: string | null;
  assigned_by: string;
  assigned_at: Generated<Date>;
  revoked_at: Date | null;
  revoked_by: string | null;
  reason: string | null;
}

export interface NotificationDeliveriesTable {
  id: Generated<string>;
  notification_id: string;
  channel: string;
  state: string;
  attempt_count: Generated<number>;
  last_attempt_at: Date | null;
  delivered_at: Date | null;
  error_code: string | null;
}

export interface TasksTable {
  id: Generated<string>;
  task_no: string;
  title: string;
  description: string | null;
  priority: string;
  state: string;
  due_at: Date | null;
  current_assignee_id: string | null;
  completed_at: Date | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_by: string | null;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface FindingsTable {
  id: Generated<string>;
  finding_no: string;
  title: string;
  description: string;
  state: string;
  severity: string | null;
  source_context: unknown | null;
  owner_id: string | null;
  opened_at: Date | null;
  closed_at: Date | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface NcrsTable {
  id: Generated<string>;
  ncr_no: string;
  title: string;
  description: string;
  state: string;
  finding_id: string | null;
  affected_item_code: string | null;
  affected_lot: string | null;
  owner_id: string | null;
  opened_at: Date | null;
  closed_at: Date | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface RcasTable {
  id: Generated<string>;
  rca_no: string | null;
  ncr_id: string;
  state: string;
  method: string | null;
  analysis: string | null;
  root_cause: string | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface CapasTable {
  id: Generated<string>;
  capa_no: string;
  ncr_id: string | null;
  state: string;
  title: string;
  description: string;
  owner_id: string | null;
  target_date: string | null;
  verification_required: boolean;
  effectiveness_required: boolean;
  closed_at: Date | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface CapaActionsTable {
  id: Generated<string>;
  capa_id: string;
  sequence_no: number;
  description: string;
  owner_id: string;
  due_at: Date | null;
  state: string;
  completed_at: Date | null;
  completed_by: string | null;
  verification_state: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface CapaCloseSnapshotsTable {
  id: Generated<string>;
  capa_id: string;
  capa_version: bigint;
  snapshot: unknown;
  snapshot_hash: string;
  created_at: Generated<Date>;
}
export interface TaskAssignmentsTable {
  id: Generated<string>;
  task_id: string;
  assignee_id: string;
  assigned_by: string;
  assigned_at: Generated<Date>;
  unassigned_at: Date | null;
  reason: string | null;
}
export interface TaskChecklistItemsTable {
  id: Generated<string>;
  task_id: string;
  label: string;
  required: boolean;
  position: number;
  completed: boolean;
  completed_by: string | null;
  completed_at: Date | null;
  version: Generated<bigint>;
}
export interface TaskCommentsTable {
  id: Generated<string>;
  task_id: string;
  author_id: string;
  body: string;
  created_at: Generated<Date>;
  edited_at: Date | null;
}
export interface TaskDependenciesTable {
  id: Generated<string>;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  created_at: Generated<Date>;
  created_by: string;
}
export interface ReceivingItemsTable {
  id: Generated<string>;
  receiving_no: string;
  supplier_name: string | null;
  doc_no: string;
  item_code: string;
  description: string;
  lot: string;
  qty: string | number;
  /** Controlled receiving quantity unit (migration 0035); NULL only for legacy rows. */
  quantity_unit: string | null;
  purchase_order_no: string | null;
  /** Import traceability (migration 0035); NULL for records created in the app. */
  source_system: string | null;
  source_reference: string | null;
  imported_at: Date | null;
  receiving_date: string | Date;
  expiry_date: string | Date | null;
  workflow_state: string;
  inspection_result: string;
  release_system: boolean;
  released_at: Date | null;
  released_by: string | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_by: string | null;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface InspectionTemplatesTable {
  id: Generated<string>;
  template_code: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: Generated<Date>;
  created_by: string;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface InspectionTemplateVersionsTable {
  id: Generated<string>;
  template_id: string;
  version_no: string;
  state: string;
  effective_at: Date | null;
  approved_at: Date | null;
  approved_by: string | null;
  source_document: string | null;
  name: string;
  description: string | null;
  created_at: Generated<Date>;
  created_by: string;
  content_hash: string | null;
  version: Generated<bigint>;
}
export interface InspectionTemplateSectionsTable {
  id: Generated<string>;
  template_version_id: string;
  section_code: string | null;
  title: string;
  position: number;
  instructions: string | null;
}
export interface InspectionTemplatePointsTable {
  id: Generated<string>;
  section_id: string;
  point_code: string;
  label: string;
  requirement_text: string | null;
  data_type: string;
  unit: string | null;
  required: boolean;
  acceptance_rule_type: string | null;
  acceptance_rule_payload: unknown | null;
  source_reference: string | null;
  position: number;
}
export interface InspectionReportsTable {
  id: Generated<string>;
  inspection_no: string;
  receiving_item_id: string;
  template_version_id: string;
  state: string;
  final_result: string | null;
  author_id: string;
  assigned_user_id: string | null;
  submitted_at: Date | null;
  review_started_at: Date | null;
  approved_at: Date | null;
  rejected_at: Date | null;
  voided_at: Date | null;
  void_reason: string | null;
  snapshot_id: string | null;
  aql: string | null;
  aql_code_letter: string | null;
  aql_inspection_level: string | null;
  aql_sample_size: string | number | null;
  aql_accept_number: string | number | null;
  aql_reject_number: string | number | null;
  aql_observed_defects: string | number | null;
  aql_sampling_result: string | null;
  aql_source_reference: string | null;
  aql_recorded_by: string | null;
  aql_recorded_at: Date | null;
  created_at: Generated<Date>;
  created_by: string;
  updated_at: Generated<Date>;
  updated_by: string | null;
  version: Generated<bigint>;
}
export interface InspectionItemTemplatesTable {
  id: Generated<string>;
  item_code: string;
  template_id: string;
  state: string;
  effective_from: string | Date;
  effective_to: string | Date | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_by: string | null;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface InspectionEquipmentUsageTable {
  id: Generated<string>;
  inspection_report_id: string;
  equipment_id: string;
  calibration_record_id: string | null;
  usage_role: string | null;
  used_at: Date | null;
  equipment_snapshot: unknown;
  calibration_snapshot: unknown | null;
  created_by: string;
  created_at: Generated<Date>;
}
export interface InspectionReportResultsTable {
  id: Generated<string>;
  inspection_report_id: string;
  template_point_id: string;
  numeric_value: string | number | null;
  text_value: string | null;
  boolean_value: boolean | null;
  selected_value: string | null;
  unit: string | null;
  result: string | null;
  remarks: string | null;
  entered_by: string;
  entered_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface InspectionReportSnapshotsTable {
  id: Generated<string>;
  inspection_report_id: string;
  snapshot_version: number;
  snapshot_stage: string;
  receiving_snapshot: unknown;
  template_snapshot: unknown;
  controlled_source_snapshot: unknown | null;
  criteria_snapshot: unknown | null;
  results_snapshot: unknown;
  created_at: Generated<Date>;
  snapshot_hash: string;
}
export interface InspectionTemplateDocumentSourcesTable {
  id: Generated<string>;
  template_version_id: string;
  document_version_id: string;
  usage_type: string;
  linked_by: string;
  linked_at: Generated<Date>;
}
export interface LabTestTemplateDocumentSourcesTable {
  id: Generated<string>;
  template_version_id: string;
  document_version_id: string;
  usage_type: string;
  linked_by: string;
  linked_at: Generated<Date>;
}
export interface LabTestTemplatesTable {
  id: Generated<string>;
  test_code: string;
  name: string;
  description: string | null;
  active: boolean;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface LabTestTemplateVersionsTable {
  id: Generated<string>;
  template_id: string;
  version_no: string;
  state: string;
  method_reference: string | null;
  effective_at: Date | null;
  approved_at: Date | null;
  approved_by: string | null;
  content_hash: string | null;
  created_by: string;
  created_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface LabTestTemplateParametersTable {
  id: Generated<string>;
  template_version_id: string;
  parameter_code: string;
  label: string;
  data_type: string;
  unit: string | null;
  required: boolean;
  acceptance_rule_type: string | null;
  acceptance_rule_payload: unknown | null;
  controlled_source_reference: string | null;
  /** QC-DATA-003 approved calculation rule (migration 0037); NULL when the reviewer owns the value. */
  calculation_rule_type: string | null;
  calculation_rule_payload: unknown | null;
  position: number;
}
export interface LabTestsTable {
  id: Generated<string>;
  lab_test_no: string;
  template_version_id: string;
  state: string;
  scientific_result: string | null;
  source_receiving_item_id: string | null;
  original_test_id: string | null;
  retest_sequence: number;
  retest_reason: string | null;
  author_id: string;
  submitted_at: Date | null;
  review_started_at: Date | null;
  approved_at: Date | null;
  rejected_at: Date | null;
  voided_at: Date | null;
  void_reason: string | null;
  snapshot_id: string | null;
  /** QC-DATA-003 derived overall result evidence (migration 0037), not the official outcome. */
  derived_result: string | null;
  derived_result_source: string | null;
  derived_result_inputs_hash: string | null;
  derived_result_computed_at: Date | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_by: string | null;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface LabTestBatchesTable {
  id: Generated<string>;
  lab_test_id: string;
  batch_no: string;
  label: string | null;
  sequence: number;
  started_at: Date | null;
  completed_at: Date | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_by: string | null;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface LabSamplesTable {
  id: Generated<string>;
  lab_test_id: string;
  /** QC-DATA-003 run this sample belongs to; NULL for legacy test-level samples. */
  batch_id: string | null;
  sample_no: string | null;
  sample_identifier: string;
  position: number | null;
  sample_source: string | null;
  state: string | null;
  created_by: string;
  created_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface LabReadingsTable {
  id: Generated<string>;
  lab_test_id: string;
  batch_id: string;
  sample_id: string;
  template_parameter_id: string;
  reading_index: number;
  raw_numeric_value: string | null;
  raw_text_value: string | null;
  raw_boolean_value: boolean | null;
  unit: string | null;
  remarks: string | null;
  entered_by: string;
  entered_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface LabMeasurementsTable {
  id: Generated<string>;
  lab_test_id: string;
  batch_id: string | null;
  sample_id: string | null;
  template_parameter_id: string;
  raw_numeric_value: string | null;
  raw_text_value: string | null;
  raw_boolean_value: boolean | null;
  unit: string | null;
  calculated_value: string | null;
  calculated_unit: string | null;
  /** QC-DATA-003 calculation traceability (migration 0037). */
  calculation_rule_reference: string | null;
  calculation_rule_version: string | null;
  calculation_inputs: unknown | null;
  result: string | null;
  remarks: string | null;
  entered_by: string;
  entered_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface LabSampleResultsTable {
  id: Generated<string>;
  lab_test_id: string;
  batch_id: string;
  sample_id: string;
  result: string;
  source: string;
  source_reference: string | null;
  content_hash: string | null;
  derived_from: unknown | null;
  evaluated_at: Generated<Date>;
  evaluated_by: string;
  version: Generated<bigint>;
}
export interface LabTestSnapshotsTable {
  id: Generated<string>;
  lab_test_id: string;
  snapshot_version: number;
  snapshot_stage: string;
  template_snapshot: unknown;
  source_snapshot: unknown | null;
  equipment_snapshot: unknown | null;
  calibration_snapshot: unknown | null;
  document_snapshot: unknown | null;
  criteria_snapshot: unknown | null;
  sample_context_snapshot: unknown | null;
  created_at: Generated<Date>;
  snapshot_hash: string;
}
export interface LabEquipmentUsageTable {
  id: Generated<string>;
  lab_test_id: string;
  /** QC-DATA-003 run-level equipment evidence (migration 0037); NULL for legacy test-level usage. */
  batch_id: string | null;
  equipment_id: string;
  calibration_record_id: string | null;
  usage_role: string | null;
  used_at: Date | null;
  equipment_snapshot: unknown;
  calibration_snapshot: unknown | null;
  created_at: Generated<Date>;
}
export interface LabDocumentUsageTable {
  id: Generated<string>;
  lab_test_id: string;
  document_version_id: string;
  usage_type: string;
  document_snapshot: unknown | null;
  created_at: Generated<Date>;
}
export interface EquipmentTable {
  id: Generated<string>;
  equipment_no: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial_no: string | null;
  location: string | null;
  state: string;
  current_calibration_id: string | null;
  commissioned_at: Date | null;
  decommissioned_at: Date | null;
  created_at: Generated<Date>;
  created_by: string;
  updated_at: Generated<Date>;
  updated_by: string | null;
  version: Generated<bigint>;
  calibration_required: boolean | null;
  maintenance_required: boolean | null;
}
export interface CalibrationRecordsTable {
  id: Generated<string>;
  calibration_no: string;
  equipment_id: string;
  state: string;
  calibration_date: string | Date;
  due_date: string | Date | null;
  provider: string | null;
  certificate_no: string | null;
  result: string | null;
  approved_at: Date | null;
  approved_by: string | null;
  became_current_at: Date | null;
  superseded_at: Date | null;
  voided_at: Date | null;
  void_reason: string | null;
  created_at: Generated<Date>;
  created_by: string;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface MaintenanceRecordsTable {
  id: Generated<string>;
  maintenance_no: string;
  equipment_id: string;
  state: string;
  maintenance_type: string | null;
  description: string;
  planned_at: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  performed_by: string | null;
  provider: string | null;
  result: string | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
  downtime_started_at: Date | null;
  downtime_ended_at: Date | null;
  downtime_minutes: number | null;
}

export interface EquipmentStatusHistoryTable {
  id: Generated<string>;
  equipment_id: string;
  from_state: string | null;
  to_state: string;
  action: string;
  reason: string | null;
  changed_by: string;
  changed_at: Generated<Date>;
  equipment_version: bigint;
  request_id: string;
}

export interface CalibrationHistoryTable {
  id: Generated<string>;
  calibration_id: string;
  state: string;
  action: string;
  snapshot: unknown;
  changed_by: string;
  changed_at: Generated<Date>;
  record_version: bigint;
  request_id: string;
}

export interface MaintenanceHistoryTable {
  id: Generated<string>;
  maintenance_id: string;
  state: string;
  action: string;
  snapshot: unknown;
  changed_by: string;
  changed_at: Generated<Date>;
  record_version: bigint;
  request_id: string;
}
export interface DocumentIdentitiesTable {
  id: Generated<string>;
  document_no: string;
  document_type: string;
  title: string;
  owner_id: string | null;
  active: boolean;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface DocumentVersionsTable {
  id: Generated<string>;
  document_id: string;
  revision: string;
  state: string;
  effective_at: Date | null;
  approved_at: Date | null;
  approved_by: string | null;
  superseded_at: Date | null;
  archived_at: Date | null;
  voided_at: Date | null;
  void_reason: string | null;
  change_summary: string | null;
  content_hash: string | null;
  created_by: string;
  created_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface DocumentVersionFilesTable {
  id: Generated<string>;
  document_version_id: string;
  file_id: string;
  file_role: string;
  linked_at: Generated<Date>;
  linked_by: string;
}

export interface ChangeRequestsTable {
  id: Generated<string>;
  change_no: string;
  target_type: string;
  target_id: string;
  target_version: bigint;
  state: string;
  reason: string;
  target_snapshot: unknown;
  target_snapshot_hash: string | null;
  requested_by: string;
  submitted_at: Date | null;
  approved_at: Date | null;
  rejected_at: Date | null;
  applied_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}

export interface ChangeRequestChangesTable {
  id: Generated<string>;
  change_request_id: string;
  field_path: string;
  current_value: unknown | null;
  proposed_value: unknown | null;
  data_type: string;
  position: number;
}

export interface ChangeApplicationAttemptsTable {
  id: Generated<string>;
  change_request_id: string;
  attempt_no: number;
  started_at: Date;
  finished_at: Date | null;
  result: string;
  target_version_before: bigint | null;
  target_version_after: bigint | null;
  error_code: string | null;
  request_id: string;
}

export interface ApprovalCasesTable {
  id: Generated<string>;
  subject_type: string;
  subject_id: string;
  subject_version: bigint;
  workflow_type: string;
  state: string;
  requested_by: string;
  requested_at: Generated<Date>;
  completed_at: Date | null;
  created_at: Generated<Date>;
  version: Generated<bigint>;
}
export interface ApprovalWorkItemsTable {
  id: Generated<string>;
  approval_case_id: string;
  step_no: number;
  work_type: string;
  assigned_user_id: string | null;
  assigned_role_requirement: string | null;
  state: string;
  assigned_at: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  version: Generated<bigint>;
}
export interface ApprovalDecisionsTable {
  id: Generated<string>;
  approval_case_id: string;
  work_item_id: string | null;
  actor_id: string;
  decision: string;
  subject_version: bigint;
  reason: string | null;
  comments: string | null;
  signature_id: string | null;
  decided_at: Generated<Date>;
  request_id: string;
}
export interface ElectronicSignaturesTable {
  id: Generated<string>;
  actor_id: string;
  subject_type: string;
  subject_id: string;
  subject_version: bigint;
  action: string;
  meaning: string;
  signed_at: Generated<Date>;
  snapshot_hash: string;
  reason: string | null;
  reauth_method: string;
  request_id: string;
}

export interface BackupRunsTable {
  id: Generated<string>;
  state: string;
  requested_by: string | null;
  requested_at: Generated<Date>;
  started_at: Date | null;
  artifact_created_at: Date | null;
  verified_at: Date | null;
  completed_at: Date | null;
  storage_reference: string | null;
  size_bytes: number | bigint | null;
  checksum: string | null;
  database_schema_version: string | null;
  error_code: string | null;
  request_id: string;
  artifact_type: string | null;
  object_version: string | null;
  git_sha: string | null;
  build_id: string | null;
  release_id: string | null;
  migration_head: string | null;
  postgres_version: string | null;
  retention_expires_at: Date | null;
  manifest_sha256: string | null;
  known_gaps: unknown | null;
}

export interface RecoveryEvidenceTable {
  id: Generated<string>;
  backup_run_id: string;
  restore_run_id: string | null;
  evidence_version: bigint;
  result: string;
  source_environment: string;
  target_environment: string;
  requested_by: string | null;
  authorized_by: string | null;
  reason: string;
  request_id: string;
  git_sha: string | null;
  build_id: string | null;
  release_id: string | null;
  migration_head: string | null;
  postgres_version: string | null;
  started_at: Date;
  completed_at: Date | null;
  measured_rpo_seconds: number | bigint | null;
  measured_rto_seconds: number | bigint | null;
  database_validation: string;
  object_validation: string;
  security_validation: string;
  business_validation: string;
  session_invalidation: string | null;
  known_gaps: unknown;
  created_at: Generated<Date>;
}

export interface RestoreRunsTable {
  id: Generated<string>;
  backup_run_id: string;
  restore_type: string;
  state: string;
  requested_by: string | null;
  authorized_by: string | null;
  requested_at: Generated<Date>;
  started_at: Date | null;
  verified_at: Date | null;
  completed_at: Date | null;
  target_environment: string;
  error_code: string | null;
  evidence: unknown | null;
  request_id: string;
}

export interface RateLimitWindowsTable {
  policy_name: string;
  bucket_key: string;
  window_started_at: Date;
  window_ended_at: Date;
  request_count: number;
  updated_at: Date;
}

export interface ReleaseCandidatesTable {
  id: Generated<string>;
  git_sha: string;
  build_id: string;
  application_version: string;
  migration_head: string;
  uat_cycle_id: string;
  uat_status: string;
  residual_risk_status: string;
  state: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}

export interface ReleaseApprovalsTable {
  id: Generated<string>;
  release_id: string;
  approved_by: string;
  authority: string;
  git_sha: string;
  build_id: string;
  application_version: string;
  migration_head: string;
  uat_status: string;
  residual_risk_status: string;
  gate_snapshot: unknown;
  risk_snapshot: unknown;
  signature_evidence_id: string;
  approved_at: Generated<Date>;
  request_id: string;
}

export interface ReleaseGateEvidenceTable {
  id: Generated<string>;
  release_id: string;
  evidence_type: string;
  status: string;
  source: string;
  immutable_reference: string;
  observed_at: Date;
  git_sha: string;
  build_id: string;
  application_version: string;
  migration_head: string;
  uat_cycle_id: string;
  release_version: bigint;
  evidence_version: bigint;
  recorded_by: string;
  audit_info: unknown;
  created_at: Generated<Date>;
}

export interface ReleaseRiskEvidenceTable {
  id: Generated<string>;
  release_id: string;
  risk_id: string;
  severity: string;
  status: string;
  source: string;
  immutable_reference: string;
  observed_at: Date;
  git_sha: string;
  build_id: string;
  application_version: string;
  migration_head: string;
  uat_cycle_id: string;
  release_version: bigint;
  evidence_version: bigint;
  recorded_by: string;
  acceptance: unknown | null;
  audit_info: unknown;
  created_at: Generated<Date>;
}

export interface UatCyclesTable {
  id: Generated<string>;
  cycle_id: string;
  release_id: string;
  git_sha: string;
  build_id: string;
  application_version: string;
  migration_head: string;
  environment: string;
  plan_reference: string;
  status: string;
  evidence_snapshot_hash: string;
  execution_started_at: Date | null;
  execution_ended_at: Date | null;
  created_at: Generated<Date>;
}

export interface UatSessionEvidenceTable {
  id: Generated<string>;
  cycle_id: string;
  session_id: string;
  participant_role: string;
  participant_code: string;
  task_id: string;
  started_at: Date;
  ended_at: Date;
  time_on_task_seconds: number;
  task_success: boolean;
  error_count: number;
  backtracking_count: number;
  failed_navigation_count: number;
  form_correction_count: number;
  assistance: string;
  wrong_action_attempts: number;
  confidence_1_to_5: number;
  seq_1_to_7: number;
  observations: string;
  severity: string;
  participant_comments: string;
  scenario_status: string;
  task_accept_reject: string;
  evidence_reference: string;
  created_at: Generated<Date>;
}

export interface UatDefectsTable {
  id: Generated<string>;
  cycle_id: string;
  defect_id: string;
  session_id: string;
  task_id: string;
  severity: string;
  title: string;
  observed_evidence: string;
  expected_business_outcome: string;
  actual_business_outcome: string;
  request_id_or_ref: string;
  status: string;
  created_at: Generated<Date>;
}

export interface UatAcceptancesTable {
  id: Generated<string>;
  cycle_id: string;
  outcome: string;
  authorized_signer_id: string;
  signature_evidence_id: string;
  reauthenticated_at: Date;
  evidence_snapshot_hash: string;
  request_id: string;
  signed_at: Generated<Date>;
}

export interface RejectReportsTable {
  id: Generated<string>;
  report_no: string;
  report_type: string;
  report_date: Date;
  department: string;
  shift: string | null;
  status: string;
  issued_at: Date | null;
  finalized_at: Date | null;
  completed_at: Date | null;
  voided_at: Date | null;
  voided_by: string | null;
  void_reason: string | null;
  correction_of: string | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_by: string | null;
  updated_at: Generated<Date>;
  version: Generated<bigint>;
}

export interface RejectIssueSlipsTable {
  report_id: string;
  goods_description: string | null;
  item_code: string;
  item_name: string;
  lot_no: string | null;
  unit: string;
  rejected_qty: string | number;
  unit_cost: string | number | null;
  total_value: string | number | null;
  reject_reason: string;
  remarks: string | null;
}

export interface IssueSlipApprovalConfirmationsTable {
  id: Generated<string>;
  report_id: string;
  approval_role: string;
  status: Generated<string>;
  approver_name: string | null;
  confirmed_by: string | null;
  confirmed_at: Date | null;
  note: string | null;
  evidence_file_id: string | null;
  reversed_by: string | null;
  reversed_at: Date | null;
  reversal_reason: string | null;
  version: Generated<bigint>;
}

export interface DailyRejectEntriesTable {
  id: Generated<string>;
  report_id: string;
  position: number;
  machine_name: string | null;
  item_code: string | null;
  item_description: string;
  lot_no: string | null;
  bu_rm_product_name: string | null;
  rm_description: string | null;
  rm_unit: string | null;
  rm_lot_no: string | null;
  rm_type: string | null;
  pump_out_qty: string | number | null;
  reject_qty: string | number;
  good_qty: string | number;
  reject_pct: string | number | null;
  reject_limit: string | number | null;
  production_formula: string | null;
  reject_reason: string;
  analysis: string | null;
  version: Generated<bigint>;
}

export interface DatabaseSchema {
  schema_migrations: SchemaMigrationsTable;
  users: UsersTable;
  sessions: SessionsTable;
  audit_events: AuditEventsTable;
  outbox_events: OutboxEventsTable;
  idempotency_records: IdempotencyRecordsTable;
  files: FilesTable;
  evidence_links: EvidenceLinksTable;
  notifications: NotificationsTable;
  notification_deliveries: NotificationDeliveriesTable;
  roles: RolesTable;
  permissions: PermissionsTable;
  role_permissions: RolePermissionsTable;
  user_roles: UserRolesTable;
  user_scopes: UserScopesTable;
  tasks: TasksTable;
  task_assignments: TaskAssignmentsTable;
  task_checklist_items: TaskChecklistItemsTable;
  task_comments: TaskCommentsTable;
  task_dependencies: TaskDependenciesTable;
  receiving_items: ReceivingItemsTable;
  inspection_templates: InspectionTemplatesTable;
  inspection_template_versions: InspectionTemplateVersionsTable;
  inspection_template_sections: InspectionTemplateSectionsTable;
  inspection_template_points: InspectionTemplatePointsTable;
  inspection_reports: InspectionReportsTable;
  inspection_report_results: InspectionReportResultsTable;
  inspection_report_snapshots: InspectionReportSnapshotsTable;
  inspection_item_templates: InspectionItemTemplatesTable;
  inspection_equipment_usage: InspectionEquipmentUsageTable;
  inspection_template_document_sources: InspectionTemplateDocumentSourcesTable;
  lab_test_templates: LabTestTemplatesTable;
  lab_test_template_versions: LabTestTemplateVersionsTable;
  lab_test_template_parameters: LabTestTemplateParametersTable;
  lab_tests: LabTestsTable;
  lab_test_batches: LabTestBatchesTable;
  lab_samples: LabSamplesTable;
  lab_readings: LabReadingsTable;
  lab_measurements: LabMeasurementsTable;
  lab_sample_results: LabSampleResultsTable;
  lab_test_snapshots: LabTestSnapshotsTable;
  lab_equipment_usage: LabEquipmentUsageTable;
  lab_document_usage: LabDocumentUsageTable;
  lab_test_template_document_sources: LabTestTemplateDocumentSourcesTable;
  findings: FindingsTable;
  ncrs: NcrsTable;
  rcas: RcasTable;
  capas: CapasTable;
  capa_actions: CapaActionsTable;
  capa_close_snapshots: CapaCloseSnapshotsTable;
  equipment: EquipmentTable;
  calibration_records: CalibrationRecordsTable;
  maintenance_records: MaintenanceRecordsTable;
  equipment_status_history: EquipmentStatusHistoryTable;
  calibration_history: CalibrationHistoryTable;
  maintenance_history: MaintenanceHistoryTable;
  document_identities: DocumentIdentitiesTable;
  document_versions: DocumentVersionsTable;
  document_version_files: DocumentVersionFilesTable;
  change_requests: ChangeRequestsTable;
  change_request_changes: ChangeRequestChangesTable;
  change_application_attempts: ChangeApplicationAttemptsTable;
  approval_cases: ApprovalCasesTable;
  approval_work_items: ApprovalWorkItemsTable;
  approval_decisions: ApprovalDecisionsTable;
  electronic_signatures: ElectronicSignaturesTable;
  backup_runs: BackupRunsTable;
  restore_runs: RestoreRunsTable;
  recovery_evidence: RecoveryEvidenceTable;
  rate_limit_windows: RateLimitWindowsTable;
  release_candidates: ReleaseCandidatesTable;
  release_approvals: ReleaseApprovalsTable;
  release_gate_evidence: ReleaseGateEvidenceTable;
  release_risk_evidence: ReleaseRiskEvidenceTable;
  uat_cycles: UatCyclesTable;
  uat_session_evidence: UatSessionEvidenceTable;
  uat_defects: UatDefectsTable;
  uat_acceptances: UatAcceptancesTable;
  reject_reports: RejectReportsTable;
  reject_issue_slips: RejectIssueSlipsTable;
  issue_slip_approval_confirmations: IssueSlipApprovalConfirmationsTable;
  daily_reject_entries: DailyRejectEntriesTable;
}

export type DatabaseRow<T extends keyof DatabaseSchema> = Selectable<DatabaseSchema[T]>;
export type DatabaseInsert<T extends keyof DatabaseSchema> = Insertable<DatabaseSchema[T]>;
export type DatabaseUpdate<T extends keyof DatabaseSchema> = Updateable<DatabaseSchema[T]>;
