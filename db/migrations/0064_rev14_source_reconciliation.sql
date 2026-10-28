-- TMP-01: versioned, evidence-backed Rev14 source reconciliation.
-- Additive and forward-only. Source evidence rows and issued inspection
-- snapshots are never rewritten; this records the owner decision separately.

ALTER TABLE qc.inspection_report_catalog
  ADD COLUMN source_resolution_version BIGINT NOT NULL DEFAULT 0
    CHECK (source_resolution_version >= 0);

CREATE TABLE qc.inspection_report_source_resolutions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  catalog_id UUID NOT NULL REFERENCES qc.inspection_report_catalog(id) ON DELETE RESTRICT,
  source_evidence_id UUID NOT NULL REFERENCES qc.inspection_report_source_evidence(id) ON DELETE RESTRICT,
  resolution_version BIGINT NOT NULL CHECK (resolution_version > 0),
  previous_source_status TEXT NOT NULL CHECK (previous_source_status IN ('SOURCE_TITLE_CONFLICT','SOURCE_REVISION_CONFLICT')),
  resolution_state TEXT NOT NULL CHECK (resolution_state = 'MATCHED_TO_CATALOG_IDENTITY'),
  evidence_source_file TEXT NOT NULL,
  evidence_source_page INTEGER,
  evidence_source_sha256 TEXT NOT NULL CHECK (evidence_source_sha256 ~ '^[a-f0-9]{64}$'),
  evidence_content_sha256 TEXT NOT NULL CHECK (evidence_content_sha256 ~ '^[a-f0-9]{64}$'),
  reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 2000),
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  owner_authority TEXT NOT NULL CHECK (owner_authority = 'SYSTEM_OWNER'),
  owner_login_identity TEXT NOT NULL CHECK (owner_login_identity = 'yazeed'),
  signature_deferred BOOLEAN NOT NULL DEFAULT TRUE CHECK (signature_deferred = TRUE),
  request_id TEXT NOT NULL UNIQUE,
  audit_event_id UUID NOT NULL UNIQUE REFERENCES qc.audit_events(id) ON DELETE RESTRICT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (catalog_id, resolution_version),
  CONSTRAINT ck_source_resolution_evidence_page CHECK (evidence_source_page IS NULL OR evidence_source_page > 0)
);

-- Missing or unreadable source material creates a pending evidence request,
-- never a fabricated MATCHED state or a template-activation exception.
CREATE TABLE qc.inspection_report_source_evidence_requests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  catalog_id UUID NOT NULL REFERENCES qc.inspection_report_catalog(id) ON DELETE RESTRICT,
  source_evidence_id UUID REFERENCES qc.inspection_report_source_evidence(id) ON DELETE RESTRICT,
  expected_resolution_version BIGINT NOT NULL CHECK (expected_resolution_version >= 0),
  requested_source_status TEXT NOT NULL CHECK (requested_source_status IN ('NOT_DIGITIZED','NEEDS_SOURCE_RESCAN')),
  request_state TEXT NOT NULL DEFAULT 'PENDING_SOURCE_EVIDENCE'
    CHECK (request_state = 'PENDING_SOURCE_EVIDENCE'),
  reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 2000),
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  request_id TEXT NOT NULL UNIQUE,
  audit_event_id UUID NOT NULL UNIQUE REFERENCES qc.audit_events(id) ON DELETE RESTRICT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_inspection_source_evidence_requests__pending_catalog
  ON qc.inspection_report_source_evidence_requests (catalog_id)
  WHERE request_state = 'PENDING_SOURCE_EVIDENCE';
CREATE INDEX idx_inspection_source_evidence_requests__catalog_history
  ON qc.inspection_report_source_evidence_requests (catalog_id, recorded_at DESC);

CREATE INDEX idx_inspection_source_resolutions__catalog_latest
  ON qc.inspection_report_source_resolutions (catalog_id, resolution_version DESC);

CREATE FUNCTION qc.guard_inspection_source_resolution_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  c qc.inspection_report_catalog;
  e qc.inspection_report_source_evidence;
BEGIN
  SELECT * INTO c FROM qc.inspection_report_catalog WHERE id = NEW.catalog_id FOR UPDATE;
  SELECT * INTO e FROM qc.inspection_report_source_evidence WHERE id = NEW.source_evidence_id FOR SHARE;
  IF c.id IS NULL OR e.id IS NULL
    OR c.source_resolution_version + 1 <> NEW.resolution_version
    OR c.source_document_status IS DISTINCT FROM NEW.previous_source_status
    OR c.catalog_state IS DISTINCT FROM 'SOURCE_CONFLICT'
    OR e.catalog_id IS DISTINCT FROM c.id
    OR e.status IS DISTINCT FROM NEW.previous_source_status
    OR e.source_file IS DISTINCT FROM NEW.evidence_source_file
    OR e.source_page IS DISTINCT FROM NEW.evidence_source_page
    OR e.source_sha256 IS DISTINCT FROM NEW.evidence_source_sha256
    OR e.content_sha256 IS DISTINCT FROM NEW.evidence_content_sha256
    OR NOT EXISTS (
      SELECT 1 FROM qc.audit_events a
       WHERE a.id = NEW.audit_event_id
         AND a.actor_id = NEW.actor_id
         AND a.subject_type = 'INSPECTION_REPORT_CATALOG'
         AND a.subject_id = NEW.catalog_id::TEXT
         AND a.action = 'SOURCE_CONFLICT_RESOLVED'
         AND a.request_id = NEW.request_id
         AND a.reason = NEW.reason
         AND a.new_state = 'MATCHED'
         AND a.payload->>'scope' = 'INTERNAL_SOURCE_MAPPING'
         AND a.payload->>'signatureDeferred' = 'true'
    )
    OR NOT EXISTS (
      SELECT 1
        FROM qc.users u
        JOIN qc.user_roles ur ON ur.user_id = u.id
        JOIN qc.roles r ON r.id = ur.role_id
       WHERE u.id = NEW.actor_id
         AND u.login_identity = 'yazeed'
         AND u.account_state = 'ACTIVE'
         AND r.code = 'SYSTEM_OWNER'
        AND r.active = TRUE
        AND ur.revoked_at IS NULL
        AND (ur.valid_from IS NULL OR ur.valid_from <= CURRENT_TIMESTAMP)
        AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
    )
  THEN
    RAISE EXCEPTION 'SOURCE_RESOLUTION_EVIDENCE_OR_AUTHORITY_REQUIRED' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER inspection_source_resolution_insert_guard
  BEFORE INSERT ON qc.inspection_report_source_resolutions
  FOR EACH ROW EXECUTE FUNCTION qc.guard_inspection_source_resolution_insert();

CREATE TRIGGER inspection_source_resolutions_append_only
  BEFORE UPDATE OR DELETE ON qc.inspection_report_source_resolutions
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER inspection_source_resolutions_no_truncate
  BEFORE TRUNCATE ON qc.inspection_report_source_resolutions
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER inspection_source_evidence_requests_append_only
  BEFORE UPDATE OR DELETE ON qc.inspection_report_source_evidence_requests
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();
CREATE TRIGGER inspection_source_evidence_requests_no_truncate
  BEFORE TRUNCATE ON qc.inspection_report_source_evidence_requests
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE FUNCTION qc.guard_inspection_source_evidence_request_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c qc.inspection_report_catalog;
BEGIN
  SELECT * INTO c FROM qc.inspection_report_catalog WHERE id = NEW.catalog_id FOR SHARE;
  IF c.id IS NULL
    OR c.source_resolution_version IS DISTINCT FROM NEW.expected_resolution_version
    OR c.source_document_status NOT IN ('NOT_DIGITIZED','NEEDS_SOURCE_RESCAN')
    OR c.source_document_status IS DISTINCT FROM NEW.requested_source_status
    OR (NEW.source_evidence_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM qc.inspection_report_source_evidence e
       WHERE e.id = NEW.source_evidence_id AND e.catalog_id = c.id
    ))
    OR NOT EXISTS (
      SELECT 1 FROM qc.audit_events a
       WHERE a.id = NEW.audit_event_id
         AND a.actor_id = NEW.actor_id
         AND a.subject_type = 'INSPECTION_REPORT_CATALOG'
         AND a.subject_id = NEW.catalog_id::TEXT
         AND a.action = 'SOURCE_EVIDENCE_REQUESTED'
         AND a.request_id = NEW.request_id
         AND a.reason = NEW.reason
         AND a.new_state = 'PENDING_SOURCE_EVIDENCE'
    )
  THEN RAISE EXCEPTION 'SOURCE_EVIDENCE_REQUEST_INVALID' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER inspection_source_evidence_request_insert_guard
  BEFORE INSERT ON qc.inspection_report_source_evidence_requests
  FOR EACH ROW EXECUTE FUNCTION qc.guard_inspection_source_evidence_request_insert();

CREATE FUNCTION qc.guard_inspection_catalog_source_mapping()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.source_document_status, NEW.catalog_state) IS DISTINCT FROM
     (OLD.source_document_status, OLD.catalog_state)
     AND NEW.source_document_status = 'MATCHED'
     AND NOT EXISTS (
       SELECT 1
         FROM qc.inspection_report_source_evidence e
        WHERE e.catalog_id = NEW.id
          AND e.status = 'MATCHED'
     )
     AND NOT EXISTS (
       SELECT 1
         FROM qc.inspection_report_source_resolutions r
        WHERE r.catalog_id = NEW.id
          AND r.resolution_version = NEW.source_resolution_version
          AND r.resolution_state = 'MATCHED_TO_CATALOG_IDENTITY'
     )
  THEN
    RAISE EXCEPTION 'SOURCE_RESOLUTION_REQUIRED' USING ERRCODE = '23514';
  END IF;
  IF NEW.source_resolution_version <> OLD.source_resolution_version
     AND NOT EXISTS (
       SELECT 1 FROM qc.inspection_report_source_resolutions r
        WHERE r.catalog_id = NEW.id
          AND r.resolution_version = NEW.source_resolution_version
          AND r.resolution_state = 'MATCHED_TO_CATALOG_IDENTITY'
     )
  THEN
    RAISE EXCEPTION 'SOURCE_RESOLUTION_VERSION_REQUIRED' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER inspection_catalog_source_mapping_guard
  BEFORE UPDATE ON qc.inspection_report_catalog
  FOR EACH ROW EXECUTE FUNCTION qc.guard_inspection_catalog_source_mapping();

-- Keep the source-derived form gate strict. A conflicting evidence row may be
-- used only when the current catalog version has an explicit owner resolution
-- pinned to the same immutable file and content digests.
CREATE OR REPLACE FUNCTION qc.enforce_controlled_template_source()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c qc.inspection_report_catalog;
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.approved_at IS NOT NULL OR OLD.state = 'APPROVED') AND
    (NEW.id, NEW.template_id, NEW.digital_form, NEW.report_revision,
     NEW.source_evidence_id, NEW.name, NEW.content_hash, NEW.source_document,
     NEW.version_no, NEW.authoring_origin) IS DISTINCT FROM
    (OLD.id, OLD.template_id, OLD.digital_form, OLD.report_revision,
     OLD.source_evidence_id, OLD.name, OLD.content_hash, OLD.source_document,
     OLD.version_no, OLD.authoring_origin)
  THEN RAISE EXCEPTION 'APPROVED_TEMPLATE_IMMUTABLE' USING ERRCODE = '23514'; END IF;

  -- Any template tied to a catalog identity remains blocked while that
  -- identity is conflicting or otherwise unresolved, regardless of origin.
  SELECT c1.* INTO c
    FROM qc.inspection_report_catalog c1
    JOIN qc.inspection_templates t ON t.catalog_id = c1.id
   WHERE t.id = NEW.template_id FOR SHARE OF c1;
  IF FOUND AND (c.catalog_state IS DISTINCT FROM 'ACTIVE'
    OR c.source_document_status IS DISTINCT FROM 'MATCHED')
  THEN RAISE EXCEPTION 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' USING ERRCODE = '23514'; END IF;

  IF NEW.state = 'APPROVED' AND (TG_OP = 'INSERT' OR OLD.state IS DISTINCT FROM NEW.state) THEN
    IF NEW.authoring_origin = 'SOURCE_TRANSCRIPTION' THEN
      SELECT c1.* INTO c
        FROM qc.inspection_report_catalog c1
        JOIN qc.inspection_templates t ON t.catalog_id = c1.id
       WHERE t.id = NEW.template_id FOR SHARE OF c1;
      IF c.id IS NULL OR c.catalog_state IS DISTINCT FROM 'ACTIVE'
        OR c.source_document_status IS DISTINCT FROM 'MATCHED'
        OR NEW.report_revision IS DISTINCT FROM c.master_revision
        OR NEW.name IS DISTINCT FROM c.official_title
        OR NEW.digital_form IS NULL OR NEW.content_hash IS NULL
        OR NEW.digital_form->>'docCode' IS DISTINCT FROM c.doc_code
        OR NEW.digital_form->>'reportRevision' IS DISTINCT FROM c.master_revision
        OR NEW.digital_form->>'schemaVersion' IS DISTINCT FROM '1'
        OR NOT EXISTS (
          SELECT 1 FROM qc.inspection_report_source_evidence e
           WHERE e.id = NEW.source_evidence_id AND e.catalog_id = c.id
             AND (
               e.status = 'MATCHED'
               OR EXISTS (
                 SELECT 1 FROM qc.inspection_report_source_resolutions r
                  WHERE r.catalog_id = c.id AND r.source_evidence_id = e.id
                    AND r.resolution_version = c.source_resolution_version
                    AND r.resolution_state = 'MATCHED_TO_CATALOG_IDENTITY'
                    AND r.evidence_source_sha256 = e.source_sha256
                    AND r.evidence_content_sha256 = e.content_sha256
               )
             )
        )
      THEN RAISE EXCEPTION 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' USING ERRCODE = '23514'; END IF;
    ELSE
      IF NEW.digital_form IS NULL OR NEW.content_hash IS NULL
        OR NEW.digital_form->>'reportRevision' IS DISTINCT FROM NEW.report_revision
        OR COALESCE(NEW.digital_form->>'schemaVersion', '') NOT IN ('1', '2')
        OR NEW.report_revision IS NULL OR btrim(NEW.report_revision) = ''
        OR NOT EXISTS (
          SELECT 1 FROM qc.inspection_template_document_sources s
          JOIN qc.document_versions d ON d.id = s.document_version_id
          WHERE s.template_version_id = NEW.id AND d.state = 'EFFECTIVE'
        )
      THEN RAISE EXCEPTION 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' USING ERRCODE = '23514'; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION qc.enforce_controlled_inspection_origin()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r qc.receiving_items; v qc.inspection_template_versions; c qc.inspection_report_catalog;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended((SELECT item_code FROM qc.receiving_items WHERE id = NEW.receiving_item_id), 0));
  SELECT * INTO r FROM qc.receiving_items WHERE id = NEW.receiving_item_id FOR UPDATE;
  SELECT * INTO v FROM qc.inspection_template_versions WHERE id = NEW.template_version_id FOR SHARE;
  IF r.id IS NULL OR r.workflow_state NOT IN ('READY_FOR_INSPECTION','UNDER_INSPECTION')
    OR v.id IS NULL OR v.state IS DISTINCT FROM 'APPROVED' OR v.approved_at IS NULL
    OR v.effective_at IS NULL OR v.effective_at > CURRENT_TIMESTAMP
    OR v.digital_form IS NULL OR v.report_revision IS NULL OR btrim(v.report_revision) = ''
    OR v.report_revision IS DISTINCT FROM COALESCE(v.digital_form->>'reportRevision','')
    OR COALESCE(v.digital_form->>'schemaVersion','') NOT IN ('1','2')
    OR NOT EXISTS (SELECT 1 FROM qc.inspection_templates t WHERE t.id = v.template_id AND t.active = TRUE)
    OR NOT EXISTS (
      SELECT 1 FROM qc.inspection_item_templates m WHERE m.template_id = v.template_id
       AND m.item_code = r.item_code AND m.state = 'ACTIVE'
       AND m.effective_from <= CURRENT_DATE AND (m.effective_to IS NULL OR m.effective_to >= CURRENT_DATE)
    )
    OR EXISTS (
      SELECT 1 FROM qc.inspection_template_versions newer WHERE newer.template_id = v.template_id
       AND newer.state = 'APPROVED' AND newer.effective_at <= CURRENT_TIMESTAMP
       AND (newer.effective_at,newer.created_at,newer.id) > (v.effective_at,v.created_at,v.id)
    )
  THEN RAISE EXCEPTION 'CONTROLLED_INSPECTION_SOURCE_REQUIRED' USING ERRCODE = '23514'; END IF;

  -- Do not permit a catalog-linked user-authored specification to bypass a
  -- source conflict merely because it has a separate controlled document.
  SELECT c1.* INTO c FROM qc.inspection_report_catalog c1
    JOIN qc.inspection_templates t ON t.catalog_id = c1.id
   WHERE t.id = v.template_id FOR SHARE OF c1;
  IF FOUND AND (c.catalog_state IS DISTINCT FROM 'ACTIVE'
    OR c.source_document_status IS DISTINCT FROM 'MATCHED')
  THEN RAISE EXCEPTION 'CONTROLLED_INSPECTION_SOURCE_REQUIRED' USING ERRCODE = '23514'; END IF;

  IF v.authoring_origin = 'SOURCE_TRANSCRIPTION' THEN
    SELECT c1.* INTO c FROM qc.inspection_report_catalog c1
      JOIN qc.inspection_templates t ON t.catalog_id = c1.id
     WHERE t.id = v.template_id FOR SHARE OF c1;
    IF c.id IS NULL OR c.catalog_state IS DISTINCT FROM 'ACTIVE'
      OR c.source_document_status IS DISTINCT FROM 'MATCHED'
      OR v.report_revision IS DISTINCT FROM c.master_revision
      OR NOT EXISTS (
        SELECT 1 FROM qc.inspection_report_source_evidence e
         WHERE e.id = v.source_evidence_id AND e.catalog_id = c.id
           AND (e.status = 'MATCHED' OR EXISTS (
             SELECT 1 FROM qc.inspection_report_source_resolutions r
              WHERE r.catalog_id = c.id AND r.source_evidence_id = e.id
                AND r.resolution_version = c.source_resolution_version
                AND r.resolution_state = 'MATCHED_TO_CATALOG_IDENTITY'
                AND r.evidence_source_sha256 = e.source_sha256
                AND r.evidence_content_sha256 = e.content_sha256
           ))
      )
    THEN RAISE EXCEPTION 'CONTROLLED_INSPECTION_SOURCE_REQUIRED' USING ERRCODE = '23514'; END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM qc.inspection_template_document_sources s
      JOIN qc.document_versions d ON d.id = s.document_version_id
       WHERE s.template_version_id = v.id AND d.state = 'EFFECTIVE'
    )
    THEN RAISE EXCEPTION 'CONTROLLED_INSPECTION_SOURCE_REQUIRED' USING ERRCODE = '23514'; END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM qc.inspection_reports prior WHERE prior.receiving_item_id = r.id
    AND prior.state IN ('DRAFT','SUBMITTED','UNDER_REVIEW','PENDING_QCM_APPROVAL'))
  THEN RAISE EXCEPTION 'INSPECTION_ALREADY_IN_FLIGHT' USING ERRCODE = '23505'; END IF;
  RETURN NEW;
END $$;

-- An item mapping cannot be activated unless it pins an approved, effective
-- template version whose catalog identity is resolved. This closes the
-- direct mapping-activation path as well as inspection execution.
CREATE FUNCTION qc.guard_inspection_item_template_activation_source()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.state = 'ACTIVE' OR NEW.approval_state = 'APPROVED' THEN
    IF NOT EXISTS (
      SELECT 1
        FROM qc.inspection_template_versions v
        JOIN qc.inspection_templates t ON t.id = v.template_id
        JOIN qc.inspection_report_catalog c ON c.id = t.catalog_id
       WHERE v.id = NEW.template_version_id
         AND v.template_id = NEW.template_id
         AND v.state = 'APPROVED' AND v.approved_at IS NOT NULL
         AND v.effective_at IS NOT NULL AND v.effective_at <= CURRENT_TIMESTAMP
         AND v.digital_form IS NOT NULL
         AND v.report_revision = c.master_revision
         AND t.active = TRUE
         AND c.catalog_state = 'ACTIVE'
         AND c.source_document_status = 'MATCHED'
         AND (v.authoring_origin = 'SOURCE_TRANSCRIPTION' OR EXISTS (
           SELECT 1 FROM qc.inspection_template_document_sources s
           JOIN qc.document_versions d ON d.id = s.document_version_id
           WHERE s.template_version_id = v.id AND d.state = 'EFFECTIVE'
         ))
    ) THEN RAISE EXCEPTION 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER inspection_item_template_activation_source_guard
  BEFORE INSERT OR UPDATE ON qc.inspection_item_templates
  FOR EACH ROW EXECUTE FUNCTION qc.guard_inspection_item_template_activation_source();
