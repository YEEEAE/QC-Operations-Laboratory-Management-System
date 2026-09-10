CREATE TABLE qc.release_candidates (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  git_sha TEXT NOT NULL CHECK (git_sha ~ '^[0-9a-fA-F]{40}$'),
  build_id TEXT NOT NULL CHECK (length(btrim(build_id)) > 0),
  application_version TEXT NOT NULL CHECK (length(btrim(application_version)) > 0),
  migration_head TEXT NOT NULL CHECK (length(btrim(migration_head)) > 0),
  uat_cycle_id TEXT NOT NULL CHECK (length(btrim(uat_cycle_id)) > 0),
  uat_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  residual_risk_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  state TEXT NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING', 'RELEASE_APPROVED')),
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qc.release_approvals (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  release_id UUID NOT NULL UNIQUE,
  approved_by UUID NOT NULL,
  authority TEXT NOT NULL CHECK (authority IN ('MANAGER', 'SYSTEM_OWNER')),
  git_sha TEXT NOT NULL CHECK (git_sha ~ '^[0-9a-fA-F]{40}$'),
  build_id TEXT NOT NULL CHECK (length(btrim(build_id)) > 0),
  application_version TEXT NOT NULL CHECK (length(btrim(application_version)) > 0),
  migration_head TEXT NOT NULL CHECK (length(btrim(migration_head)) > 0),
  uat_status TEXT NOT NULL CHECK (length(btrim(uat_status)) > 0),
  residual_risk_status TEXT NOT NULL CHECK (length(btrim(residual_risk_status)) > 0),
  gate_snapshot JSONB NOT NULL,
  risk_snapshot JSONB NOT NULL,
  signature_evidence_id UUID NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT NOT NULL UNIQUE,
  CONSTRAINT fk_release_approvals__release_id FOREIGN KEY (release_id) REFERENCES qc.release_candidates (id) ON DELETE RESTRICT,
  CONSTRAINT fk_release_approvals__approved_by FOREIGN KEY (approved_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_release_approvals__signature FOREIGN KEY (signature_evidence_id) REFERENCES qc.electronic_signatures (id) ON DELETE RESTRICT
);

CREATE INDEX idx_release_approvals__release_id ON qc.release_approvals (release_id);
CREATE INDEX idx_release_approvals__request_id ON qc.release_approvals (request_id);
