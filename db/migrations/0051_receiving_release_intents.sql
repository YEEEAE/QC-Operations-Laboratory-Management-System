-- REL-03: persist release intent separately from actual material disposition.
-- Pilot simulations and production requests are evidence only; this ledger
-- cannot set receiving_items.release_system or issue warehouse/ERP commands.
CREATE TABLE qc.receiving_release_intents (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  environment_profile TEXT NOT NULL CHECK (environment_profile IN ('development', 'test', 'staging', 'pilot', 'production')),
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'SIMULATED_RELEASE', 'RELEASE_SIMULATION_REQUEST', 'PRODUCTION_RELEASE_REQUEST', 'NONPRODUCTION_RELEASE_REQUEST'
  )),
  intent_state TEXT NOT NULL CHECK (intent_state IN (
    'SIMULATED_ONLY', 'PENDING_SCOPE_BINDING', 'PENDING_AUTHORITY'
  )),
  authority_state TEXT NOT NULL CHECK (authority_state IN ('NOT_GRANTED', 'UNAVAILABLE')),
  execution_state TEXT NOT NULL CHECK (execution_state = 'NOT_SENT'),
  decision_source TEXT NOT NULL CHECK (length(btrim(decision_source)) > 0),
  gate_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  receiving_item_id UUID NOT NULL,
  linked_inspection_report_id UUID,
  lot_snapshot TEXT NOT NULL CHECK (length(btrim(lot_snapshot)) > 0),
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  request_fingerprint CHAR(64) NOT NULL,
  actor_id UUID NOT NULL,
  expected_version BIGINT NOT NULL CHECK (expected_version > 0),
  source_workflow_state TEXT NOT NULL,
  source_inspection_result TEXT NOT NULL,
  scope_site TEXT,
  scope_department TEXT,
  scope_line TEXT,
  scope_shift TEXT,
  record_scope_site TEXT,
  record_scope_department TEXT,
  record_scope_line TEXT,
  record_scope_shift TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_receiving_release_intents__profile_state CHECK (
    (environment_profile = 'pilot' AND intent_state IN ('SIMULATED_ONLY', 'PENDING_SCOPE_BINDING'))
    OR (environment_profile <> 'pilot' AND intent_state = 'PENDING_AUTHORITY')
  ),
  CONSTRAINT ck_receiving_release_intents__authority_state CHECK (
    (intent_state = 'SIMULATED_ONLY' AND authority_state = 'NOT_GRANTED')
    OR (intent_state <> 'SIMULATED_ONLY' AND authority_state = 'UNAVAILABLE')
  ),
  CONSTRAINT ck_receiving_release_intents__decision_type CHECK (
    (environment_profile = 'pilot' AND intent_state = 'SIMULATED_ONLY' AND decision_type = 'SIMULATED_RELEASE')
    OR (environment_profile = 'pilot' AND intent_state = 'PENDING_SCOPE_BINDING' AND decision_type = 'RELEASE_SIMULATION_REQUEST')
    OR (environment_profile = 'production' AND intent_state = 'PENDING_AUTHORITY' AND decision_type = 'PRODUCTION_RELEASE_REQUEST')
    OR (environment_profile NOT IN ('pilot', 'production') AND intent_state = 'PENDING_AUTHORITY' AND decision_type = 'NONPRODUCTION_RELEASE_REQUEST')
  ),
  CONSTRAINT ck_receiving_release_intents__pilot_scope CHECK (
    environment_profile <> 'pilot'
    OR (scope_site IS NOT NULL AND scope_department IS NOT NULL AND scope_line IS NOT NULL AND scope_shift IS NOT NULL)
  ),
  CONSTRAINT fk_receiving_release_intents__receiving FOREIGN KEY (receiving_item_id)
    REFERENCES qc.receiving_items(id) ON DELETE RESTRICT,
  CONSTRAINT fk_receiving_release_intents__report FOREIGN KEY (linked_inspection_report_id)
    REFERENCES qc.inspection_reports(id) ON DELETE RESTRICT,
  CONSTRAINT fk_receiving_release_intents__actor FOREIGN KEY (actor_id)
    REFERENCES qc.users(id) ON DELETE RESTRICT,
  CONSTRAINT uq_receiving_release_intents__command UNIQUE (environment_profile, receiving_item_id, request_id)
);

CREATE INDEX idx_receiving_release_intents__recorded
  ON qc.receiving_release_intents (recorded_at DESC, id DESC);

CREATE TRIGGER receiving_release_intents_append_only
  BEFORE UPDATE OR DELETE ON qc.receiving_release_intents
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER receiving_release_intents_no_truncate
  BEFORE TRUNCATE ON qc.receiving_release_intents
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();

COMMENT ON TABLE qc.receiving_release_intents IS
  'Append-only release intents. SIMULATED_ONLY and PENDING_AUTHORITY never change product disposition or execute warehouse/ERP actions.';
