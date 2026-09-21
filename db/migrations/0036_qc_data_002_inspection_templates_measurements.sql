-- QC-DATA-002: deterministic product→template mapping, structured AQL /
-- sampling report data, and inspection→equipment→calibration traceability.
--
-- Forward-only. Historical rows are never rewritten or guessed: every new
-- column is nullable and every new constraint is NOT VALID, so pre-existing
-- rows stay untouched while every new write is enforced.
--
-- No AQL / sampling values are invented here: the paper forms' Accept /
-- Reject / Code Letter numbers are operator-supplied from the approved AQL
-- source and stored as structured report facts (not free-text remarks).

-- 1. Deterministic item→template mapping -------------------------------------
--
-- Resolves the approved inspection template for a receiving item by its
-- controlled item_code (the identifier already carried on receiving_items).
-- `resolve` is the operator-facing mapping table; ambiguity is prevented at
-- write time by requiring the (item_code, template_id) pair to be unique and
-- by the application enforcing at most one active mapping per item unless an
-- authorized operator explicitly selects between mapped candidates.
CREATE TABLE qc.inspection_item_templates (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  item_code TEXT NOT NULL CHECK (length(btrim(item_code)) > 0),
  template_id UUID NOT NULL,
  state TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (state IN ('ACTIVE', 'STOPPED')),
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_inspection_item_templates__item_template
    UNIQUE (item_code, template_id),
  CONSTRAINT fk_inspection_item_templates__template
    FOREIGN KEY (template_id) REFERENCES qc.inspection_templates (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_item_templates__created_by
    FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_item_templates__updated_by
    FOREIGN KEY (updated_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT ck_inspection_item_templates__window
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_inspection_item_templates__item_code
  ON qc.inspection_item_templates (item_code);
CREATE INDEX idx_inspection_item_templates__template_id
  ON qc.inspection_item_templates (template_id);

-- 2. Structured AQL / sampling on the inspection report ----------------------
--
-- Each field is a structured report fact, never a free-text remark. Values are
-- operator-supplied from the approved AQL reference; the system does not
-- compute AQL, code letters, or sample sizes (no approved AQL rule table
-- exists in the project to automate).
ALTER TABLE qc.inspection_reports
  ADD COLUMN aql TEXT,
  ADD COLUMN aql_code_letter TEXT,
  ADD COLUMN aql_inspection_level TEXT,
  ADD COLUMN aql_sample_size NUMERIC,
  ADD COLUMN aql_accept_number NUMERIC,
  ADD COLUMN aql_reject_number NUMERIC,
  ADD COLUMN aql_observed_defects NUMERIC,
  ADD COLUMN aql_sampling_result TEXT,
  ADD COLUMN aql_source_reference TEXT,
  ADD COLUMN aql_recorded_by UUID,
  ADD COLUMN aql_recorded_at TIMESTAMPTZ;

ALTER TABLE qc.inspection_reports
  ADD CONSTRAINT ck_inspection_reports__aql_result_vocabulary
    CHECK (
      aql_sampling_result IS NULL
      OR aql_sampling_result IN ('ACCEPT', 'REJECT', 'NOT_APPLICABLE')
    )
  NOT VALID;

-- 3. Inspection equipment usage: report → equipment → calibration -----------
--
-- Mirrors `qc.lab_equipment_usage` (0009/0010): the usage row carries the
-- snapshots of the equipment and its current calibration at usage time so the
-- historical fact survives later calibration churn. Eligibility (ACTIVE
-- equipment, CURRENT calibration, not overdue) is enforced in the
-- application layer by the approved eligibility use case — not here — so the
-- policy stays in exactly one place.
CREATE TABLE qc.inspection_equipment_usage (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  inspection_report_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  calibration_record_id UUID,
  usage_role TEXT,
  used_at TIMESTAMPTZ,
  equipment_snapshot JSONB NOT NULL,
  calibration_snapshot JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_inspection_equipment_usage__report_equipment
    UNIQUE (inspection_report_id, equipment_id),
  CONSTRAINT fk_inspection_equipment_usage__report
    FOREIGN KEY (inspection_report_id) REFERENCES qc.inspection_reports (id) ON DELETE RESTRICT,
  -- Equipment and calibration domains already exist (0010); explicit domain
  -- boundaries only, matching lab_equipment_usage.
  CONSTRAINT fk_inspection_equipment_usage__equipment
    FOREIGN KEY (equipment_id) REFERENCES qc.equipment (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_equipment_usage__calibration
    FOREIGN KEY (calibration_record_id) REFERENCES qc.calibration_records (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_equipment_usage__created_by
    FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_inspection_equipment_usage__report
  ON qc.inspection_equipment_usage (inspection_report_id);
CREATE INDEX idx_inspection_equipment_usage__equipment
  ON qc.inspection_equipment_usage (equipment_id);

ALTER TABLE qc.inspection_reports
  ADD CONSTRAINT fk_inspection_reports__aql_recorded_by
    FOREIGN KEY (aql_recorded_by) REFERENCES qc.users (id) ON DELETE RESTRICT;
