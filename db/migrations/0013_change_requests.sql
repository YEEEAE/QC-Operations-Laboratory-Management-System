CREATE TABLE qc.change_requests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  change_no TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_version BIGINT NOT NULL CHECK (target_version > 0),
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED', 'APPLYING', 'APPLIED', 'APPLICATION_FAILED', 'CANCELLED')),
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  target_snapshot JSONB NOT NULL,
  target_snapshot_hash TEXT,
  requested_by UUID NOT NULL,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_change_requests__change_no UNIQUE (change_no),
  CONSTRAINT fk_change_requests__requested_by FOREIGN KEY (requested_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.change_request_changes (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  change_request_id UUID NOT NULL,
  field_path TEXT NOT NULL CHECK (length(btrim(field_path)) > 0),
  current_value JSONB,
  proposed_value JSONB,
  data_type TEXT NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT fk_change_request_changes__change_request_id FOREIGN KEY (change_request_id) REFERENCES qc.change_requests (id) ON DELETE RESTRICT
);

CREATE TABLE qc.change_application_attempts (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  change_request_id UUID NOT NULL,
  attempt_no INTEGER NOT NULL CHECK (attempt_no > 0),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  result TEXT NOT NULL CHECK (result IN ('SUCCESS', 'FAILED')),
  target_version_before BIGINT,
  target_version_after BIGINT,
  error_code TEXT,
  request_id TEXT NOT NULL,
  CONSTRAINT uq_change_application_attempts__attempt UNIQUE (change_request_id, attempt_no),
  CONSTRAINT fk_change_application_attempts__change_request_id FOREIGN KEY (change_request_id) REFERENCES qc.change_requests (id) ON DELETE RESTRICT
);

CREATE INDEX idx_change_requests__target ON qc.change_requests (target_type, target_id);
CREATE INDEX idx_change_requests__state ON qc.change_requests (state);
CREATE INDEX idx_change_requests__requested_by ON qc.change_requests (requested_by);
CREATE INDEX idx_change_request_changes__change_request_id ON qc.change_request_changes (change_request_id);
CREATE INDEX idx_change_application_attempts__change_request_id ON qc.change_application_attempts (change_request_id);
CREATE INDEX idx_change_application_attempts__request_id ON qc.change_application_attempts (request_id);

ALTER TABLE qc.change_requests OWNER TO qc_migrator;
ALTER TABLE qc.change_request_changes OWNER TO qc_migrator;
ALTER TABLE qc.change_application_attempts OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.change_requests TO qc_app_runtime;
GRANT SELECT, INSERT ON qc.change_request_changes, qc.change_application_attempts TO qc_app_runtime;
