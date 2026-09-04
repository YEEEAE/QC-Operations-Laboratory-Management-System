CREATE TABLE qc.lab_test_templates (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  test_code TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  description TEXT,
  active BOOLEAN NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_lab_test_templates__test_code UNIQUE (test_code),
  CONSTRAINT fk_lab_test_templates__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.lab_test_template_versions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  template_id UUID NOT NULL,
  version_no TEXT NOT NULL,
  state TEXT NOT NULL,
  method_reference TEXT,
  effective_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  content_hash TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_lab_test_template_versions__revision UNIQUE (template_id, version_no),
  CONSTRAINT fk_lab_test_template_versions__template_id FOREIGN KEY (template_id) REFERENCES qc.lab_test_templates (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_test_template_versions__approved_by FOREIGN KEY (approved_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_test_template_versions__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.lab_test_template_sections (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  template_version_id UUID NOT NULL,
  section_code TEXT,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  position INTEGER NOT NULL,
  instructions TEXT,
  CONSTRAINT fk_lab_test_template_sections__template_version_id FOREIGN KEY (template_version_id) REFERENCES qc.lab_test_template_versions (id) ON DELETE RESTRICT
);

CREATE TABLE qc.lab_test_template_parameters (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  template_version_id UUID NOT NULL,
  parameter_code TEXT NOT NULL,
  label TEXT NOT NULL CHECK (length(btrim(label)) > 0),
  data_type TEXT NOT NULL,
  unit TEXT,
  required BOOLEAN NOT NULL,
  acceptance_rule_type TEXT,
  acceptance_rule_payload JSONB,
  controlled_source_reference TEXT,
  position INTEGER NOT NULL,
  CONSTRAINT uq_lab_test_template_parameters__code UNIQUE (template_version_id, parameter_code),
  CONSTRAINT fk_lab_test_template_parameters__template_version_id FOREIGN KEY (template_version_id) REFERENCES qc.lab_test_template_versions (id) ON DELETE RESTRICT
);

CREATE TABLE qc.lab_tests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  lab_test_no TEXT NOT NULL,
  template_version_id UUID NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED', 'VOID')),
  scientific_result TEXT CHECK (scientific_result IN ('PASS', 'FAIL', 'HOLD')),
  source_receiving_item_id UUID,
  original_test_id UUID,
  retest_sequence INTEGER NOT NULL DEFAULT 0 CHECK (retest_sequence >= 0),
  retest_reason TEXT,
  author_id UUID NOT NULL,
  submitted_at TIMESTAMPTZ,
  review_started_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  snapshot_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_lab_tests__lab_test_no UNIQUE (lab_test_no),
  CONSTRAINT ck_lab_tests__retest_context CHECK ((retest_sequence = 0 AND original_test_id IS NULL AND retest_reason IS NULL) OR (retest_sequence > 0 AND original_test_id IS NOT NULL AND retest_reason IS NOT NULL)),
  CONSTRAINT ck_lab_tests__not_self_retest CHECK (original_test_id IS NULL OR original_test_id <> id),
  CONSTRAINT fk_lab_tests__template_version_id FOREIGN KEY (template_version_id) REFERENCES qc.lab_test_template_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_tests__source_receiving_item_id FOREIGN KEY (source_receiving_item_id) REFERENCES qc.receiving_items (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_tests__original_test_id FOREIGN KEY (original_test_id) REFERENCES qc.lab_tests (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_tests__author_id FOREIGN KEY (author_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_tests__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_tests__updated_by FOREIGN KEY (updated_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.lab_samples (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  lab_test_id UUID NOT NULL,
  sample_no TEXT,
  sample_identifier TEXT NOT NULL CHECK (length(btrim(sample_identifier)) > 0),
  position INTEGER,
  sample_source TEXT,
  state TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT fk_lab_samples__lab_test_id FOREIGN KEY (lab_test_id) REFERENCES qc.lab_tests (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_samples__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.lab_measurements (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  lab_test_id UUID NOT NULL,
  sample_id UUID,
  template_parameter_id UUID NOT NULL,
  raw_numeric_value NUMERIC,
  raw_text_value TEXT,
  raw_boolean_value BOOLEAN,
  unit TEXT,
  calculated_value NUMERIC,
  calculated_unit TEXT,
  result TEXT,
  remarks TEXT,
  entered_by UUID NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT ck_lab_measurements__one_raw_value CHECK (num_nonnulls(raw_numeric_value, raw_text_value, raw_boolean_value) = 1),
  CONSTRAINT fk_lab_measurements__lab_test_id FOREIGN KEY (lab_test_id) REFERENCES qc.lab_tests (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_measurements__sample_id FOREIGN KEY (sample_id) REFERENCES qc.lab_samples (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_measurements__template_parameter_id FOREIGN KEY (template_parameter_id) REFERENCES qc.lab_test_template_parameters (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_measurements__entered_by FOREIGN KEY (entered_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.lab_equipment_usage (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  lab_test_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  calibration_record_id UUID,
  usage_role TEXT,
  used_at TIMESTAMPTZ,
  equipment_snapshot JSONB NOT NULL,
  calibration_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lab_equipment_usage__lab_test_id FOREIGN KEY (lab_test_id) REFERENCES qc.lab_tests (id) ON DELETE RESTRICT
  -- Equipment and calibration domains are introduced by later migrations.
  -- Their typed UUID references remain explicit domain boundaries until then.
);

CREATE TABLE qc.lab_document_usage (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  lab_test_id UUID NOT NULL,
  document_version_id UUID NOT NULL,
  usage_type TEXT NOT NULL,
  document_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lab_document_usage__lab_test_id FOREIGN KEY (lab_test_id) REFERENCES qc.lab_tests (id) ON DELETE RESTRICT
);

CREATE TABLE qc.lab_test_snapshots (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  lab_test_id UUID NOT NULL,
  snapshot_version INTEGER NOT NULL,
  snapshot_stage TEXT NOT NULL,
  template_snapshot JSONB NOT NULL,
  source_snapshot JSONB,
  equipment_snapshot JSONB,
  calibration_snapshot JSONB,
  document_snapshot JSONB,
  criteria_snapshot JSONB,
  sample_context_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  snapshot_hash TEXT NOT NULL,
  CONSTRAINT uq_lab_test_snapshots__version UNIQUE (lab_test_id, snapshot_version),
  CONSTRAINT fk_lab_test_snapshots__lab_test_id FOREIGN KEY (lab_test_id) REFERENCES qc.lab_tests (id) ON DELETE RESTRICT
);

ALTER TABLE qc.lab_tests
  ADD CONSTRAINT fk_lab_tests__snapshot_id FOREIGN KEY (snapshot_id) REFERENCES qc.lab_test_snapshots (id) ON DELETE RESTRICT;

CREATE INDEX idx_lab_test_template_versions__template_id ON qc.lab_test_template_versions (template_id);
CREATE INDEX idx_lab_test_template_sections__template_version_id ON qc.lab_test_template_sections (template_version_id);
CREATE INDEX idx_lab_test_template_parameters__template_version_id ON qc.lab_test_template_parameters (template_version_id);
CREATE INDEX idx_lab_tests__state ON qc.lab_tests (state);
CREATE INDEX idx_lab_tests__source_receiving_item_id ON qc.lab_tests (source_receiving_item_id);
CREATE INDEX idx_lab_tests__original_test_id ON qc.lab_tests (original_test_id);
CREATE INDEX idx_lab_samples__lab_test_id ON qc.lab_samples (lab_test_id);
CREATE INDEX idx_lab_measurements__lab_test_id ON qc.lab_measurements (lab_test_id);
CREATE INDEX idx_lab_measurements__sample_id ON qc.lab_measurements (sample_id);
CREATE INDEX idx_lab_equipment_usage__lab_test_id ON qc.lab_equipment_usage (lab_test_id);
CREATE INDEX idx_lab_equipment_usage__equipment_id ON qc.lab_equipment_usage (equipment_id);
CREATE INDEX idx_lab_document_usage__lab_test_id ON qc.lab_document_usage (lab_test_id);
CREATE INDEX idx_lab_document_usage__document_version_id ON qc.lab_document_usage (document_version_id);
CREATE INDEX idx_lab_test_snapshots__lab_test_id ON qc.lab_test_snapshots (lab_test_id);

ALTER TABLE qc.lab_test_templates OWNER TO qc_migrator;
ALTER TABLE qc.lab_test_template_versions OWNER TO qc_migrator;
ALTER TABLE qc.lab_test_template_sections OWNER TO qc_migrator;
ALTER TABLE qc.lab_test_template_parameters OWNER TO qc_migrator;
ALTER TABLE qc.lab_tests OWNER TO qc_migrator;
ALTER TABLE qc.lab_samples OWNER TO qc_migrator;
ALTER TABLE qc.lab_measurements OWNER TO qc_migrator;
ALTER TABLE qc.lab_equipment_usage OWNER TO qc_migrator;
ALTER TABLE qc.lab_document_usage OWNER TO qc_migrator;
ALTER TABLE qc.lab_test_snapshots OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.lab_test_templates, qc.lab_test_template_versions, qc.lab_test_template_sections, qc.lab_test_template_parameters, qc.lab_tests, qc.lab_samples, qc.lab_measurements, qc.lab_equipment_usage, qc.lab_document_usage TO qc_app_runtime;
GRANT SELECT, INSERT ON qc.lab_test_snapshots TO qc_app_runtime;
