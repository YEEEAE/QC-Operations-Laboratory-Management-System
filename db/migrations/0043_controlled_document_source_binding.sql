-- QC-ADP26-24: bind controlled revisions to immutable file digests and
-- snapshot the exact source revision/digest on controlled-document usage.

ALTER TABLE qc.inspection_template_document_sources
  ADD COLUMN source_revision TEXT,
  ADD COLUMN source_content_hash TEXT,
  ADD COLUMN source_files_snapshot JSONB,
  ADD COLUMN source_snapshot_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE qc.lab_test_template_document_sources
  ADD COLUMN source_revision TEXT,
  ADD COLUMN source_content_hash TEXT,
  ADD COLUMN source_files_snapshot JSONB,
  ADD COLUMN source_snapshot_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE qc.lab_document_usage
  ADD COLUMN source_revision TEXT,
  ADD COLUMN source_content_hash TEXT,
  ADD COLUMN source_files_snapshot JSONB,
  ADD COLUMN source_snapshot_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing append-only usage rows remain unverified. Do not rewrite historical
-- snapshots or promote legacy browser-provided hashes to trusted evidence.
ALTER TABLE qc.document_versions
  ADD COLUMN source_binding_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE qc.document_versions
  ADD CONSTRAINT ck_document_versions__verified_source_binding
  CHECK (NOT source_binding_verified OR (content_hash IS NOT NULL AND content_hash ~ '^[0-9a-f]{64}$'));

ALTER TABLE qc.inspection_template_document_sources
  ADD CONSTRAINT ck_inspection_document_source__verified_snapshot
  CHECK (NOT source_snapshot_verified OR (source_revision IS NOT NULL AND source_content_hash IS NOT NULL AND source_content_hash ~ '^[0-9a-f]{64}$' AND source_files_snapshot IS NOT NULL AND jsonb_typeof(source_files_snapshot) = 'array'));
ALTER TABLE qc.lab_test_template_document_sources
  ADD CONSTRAINT ck_lab_template_document_source__verified_snapshot
  CHECK (NOT source_snapshot_verified OR (source_revision IS NOT NULL AND source_content_hash IS NOT NULL AND source_content_hash ~ '^[0-9a-f]{64}$' AND source_files_snapshot IS NOT NULL AND jsonb_typeof(source_files_snapshot) = 'array'));
ALTER TABLE qc.lab_document_usage
  ADD CONSTRAINT ck_lab_document_usage__verified_snapshot
  CHECK (NOT source_snapshot_verified OR (source_revision IS NOT NULL AND source_content_hash IS NOT NULL AND source_content_hash ~ '^[0-9a-f]{64}$' AND source_files_snapshot IS NOT NULL AND jsonb_typeof(source_files_snapshot) = 'array'));

CREATE OR REPLACE FUNCTION qc.guard_document_source_binding_flag()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.source_binding_verified IS DISTINCT FROM OLD.source_binding_verified
     AND OLD.state <> 'DRAFT' THEN
    RAISE EXCEPTION 'document source binding is immutable after draft'
      USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER document_source_binding_flag_guard
  BEFORE UPDATE ON qc.document_versions
  FOR EACH ROW EXECUTE FUNCTION qc.guard_document_source_binding_flag();

CREATE OR REPLACE FUNCTION qc.guard_file_digest_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.original_filename IS DISTINCT FROM OLD.original_filename OR
     NEW.storage_key IS DISTINCT FROM OLD.storage_key OR
     NEW.storage_provider IS DISTINCT FROM OLD.storage_provider OR
     NEW.mime_type IS DISTINCT FROM OLD.mime_type OR
     NEW.extension IS DISTINCT FROM OLD.extension OR
     NEW.size_bytes IS DISTINCT FROM OLD.size_bytes OR
     NEW.sha256 IS DISTINCT FROM OLD.sha256 OR
     NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by OR
     NEW.uploaded_at IS DISTINCT FROM OLD.uploaded_at THEN
    RAISE EXCEPTION 'file identity and digest metadata are immutable'
      USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER files_digest_immutable
  BEFORE UPDATE ON qc.files
  FOR EACH ROW EXECUTE FUNCTION qc.guard_file_digest_immutability();

CREATE OR REPLACE FUNCTION qc.snapshot_controlled_document_source()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  source_row RECORD;
  source_files JSONB;
BEGIN
  SELECT id, revision, content_hash, state, source_binding_verified
    INTO source_row
    FROM qc.document_versions
    WHERE id = NEW.document_version_id
    FOR KEY SHARE;

  IF NOT FOUND OR source_row.state <> 'EFFECTIVE' OR
     source_row.source_binding_verified IS NOT TRUE OR
     source_row.content_hash IS NULL OR
     source_row.content_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'controlled source must be an effective version with a server-bound digest'
      USING ERRCODE = '55006';
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'fileId', link.file_id,
    'fileRole', link.file_role,
    'sha256', file.sha256
  ) ORDER BY link.file_id, link.file_role)
    INTO source_files
    FROM qc.document_version_files AS link
    JOIN qc.files AS file ON file.id = link.file_id
    WHERE link.document_version_id = NEW.document_version_id
      AND file.state = 'ACTIVE';

  IF source_files IS NULL OR jsonb_array_length(source_files) = 0 THEN
    RAISE EXCEPTION 'controlled source has no active bound file'
      USING ERRCODE = '55006';
  END IF;

  IF jsonb_array_length(source_files) <> (
    SELECT count(*) FROM qc.document_version_files
    WHERE document_version_id = NEW.document_version_id
  ) THEN
    RAISE EXCEPTION 'controlled source contains an inactive bound file'
      USING ERRCODE = '55006';
  END IF;

  NEW.source_revision := source_row.revision;
  NEW.source_content_hash := source_row.content_hash;
  NEW.source_files_snapshot := source_files;
  NEW.source_snapshot_verified := TRUE;
  IF TG_TABLE_NAME = 'lab_document_usage' THEN
    NEW.document_snapshot := jsonb_build_object(
      'documentVersionId', source_row.id,
      'revision', source_row.revision,
      'contentHash', source_row.content_hash,
      'files', source_files
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER inspection_template_document_source_snapshot
  BEFORE INSERT ON qc.inspection_template_document_sources
  FOR EACH ROW EXECUTE FUNCTION qc.snapshot_controlled_document_source();

CREATE TRIGGER lab_test_template_document_source_snapshot
  BEFORE INSERT ON qc.lab_test_template_document_sources
  FOR EACH ROW EXECUTE FUNCTION qc.snapshot_controlled_document_source();

CREATE TRIGGER lab_document_usage_source_snapshot
  BEFORE INSERT ON qc.lab_document_usage
  FOR EACH ROW EXECUTE FUNCTION qc.snapshot_controlled_document_source();
