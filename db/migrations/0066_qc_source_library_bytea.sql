-- 0066_qc_source_library_bytea
-- Immutable PostgreSQL BYTEA storage and source provenance. Import stays operator-gated.

CREATE TABLE qc.library_binary_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sha256 text NOT NULL UNIQUE CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  mime_type text NOT NULL CHECK (length(mime_type) BETWEEN 3 AND 255),
  object_state text NOT NULL CHECK (object_state IN ('STAGING', 'COMPLETE', 'QUARANTINED')),
  chunk_count integer NOT NULL CHECK (chunk_count > 0),
  integrity_status text NOT NULL CHECK (integrity_status IN ('PENDING', 'VERIFIED', 'FAILED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE qc.library_binary_chunks (
  object_id uuid NOT NULL REFERENCES qc.library_binary_objects(id) ON DELETE RESTRICT,
  chunk_no integer NOT NULL CHECK (chunk_no >= 0),
  chunk_bytes bytea NOT NULL CHECK (octet_length(chunk_bytes) BETWEEN 1 AND 524288),
  PRIMARY KEY (object_id, chunk_no)
);

CREATE TABLE qc.library_binary_object_keys (
  storage_key text PRIMARY KEY CHECK (length(storage_key) BETWEEN 1 AND 512),
  object_id uuid NOT NULL REFERENCES qc.library_binary_objects(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX library_binary_object_keys_object_idx
  ON qc.library_binary_object_keys (object_id);

CREATE FUNCTION qc.guard_library_binary_object_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.object_state = 'COMPLETE' THEN
    RAISE EXCEPTION 'completed library binary objects are immutable';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.object_state = 'COMPLETE'
     AND NEW.integrity_status <> 'VERIFIED' THEN
    RAISE EXCEPTION 'completed library binary objects must be read-back verified';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER library_binary_objects_immutable
  BEFORE UPDATE OR DELETE ON qc.library_binary_objects
  FOR EACH ROW EXECUTE FUNCTION qc.guard_library_binary_object_immutability();

CREATE FUNCTION qc.guard_library_binary_chunk_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_object_id uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.object_id ELSE NEW.object_id END;
  target_state text;
BEGIN
  SELECT object_state INTO target_state
  FROM qc.library_binary_objects WHERE id = target_object_id
  FOR UPDATE;
  IF target_state = 'COMPLETE' THEN
    RAISE EXCEPTION 'chunks of completed library binary objects are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER library_binary_chunks_immutable
  BEFORE UPDATE OR DELETE ON qc.library_binary_chunks
  FOR EACH ROW EXECUTE FUNCTION qc.guard_library_binary_chunk_immutability();

CREATE TABLE qc.library_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_sha256 text NOT NULL CHECK (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  actor_id uuid NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  profile text NOT NULL CHECK (profile IN ('development', 'test', 'staging', 'production')),
  target_project_id text NOT NULL,
  target_branch_id text NOT NULL,
  target_database text NOT NULL,
  change_reference text NOT NULL,
  approval_reference text NOT NULL,
  recovery_reference text NOT NULL,
  state text NOT NULL CHECK (state IN ('PLANNED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED')),
  counters jsonb NOT NULL DEFAULT '{}'::jsonb,
  sanitized_error text NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  UNIQUE (manifest_sha256, target_project_id, target_branch_id, target_database)
);
CREATE INDEX library_import_batches_target_idx
  ON qc.library_import_batches (target_project_id, target_branch_id, started_at DESC);

CREATE TABLE qc.library_source_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES qc.library_import_batches(id) ON DELETE RESTRICT,
  manifest_row integer NOT NULL CHECK (manifest_row > 0),
  manifest_sha256 text NOT NULL CHECK (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  original_filename text NOT NULL CHECK (length(original_filename) BETWEEN 1 AND 512),
  source_path text NOT NULL CHECK (length(source_path) BETWEEN 1 AND 2048),
  source_title text NULL,
  classification text NOT NULL,
  filename_code text NULL,
  filename_revision text NULL,
  content_code text NULL,
  content_revision text NULL,
  review_state text NOT NULL CHECK (review_state IN ('UNREVIEWED', 'READABLE', 'PARTIAL', 'SCAN_REQUIRED', 'SOURCE_CONFLICT', 'UNAVAILABLE')),
  license_state text NOT NULL CHECK (license_state IN ('NOT_APPLICABLE', 'LICENSE_REVIEW_REQUIRED', 'AUTHORIZED', 'DENIED')),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes >= 0),
  binary_object_id uuid NULL REFERENCES qc.library_binary_objects(id) ON DELETE RESTRICT,
  file_id uuid NULL REFERENCES qc.files(id) ON DELETE RESTRICT,
  source_location text NULL,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, manifest_row),
  UNIQUE (manifest_sha256, source_path, sha256)
);
CREATE INDEX library_source_occurrences_category_idx
  ON qc.library_source_occurrences (classification, review_state, source_path);
CREATE INDEX library_source_occurrences_digest_idx
  ON qc.library_source_occurrences (sha256);
CREATE INDEX library_source_occurrences_code_idx
  ON qc.library_source_occurrences (filename_code, filename_revision);

COMMENT ON TABLE qc.library_binary_objects IS
  'Content-addressed immutable raw source bytes stored only in bounded BYTEA chunks; COMPLETE requires successful read-back SHA-256 reconciliation.';
COMMENT ON TABLE qc.library_source_occurrences IS
  'One row per source occurrence/alias. Metadata is not approval, effectivity, a template, or authorization to distribute standards.';
