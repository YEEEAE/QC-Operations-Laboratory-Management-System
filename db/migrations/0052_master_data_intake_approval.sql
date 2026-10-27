-- DATA-01: staging and approval evidence only; no company values are seeded.
-- Business entities remain absent until their definitions and sources are approved.
CREATE TABLE qc.master_data_import_revisions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  dataset_key TEXT NOT NULL CHECK (dataset_key IN (
    'organization-site', 'organization-department', 'item', 'supplier',
    'equipment', 'method', 'controlled-template'
  )),
  content_sha256 CHAR(64) NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  source_owner TEXT NOT NULL CHECK (length(btrim(source_owner)) > 0),
  source_reference TEXT NOT NULL CHECK (length(btrim(source_reference)) > 0),
  effective_revision TEXT,
  source_approval_reference TEXT,
  adapter_key TEXT,
  source_last_updated DATE,
  header_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  records JSONB NOT NULL CHECK (jsonb_typeof(records) = 'array'),
  preview JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  request_fingerprint CHAR(64) NOT NULL CHECK (request_fingerprint ~ '^[0-9a-f]{64}$'),
  submitted_by UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approval_state TEXT NOT NULL DEFAULT 'PENDING_SOURCE_APPROVAL'
    CHECK (approval_state IN ('PENDING_SOURCE_APPROVAL', 'APPROVED', 'REJECTED')),
  import_state TEXT NOT NULL DEFAULT 'NOT_IMPORTED'
    CHECK (import_state IN ('NOT_IMPORTED', 'IMPORTED')),
  import_request_id TEXT,
  import_fingerprint CHAR(64) CHECK (import_fingerprint IS NULL OR import_fingerprint ~ '^[0-9a-f]{64}$'),
  import_result JSONB,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_master_data_import_request UNIQUE (dataset_key, request_id),
  CONSTRAINT ck_master_data_import_approved_source CHECK (
    approval_state <> 'APPROVED' OR (
      effective_revision IS NOT NULL AND length(btrim(effective_revision)) > 0
      AND source_approval_reference IS NOT NULL AND length(btrim(source_approval_reference)) > 0
    )
  ),
  CONSTRAINT ck_master_data_import_receipt CHECK (
    (import_state = 'NOT_IMPORTED' AND import_request_id IS NULL AND import_fingerprint IS NULL AND import_result IS NULL)
    OR (import_state = 'IMPORTED' AND import_request_id IS NOT NULL AND import_fingerprint IS NOT NULL AND import_result IS NOT NULL)
  )
);

CREATE TABLE qc.master_data_approval_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  revision_id UUID NOT NULL REFERENCES qc.master_data_import_revisions(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('OWNER_APPROVE', 'OWNER_REJECT', 'IMPORT_COMPLETED')),
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  owner_authority TEXT CHECK (owner_authority IS NULL OR owner_authority = 'SYSTEM_OWNER'),
  owner_login_identity TEXT CHECK (owner_login_identity IS NULL OR owner_login_identity = 'yazeed'),
  content_sha256 CHAR(64) NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  audit_event_id UUID REFERENCES qc.audit_events(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  signature_deferred BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_master_data_approval_command UNIQUE (revision_id, request_id),
  CONSTRAINT ck_master_data_approval_authority CHECK (
    (event_type IN ('OWNER_APPROVE', 'OWNER_REJECT') AND owner_authority IS NOT NULL
      AND owner_authority = 'SYSTEM_OWNER' AND owner_login_identity IS NOT NULL
      AND owner_login_identity = 'yazeed' AND signature_deferred = (event_type = 'OWNER_APPROVE')
      AND audit_event_id IS NOT NULL)
    OR (event_type = 'IMPORT_COMPLETED' AND owner_authority IS NULL
      AND owner_login_identity IS NULL AND NOT signature_deferred AND audit_event_id IS NOT NULL)
  )
);

CREATE INDEX idx_master_data_import_revisions_queue
  ON qc.master_data_import_revisions (approval_state, submitted_at DESC, id DESC);
CREATE INDEX idx_master_data_approval_events_revision
  ON qc.master_data_approval_events (revision_id, recorded_at, id);

CREATE TRIGGER master_data_approval_events_append_only
  BEFORE UPDATE OR DELETE ON qc.master_data_approval_events
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER master_data_approval_events_no_truncate
  BEFORE TRUNCATE ON qc.master_data_approval_events
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE FUNCTION qc.guard_master_data_revision_update() RETURNS trigger
LANGUAGE plpgsql AS $function$
BEGIN
  IF NEW.id <> OLD.id OR NEW.dataset_key <> OLD.dataset_key
    OR NEW.content_sha256 <> OLD.content_sha256 OR NEW.source_owner <> OLD.source_owner
    OR NEW.source_reference <> OLD.source_reference OR NEW.header_mapping <> OLD.header_mapping
    OR NEW.records <> OLD.records OR NEW.preview <> OLD.preview
    OR NEW.request_id <> OLD.request_id OR NEW.request_fingerprint <> OLD.request_fingerprint
    OR NEW.submitted_by <> OLD.submitted_by OR NEW.submitted_at <> OLD.submitted_at
    OR NEW.adapter_key IS DISTINCT FROM OLD.adapter_key THEN
    RAISE EXCEPTION 'Master-data revision content and provenance are immutable';
  END IF;
  IF OLD.approval_state <> 'PENDING_SOURCE_APPROVAL' AND (
    NEW.effective_revision IS DISTINCT FROM OLD.effective_revision
    OR NEW.source_approval_reference IS DISTINCT FROM OLD.source_approval_reference
    OR NEW.source_last_updated IS DISTINCT FROM OLD.source_last_updated
  ) THEN
    RAISE EXCEPTION 'Approved master-data source metadata is immutable';
  END IF;
  IF NEW.version <> OLD.version + 1 THEN
    RAISE EXCEPTION 'Master-data revision update requires an exact version increment';
  END IF;
  IF NEW.approval_state <> OLD.approval_state AND NOT (
    OLD.approval_state = 'PENDING_SOURCE_APPROVAL'
    AND NEW.approval_state IN ('APPROVED', 'REJECTED')
  ) THEN
    RAISE EXCEPTION 'Invalid master-data approval transition';
  END IF;
  IF NEW.import_state <> OLD.import_state AND NOT (
    OLD.import_state = 'NOT_IMPORTED' AND NEW.import_state = 'IMPORTED'
    AND OLD.approval_state = 'APPROVED'
  ) THEN
    RAISE EXCEPTION 'Invalid master-data import transition';
  END IF;
  IF NEW.import_state = OLD.import_state AND (
    NEW.import_request_id IS DISTINCT FROM OLD.import_request_id
    OR NEW.import_fingerprint IS DISTINCT FROM OLD.import_fingerprint
    OR NEW.import_result IS DISTINCT FROM OLD.import_result
  ) THEN
    RAISE EXCEPTION 'Master-data import receipt is immutable';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER master_data_import_revisions_guard
  BEFORE UPDATE ON qc.master_data_import_revisions
  FOR EACH ROW EXECUTE FUNCTION qc.guard_master_data_revision_update();
CREATE TRIGGER master_data_import_revisions_no_delete
  BEFORE DELETE OR TRUNCATE ON qc.master_data_import_revisions
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();

COMMENT ON TABLE qc.master_data_import_revisions IS
  'Untrusted, staged source revisions. Approval records scoped internal owner decisions, not formal signatures; importing values requires an approved matching revision and registered adapter.';
