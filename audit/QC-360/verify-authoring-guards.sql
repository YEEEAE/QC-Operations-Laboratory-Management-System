-- QC-360 verification: authoring-origin guards, approved-content immutability,
-- and controlled document body mutability. Runs against the migrated
-- disposable PostgreSQL 18 cluster. Read/write only inside that cluster.
\set ON_ERROR_STOP on
\pset pager off

BEGIN;

INSERT INTO qc.users (id, login_identity, display_name, password_hash, account_state, must_change_password, version)
VALUES ('01900000-0000-7000-8000-0000000f0001', 'qc360-verifier', 'QC360 verifier', 'x', 'ACTIVE', false, 1);

INSERT INTO qc.files (id, original_filename, storage_key, storage_provider, mime_type, extension, size_bytes, sha256, uploaded_by, state)
VALUES ('01900000-0000-7000-8000-0000000f0010', 'SOP-FRS-900.pdf', 'qc360/sop.pdf', 'LOCAL', 'application/pdf', 'pdf', 12,
        repeat('a', 64), '01900000-0000-7000-8000-0000000f0001', 'ACTIVE');

INSERT INTO qc.document_identities (id, document_no, document_type, title, active, created_by, version)
VALUES ('01900000-0000-7000-8000-0000000f0020', 'SOP-FRS-900', 'SOP', 'Authored inspection procedure', true,
        '01900000-0000-7000-8000-0000000f0001', 1);

INSERT INTO qc.document_versions (id, document_id, revision, state, content_hash, source_binding_verified, created_by, version)
VALUES ('01900000-0000-7000-8000-0000000f0030', '01900000-0000-7000-8000-0000000f0020', 'D0.1', 'DRAFT',
        repeat('b', 64), true, '01900000-0000-7000-8000-0000000f0001', 1);

INSERT INTO qc.document_version_files (document_version_id, file_id, file_role, linked_by)
VALUES ('01900000-0000-7000-8000-0000000f0030', '01900000-0000-7000-8000-0000000f0010', 'SOURCE', '01900000-0000-7000-8000-0000000f0001');

UPDATE qc.document_versions SET state = 'EFFECTIVE' WHERE id = '01900000-0000-7000-8000-0000000f0030';

-- An authored template identity with no catalogue row.
INSERT INTO qc.inspection_templates (id, catalog_id, template_code, name, active, created_by, version)
VALUES ('01900000-0000-7000-8000-0000000f0040', NULL, 'QC-AUTH-900', 'Authored specimen inspection', true,
        '01900000-0000-7000-8000-0000000f0001', 1);

-- Guard 1: an authored version cannot be approved without a bound effective document.
INSERT INTO qc.inspection_template_versions (id, template_id, version_no, state, name, created_by, content_hash, digital_form, report_revision, authoring_origin, version)
VALUES ('01900000-0000-7000-8000-0000000f0050', '01900000-0000-7000-8000-0000000f0040', '1', 'DRAFT',
        'Authored specimen inspection', '01900000-0000-7000-8000-0000000f0001', repeat('c', 64),
        '{"schemaVersion":2,"docCode":"QC-AUTH-900","reportRevision":"1","sourceTitle":"Authored specimen inspection","sourceDate":null,"headerFields":[],"sections":[],"aqlFields":[],"resultVocabulary":"PASS_FAIL_REMARK_NA","finalDisposition":[],"reviewResponsibilities":[]}'::jsonb,
        '1', 'USER_AUTHORED_SPECIFICATION', 1);

DO $$
BEGIN
  BEGIN
    UPDATE qc.inspection_template_versions SET state = 'APPROVED' WHERE id = '01900000-0000-7000-8000-0000000f0050';
    RAISE EXCEPTION 'VERIFY FAIL: authored approval without a bound document was allowed';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM <> 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' THEN RAISE; END IF;
    RAISE NOTICE 'PASS guard-1: authored approval without effective document rejected';
  END;
END $$;

-- Guard 2: an unsupported schema version is rejected even with a document bound.
INSERT INTO qc.inspection_template_document_sources (template_version_id, document_version_id, usage_type, linked_by)
VALUES ('01900000-0000-7000-8000-0000000f0050', '01900000-0000-7000-8000-0000000f0030', 'SPECIFICATION', '01900000-0000-7000-8000-0000000f0001');

UPDATE qc.inspection_template_versions
   SET digital_form = digital_form || '{"schemaVersion":3}'::jsonb
 WHERE id = '01900000-0000-7000-8000-0000000f0050';

DO $$
BEGIN
  BEGIN
    UPDATE qc.inspection_template_versions SET state = 'APPROVED' WHERE id = '01900000-0000-7000-8000-0000000f0050';
    RAISE EXCEPTION 'VERIFY FAIL: schemaVersion 3 was approved';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM <> 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' THEN RAISE; END IF;
    RAISE NOTICE 'PASS guard-2: unsupported schemaVersion rejected';
  END;
END $$;

-- Guard 3: the supported authored path approves successfully.
UPDATE qc.inspection_template_versions
   SET digital_form = digital_form || '{"schemaVersion":2}'::jsonb
 WHERE id = '01900000-0000-7000-8000-0000000f0050';

UPDATE qc.inspection_template_versions SET state = 'APPROVED', approved_at = now(), approved_by = '01900000-0000-7000-8000-0000000f0001' WHERE id = '01900000-0000-7000-8000-0000000f0050';

DO $$
DECLARE s TEXT;
BEGIN
  SELECT state INTO s FROM qc.inspection_template_versions WHERE id = '01900000-0000-7000-8000-0000000f0050';
  IF s <> 'APPROVED' THEN RAISE EXCEPTION 'VERIFY FAIL: authored approval did not commit'; END IF;
  RAISE NOTICE 'PASS guard-3: authored approval with effective document commits';
END $$;

-- Guard 4: approved content is immutable, including the authoring origin.
DO $$
BEGIN
  BEGIN
    UPDATE qc.inspection_template_versions SET authoring_origin = 'SOURCE_TRANSCRIPTION' WHERE id = '01900000-0000-7000-8000-0000000f0050';
    RAISE EXCEPTION 'VERIFY FAIL: approved authoring_origin was mutable';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM <> 'APPROVED_TEMPLATE_IMMUTABLE' THEN RAISE; END IF;
    RAISE NOTICE 'PASS guard-4: approved authoring_origin is immutable';
  END;
END $$;

-- Guard 5: a source transcription still requires the 0046 evidence chain, even
-- when it targets an ACTIVE catalogue row that carries a source conflict.
INSERT INTO qc.inspection_templates (id, catalog_id, template_code, name, active, created_by, version)
SELECT '01900000-0000-7000-8000-0000000f0045', c.id, c.doc_code, c.official_title, true,
       '01900000-0000-7000-8000-0000000f0001', 1
  FROM qc.inspection_report_catalog c
 WHERE c.doc_code = 'F-823-T102';

INSERT INTO qc.inspection_template_versions (id, template_id, version_no, state, name, created_by, content_hash, digital_form, report_revision, authoring_origin, version)
VALUES ('01900000-0000-7000-8000-0000000f0060', '01900000-0000-7000-8000-0000000f0045',
        '4', 'DRAFT', 'Inspection & Test Report for Needle Veress', '01900000-0000-7000-8000-0000000f0001', repeat('d', 64),
        '{"schemaVersion":1,"docCode":"F-823-T102","reportRevision":"4","sourceTitle":"Inspection & Test Report for Needle Veress","sourceDate":null,"headerFields":[],"sections":[],"aqlFields":[],"resultVocabulary":"PASS_FAIL_REMARK_NA","finalDisposition":[],"reviewResponsibilities":[]}'::jsonb,
        '4', 'SOURCE_TRANSCRIPTION', 1);

DO $$
BEGIN
  -- Path A: revision mismatch against the master revision is rejected.
  BEGIN
    UPDATE qc.inspection_template_versions SET state = 'APPROVED' WHERE id = '01900000-0000-7000-8000-0000000f0060';
    RAISE EXCEPTION 'VERIFY FAIL: a source-conflicted transcription was approved';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM <> 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' THEN RAISE; END IF;
    RAISE NOTICE 'PASS guard-5a: source-conflicted transcription rejected';
  END;

  -- Path B: even with a revision matching the master, the missing MATCHED
  -- source evidence keeps the transcription unapprovable.
  UPDATE qc.inspection_template_versions
     SET report_revision = '3',
         digital_form = digital_form || '{"reportRevision":"3"}'::jsonb
   WHERE id = '01900000-0000-7000-8000-0000000f0060';
  BEGIN
    UPDATE qc.inspection_template_versions SET state = 'APPROVED' WHERE id = '01900000-0000-7000-8000-0000000f0060';
    RAISE EXCEPTION 'VERIFY FAIL: a transcription without MATCHED evidence was approved';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM <> 'CONTROLLED_TEMPLATE_SOURCE_REQUIRED' THEN RAISE; END IF;
    RAISE NOTICE 'PASS guard-5b: transcription without MATCHED source evidence rejected';
  END;
END $$;

-- Guard 6: the document body is mutable while its version is a draft and
-- immutable once the revision leaves draft.
DO $$
BEGIN
  BEGIN
    INSERT INTO qc.document_version_sections (document_version_id, block_type, body_text, position, created_by)
    VALUES ('01900000-0000-7000-8000-0000000f0030', 'PARAGRAPH', 'Body on an effective revision', 1, '01900000-0000-7000-8000-0000000f0001');
    RAISE EXCEPTION 'VERIFY FAIL: body block written against an EFFECTIVE document version';
  EXCEPTION WHEN sqlstate '55006' THEN
    RAISE NOTICE 'PASS guard-6a: body block against an EFFECTIVE version rejected';
  END;
END $$;

INSERT INTO qc.document_versions (id, document_id, revision, state, content_hash, created_by, version)
VALUES ('01900000-0000-7000-8000-0000000f0070', '01900000-0000-7000-8000-0000000f0020', 'D0.2', 'DRAFT', NULL, '01900000-0000-7000-8000-0000000f0001', 1);

INSERT INTO qc.document_version_sections (document_version_id, block_type, body_text, position, created_by)
VALUES ('01900000-0000-7000-8000-0000000f0070', 'PARAGRAPH', 'Draft body', 1, '01900000-0000-7000-8000-0000000f0001');

DO $$
BEGIN
  RAISE NOTICE 'PASS guard-6b: draft body block insert allowed';
  UPDATE qc.document_versions SET state = 'IN_REVIEW' WHERE id = '01900000-0000-7000-8000-0000000f0070';
  BEGIN
    UPDATE qc.document_version_sections SET body_text = 'edited after draft' WHERE document_version_id = '01900000-0000-7000-8000-0000000f0070';
    RAISE EXCEPTION 'VERIFY FAIL: body edited after the revision left draft';
  EXCEPTION WHEN sqlstate '55006' THEN
    RAISE NOTICE 'PASS guard-6c: body edit after draft rejected';
  END;
  BEGIN
    DELETE FROM qc.document_version_sections WHERE document_version_id = '01900000-0000-7000-8000-0000000f0070';
    RAISE EXCEPTION 'VERIFY FAIL: body deleted after the revision left draft';
  EXCEPTION WHEN sqlstate '55006' THEN
    RAISE NOTICE 'PASS guard-6d: body delete after draft rejected';
  END;
END $$;

-- Backfill / catalogue integrity facts.
DO $$
DECLARE legacy INTEGER; total INTEGER; conflicted INTEGER;
BEGIN
  SELECT count(*) INTO total FROM qc.inspection_report_catalog;
  SELECT count(*) INTO conflicted FROM qc.inspection_report_catalog WHERE catalog_state <> 'ACTIVE';
  SELECT count(*) INTO legacy FROM qc.inspection_template_versions WHERE authoring_origin = 'SOURCE_TRANSCRIPTION' AND state = 'APPROVED';
  IF total <> 194 THEN RAISE EXCEPTION 'VERIFY FAIL: expected 194 catalogue rows, found %', total; END IF;
  IF conflicted <> 7 THEN RAISE EXCEPTION 'VERIFY FAIL: expected 7 conflicted catalogue rows, found %', conflicted; END IF;
  IF EXISTS (SELECT 1 FROM qc.inspection_report_catalog WHERE doc_code = 'F-823-T175') THEN
    RAISE EXCEPTION 'VERIFY FAIL: the blank-title identity F-823-T175 is present';
  END IF;
  IF legacy <> 0 THEN RAISE EXCEPTION 'VERIFY FAIL: approved legacy transcriptions exist (%)', legacy; END IF;
  RAISE NOTICE 'PASS catalogue: 194 rows, 7 source-conflicted, T175 excluded, 0 approved legacy transcriptions';
END $$;

ROLLBACK;

\echo 'ALL VERIFICATION CHECKS COMPLETED'
