ALTER TABLE qc.equipment
  ADD COLUMN calibration_required BOOLEAN,
  ADD COLUMN maintenance_required BOOLEAN;

ALTER TABLE qc.calibration_records
  DROP CONSTRAINT calibration_records_state_check,
  ADD CONSTRAINT calibration_records_state_check
    CHECK (state IN (
      'DRAFT', 'SCHEDULED', 'SUBMITTED', 'APPROVED', 'CURRENT', 'DUE',
      'OVERDUE', 'COMPLETED', 'FAILED', 'SUPERSEDED', 'VOID'
    ));

ALTER TABLE qc.maintenance_records
  ADD COLUMN downtime_started_at TIMESTAMPTZ,
  ADD COLUMN downtime_ended_at TIMESTAMPTZ,
  ADD COLUMN downtime_minutes INTEGER
    CHECK (downtime_minutes IS NULL OR downtime_minutes >= 0),
  ADD CONSTRAINT ck_maintenance_records__downtime_pair
    CHECK (downtime_started_at IS NOT NULL OR downtime_ended_at IS NULL);

CREATE TABLE qc.equipment_status_history (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  equipment_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  equipment_version BIGINT NOT NULL CHECK (equipment_version > 0),
  request_id TEXT NOT NULL,
  CONSTRAINT fk_equipment_status_history__equipment
    FOREIGN KEY (equipment_id) REFERENCES qc.equipment (id) ON DELETE RESTRICT,
  CONSTRAINT fk_equipment_status_history__changed_by
    FOREIGN KEY (changed_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.calibration_history (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  calibration_id UUID NOT NULL,
  state TEXT NOT NULL,
  action TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  record_version BIGINT NOT NULL CHECK (record_version > 0),
  request_id TEXT NOT NULL,
  CONSTRAINT fk_calibration_history__calibration
    FOREIGN KEY (calibration_id) REFERENCES qc.calibration_records (id) ON DELETE RESTRICT,
  CONSTRAINT fk_calibration_history__changed_by
    FOREIGN KEY (changed_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.maintenance_history (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  maintenance_id UUID NOT NULL,
  state TEXT NOT NULL,
  action TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  record_version BIGINT NOT NULL CHECK (record_version > 0),
  request_id TEXT NOT NULL,
  CONSTRAINT fk_maintenance_history__maintenance
    FOREIGN KEY (maintenance_id) REFERENCES qc.maintenance_records (id) ON DELETE RESTRICT,
  CONSTRAINT fk_maintenance_history__changed_by
    FOREIGN KEY (changed_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_equipment_status_history__equipment
  ON qc.equipment_status_history (equipment_id, changed_at DESC, id DESC);
CREATE INDEX idx_calibration_history__calibration
  ON qc.calibration_history (calibration_id, changed_at DESC, id DESC);
CREATE INDEX idx_maintenance_history__maintenance
  ON qc.maintenance_history (maintenance_id, changed_at DESC, id DESC);

INSERT INTO qc.equipment_status_history
  (equipment_id, from_state, to_state, action, changed_by, changed_at, equipment_version, request_id)
SELECT e.id, NULL, e.state, 'MIGRATION_BACKFILL', e.created_by, e.created_at, e.version, 'migration-0027'
FROM qc.equipment e
WHERE NOT EXISTS (
  SELECT 1 FROM qc.equipment_status_history h WHERE h.equipment_id = e.id
);

INSERT INTO qc.calibration_history
  (calibration_id, state, action, snapshot, changed_by, changed_at, record_version, request_id)
SELECT c.id, c.state, 'MIGRATION_BACKFILL',
       jsonb_build_object(
         'id', c.id, 'calibrationNo', c.calibration_no, 'equipmentId', c.equipment_id,
         'state', c.state, 'calibrationDate', c.calibration_date,
         'dueDate', c.due_date, 'provider', c.provider,
         'certificateNo', c.certificate_no, 'result', c.result,
         'version', c.version
       ),
       c.created_by, c.created_at, c.version, 'migration-0027'
FROM qc.calibration_records c
WHERE NOT EXISTS (
  SELECT 1 FROM qc.calibration_history h WHERE h.calibration_id = c.id
);

INSERT INTO qc.maintenance_history
  (maintenance_id, state, action, snapshot, changed_by, changed_at, record_version, request_id)
SELECT m.id, m.state, 'MIGRATION_BACKFILL',
       jsonb_build_object(
         'id', m.id, 'maintenanceNo', m.maintenance_no, 'equipmentId', m.equipment_id,
         'state', m.state, 'maintenanceType', m.maintenance_type,
         'description', m.description, 'plannedAt', m.planned_at,
         'startedAt', m.started_at, 'completedAt', m.completed_at,
         'performedBy', m.performed_by, 'provider', m.provider,
         'result', m.result, 'version', m.version
       ),
       m.created_by, m.created_at, m.version, 'migration-0027'
FROM qc.maintenance_records m
WHERE NOT EXISTS (
  SELECT 1 FROM qc.maintenance_history h WHERE h.maintenance_id = m.id
);

CREATE OR REPLACE FUNCTION qc.reject_asset_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'controlled asset history is append-only';
END;
$$;

CREATE TRIGGER equipment_status_history_append_only
  BEFORE UPDATE OR DELETE ON qc.equipment_status_history
  FOR EACH ROW EXECUTE FUNCTION qc.reject_asset_history_mutation();

CREATE TRIGGER calibration_history_append_only
  BEFORE UPDATE OR DELETE ON qc.calibration_history
  FOR EACH ROW EXECUTE FUNCTION qc.reject_asset_history_mutation();

CREATE TRIGGER maintenance_history_append_only
  BEFORE UPDATE OR DELETE ON qc.maintenance_history
  FOR EACH ROW EXECUTE FUNCTION qc.reject_asset_history_mutation();
