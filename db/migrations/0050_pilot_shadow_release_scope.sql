ALTER TABLE qc.receiving_items
  ADD COLUMN pilot_scope_site TEXT,
  ADD COLUMN pilot_scope_department TEXT,
  ADD COLUMN pilot_scope_line TEXT,
  ADD COLUMN pilot_scope_shift TEXT;

ALTER TABLE qc.receiving_items
  ADD CONSTRAINT chk_receiving_items__pilot_scope_values_nonblank
  CHECK (
    (pilot_scope_site IS NULL OR length(btrim(pilot_scope_site)) > 0)
    AND (pilot_scope_department IS NULL OR length(btrim(pilot_scope_department)) > 0)
    AND (pilot_scope_line IS NULL OR length(btrim(pilot_scope_line)) > 0)
    AND (pilot_scope_shift IS NULL OR length(btrim(pilot_scope_shift)) > 0)
  );

CREATE TABLE qc.pilot_shadow_decisions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  environment_profile TEXT NOT NULL CHECK (environment_profile = 'pilot'),
  decision_type TEXT NOT NULL CHECK (decision_type IN ('SIMULATED_RELEASE', 'RELEASE_SIMULATION_REQUEST')),
  decision_state TEXT NOT NULL CHECK (decision_state IN ('SIMULATED', 'PENDING_SCOPE_BINDING')),
  execution_state TEXT NOT NULL CHECK (execution_state = 'NOT_SENT'),
  receiving_item_id UUID NOT NULL,
  request_id TEXT NOT NULL,
  request_fingerprint CHAR(64) NOT NULL,
  actor_id UUID NOT NULL,
  source_workflow_state TEXT NOT NULL,
  source_inspection_result TEXT NOT NULL,
  source_record_version BIGINT NOT NULL CHECK (source_record_version > 0),
  scope_site TEXT NOT NULL,
  scope_department TEXT NOT NULL,
  scope_line TEXT NOT NULL,
  scope_shift TEXT NOT NULL,
  record_scope_site TEXT,
  record_scope_department TEXT,
  record_scope_line TEXT,
  record_scope_shift TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pilot_shadow_decisions__receiving FOREIGN KEY (receiving_item_id) REFERENCES qc.receiving_items(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pilot_shadow_decisions__actor FOREIGN KEY (actor_id) REFERENCES qc.users(id) ON DELETE RESTRICT,
  CONSTRAINT uq_pilot_shadow_decisions__command UNIQUE (environment_profile, receiving_item_id, request_id)
);

CREATE INDEX idx_pilot_shadow_decisions__recorded
  ON qc.pilot_shadow_decisions (recorded_at DESC, id DESC);

CREATE TRIGGER pilot_shadow_decisions_append_only
  BEFORE UPDATE OR DELETE ON qc.pilot_shadow_decisions
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER pilot_shadow_decisions_no_truncate
  BEFORE TRUNCATE ON qc.pilot_shadow_decisions
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();

COMMENT ON TABLE qc.pilot_shadow_decisions IS
  'Append-only application-only pilot release simulations. These rows never represent ERP/warehouse execution or product disposition.';
