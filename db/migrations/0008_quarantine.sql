CREATE TABLE qc.receiving_items (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  receiving_no TEXT NOT NULL,
  doc_no TEXT NOT NULL CHECK (length(btrim(doc_no)) > 0),
  item_code TEXT NOT NULL CHECK (length(btrim(item_code)) > 0),
  description TEXT NOT NULL CHECK (length(btrim(description)) > 0),
  lot TEXT NOT NULL CHECK (length(btrim(lot)) > 0),
  qty NUMERIC NOT NULL CHECK (qty > 0),
  receiving_date DATE NOT NULL,
  expiry_date DATE,
  workflow_state TEXT NOT NULL DEFAULT 'PENDING' CHECK (workflow_state IN ('PENDING', 'READY_FOR_INSPECTION', 'UNDER_INSPECTION', 'INSPECTION_COMPLETE', 'RELEASE_PENDING', 'RELEASED', 'HOLD', 'EXPIRED', 'CANCELLED')),
  inspection_result TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (inspection_result IN ('NOT_STARTED', 'IN_PROGRESS', 'PASS', 'FAIL', 'HOLD')),
  release_system BOOLEAN NOT NULL DEFAULT FALSE,
  released_at TIMESTAMPTZ,
  released_by UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_receiving_items__receiving_no UNIQUE (receiving_no),
  CONSTRAINT fk_receiving_items__released_by FOREIGN KEY (released_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_receiving_items__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_receiving_items__updated_by FOREIGN KEY (updated_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.inspection_templates (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  template_code TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  description TEXT,
  active BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_inspection_templates__template_code UNIQUE (template_code),
  CONSTRAINT fk_inspection_templates__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.inspection_template_versions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  template_id UUID NOT NULL,
  version_no TEXT NOT NULL,
  state TEXT NOT NULL,
  effective_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  source_document TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL,
  content_hash TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_inspection_template_versions__revision UNIQUE (template_id, version_no),
  CONSTRAINT fk_inspection_template_versions__template_id FOREIGN KEY (template_id) REFERENCES qc.inspection_templates (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_template_versions__approved_by FOREIGN KEY (approved_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_template_versions__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.inspection_template_sections (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  template_version_id UUID NOT NULL,
  section_code TEXT,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  position INTEGER NOT NULL,
  instructions TEXT,
  CONSTRAINT fk_inspection_template_sections__template_version_id FOREIGN KEY (template_version_id) REFERENCES qc.inspection_template_versions (id) ON DELETE RESTRICT
);

CREATE TABLE qc.inspection_template_points (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  section_id UUID NOT NULL,
  point_code TEXT NOT NULL,
  label TEXT NOT NULL CHECK (length(btrim(label)) > 0),
  requirement_text TEXT,
  data_type TEXT NOT NULL,
  unit TEXT,
  required BOOLEAN NOT NULL,
  acceptance_rule_type TEXT,
  acceptance_rule_payload JSONB,
  source_reference TEXT,
  position INTEGER NOT NULL,
  CONSTRAINT uq_inspection_template_points__code UNIQUE (section_id, point_code),
  CONSTRAINT fk_inspection_template_points__section_id FOREIGN KEY (section_id) REFERENCES qc.inspection_template_sections (id) ON DELETE RESTRICT
);

CREATE TABLE qc.inspection_reports (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  inspection_no TEXT NOT NULL,
  receiving_item_id UUID NOT NULL,
  template_version_id UUID NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED', 'VOID')),
  final_result TEXT CHECK (final_result IN ('PASS', 'FAIL', 'HOLD')),
  author_id UUID NOT NULL,
  submitted_at TIMESTAMPTZ,
  review_started_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  snapshot_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_inspection_reports__inspection_no UNIQUE (inspection_no),
  CONSTRAINT fk_inspection_reports__receiving_item_id FOREIGN KEY (receiving_item_id) REFERENCES qc.receiving_items (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_reports__template_version_id FOREIGN KEY (template_version_id) REFERENCES qc.inspection_template_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_reports__author_id FOREIGN KEY (author_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_reports__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_reports__updated_by FOREIGN KEY (updated_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.inspection_report_results (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  inspection_report_id UUID NOT NULL,
  template_point_id UUID NOT NULL,
  numeric_value NUMERIC,
  text_value TEXT,
  boolean_value BOOLEAN,
  selected_value TEXT,
  unit TEXT,
  result TEXT,
  remarks TEXT,
  entered_by UUID NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT ck_inspection_report_results__one_value CHECK (num_nonnulls(numeric_value, text_value, boolean_value, selected_value) = 1),
  CONSTRAINT fk_inspection_report_results__inspection_report_id FOREIGN KEY (inspection_report_id) REFERENCES qc.inspection_reports (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_report_results__template_point_id FOREIGN KEY (template_point_id) REFERENCES qc.inspection_template_points (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_report_results__entered_by FOREIGN KEY (entered_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.inspection_report_snapshots (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  inspection_report_id UUID NOT NULL,
  snapshot_version INTEGER NOT NULL,
  snapshot_stage TEXT NOT NULL,
  receiving_snapshot JSONB NOT NULL,
  template_snapshot JSONB NOT NULL,
  controlled_source_snapshot JSONB,
  criteria_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  snapshot_hash TEXT NOT NULL,
  CONSTRAINT uq_inspection_report_snapshots__version UNIQUE (inspection_report_id, snapshot_version),
  CONSTRAINT fk_inspection_report_snapshots__inspection_report_id FOREIGN KEY (inspection_report_id) REFERENCES qc.inspection_reports (id) ON DELETE RESTRICT
);

ALTER TABLE qc.inspection_reports
  ADD CONSTRAINT fk_inspection_reports__snapshot_id FOREIGN KEY (snapshot_id) REFERENCES qc.inspection_report_snapshots (id) ON DELETE RESTRICT;

CREATE INDEX idx_receiving_items__workflow_state ON qc.receiving_items (workflow_state);
CREATE INDEX idx_receiving_items__inspection_result ON qc.receiving_items (inspection_result);
CREATE INDEX idx_receiving_items__doc_item_lot ON qc.receiving_items (doc_no, item_code, lot);
CREATE INDEX idx_receiving_items__expiry_date ON qc.receiving_items (expiry_date);
CREATE INDEX idx_inspection_template_versions__template_id ON qc.inspection_template_versions (template_id);
CREATE INDEX idx_inspection_template_sections__template_version_id ON qc.inspection_template_sections (template_version_id);
CREATE INDEX idx_inspection_template_points__section_id ON qc.inspection_template_points (section_id);
CREATE INDEX idx_inspection_reports__receiving_item_id ON qc.inspection_reports (receiving_item_id);
CREATE INDEX idx_inspection_reports__state ON qc.inspection_reports (state);
CREATE INDEX idx_inspection_report_results__inspection_report_id ON qc.inspection_report_results (inspection_report_id);
CREATE INDEX idx_inspection_report_snapshots__inspection_report_id ON qc.inspection_report_snapshots (inspection_report_id);

ALTER TABLE qc.receiving_items OWNER TO qc_migrator;
ALTER TABLE qc.inspection_templates OWNER TO qc_migrator;
ALTER TABLE qc.inspection_template_versions OWNER TO qc_migrator;
ALTER TABLE qc.inspection_template_sections OWNER TO qc_migrator;
ALTER TABLE qc.inspection_template_points OWNER TO qc_migrator;
ALTER TABLE qc.inspection_reports OWNER TO qc_migrator;
ALTER TABLE qc.inspection_report_results OWNER TO qc_migrator;
ALTER TABLE qc.inspection_report_snapshots OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.receiving_items, qc.inspection_templates, qc.inspection_template_versions, qc.inspection_template_sections, qc.inspection_template_points, qc.inspection_reports, qc.inspection_report_results TO qc_app_runtime;
GRANT SELECT, INSERT ON qc.inspection_report_snapshots TO qc_app_runtime;
