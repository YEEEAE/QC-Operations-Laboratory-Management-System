-- DOC-02: pin the exact controlled document source used by an inspection or
-- laboratory record.  Historical rows are intentionally not backfilled.
CREATE TABLE qc.document_execution_contexts (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  execution_type TEXT NOT NULL CHECK (execution_type IN ('INSPECTION_REPORT', 'LAB_TEST')),
  execution_id UUID NOT NULL,
  checkpoint TEXT NOT NULL CHECK (checkpoint IN ('CREATE', 'SUBMIT')),
  document_id UUID NOT NULL REFERENCES qc.document_identities(id) ON DELETE RESTRICT,
  document_version_id UUID NOT NULL REFERENCES qc.document_versions(id) ON DELETE RESTRICT,
  template_version_id UUID NOT NULL,
  usage_type TEXT NOT NULL,
  revision TEXT NOT NULL,
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  source_file_digest TEXT NOT NULL CHECK (source_file_digest ~ '^[0-9a-f]{64}$'),
  source_files_snapshot JSONB NOT NULL CHECK (jsonb_typeof(source_files_snapshot) = 'array'),
  effective_at TIMESTAMPTZ NOT NULL,
  execution_at TIMESTAMPTZ NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  item_code TEXT,
  lot TEXT,
  method_reference TEXT NOT NULL,
  captured_by UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT uq_document_execution_contexts__checkpoint
    UNIQUE (execution_type, execution_id, document_version_id, usage_type, checkpoint)
);

CREATE INDEX idx_document_execution_contexts__record
  ON qc.document_execution_contexts (execution_type, execution_id, checkpoint);

CREATE FUNCTION qc.guard_document_execution_context()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  source_state TEXT;
  source_revision TEXT;
  source_hash TEXT;
  source_effective_at TIMESTAMPTZ;
  source_effective_until TIMESTAMPTZ;
  source_approved_at TIMESTAMPTZ;
  source_reviewed_at TIMESTAMPTZ;
  source_binding_verified BOOLEAN;
  source_document_id UUID;
  execution_state TEXT;
  expected_files JSONB;
  expected_method TEXT;
  expected_item TEXT;
  expected_lot TEXT;
  record_created_at TIMESTAMPTZ;
  template_state TEXT;
  template_approved_at TIMESTAMPTZ;
  template_effective_at TIMESTAMPTZ;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'document execution context is append-only' USING ERRCODE = '55006';
  END IF;

  SELECT state, revision, content_hash, effective_at, effective_until,
         approved_at, reviewed_at, source_binding_verified, document_id
    INTO source_state, source_revision, source_hash, source_effective_at,
         source_effective_until, source_approved_at, source_reviewed_at,
         source_binding_verified, source_document_id
    FROM qc.document_versions
   WHERE id = NEW.document_version_id
   FOR KEY SHARE;
  IF NOT FOUND OR source_document_id <> NEW.document_id
     OR source_revision <> NEW.revision OR source_hash <> NEW.content_hash
     OR source_state NOT IN ('EFFECTIVE', 'SUPERSEDED')
     OR source_approved_at IS NULL OR source_reviewed_at IS NULL
     OR source_binding_verified IS NOT TRUE OR source_effective_at IS NULL
     OR source_effective_at > NEW.execution_at
     OR (source_effective_until IS NOT NULL AND source_effective_until <= NEW.execution_at)
     OR source_effective_at <> NEW.effective_at THEN
    RAISE EXCEPTION 'execution requires its approved, verified document version effective at execution time'
      USING ERRCODE = '55006';
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'fileId', link.file_id, 'fileRole', link.file_role, 'sha256', file.sha256
  ) ORDER BY link.file_id, link.file_role)
    INTO expected_files
    FROM qc.document_version_files link
    JOIN qc.files file ON file.id = link.file_id
   WHERE link.document_version_id = NEW.document_version_id AND file.state = 'ACTIVE';
  IF expected_files IS NULL OR expected_files <> NEW.source_files_snapshot
     OR jsonb_array_length(expected_files) = 0 THEN
    RAISE EXCEPTION 'execution source file manifest is missing or does not match active source files'
      USING ERRCODE = '55006';
  END IF;

  IF NEW.execution_type = 'INSPECTION_REPORT' THEN
    SELECT receiving.item_code, receiving.lot, catalog.doc_code, report.created_at,
           template.state, template.approved_at, template.effective_at
      INTO expected_item, expected_lot, expected_method, record_created_at,
           template_state, template_approved_at, template_effective_at
      FROM qc.inspection_reports report
      JOIN qc.receiving_items receiving ON receiving.id = report.receiving_item_id
      JOIN qc.inspection_template_versions template ON template.id = report.template_version_id
      JOIN qc.inspection_templates parent ON parent.id = template.template_id
      JOIN qc.inspection_report_catalog catalog ON catalog.id = parent.catalog_id
     WHERE report.id = NEW.execution_id AND report.template_version_id = NEW.template_version_id;
  ELSE
    SELECT template.method_reference, test.created_at, template.state,
           template.approved_at, template.effective_at
      INTO expected_method, record_created_at, template_state,
           template_approved_at, template_effective_at
      FROM qc.lab_tests test
      JOIN qc.lab_test_template_versions template ON template.id = test.template_version_id
     WHERE test.id = NEW.execution_id AND test.template_version_id = NEW.template_version_id;
  END IF;
  IF expected_method IS NULL OR expected_method <> NEW.method_reference
     OR record_created_at IS DISTINCT FROM NEW.execution_at
     OR (NEW.execution_type = 'INSPECTION_REPORT' AND
         (expected_item IS DISTINCT FROM NEW.item_code OR expected_lot IS DISTINCT FROM NEW.lot)) THEN
    RAISE EXCEPTION 'execution context does not match its controlled method, template, item, or lot'
      USING ERRCODE = '55006';
  END IF;

  IF NEW.checkpoint = 'CREATE' THEN
    IF template_state <> 'APPROVED' OR template_approved_at IS NULL
       OR template_effective_at IS NULL OR template_effective_at > NEW.execution_at
       OR (NEW.execution_type = 'INSPECTION_REPORT' AND NOT EXISTS (
          SELECT 1 FROM qc.inspection_reports WHERE id = NEW.execution_id
            AND template_version_id = NEW.template_version_id AND state = 'DRAFT'
            AND author_id = NEW.captured_by)) OR
       (NEW.execution_type = 'LAB_TEST' AND NOT EXISTS (
          SELECT 1 FROM qc.lab_tests WHERE id = NEW.execution_id
            AND template_version_id = NEW.template_version_id AND state = 'DRAFT'
            AND author_id = NEW.captured_by)) THEN
      RAISE EXCEPTION 'creation context must match a new draft record and its actor'
        USING ERRCODE = '55006';
    END IF;
  END IF;

  IF NEW.checkpoint = 'SUBMIT' THEN
    SELECT state INTO execution_state
      FROM (SELECT state FROM qc.inspection_reports WHERE id = NEW.execution_id AND NEW.execution_type = 'INSPECTION_REPORT'
            UNION ALL
            SELECT state FROM qc.lab_tests WHERE id = NEW.execution_id AND NEW.execution_type = 'LAB_TEST') AS execution
     LIMIT 1;
    IF execution_state IS NULL OR execution_state NOT IN ('SUBMITTED', 'UNDER_REVIEW', 'PENDING_QCM_APPROVAL')
       OR NOT EXISTS (
         SELECT 1 FROM qc.document_execution_contexts prior
          WHERE prior.execution_type = NEW.execution_type
            AND prior.execution_id = NEW.execution_id
            AND prior.document_version_id = NEW.document_version_id
            AND prior.checkpoint = 'CREATE'
            AND prior.execution_at = NEW.execution_at
       ) THEN
      RAISE EXCEPTION 'submission context must reference the original creation snapshot'
        USING ERRCODE = '55006';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER document_execution_contexts_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON qc.document_execution_contexts
  FOR EACH ROW EXECUTE FUNCTION qc.guard_document_execution_context();

CREATE TRIGGER document_execution_contexts_no_truncate
  BEFORE TRUNCATE ON qc.document_execution_contexts
  FOR EACH STATEMENT EXECUTE FUNCTION qc.guard_document_execution_context();
