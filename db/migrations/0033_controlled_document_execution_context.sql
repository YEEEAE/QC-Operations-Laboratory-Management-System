-- QC-100-FINAL-029-B: bind controlled execution to the document versions that
-- were effective when the template was authored, and preserve execution data.

ALTER TABLE qc.inspection_report_snapshots
  ADD COLUMN results_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE qc.inspection_template_document_sources (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  template_version_id UUID NOT NULL,
  document_version_id UUID NOT NULL,
  usage_type TEXT NOT NULL,
  linked_by UUID NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_inspection_template_document_sources__source
    UNIQUE (template_version_id, document_version_id, usage_type),
  CONSTRAINT fk_inspection_template_document_sources__template
    FOREIGN KEY (template_version_id) REFERENCES qc.inspection_template_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_template_document_sources__document
    FOREIGN KEY (document_version_id) REFERENCES qc.document_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inspection_template_document_sources__linked_by
    FOREIGN KEY (linked_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.lab_test_template_document_sources (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  template_version_id UUID NOT NULL,
  document_version_id UUID NOT NULL,
  usage_type TEXT NOT NULL,
  linked_by UUID NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_lab_test_template_document_sources__source
    UNIQUE (template_version_id, document_version_id, usage_type),
  CONSTRAINT fk_lab_test_template_document_sources__template
    FOREIGN KEY (template_version_id) REFERENCES qc.lab_test_template_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_test_template_document_sources__document
    FOREIGN KEY (document_version_id) REFERENCES qc.document_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lab_test_template_document_sources__linked_by
    FOREIGN KEY (linked_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_inspection_template_document_sources__template
  ON qc.inspection_template_document_sources (template_version_id);
CREATE INDEX idx_lab_test_template_document_sources__template
  ON qc.lab_test_template_document_sources (template_version_id);

CREATE OR REPLACE FUNCTION qc.guard_template_document_source_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  template_state TEXT;
  source_state TEXT;
  template_id UUID;
  source_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    template_id := NEW.template_version_id;
    source_id := NEW.document_version_id;
    IF TG_TABLE_NAME = 'inspection_template_document_sources' THEN
      SELECT state INTO template_state FROM qc.inspection_template_versions WHERE id = template_id FOR KEY SHARE;
    ELSE
      SELECT state INTO template_state FROM qc.lab_test_template_versions WHERE id = template_id FOR KEY SHARE;
    END IF;
    SELECT state INTO source_state FROM qc.document_versions WHERE id = source_id FOR KEY SHARE;
    IF template_state IS DISTINCT FROM 'DRAFT' OR source_state IS DISTINCT FROM 'EFFECTIVE' THEN
      RAISE EXCEPTION 'template document sources require a draft template and an effective document version'
        USING ERRCODE = '55006';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'template document source evidence is append-only'
    USING ERRCODE = '55006';
END;
$$;

CREATE TRIGGER inspection_template_document_sources_integrity
  BEFORE INSERT OR UPDATE OR DELETE ON qc.inspection_template_document_sources
  FOR EACH ROW EXECUTE FUNCTION qc.guard_template_document_source_link();
CREATE TRIGGER inspection_template_document_sources_truncate_guard
  BEFORE TRUNCATE ON qc.inspection_template_document_sources
  FOR EACH STATEMENT EXECUTE FUNCTION qc.guard_template_document_source_link();
CREATE TRIGGER lab_test_template_document_sources_integrity
  BEFORE INSERT OR UPDATE OR DELETE ON qc.lab_test_template_document_sources
  FOR EACH ROW EXECUTE FUNCTION qc.guard_template_document_source_link();
CREATE TRIGGER lab_test_template_document_sources_truncate_guard
  BEFORE TRUNCATE ON qc.lab_test_template_document_sources
  FOR EACH STATEMENT EXECUTE FUNCTION qc.guard_template_document_source_link();

CREATE OR REPLACE FUNCTION qc.guard_lab_document_usage_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  source_state TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT state INTO source_state FROM qc.document_versions WHERE id = NEW.document_version_id FOR KEY SHARE;
    IF source_state IS DISTINCT FROM 'EFFECTIVE' THEN
      RAISE EXCEPTION 'laboratory execution may only link an effective document version'
        USING ERRCODE = '55006';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'laboratory document usage is append-only'
    USING ERRCODE = '55006';
END;
$$;

CREATE TRIGGER lab_document_usage_integrity
  BEFORE INSERT OR UPDATE OR DELETE ON qc.lab_document_usage
  FOR EACH ROW EXECUTE FUNCTION qc.guard_lab_document_usage_integrity();
CREATE TRIGGER lab_document_usage_truncate_guard
  BEFORE TRUNCATE ON qc.lab_document_usage
  FOR EACH STATEMENT EXECUTE FUNCTION qc.guard_lab_document_usage_integrity();

CREATE TRIGGER audit_events_truncate_guard
  BEFORE TRUNCATE ON qc.audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER electronic_signatures_truncate_guard
  BEFORE TRUNCATE ON qc.electronic_signatures
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER approval_decisions_truncate_guard
  BEFORE TRUNCATE ON qc.approval_decisions
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER change_request_changes_truncate_guard
  BEFORE TRUNCATE ON qc.change_request_changes
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER inspection_report_snapshots_truncate_guard
  BEFORE TRUNCATE ON qc.inspection_report_snapshots
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER lab_test_snapshots_truncate_guard
  BEFORE TRUNCATE ON qc.lab_test_snapshots
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER capa_close_snapshots_truncate_guard
  BEFORE TRUNCATE ON qc.capa_close_snapshots
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
