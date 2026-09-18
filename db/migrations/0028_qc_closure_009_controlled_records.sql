-- QC-CLOSURE-009: controlled records must remain historically trustworthy.
-- Application use-cases still own authorization and workflow transitions; these
-- database guards protect the same invariants from direct SQL writers.

ALTER TABLE qc.inspection_template_versions
  ADD CONSTRAINT ck_inspection_template_versions__state
  CHECK (state IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'STOPPED', 'VOID', 'SUPERSEDED')) NOT VALID;

ALTER TABLE qc.lab_test_template_versions
  ADD CONSTRAINT ck_lab_test_template_versions__state
  CHECK (state IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'STOPPED', 'VOID', 'SUPERSEDED')) NOT VALID;

ALTER TABLE qc.electronic_signatures
  ADD CONSTRAINT ck_electronic_signatures__reauth_method
  CHECK (reauth_method IN ('PASSWORD', 'OTHER_APPROVED_METHOD')) NOT VALID;

-- A version keeps its own display content.  The old implementation updated the
-- shared inspection_templates header while creating a revision, which changed
-- the meaning shown for already-approved historical versions.
ALTER TABLE qc.inspection_template_versions
  ADD COLUMN name TEXT,
  ADD COLUMN description TEXT;

UPDATE qc.inspection_template_versions v
SET name = t.name,
    description = t.description
FROM qc.inspection_templates t
WHERE t.id = v.template_id;

CREATE OR REPLACE FUNCTION qc.reject_controlled_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'controlled history is append-only: %.%', TG_TABLE_SCHEMA, TG_TABLE_NAME
    USING ERRCODE = '55006';
END;
$$;

CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON qc.audit_events
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER electronic_signatures_append_only
  BEFORE UPDATE OR DELETE ON qc.electronic_signatures
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER approval_decisions_append_only
  BEFORE UPDATE OR DELETE ON qc.approval_decisions
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER change_request_changes_append_only
  BEFORE UPDATE OR DELETE ON qc.change_request_changes
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER inspection_report_snapshots_append_only
  BEFORE UPDATE OR DELETE ON qc.inspection_report_snapshots
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER lab_test_snapshots_append_only
  BEFORE UPDATE OR DELETE ON qc.lab_test_snapshots
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER capa_close_snapshots_append_only
  BEFORE UPDATE OR DELETE ON qc.capa_close_snapshots
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE OR REPLACE FUNCTION qc.reject_approved_document_content_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.state <> 'DRAFT' AND (
    NEW.revision IS DISTINCT FROM OLD.revision OR
    NEW.change_summary IS DISTINCT FROM OLD.change_summary OR
    NEW.content_hash IS DISTINCT FROM OLD.content_hash
  ) THEN
    RAISE EXCEPTION 'approved controlled document content is immutable'
      USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER document_versions_content_immutable
  BEFORE UPDATE ON qc.document_versions
  FOR EACH ROW EXECUTE FUNCTION qc.reject_approved_document_content_mutation();

CREATE OR REPLACE FUNCTION qc.reject_approved_template_content_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.state <> 'DRAFT' AND (
    NEW.version_no IS DISTINCT FROM OLD.version_no OR
    NEW.name IS DISTINCT FROM OLD.name OR
    NEW.description IS DISTINCT FROM OLD.description OR
    NEW.source_document IS DISTINCT FROM OLD.source_document OR
    NEW.content_hash IS DISTINCT FROM OLD.content_hash
  ) THEN
    RAISE EXCEPTION 'approved controlled template content is immutable'
      USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER inspection_template_versions_content_immutable
  BEFORE UPDATE ON qc.inspection_template_versions
  FOR EACH ROW EXECUTE FUNCTION qc.reject_approved_template_content_mutation();

CREATE OR REPLACE FUNCTION qc.reject_approved_lab_template_content_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.state <> 'DRAFT' AND (
    NEW.version_no IS DISTINCT FROM OLD.version_no OR
    NEW.method_reference IS DISTINCT FROM OLD.method_reference OR
    NEW.content_hash IS DISTINCT FROM OLD.content_hash
  ) THEN
    RAISE EXCEPTION 'approved laboratory template content is immutable'
      USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER lab_test_template_versions_content_immutable
  BEFORE UPDATE ON qc.lab_test_template_versions
  FOR EACH ROW EXECUTE FUNCTION qc.reject_approved_lab_template_content_mutation();
