CREATE TABLE qc.backup_runs (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  state TEXT NOT NULL CHECK (state IN ('REQUESTED', 'RUNNING', 'CREATED', 'VERIFYING', 'VERIFIED', 'FAILED', 'EXPIRED', 'DELETED')),
  requested_by UUID,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  artifact_created_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  storage_reference TEXT,
  size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
  checksum TEXT,
  database_schema_version TEXT,
  error_code TEXT,
  request_id TEXT NOT NULL,
  CONSTRAINT fk_backup_runs__requested_by FOREIGN KEY (requested_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.restore_runs (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  backup_run_id UUID NOT NULL,
  restore_type TEXT NOT NULL CHECK (restore_type IN ('DRILL', 'PRODUCTION')),
  state TEXT NOT NULL,
  requested_by UUID,
  authorized_by UUID,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  target_environment TEXT NOT NULL,
  error_code TEXT,
  evidence JSONB,
  request_id TEXT NOT NULL,
  CONSTRAINT fk_restore_runs__backup_run_id FOREIGN KEY (backup_run_id) REFERENCES qc.backup_runs (id) ON DELETE RESTRICT,
  CONSTRAINT fk_restore_runs__requested_by FOREIGN KEY (requested_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_restore_runs__authorized_by FOREIGN KEY (authorized_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_backup_runs__state ON qc.backup_runs (state);
CREATE INDEX idx_backup_runs__requested_at ON qc.backup_runs (requested_at);
CREATE INDEX idx_backup_runs__request_id ON qc.backup_runs (request_id);
CREATE INDEX idx_restore_runs__backup_run_id ON qc.restore_runs (backup_run_id);
CREATE INDEX idx_restore_runs__state ON qc.restore_runs (state);
CREATE INDEX idx_restore_runs__request_id ON qc.restore_runs (request_id);

ALTER TABLE qc.backup_runs OWNER TO qc_migrator;
ALTER TABLE qc.restore_runs OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.backup_runs, qc.restore_runs TO qc_app_runtime;
