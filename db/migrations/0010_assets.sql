CREATE TABLE qc.equipment (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  equipment_no TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  manufacturer TEXT,
  model TEXT,
  serial_no TEXT,
  location TEXT,
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED')),
  current_calibration_id UUID,
  commissioned_at TIMESTAMPTZ,
  decommissioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_equipment__equipment_no UNIQUE (equipment_no),
  CONSTRAINT fk_equipment__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_equipment__updated_by FOREIGN KEY (updated_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.calibration_records (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  calibration_no TEXT NOT NULL,
  equipment_id UUID NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'CURRENT', 'DUE', 'OVERDUE', 'SUPERSEDED', 'VOID')),
  calibration_date DATE NOT NULL,
  due_date DATE,
  provider TEXT,
  certificate_no TEXT,
  result TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  became_current_at TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_calibration_records__calibration_no UNIQUE (calibration_no),
  CONSTRAINT fk_calibration_records__equipment_id FOREIGN KEY (equipment_id) REFERENCES qc.equipment (id) ON DELETE RESTRICT,
  CONSTRAINT fk_calibration_records__approved_by FOREIGN KEY (approved_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_calibration_records__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  maintenance_no TEXT NOT NULL,
  equipment_id UUID NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'VOID')),
  maintenance_type TEXT,
  description TEXT NOT NULL CHECK (length(btrim(description)) > 0),
  planned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  performed_by TEXT,
  provider TEXT,
  result TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_maintenance_records__maintenance_no UNIQUE (maintenance_no),
  CONSTRAINT fk_maintenance_records__equipment_id FOREIGN KEY (equipment_id) REFERENCES qc.equipment (id) ON DELETE RESTRICT,
  CONSTRAINT fk_maintenance_records__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

ALTER TABLE qc.equipment
  ADD CONSTRAINT fk_equipment__current_calibration_id FOREIGN KEY (current_calibration_id) REFERENCES qc.calibration_records (id) ON DELETE RESTRICT;

ALTER TABLE qc.lab_equipment_usage
  ADD CONSTRAINT fk_lab_equipment_usage__equipment_id FOREIGN KEY (equipment_id) REFERENCES qc.equipment (id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_lab_equipment_usage__calibration_record_id FOREIGN KEY (calibration_record_id) REFERENCES qc.calibration_records (id) ON DELETE RESTRICT;

CREATE INDEX idx_equipment__state ON qc.equipment (state);
CREATE INDEX idx_calibration_records__equipment_id ON qc.calibration_records (equipment_id);
CREATE INDEX idx_calibration_records__state ON qc.calibration_records (state);
CREATE INDEX idx_maintenance_records__equipment_id ON qc.maintenance_records (equipment_id);
CREATE INDEX idx_maintenance_records__state ON qc.maintenance_records (state);

ALTER TABLE qc.equipment OWNER TO qc_migrator;
ALTER TABLE qc.calibration_records OWNER TO qc_migrator;
ALTER TABLE qc.maintenance_records OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.equipment, qc.calibration_records, qc.maintenance_records TO qc_app_runtime;
