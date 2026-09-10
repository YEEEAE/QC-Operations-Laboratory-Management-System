ALTER TABLE qc.backup_runs
  ADD COLUMN IF NOT EXISTS artifact_type TEXT,
  ADD COLUMN IF NOT EXISTS object_version TEXT,
  ADD COLUMN IF NOT EXISTS git_sha TEXT,
  ADD COLUMN IF NOT EXISTS build_id TEXT,
  ADD COLUMN IF NOT EXISTS release_id TEXT,
  ADD COLUMN IF NOT EXISTS migration_head TEXT,
  ADD COLUMN IF NOT EXISTS postgres_version TEXT,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manifest_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS known_gaps JSONB;

ALTER TABLE qc.backup_runs
  ADD CONSTRAINT backup_runs__artifact_type_check
    CHECK (artifact_type IS NULL OR artifact_type IN ('LOGICAL_EXPORT')),
  ADD CONSTRAINT backup_runs__checksum_format_check
    CHECK (checksum IS NULL OR checksum ~ '^[0-9a-fA-F]{64}$');

CREATE UNIQUE INDEX IF NOT EXISTS uq_backup_runs__release_artifact
  ON qc.backup_runs (release_id, checksum)
  WHERE release_id IS NOT NULL AND checksum IS NOT NULL;

CREATE TABLE IF NOT EXISTS qc.recovery_evidence (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  backup_run_id UUID NOT NULL REFERENCES qc.backup_runs (id) ON DELETE RESTRICT,
  restore_run_id UUID REFERENCES qc.restore_runs (id) ON DELETE RESTRICT,
  evidence_version BIGINT NOT NULL DEFAULT 1 CHECK (evidence_version > 0),
  result TEXT NOT NULL CHECK (result IN ('VERIFIED', 'VERIFICATION_FAILED', 'BLOCKED')),
  source_environment TEXT NOT NULL,
  target_environment TEXT NOT NULL,
  requested_by UUID REFERENCES qc.users (id) ON DELETE RESTRICT,
  authorized_by UUID REFERENCES qc.users (id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  request_id TEXT NOT NULL,
  git_sha TEXT,
  build_id TEXT,
  release_id TEXT,
  migration_head TEXT,
  postgres_version TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  measured_rpo_seconds BIGINT CHECK (measured_rpo_seconds IS NULL OR measured_rpo_seconds >= 0),
  measured_rto_seconds BIGINT CHECK (measured_rto_seconds IS NULL OR measured_rto_seconds >= 0),
  database_validation TEXT NOT NULL,
  object_validation TEXT NOT NULL,
  security_validation TEXT NOT NULL,
  business_validation TEXT NOT NULL,
  session_invalidation TEXT,
  known_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (backup_run_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_recovery_evidence__backup_run_id
  ON qc.recovery_evidence (backup_run_id, created_at DESC);
