-- QC-DATA-003: dynamic laboratory test batches (runs), replicated readings,
-- calculation evidence, run-level equipment evidence and derived sample
-- results.
--
-- Forward-only. Every new column is nullable and every new constraint is
-- NOT VALID, so historical rows stay untouched while every new write is
-- enforced.
--
-- Nothing scientific is invented here. A calculation only runs when the
-- approved template parameter carries a machine-readable
-- `calculation_rule_type` + `calculation_rule_payload`; a sample result is only
-- derived from per-parameter outcomes that already came from approved
-- acceptance rules. Absent rules leave the outcome to the human reviewer, and
-- the overall test result still comes from the approved evaluation source.

-- 1. Test Batch / Run ---------------------------------------------------------
--
-- One laboratory test contains one or more runs. Each run carries its own
-- samples, readings and equipment evidence, and `sequence` is the run order
-- within the test (1-based, unique per test).
CREATE TABLE qc.lab_test_batches (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  lab_test_id UUID NOT NULL,
  batch_no TEXT NOT NULL CHECK (length(btrim(batch_no)) > 0),
  label TEXT,
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_lab_test_batches__test_batch_no UNIQUE (lab_test_id, batch_no),
  CONSTRAINT uq_lab_test_batches__test_sequence UNIQUE (lab_test_id, sequence),
  CONSTRAINT fk_lab_test_batches__lab_test_id
    FOREIGN KEY (lab_test_id) REFERENCES qc.lab_tests (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_test_batches__created_by
    FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_test_batches__updated_by
    FOREIGN KEY (updated_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT ck_lab_test_batches__window
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

CREATE INDEX idx_lab_test_batches__lab_test_id
  ON qc.lab_test_batches (lab_test_id);

-- 2. A sample belongs to a run -------------------------------------------------
--
-- Nullable so every pre-existing sample row keeps its meaning: NULL batch_id is
-- the legacy test-level sample that QC-DATA-003 does not reinterpret. The
-- uniqueness pair only constrains rows that carry a run, because PostgreSQL
-- treats NULLs as distinct.
ALTER TABLE qc.lab_samples
  ADD COLUMN batch_id UUID;

ALTER TABLE qc.lab_samples
  ADD CONSTRAINT fk_lab_samples__batch_id
    FOREIGN KEY (batch_id) REFERENCES qc.lab_test_batches (id) ON DELETE RESTRICT
  NOT VALID;

-- A uniqueness constraint cannot be marked NOT VALID, and it does not need to
-- be here: `batch_id` is new, so every pre-existing row carries NULL and
-- PostgreSQL treats NULLs as distinct — no historical row can collide.
ALTER TABLE qc.lab_samples
  ADD CONSTRAINT uq_lab_samples__batch_identifier
    UNIQUE (batch_id, sample_identifier);

CREATE INDEX idx_lab_samples__batch_id ON qc.lab_samples (batch_id);

-- 3. Readings: many per sample per parameter ----------------------------------
--
-- One row per replicate. `reading_index` is the operator-supplied replicate
-- number within (run, sample, parameter) and is the only ordering the system
-- assumes. Raw values are preserved exactly as captured; nothing is averaged or
-- rounded at write time.
CREATE TABLE qc.lab_readings (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  lab_test_id UUID NOT NULL,
  batch_id UUID NOT NULL,
  sample_id UUID NOT NULL,
  template_parameter_id UUID NOT NULL,
  reading_index INTEGER NOT NULL CHECK (reading_index >= 1),
  raw_numeric_value NUMERIC,
  raw_text_value TEXT,
  raw_boolean_value BOOLEAN,
  unit TEXT,
  remarks TEXT,
  entered_by UUID NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT ck_lab_readings__one_raw_value
    CHECK (num_nonnulls(raw_numeric_value, raw_text_value, raw_boolean_value) = 1),
  CONSTRAINT uq_lab_readings__replicate
    UNIQUE (batch_id, sample_id, template_parameter_id, reading_index),
  CONSTRAINT fk_lab_readings__lab_test_id
    FOREIGN KEY (lab_test_id) REFERENCES qc.lab_tests (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_readings__batch_id
    FOREIGN KEY (batch_id) REFERENCES qc.lab_test_batches (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_readings__sample_id
    FOREIGN KEY (sample_id) REFERENCES qc.lab_samples (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_readings__template_parameter_id
    FOREIGN KEY (template_parameter_id) REFERENCES qc.lab_test_template_parameters (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_readings__entered_by
    FOREIGN KEY (entered_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_lab_readings__lab_test_id ON qc.lab_readings (lab_test_id);
CREATE INDEX idx_lab_readings__batch_id ON qc.lab_readings (batch_id);
CREATE INDEX idx_lab_readings__sample_id ON qc.lab_readings (sample_id);

-- 4. Calculation evidence on the reported measurement --------------------------
--
-- `lab_measurements` already carries `calculated_value` / `calculated_unit`
-- (0009); QC-DATA-003 adds the traceability columns DATA-MODEL §75 requires so a
-- calculated value can be reproduced from the readings it came from.
ALTER TABLE qc.lab_measurements
  ADD COLUMN batch_id UUID,
  ADD COLUMN calculation_rule_reference TEXT,
  ADD COLUMN calculation_rule_version TEXT,
  ADD COLUMN calculation_inputs JSONB;

ALTER TABLE qc.lab_measurements
  ADD CONSTRAINT fk_lab_measurements__batch_id
    FOREIGN KEY (batch_id) REFERENCES qc.lab_test_batches (id) ON DELETE RESTRICT
  NOT VALID;

CREATE INDEX idx_lab_measurements__batch_id ON qc.lab_measurements (batch_id);

-- A parameter that is computed from readings has no single raw value, so the
-- original "exactly one raw value" rule is narrowed to "at most one raw value,
-- and at least one of raw-or-calculated". Every row the old constraint accepted
-- is still accepted, and every row it rejected for having two raw values is
-- still rejected.
ALTER TABLE qc.lab_measurements
  DROP CONSTRAINT ck_lab_measurements__one_raw_value;

ALTER TABLE qc.lab_measurements
  ADD CONSTRAINT ck_lab_measurements__one_raw_value
    CHECK (num_nonnulls(raw_numeric_value, raw_text_value, raw_boolean_value) <= 1),
  ADD CONSTRAINT ck_lab_measurements__raw_or_calculated
    CHECK (num_nonnulls(raw_numeric_value, raw_text_value, raw_boolean_value) = 1 OR calculated_value IS NOT NULL);

ALTER TABLE qc.lab_measurements
  ADD CONSTRAINT ck_lab_measurements__result_vocabulary
    CHECK (result IS NULL OR result IN ('PASS', 'FAIL', 'HOLD', 'NOT_APPLICABLE'))
  NOT VALID;

-- 5. Run-level equipment evidence ---------------------------------------------
--
-- QC-DATA-002 mirror for the laboratory: the usage row keeps the equipment and
-- calibration snapshots taken at usage time. Eligibility (ACTIVE equipment,
-- CURRENT non-overdue calibration) stays in the approved Assets use case.
ALTER TABLE qc.lab_equipment_usage
  ADD COLUMN batch_id UUID;

ALTER TABLE qc.lab_equipment_usage
  ADD CONSTRAINT fk_lab_equipment_usage__batch_id
    FOREIGN KEY (batch_id) REFERENCES qc.lab_test_batches (id) ON DELETE RESTRICT
  NOT VALID;

CREATE INDEX idx_lab_equipment_usage__batch_id ON qc.lab_equipment_usage (batch_id);

-- 6. Calculation rule on the approved template parameter -----------------------
--
-- The approved template is the only source of a calculation. A parameter without
-- a rule stores readings and no calculated value; the reviewer owns the outcome.
ALTER TABLE qc.lab_test_template_parameters
  ADD COLUMN calculation_rule_type TEXT,
  ADD COLUMN calculation_rule_payload JSONB;

ALTER TABLE qc.lab_test_template_parameters
  ADD CONSTRAINT ck_lab_test_template_parameters__calculation_rule
    CHECK (
      calculation_rule_type IS NULL
      OR calculation_rule_type IN ('MEAN', 'SUM', 'MIN', 'MAX', 'RANGE')
    )
  NOT VALID;

-- 7. Derived overall result evidence ------------------------------------------
--
-- The derived result is the aggregate of the run-level sample results shown to
-- the reviewer. It is evidence, not the official outcome: `scientific_result`
-- still comes from the approved evaluation source at stage-1 approval.
ALTER TABLE qc.lab_tests
  ADD COLUMN derived_result TEXT,
  ADD COLUMN derived_result_source TEXT,
  ADD COLUMN derived_result_inputs_hash TEXT,
  ADD COLUMN derived_result_computed_at TIMESTAMPTZ;

ALTER TABLE qc.lab_tests
  ADD CONSTRAINT ck_lab_tests__derived_result
    CHECK (
      derived_result IS NULL
      OR derived_result IN ('PASS', 'FAIL', 'HOLD', 'NOT_APPLICABLE')
    )
  NOT VALID;

-- 8. Derived sample result per run sample -------------------------------------
--
-- One row per (run, sample). `source` separates a result the server derived from
-- approved rules from one a human recorded; `derived_from` keeps the exact
-- per-parameter inputs so the derivation can be reproduced.
CREATE TABLE qc.lab_sample_results (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  lab_test_id UUID NOT NULL,
  batch_id UUID NOT NULL,
  sample_id UUID NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL', 'HOLD', 'NOT_APPLICABLE')),
  source TEXT NOT NULL CHECK (source IN ('SYSTEM_EVALUATION', 'HUMAN')),
  source_reference TEXT,
  content_hash TEXT,
  derived_from JSONB,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  evaluated_by UUID NOT NULL,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_lab_sample_results__batch_sample UNIQUE (batch_id, sample_id),
  CONSTRAINT fk_lab_sample_results__lab_test_id
    FOREIGN KEY (lab_test_id) REFERENCES qc.lab_tests (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_sample_results__batch_id
    FOREIGN KEY (batch_id) REFERENCES qc.lab_test_batches (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_sample_results__sample_id
    FOREIGN KEY (sample_id) REFERENCES qc.lab_samples (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_sample_results__evaluated_by
    FOREIGN KEY (evaluated_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_lab_sample_results__lab_test_id ON qc.lab_sample_results (lab_test_id);
CREATE INDEX idx_lab_sample_results__batch_id ON qc.lab_sample_results (batch_id);
