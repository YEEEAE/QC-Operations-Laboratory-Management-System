-- QC-100-FINAL-029-A: preserve document-version file evidence.
-- File references are established while a version is a draft. Once linked,
-- their identity and attribution are historical evidence and cannot be edited
-- or removed through direct SQL.
CREATE OR REPLACE FUNCTION qc.guard_document_version_file_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  version_state TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT state INTO version_state
    FROM qc.document_versions
    WHERE id = NEW.document_version_id
    FOR KEY SHARE;

    IF version_state IS DISTINCT FROM 'DRAFT' THEN
      RAISE EXCEPTION 'document version files may only be linked while the version is DRAFT'
        USING ERRCODE = '55006';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'document version file evidence is append-only'
    USING ERRCODE = '55006';
END;
$$;

CREATE TRIGGER document_version_files_integrity
  BEFORE INSERT OR UPDATE OR DELETE ON qc.document_version_files
  FOR EACH ROW EXECUTE FUNCTION qc.guard_document_version_file_integrity();

CREATE TRIGGER document_version_files_truncate_guard
  BEFORE TRUNCATE ON qc.document_version_files
  FOR EACH STATEMENT EXECUTE FUNCTION qc.guard_document_version_file_integrity();
