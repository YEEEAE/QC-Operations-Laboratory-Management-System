-- QC-360: controlled template authoring origin and controlled-document bodies.
--
-- Additive and forward-only. No historical row is rewritten and no existing
-- constraint is loosened for the externally transcribed catalogue path.
--
-- Why this migration exists
-- ------------------------
-- 0046 froze a single authoring origin: an inspection template version could
-- only be APPROVED when it was a verbatim transcription of a MATCHED Rev 14
-- catalogue page bound to a MATCHED source-evidence digest. That is correct for
-- source-derived content and it stays unchanged here.
--
-- It is not sufficient for content a QC author writes themselves inside the
-- system. Such content has no externally transcribed catalogue page to match,
-- so `authoring_origin` distinguishes the two cases and the approval guard is
-- duplicated per origin:
--
--   SOURCE_TRANSCRIPTION        - the 0046 evidence chain, byte-for-byte rules.
--   USER_AUTHORED_SPECIFICATION - the controlled evidence is an EFFECTIVE
--                                 controlled document version linked through
--                                 qc.inspection_template_document_sources.
--
-- Neither branch approves anything by itself: approval still requires the
-- existing authorized E-Signature ceremony, review state and item mapping.
--
-- Also added here: the structured body of a controlled document
-- (qc.document_version_sections) plus qc.document_versions.body_hash, so a
-- document version can carry server-stored content instead of only linked
-- files. The body is mutable only while its version is a DRAFT or RETURNED and
-- is append-only after that, matching the existing document lifecycle.

-- 1. Authoring origin --------------------------------------------------------
ALTER TABLE qc.inspection_template_versions
  ADD COLUMN authoring_origin TEXT NOT NULL DEFAULT 'SOURCE_TRANSCRIPTION';

ALTER TABLE qc.inspection_template_versions
  ADD CONSTRAINT ck_inspection_template_versions__authoring_origin
    CHECK (authoring_origin IN ('SOURCE_TRANSCRIPTION', 'USER_AUTHORED_SPECIFICATION'))
    NOT VALID;

-- Existing rows predate the column and are all source transcriptions, which is
-- exactly what the DEFAULT backfilled. Validate now that the backfill is known.
ALTER TABLE qc.inspection_template_versions
  VALIDATE CONSTRAINT ck_inspection_template_versions__authoring_origin;

CREATE INDEX idx_inspection_template_versions__origin_state
  ON qc.inspection_template_versions (authoring_origin, state);

-- 2. Approval guard, origin aware -------------------------------------------
--
-- Preserved verbatim from 0046 for SOURCE_TRANSCRIPTION. `schemaVersion` is
-- still pinned to '1' for transcriptions: a transcription is a digital copy of
-- the paper form and must not gain authoring-only field semantics.
CREATE OR REPLACE FUNCTION qc.enforce_controlled_template_source()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  c qc.inspection_report_catalog;
BEGIN
  -- Approved content is frozen: state may move, content may not.
  IF TG_OP = 'UPDATE' AND (OLD.approved_at IS NOT NULL OR OLD.state = 'APPROVED') AND
    (NEW.id, NEW.template_id, NEW.digital_form, NEW.report_revision,
     NEW.source_evidence_id, NEW.name, NEW.content_hash, NEW.source_document,
     NEW.version_no, NEW.authoring_origin) IS DISTINCT FROM
    (OLD.id, OLD.template_id, OLD.digital_form, OLD.report_revision,
     OLD.source_evidence_id, OLD.name, OLD.content_hash, OLD.source_document,
     OLD.version_no, OLD.authoring_origin)
  THEN
    RAISE EXCEPTION 'APPROVED_TEMPLATE_IMMUTABLE' USING ERRCODE = '23514';
  END IF;

  IF NEW.state = 'APPROVED' AND (TG_OP = 'INSERT' OR OLD.state IS DISTINCT FROM NEW.state) THEN
    IF NEW.authoring_origin = 'SOURCE_TRANSCRIPTION' THEN
      SELECT c1.* INTO c
        FROM qc.inspection_report_catalog c1
        JOIN qc.inspection_templates t ON t.catalog_id = c1.id
       WHERE t.id = NEW.template_id
       FOR SHARE OF c1;
      IF c.id IS NULL
        OR c.catalog_state IS DISTINCT FROM 'ACTIVE'
        OR c.source_document_status IS DISTINCT FROM 'MATCHED'
        OR NEW.report_revision IS DISTINCT FROM c.master_revision
        OR NEW.name IS DISTINCT FROM c.official_title
        OR NEW.digital_form IS NULL
        OR NEW.content_hash IS NULL
        OR NEW.digital_form->>'docCode' IS DISTINCT FROM c.doc_code
        OR NEW.digital_form->>'reportRevision' IS DISTINCT FROM c.master_revision
        OR NEW.digital_form->>'schemaVersion' IS DISTINCT FROM '1'
        OR NOT EXISTS (
             SELECT 1 FROM qc.inspection_report_source_evidence e
              WHERE e.id = NEW.source_evidence_id
                AND e.catalog_id = c.id
                AND e.status = 'MATCHED')
      THEN
        RAISE EXCEPTION 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' USING ERRCODE = '23514';
      END IF;
    ELSE
      -- USER_AUTHORED_SPECIFICATION: no catalogue identity exists, so the
      -- controlled evidence is the EFFECTIVE document version the author bound
      -- to this draft. The schema may be v1 (checklist shape) or v2 (authoring
      -- field semantics). Every comparison is null-safe by construction:
      -- COALESCE on the JSON key so a missing schemaVersion can never satisfy
      -- the guard by evaluating to NULL, and IS DISTINCT FROM elsewhere.
      IF NEW.digital_form IS NULL
        OR NEW.content_hash IS NULL
        OR NEW.digital_form->>'reportRevision' IS DISTINCT FROM NEW.report_revision
        OR COALESCE(NEW.digital_form->>'schemaVersion', '') NOT IN ('1', '2')
        OR NEW.report_revision IS NULL
        OR btrim(NEW.report_revision) = ''
        OR NOT EXISTS (
             SELECT 1
               FROM qc.inspection_template_document_sources s
               JOIN qc.document_versions d ON d.id = s.document_version_id
              WHERE s.template_version_id = NEW.id
                AND d.state = 'EFFECTIVE')
      THEN
        RAISE EXCEPTION 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END
$$;

-- Trigger definition is unchanged from 0046; the function body is replaced in
-- place so no trigger is dropped and no window of unguarded writes exists.

-- 3. Execution guard, origin aware ------------------------------------------
--
-- Every pre-existing condition is preserved. The catalogue/evidence block is
-- skipped only for an authored specification, which is instead required to
-- carry an EFFECTIVE controlled document link.
CREATE OR REPLACE FUNCTION qc.enforce_controlled_inspection_origin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  r qc.receiving_items;
  v qc.inspection_template_versions;
  c qc.inspection_report_catalog;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended((SELECT item_code FROM qc.receiving_items WHERE id = NEW.receiving_item_id), 0));
  SELECT * INTO r FROM qc.receiving_items WHERE id = NEW.receiving_item_id FOR UPDATE;
  SELECT * INTO v FROM qc.inspection_template_versions WHERE id = NEW.template_version_id FOR SHARE;

  IF r.id IS NULL
    OR r.workflow_state NOT IN ('READY_FOR_INSPECTION', 'UNDER_INSPECTION')
    OR v.id IS NULL
    OR v.state IS DISTINCT FROM 'APPROVED'
    OR v.approved_at IS NULL
    OR v.effective_at IS NULL
    OR v.effective_at > CURRENT_TIMESTAMP
    OR v.digital_form IS NULL
    OR v.report_revision IS NULL
    OR btrim(v.report_revision) = ''
    OR v.report_revision IS DISTINCT FROM COALESCE(v.digital_form->>'reportRevision', '')
    OR COALESCE(v.digital_form->>'schemaVersion', '') NOT IN ('1', '2')
    OR NOT EXISTS (SELECT 1 FROM qc.inspection_templates t WHERE t.id = v.template_id AND t.active = true)
    OR NOT EXISTS (
         SELECT 1 FROM qc.inspection_item_templates m
          WHERE m.template_id = v.template_id
            AND m.item_code = r.item_code
            AND m.state = 'ACTIVE'
            AND m.effective_from <= CURRENT_DATE
            AND (m.effective_to IS NULL OR m.effective_to >= CURRENT_DATE))
    OR EXISTS (
         SELECT 1 FROM qc.inspection_template_versions newer
          WHERE newer.template_id = v.template_id
            AND newer.state = 'APPROVED'
            AND newer.effective_at <= CURRENT_TIMESTAMP
            AND (newer.effective_at, newer.created_at, newer.id) > (v.effective_at, v.created_at, v.id))
  THEN
    RAISE EXCEPTION 'CONTROLLED_INSPECTION_SOURCE_REQUIRED' USING ERRCODE = '23514';
  END IF;

  IF v.authoring_origin = 'SOURCE_TRANSCRIPTION' THEN
    SELECT c1.* INTO c
      FROM qc.inspection_report_catalog c1
      JOIN qc.inspection_templates t ON t.catalog_id = c1.id
     WHERE t.id = v.template_id
     FOR SHARE OF c1;
    IF c.id IS NULL
      OR c.catalog_state IS DISTINCT FROM 'ACTIVE'
      OR c.source_document_status IS DISTINCT FROM 'MATCHED'
      OR v.report_revision IS DISTINCT FROM c.master_revision
      OR NOT EXISTS (
           SELECT 1 FROM qc.inspection_report_source_evidence e
            WHERE e.id = v.source_evidence_id
              AND e.catalog_id = c.id
              AND e.status = 'MATCHED')
    THEN
      RAISE EXCEPTION 'CONTROLLED_INSPECTION_SOURCE_REQUIRED' USING ERRCODE = '23514';
    END IF;
  ELSE
    IF NOT EXISTS (
         SELECT 1
           FROM qc.inspection_template_document_sources s
           JOIN qc.document_versions d ON d.id = s.document_version_id
          WHERE s.template_version_id = v.id
            AND d.state = 'EFFECTIVE')
    THEN
      RAISE EXCEPTION 'CONTROLLED_INSPECTION_SOURCE_REQUIRED' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF EXISTS (
       SELECT 1 FROM qc.inspection_reports prior
        WHERE prior.receiving_item_id = r.id
          AND prior.state IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_QCM_APPROVAL'))
  THEN
    RAISE EXCEPTION 'INSPECTION_ALREADY_IN_FLIGHT' USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END
$$;

-- 4. Controlled document body ------------------------------------------------
--
-- Structured blocks, not a single opaque blob, so a revision can be diffed and
-- compared. body_hash on the version is the server-computed digest of the
-- ordered block set and feeds content_hash derivation.
CREATE TABLE qc.document_version_sections (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  document_version_id UUID NOT NULL,
  block_type TEXT NOT NULL,
  level INTEGER,
  heading_text TEXT,
  body_text TEXT,
  table_payload JSONB,
  reference_key TEXT,
  position INTEGER NOT NULL CHECK (position > 0),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_document_version_sections__position
    UNIQUE (document_version_id, position),
  CONSTRAINT ck_document_version_sections__block_type
    CHECK (block_type IN ('HEADING', 'PARAGRAPH', 'TABLE', 'CHECKLIST', 'IMAGE_REF', 'RELATED_DOCUMENT')),
  CONSTRAINT ck_document_version_sections__level
    CHECK (level IS NULL OR (level >= 1 AND level <= 6)),
  CONSTRAINT ck_document_version_sections__content_present
    CHECK (heading_text IS NOT NULL OR body_text IS NOT NULL OR table_payload IS NOT NULL),
  CONSTRAINT ck_document_version_sections__heading_needs_level
    CHECK (block_type <> 'HEADING' OR (heading_text IS NOT NULL AND level IS NOT NULL)),
  CONSTRAINT ck_document_version_sections__table_needs_payload
    CHECK (block_type NOT IN ('TABLE', 'CHECKLIST') OR table_payload IS NOT NULL),
  CONSTRAINT fk_document_version_sections__version
    FOREIGN KEY (document_version_id) REFERENCES qc.document_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_document_version_sections__created_by
    FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_document_version_sections__version
  ON qc.document_version_sections (document_version_id);

ALTER TABLE qc.document_versions ADD COLUMN body_hash TEXT;

ALTER TABLE qc.document_versions
  ADD CONSTRAINT ck_document_versions__body_hash_shape
    CHECK (body_hash IS NULL OR body_hash ~ '^[0-9a-f]{64}$')
    NOT VALID;

-- The body belongs to an authoring draft. Once the revision leaves draft it is
-- controlled history: no block may be inserted, edited, reordered or removed.
CREATE OR REPLACE FUNCTION qc.guard_document_version_section_mutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  version_state TEXT;
  target_version UUID;
BEGIN
  target_version := CASE WHEN TG_OP = 'DELETE' THEN OLD.document_version_id ELSE NEW.document_version_id END;
  SELECT state INTO version_state
    FROM qc.document_versions
   WHERE id = target_version
   FOR KEY SHARE;

  IF version_state IS NULL OR version_state NOT IN ('DRAFT', 'RETURNED') THEN
    RAISE EXCEPTION 'controlled document body is immutable outside draft'
      USING ERRCODE = '55006';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER document_version_sections_mutability
  BEFORE INSERT OR UPDATE OR DELETE ON qc.document_version_sections
  FOR EACH ROW EXECUTE FUNCTION qc.guard_document_version_section_mutability();

CREATE TRIGGER document_version_sections_truncate_guard
  BEFORE TRUNCATE ON qc.document_version_sections
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
