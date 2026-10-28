-- NDB-10: source-backed onboarding metadata and owner-approved item mappings.
-- This migration changes source only; it does not import or reconcile company data.

ALTER TABLE qc.master_data_import_revisions
  ADD COLUMN schema_version TEXT NOT NULL DEFAULT '1'
    CHECK (length(btrim(schema_version)) > 0),
  ADD COLUMN source_file_reference TEXT,
  ADD COLUMN import_batch_id UUID NOT NULL DEFAULT uuidv7();

CREATE UNIQUE INDEX uq_master_data_import_batch_id
  ON qc.master_data_import_revisions (import_batch_id);

CREATE FUNCTION qc.guard_master_data_import_lineage_update() RETURNS trigger
LANGUAGE plpgsql AS $function$
BEGIN
  IF NEW.schema_version <> OLD.schema_version
    OR NEW.source_file_reference IS DISTINCT FROM OLD.source_file_reference
    OR NEW.import_batch_id <> OLD.import_batch_id THEN
    RAISE EXCEPTION 'Master-data file, schema and batch lineage are immutable';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER master_data_import_lineage_immutable
  BEFORE UPDATE ON qc.master_data_import_revisions
  FOR EACH ROW EXECUTE FUNCTION qc.guard_master_data_import_lineage_update();

ALTER TABLE qc.inspection_item_templates
  DROP CONSTRAINT uq_inspection_item_templates__item_template;

ALTER TABLE qc.inspection_item_templates
  ADD COLUMN approval_state TEXT NOT NULL DEFAULT 'PENDING_SOURCE_APPROVAL'
    CHECK (approval_state IN ('PENDING_SOURCE_APPROVAL', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
  ADD COLUMN template_version_id UUID,
  ADD COLUMN source_revision_id UUID REFERENCES qc.master_data_import_revisions(id) ON DELETE RESTRICT,
  ADD COLUMN source_reference TEXT,
  ADD COLUMN effective_revision TEXT,
  ADD COLUMN approved_by UUID REFERENCES qc.users(id) ON DELETE RESTRICT,
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN superseded_by UUID REFERENCES qc.inspection_item_templates(id) ON DELETE RESTRICT;

ALTER TABLE qc.inspection_reports
  ADD COLUMN item_mapping_revision_id UUID REFERENCES qc.inspection_item_templates(id) ON DELETE RESTRICT;
ALTER TABLE qc.inspection_report_snapshots
  ADD COLUMN item_mapping_revision_id UUID REFERENCES qc.inspection_item_templates(id) ON DELETE RESTRICT;

CREATE FUNCTION qc.require_inspection_mapping_snapshot() RETURNS trigger
LANGUAGE plpgsql AS $function$
DECLARE
  receiving_item_code TEXT;
  mapping_item_code TEXT;
  mapping_template_version UUID;
  report_mapping_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'inspection_reports' AND NEW.item_mapping_revision_id IS NULL THEN
    RAISE EXCEPTION 'New inspection reports require an approved item mapping revision';
  END IF;
  IF TG_TABLE_NAME = 'inspection_reports' THEN
    SELECT item_code INTO receiving_item_code FROM qc.receiving_items WHERE id = NEW.receiving_item_id;
    SELECT item_code, template_version_id INTO mapping_item_code, mapping_template_version
      FROM qc.inspection_item_templates WHERE id = NEW.item_mapping_revision_id
        AND state = 'ACTIVE' AND approval_state = 'APPROVED';
    IF mapping_item_code IS DISTINCT FROM receiving_item_code
      OR mapping_template_version IS DISTINCT FROM NEW.template_version_id THEN
      RAISE EXCEPTION 'Inspection report mapping must match its receiving Item Code and pinned template version';
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'inspection_report_snapshots' AND NEW.snapshot_stage = 'CREATION'
    AND NEW.item_mapping_revision_id IS NULL THEN
    RAISE EXCEPTION 'Inspection creation snapshots require the exact item mapping revision';
  END IF;
  IF TG_TABLE_NAME = 'inspection_report_snapshots' AND NEW.snapshot_stage = 'CREATION' THEN
    SELECT item_mapping_revision_id INTO report_mapping_id FROM qc.inspection_reports
      WHERE id = NEW.inspection_report_id;
    IF NEW.item_mapping_revision_id IS DISTINCT FROM report_mapping_id THEN
      RAISE EXCEPTION 'Inspection creation snapshot must retain its report mapping revision';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER inspection_reports_require_mapping
  BEFORE INSERT ON qc.inspection_reports
  FOR EACH ROW EXECUTE FUNCTION qc.require_inspection_mapping_snapshot();
CREATE TRIGGER inspection_report_snapshots_require_mapping
  BEFORE INSERT ON qc.inspection_report_snapshots
  FOR EACH ROW EXECUTE FUNCTION qc.require_inspection_mapping_snapshot();

ALTER TABLE qc.inspection_item_templates
  ADD CONSTRAINT fk_inspection_item_templates__pinned_version
    FOREIGN KEY (template_version_id) REFERENCES qc.inspection_template_versions(id) ON DELETE RESTRICT,
  ADD CONSTRAINT ck_inspection_item_templates__approved_source CHECK (
    approval_state <> 'APPROVED' OR (
      template_version_id IS NOT NULL AND source_revision_id IS NOT NULL
      AND source_reference IS NOT NULL AND length(btrim(source_reference)) > 0
      AND effective_revision IS NOT NULL AND length(btrim(effective_revision)) > 0
      AND approved_by IS NOT NULL AND approved_at IS NOT NULL AND state = 'ACTIVE'
    )
  ),
  ADD CONSTRAINT ck_inspection_item_templates__superseded_link CHECK (
    approval_state <> 'SUPERSEDED' OR superseded_by IS NOT NULL
  );

CREATE FUNCTION qc.guard_inspection_item_template_mapping_revision() RETURNS trigger
LANGUAGE plpgsql AS $function$
BEGIN
  IF NEW.id <> OLD.id OR NEW.item_code <> OLD.item_code OR NEW.template_id <> OLD.template_id
    OR NEW.template_version_id IS DISTINCT FROM OLD.template_version_id
    OR NEW.source_revision_id IS DISTINCT FROM OLD.source_revision_id
    OR NEW.source_reference IS DISTINCT FROM OLD.source_reference
    OR NEW.effective_revision IS DISTINCT FROM OLD.effective_revision
    OR NEW.created_by <> OLD.created_by OR NEW.created_at <> OLD.created_at
    OR NEW.effective_from <> OLD.effective_from THEN
    RAISE EXCEPTION 'Item mapping revision identity and source are immutable';
  END IF;
  IF NEW.version <> OLD.version + 1 THEN
    RAISE EXCEPTION 'Item mapping update requires an exact version increment';
  END IF;
  IF NEW.approval_state <> OLD.approval_state AND NOT (
    (OLD.approval_state = 'PENDING_SOURCE_APPROVAL' AND NEW.approval_state IN ('APPROVED', 'REJECTED'))
    OR (OLD.approval_state = 'APPROVED' AND NEW.approval_state = 'SUPERSEDED')
  ) THEN
    RAISE EXCEPTION 'Invalid item mapping approval transition';
  END IF;
  IF OLD.approval_state <> 'APPROVED' AND NEW.approval_state = 'APPROVED'
    AND (NEW.state <> 'ACTIVE' OR NEW.approved_by IS NULL OR NEW.approved_at IS NULL) THEN
    RAISE EXCEPTION 'An approved item mapping requires owner decision metadata';
  END IF;
  IF OLD.approval_state = 'APPROVED' AND NEW.approval_state = 'SUPERSEDED'
    AND (NEW.state <> 'STOPPED' OR NEW.superseded_by IS NULL) THEN
    RAISE EXCEPTION 'A superseded item mapping must link to its replacement';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER inspection_item_template_mapping_revision_guard
  BEFORE UPDATE ON qc.inspection_item_templates
  FOR EACH ROW EXECUTE FUNCTION qc.guard_inspection_item_template_mapping_revision();
CREATE TRIGGER inspection_item_template_mappings_no_delete
  BEFORE DELETE OR TRUNCATE ON qc.inspection_item_templates
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE FUNCTION qc.validate_inspection_item_template_mapping_source() RETURNS trigger
LANGUAGE plpgsql AS $function$
DECLARE
  pinned_template_id UUID;
  source_approval_state TEXT;
  source_dataset_key TEXT;
  matching_items INTEGER;
BEGIN
  IF NEW.template_version_id IS NOT NULL THEN
    SELECT template_id INTO pinned_template_id FROM qc.inspection_template_versions
      WHERE id = NEW.template_version_id;
    IF pinned_template_id IS NULL OR pinned_template_id <> NEW.template_id THEN
      RAISE EXCEPTION 'Pinned template version does not belong to the mapping template';
    END IF;
  END IF;
  IF NEW.approval_state = 'APPROVED' THEN
    SELECT dataset_key, approval_state INTO source_dataset_key, source_approval_state
      FROM qc.master_data_import_revisions WHERE id = NEW.source_revision_id;
    IF source_dataset_key IS DISTINCT FROM 'item' OR source_approval_state IS DISTINCT FROM 'APPROVED' THEN
      RAISE EXCEPTION 'Mapping requires an owner-approved item source revision';
    END IF;
    SELECT count(*) INTO matching_items FROM qc.master_data_import_revisions revision,
      LATERAL jsonb_array_elements(revision.records) AS items(record)
      WHERE revision.id = NEW.source_revision_id AND items.record->>'item_code' = NEW.item_code;
    IF matching_items <> 1 THEN
      RAISE EXCEPTION 'Item Code must resolve to exactly one row in the approved item source';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM qc.inspection_template_versions version
      JOIN qc.inspection_templates template ON template.id = version.template_id
      JOIN qc.inspection_report_catalog catalog ON catalog.id = template.catalog_id
      WHERE version.id = NEW.template_version_id AND version.state = 'APPROVED'
        AND version.effective_at <= CURRENT_TIMESTAMP AND version.digital_form IS NOT NULL
        AND version.report_revision = catalog.master_revision
        AND template.active AND catalog.catalog_state = 'ACTIVE'
        AND catalog.source_document_status = 'MATCHED'
    ) THEN
      RAISE EXCEPTION 'Mapping requires an exact approved effective template revision';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER inspection_item_template_mapping_source_guard
  BEFORE INSERT OR UPDATE ON qc.inspection_item_templates
  FOR EACH ROW EXECUTE FUNCTION qc.validate_inspection_item_template_mapping_source();

-- Historical rows are retained but fail closed until individually sourced and approved.
CREATE INDEX idx_inspection_item_templates__mapping_review
  ON qc.inspection_item_templates (approval_state, created_at DESC, id DESC);
CREATE UNIQUE INDEX uq_inspection_item_templates__one_approved_item
  ON qc.inspection_item_templates (item_code)
  WHERE state = 'ACTIVE' AND approval_state = 'APPROVED';

CREATE TABLE qc.inspection_item_template_mapping_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  mapping_id UUID NOT NULL REFERENCES qc.inspection_item_templates(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('SUBMITTED', 'OWNER_APPROVED', 'OWNER_REJECTED', 'SUPERSEDED')),
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  owner_authority TEXT CHECK (owner_authority IS NULL OR owner_authority = 'SYSTEM_OWNER'),
  owner_login_identity TEXT CHECK (owner_login_identity IS NULL OR owner_login_identity = 'yazeed'),
  source_revision_id UUID NOT NULL REFERENCES qc.master_data_import_revisions(id) ON DELETE RESTRICT,
  content_sha256 CHAR(64) NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  audit_event_id UUID NOT NULL REFERENCES qc.audit_events(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_inspection_item_template_mapping_command UNIQUE (mapping_id, request_id),
  CONSTRAINT ck_inspection_item_template_mapping_authority CHECK (
    (event_type IN ('OWNER_APPROVED', 'OWNER_REJECTED', 'SUPERSEDED')
      AND owner_authority = 'SYSTEM_OWNER' AND owner_login_identity = 'yazeed')
    OR (event_type = 'SUBMITTED' AND owner_authority IS NULL AND owner_login_identity IS NULL)
  )
);

CREATE INDEX idx_inspection_item_template_mapping_events
  ON qc.inspection_item_template_mapping_events (mapping_id, recorded_at, id);
CREATE TRIGGER inspection_item_template_mapping_events_append_only
  BEFORE UPDATE OR DELETE ON qc.inspection_item_template_mapping_events
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER inspection_item_template_mapping_events_no_truncate
  BEFORE TRUNCATE ON qc.inspection_item_template_mapping_events
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();

COMMENT ON TABLE qc.inspection_item_templates IS
  'Item-to-inspection-template mapping revisions. New mappings remain pending until owner approval pins an approved effective template version and an owner-approved item source revision.';
