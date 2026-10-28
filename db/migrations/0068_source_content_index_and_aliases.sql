-- 0068_source_content_index_and_aliases
-- Searchable extracted text and explicit canonical-to-alias provenance.
-- Extracted text is derivative working content, never QMS approval/effectivity.

ALTER TABLE qc.library_source_occurrences
  ADD COLUMN extracted_text text NULL,
  ADD COLUMN extraction_status text NOT NULL DEFAULT 'NOT_READ'
    CHECK (extraction_status IN (
      'NOT_READ', 'EXTRACTED_COMPLETE', 'ARCHIVE_INSPECTED', 'NEEDS_SOURCE_RESCAN',
      'EXTRACTION_ERROR', 'LICENSE_CONTENT_NOT_RETAINED', 'LICENSE_REVIEW_REQUIRED',
      'SOURCE_NOT_AVAILABLE', 'SOURCE_CONFLICT', 'EMPTY_DOCUMENT', 'EMPTY_WORKBOOK',
      'MANUAL_REVIEW_REQUIRED'
    )),
  ADD COLUMN content_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE qc.library_source_occurrences
  DROP CONSTRAINT library_source_occurrences_review_state_check;
ALTER TABLE qc.library_source_occurrences
  ADD CONSTRAINT library_source_occurrences_review_state_check
    CHECK (review_state IN (
      'UNREVIEWED', 'READABLE', 'PARTIAL', 'SCAN_REQUIRED', 'SOURCE_CONFLICT',
      'UNAVAILABLE', 'NEEDS_SOURCE_RESCAN'
    ));

CREATE TABLE qc.library_source_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES qc.library_import_batches(id) ON DELETE RESTRICT,
  manifest_sha256 text NOT NULL CHECK (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  alias_filename text NOT NULL CHECK (length(alias_filename) BETWEEN 1 AND 512),
  canonical_filename text NOT NULL CHECK (length(canonical_filename) BETWEEN 1 AND 512),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  file_id uuid NULL REFERENCES qc.files(id) ON DELETE RESTRICT,
  binary_object_id uuid NULL REFERENCES qc.library_binary_objects(id) ON DELETE RESTRICT,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, alias_filename, sha256)
);
CREATE INDEX library_source_aliases_canonical_idx
  ON qc.library_source_aliases (batch_id, canonical_filename);
CREATE INDEX library_source_aliases_digest_idx
  ON qc.library_source_aliases (sha256);

CREATE INDEX library_source_occurrences_text_search_idx
  ON qc.library_source_occurrences
  USING gin (to_tsvector('english', coalesce(extracted_text, '')));
CREATE INDEX library_source_occurrences_extraction_status_idx
  ON qc.library_source_occurrences (extraction_status, license_state, review_state);

COMMENT ON COLUMN qc.library_source_occurrences.extracted_text IS
  'Locally extracted searchable text; standards/licensed content must remain NULL without an explicit retention license.';
COMMENT ON TABLE qc.library_source_aliases IS
  'Exact duplicate filename aliases from the exporter. No missing physical source path is fabricated.';
