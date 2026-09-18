-- QC-CLOSURE-014: indexes for bounded list/dashboard/report/audit reads.
-- No business state is changed; all indexes support existing predicates/order.
CREATE INDEX idx_tasks__assignee_state_updated
  ON qc.tasks (current_assignee_id, state, updated_at DESC, id DESC);
CREATE INDEX idx_receiving_items__creator_date
  ON qc.receiving_items (created_by, receiving_date DESC, id DESC);
CREATE INDEX idx_receiving_items__creator_filters
  ON qc.receiving_items (created_by, workflow_state, inspection_result, release_system, receiving_date DESC, id DESC);
CREATE INDEX idx_inspection_reports__author_state
  ON qc.inspection_reports (author_id, state, updated_at DESC, id DESC);
CREATE INDEX idx_inspection_reports__author_result
  ON qc.inspection_reports (author_id, final_result, id DESC);
CREATE INDEX idx_lab_tests__author_state
  ON qc.lab_tests (author_id, state, updated_at DESC, id DESC);
CREATE INDEX idx_audit_events__actor_time
  ON qc.audit_events (actor_id, occurred_at DESC, event_no DESC);
CREATE INDEX idx_user_roles__active_user
  ON qc.user_roles (user_id, role_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_user_scopes__active_user
  ON qc.user_scopes (user_id, scope_kind, scope_value) WHERE revoked_at IS NULL;
