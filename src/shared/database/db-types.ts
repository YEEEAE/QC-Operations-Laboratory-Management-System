import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface SchemaMigrationsTable {
  version: string;
  name: string;
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
export interface RolesTable { id: string; code: string; name: string; description: string | null; is_system_role: boolean; active: boolean; created_at: Generated<Date>; updated_at: Generated<Date>; version: Generated<bigint>; }
export interface PermissionsTable { id: string; code: string; domain: string; action: string; description: string | null; risk_level: string; active: boolean; created_at: Generated<Date>; updated_at: Generated<Date>; }
export interface RolePermissionsTable { role_id: string; permission_id: string; granted_at: Generated<Date>; granted_by: string | null; }
export interface UserRolesTable { id: string; user_id: string; role_id: string; revoked_at: Date | null; }
export interface UserScopesTable { id: Generated<string>; user_id: string; scope_kind: string; scope_value: string | null; assigned_by: string; assigned_at: Generated<Date>; revoked_at: Date | null; revoked_by: string | null; reason: string | null; }

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
  id: Generated<string>; task_no: string; title: string; description: string | null; priority: string;
  state: string; due_at: Date | null; current_assignee_id: string | null; completed_at: Date | null;
  created_by: string; created_at: Generated<Date>; updated_by: string | null; updated_at: Generated<Date>; version: Generated<bigint>;
}
export interface FindingsTable { id: Generated<string>; finding_no:string; title:string; description:string; state:string; severity:string|null; source_context:unknown|null; owner_id:string|null; opened_at:Date|null; closed_at:Date|null; created_by:string; created_at:Generated<Date>; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface NcrsTable { id:Generated<string>; ncr_no:string; title:string; description:string; state:string; finding_id:string|null; affected_item_code:string|null; affected_lot:string|null; owner_id:string|null; opened_at:Date|null; closed_at:Date|null; created_by:string; created_at:Generated<Date>; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface RcasTable { id:Generated<string>; rca_no:string|null; ncr_id:string; state:string; method:string|null; analysis:string|null; root_cause:string|null; submitted_at:Date|null; approved_at:Date|null; created_by:string; created_at:Generated<Date>; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface CapasTable { id:Generated<string>; capa_no:string; ncr_id:string|null; state:string; title:string; description:string; owner_id:string|null; target_date:string|null; verification_required:boolean; effectiveness_required:boolean; closed_at:Date|null; created_by:string; created_at:Generated<Date>; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface CapaActionsTable { id:Generated<string>; capa_id:string; sequence_no:number; description:string; owner_id:string; due_at:Date|null; state:string; completed_at:Date|null; completed_by:string|null; verification_state:string|null; created_at:Generated<Date>; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface TaskAssignmentsTable { id: Generated<string>; task_id: string; assignee_id: string; assigned_by: string; assigned_at: Generated<Date>; unassigned_at: Date | null; reason: string | null; }
export interface TaskChecklistItemsTable { id: Generated<string>; task_id: string; label: string; required: boolean; position: number; completed: boolean; completed_by: string | null; completed_at: Date | null; version: Generated<bigint>; }
export interface TaskCommentsTable { id: Generated<string>; task_id: string; author_id: string; body: string; created_at: Generated<Date>; edited_at: Date | null; }
export interface TaskDependenciesTable { id: Generated<string>; task_id: string; depends_on_task_id: string; dependency_type: string; created_at: Generated<Date>; created_by: string; }
export interface ReceivingItemsTable { id: Generated<string>; receiving_no:string; doc_no:string; item_code:string; description:string; lot:string; qty:string|number; receiving_date:string|Date; expiry_date:string|Date|null; workflow_state:string; inspection_result:string; release_system:boolean; released_at:Date|null; released_by:string|null; created_by:string; created_at:Generated<Date>; updated_by:string|null; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface InspectionTemplatesTable { id:Generated<string>; template_code:string; name:string; description:string|null; active:boolean; created_at:Generated<Date>; created_by:string; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface InspectionTemplateVersionsTable { id:Generated<string>; template_id:string; version_no:string; state:string; effective_at:Date|null; approved_at:Date|null; approved_by:string|null; source_document:string|null; created_at:Generated<Date>; created_by:string; content_hash:string|null; version:Generated<bigint>; }
export interface InspectionTemplateSectionsTable { id:Generated<string>; template_version_id:string; section_code:string|null; title:string; position:number; instructions:string|null; }
export interface InspectionTemplatePointsTable { id:Generated<string>; section_id:string; point_code:string; label:string; requirement_text:string|null; data_type:string; unit:string|null; required:boolean; acceptance_rule_type:string|null; acceptance_rule_payload:unknown|null; source_reference:string|null; position:number; }
export interface InspectionReportsTable { id:Generated<string>; inspection_no:string; receiving_item_id:string; template_version_id:string; state:string; final_result:string|null; author_id:string; submitted_at:Date|null; review_started_at:Date|null; approved_at:Date|null; rejected_at:Date|null; voided_at:Date|null; void_reason:string|null; snapshot_id:string|null; created_at:Generated<Date>; created_by:string; updated_at:Generated<Date>; updated_by:string|null; version:Generated<bigint>; }
export interface InspectionReportResultsTable { id:Generated<string>; inspection_report_id:string; template_point_id:string; numeric_value:string|number|null; text_value:string|null; boolean_value:boolean|null; selected_value:string|null; unit:string|null; result:string|null; remarks:string|null; entered_by:string; entered_at:Generated<Date>; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface InspectionReportSnapshotsTable { id:Generated<string>; inspection_report_id:string; snapshot_version:number; snapshot_stage:string; receiving_snapshot:unknown; template_snapshot:unknown; controlled_source_snapshot:unknown|null; criteria_snapshot:unknown|null; created_at:Generated<Date>; snapshot_hash:string; }
export interface LabTestTemplatesTable { id:Generated<string>; test_code:string; name:string; description:string|null; active:boolean; created_by:string; created_at:Generated<Date>; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface LabTestTemplateVersionsTable { id:Generated<string>; template_id:string; version_no:string; state:string; method_reference:string|null; effective_at:Date|null; approved_at:Date|null; approved_by:string|null; content_hash:string|null; created_by:string; created_at:Generated<Date>; version:Generated<bigint>; }
export interface LabTestTemplateParametersTable { id:Generated<string>; template_version_id:string; parameter_code:string; label:string; data_type:string; unit:string|null; required:boolean; acceptance_rule_type:string|null; acceptance_rule_payload:unknown|null; controlled_source_reference:string|null; position:number; }
export interface LabTestsTable { id:Generated<string>; lab_test_no:string; template_version_id:string; state:string; scientific_result:string|null; source_receiving_item_id:string|null; original_test_id:string|null; retest_sequence:number; retest_reason:string|null; author_id:string; submitted_at:Date|null; review_started_at:Date|null; approved_at:Date|null; rejected_at:Date|null; voided_at:Date|null; void_reason:string|null; snapshot_id:string|null; created_by:string; created_at:Generated<Date>; updated_by:string|null; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface LabSamplesTable { id:Generated<string>; lab_test_id:string; sample_no:string|null; sample_identifier:string; position:number|null; sample_source:string|null; state:string|null; created_by:string; created_at:Generated<Date>; version:Generated<bigint>; }
export interface LabMeasurementsTable { id:Generated<string>; lab_test_id:string; sample_id:string|null; template_parameter_id:string; raw_numeric_value:string|null; raw_text_value:string|null; raw_boolean_value:boolean|null; unit:string|null; calculated_value:string|null; calculated_unit:string|null; result:string|null; remarks:string|null; entered_by:string; entered_at:Generated<Date>; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface LabTestSnapshotsTable { id:Generated<string>; lab_test_id:string; snapshot_version:number; snapshot_stage:string; template_snapshot:unknown; source_snapshot:unknown|null; equipment_snapshot:unknown|null; calibration_snapshot:unknown|null; document_snapshot:unknown|null; criteria_snapshot:unknown|null; sample_context_snapshot:unknown|null; created_at:Generated<Date>; snapshot_hash:string; }
export interface LabEquipmentUsageTable { id:Generated<string>; lab_test_id:string; equipment_id:string; calibration_record_id:string|null; usage_role:string|null; used_at:Date|null; equipment_snapshot:unknown; calibration_snapshot:unknown|null; created_at:Generated<Date>; }
export interface LabDocumentUsageTable { id:Generated<string>; lab_test_id:string; document_version_id:string; usage_type:string; document_snapshot:unknown|null; created_at:Generated<Date>; }
export interface EquipmentTable { id:Generated<string>; equipment_no:string; name:string; manufacturer:string|null; model:string|null; serial_no:string|null; location:string|null; state:string; current_calibration_id:string|null; commissioned_at:Date|null; decommissioned_at:Date|null; created_at:Generated<Date>; created_by:string; updated_at:Generated<Date>; updated_by:string|null; version:Generated<bigint>; }
export interface CalibrationRecordsTable { id:Generated<string>; calibration_no:string; equipment_id:string; state:string; calibration_date:string; due_date:string|null; provider:string|null; certificate_no:string|null; result:string|null; approved_at:Date|null; approved_by:string|null; became_current_at:Date|null; superseded_at:Date|null; voided_at:Date|null; void_reason:string|null; created_at:Generated<Date>; created_by:string; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface MaintenanceRecordsTable { id:Generated<string>; maintenance_no:string; equipment_id:string; state:string; maintenance_type:string|null; description:string; planned_at:Date|null; started_at:Date|null; completed_at:Date|null; performed_by:string|null; provider:string|null; result:string|null; created_by:string; created_at:Generated<Date>; updated_at:Generated<Date>; version:Generated<bigint>; }
export interface DocumentIdentitiesTable { id: Generated<string>; document_no: string; document_type: string; title: string; owner_id: string | null; active: boolean; created_by: string; created_at: Generated<Date>; updated_at: Generated<Date>; version: Generated<bigint>; }
export interface DocumentVersionsTable { id: Generated<string>; document_id: string; revision: string; state: string; effective_at: Date | null; approved_at: Date | null; approved_by: string | null; superseded_at: Date | null; archived_at: Date | null; voided_at: Date | null; void_reason: string | null; change_summary: string | null; content_hash: string | null; created_by: string; created_at: Generated<Date>; version: Generated<bigint>; }
export interface DocumentVersionFilesTable { id: Generated<string>; document_version_id: string; file_id: string; file_role: string; linked_at: Generated<Date>; linked_by: string; }


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
  receiving_items: ReceivingItemsTable; inspection_templates: InspectionTemplatesTable; inspection_template_versions: InspectionTemplateVersionsTable; inspection_template_sections: InspectionTemplateSectionsTable; inspection_template_points: InspectionTemplatePointsTable; inspection_reports: InspectionReportsTable; inspection_report_results: InspectionReportResultsTable; inspection_report_snapshots: InspectionReportSnapshotsTable;
  lab_test_templates: LabTestTemplatesTable; lab_test_template_versions: LabTestTemplateVersionsTable; lab_test_template_parameters: LabTestTemplateParametersTable; lab_tests: LabTestsTable; lab_samples: LabSamplesTable; lab_measurements: LabMeasurementsTable; lab_test_snapshots: LabTestSnapshotsTable; lab_equipment_usage:LabEquipmentUsageTable; lab_document_usage:LabDocumentUsageTable;
  findings: FindingsTable; ncrs: NcrsTable; rcas: RcasTable; capas: CapasTable; capa_actions: CapaActionsTable;
  equipment: EquipmentTable; calibration_records: CalibrationRecordsTable; maintenance_records: MaintenanceRecordsTable;
  document_identities: DocumentIdentitiesTable; document_versions: DocumentVersionsTable; document_version_files: DocumentVersionFilesTable;
  approval_cases: ApprovalCasesTable;
  approval_work_items: ApprovalWorkItemsTable;
  approval_decisions: ApprovalDecisionsTable;
  electronic_signatures: ElectronicSignaturesTable;
}

export type DatabaseRow<T extends keyof DatabaseSchema> = Selectable<DatabaseSchema[T]>;
export type DatabaseInsert<T extends keyof DatabaseSchema> = Insertable<DatabaseSchema[T]>;
export type DatabaseUpdate<T extends keyof DatabaseSchema> = Updateable<DatabaseSchema[T]>;
