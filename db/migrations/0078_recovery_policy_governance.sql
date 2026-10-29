-- OPS-01: govern RPO, RTO, backup retention and recovery.
--
-- This migration stores recovery objectives as a versioned, source-linked
-- policy record and never supplies company values. No RPO/RTO/retention/copy
-- count is seeded here, and every policy version starts in PENDING_APPROVAL:
-- an unapproved policy cannot be treated as a verified objective. Approval of
-- a version records the owner's internal decision reference; electronic
-- signatures remain deferred and no signature row is created.
--
-- Service-level evidence (latest backup, artifact checksum/verification,
-- restore drill outcome, observed restore time, backup age and unresolved
-- exceptions) is derived at read time from qc.backup_runs, qc.restore_runs and
-- qc.recovery_evidence. No measured value is stored as an objective.
--
-- Storage boundaries are recorded as non-secret identity labels only. Bucket
-- names, keys, endpoints and credentials never belong in these rows, and a
-- cross-environment object write is refused by constraint.
--
-- Production restore execution stays fail-closed: planning a request is not
-- execution. A controlled runner may only act when a separate, explicitly
-- approved recovery procedure authorization exists for that environment; that
-- authorization has no creation route in this baseline, so the table is empty
-- by default and the runner refuses.

INSERT INTO qc.permissions (id, code, domain, action, description, risk_level, active)
SELECT uuidv7(), seed.code, 'BKP', seed.action_code, seed.description, 'HIGH', TRUE
FROM (
  VALUES
    ('PERM-BKP-POLICY-MANAGE', 'POLICY-MANAGE', 'Draft a recovery policy version from an approved source and record recovery incident evidence.'),
    ('PERM-BKP-POLICY-APPROVE', 'POLICY-APPROVE', 'Approve a pending recovery policy version from an approved source.')
) AS seed (code, action_code, description)
ON CONFLICT (code) DO NOTHING;

-- Draft/evidence authority is granted to ADMIN (the existing operational
-- recovery administrator). Approval authority is intentionally NOT granted to
-- ADMIN here; the named SYSTEM_OWNER bundle receives every active permission.
INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code IN ('ADMIN', 'SYSTEM_OWNER')
  AND permission.code = 'PERM-BKP-POLICY-MANAGE'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code = 'SYSTEM_OWNER'
  AND permission.active = TRUE
  AND permission.code = 'PERM-BKP-POLICY-APPROVE'
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE TABLE qc.recovery_policy_versions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  policy_key TEXT NOT NULL DEFAULT 'BACKUP_RECOVERY'
    CHECK (policy_key = 'BACKUP_RECOVERY'),
  revision INTEGER NOT NULL CHECK (revision > 0),
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
    CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUPERSEDED', 'EXPIRED')),
  -- Objective values. NULL means "not supplied by an approved source"; the
  -- application never substitutes a default for an unapproved objective.
  rpo_seconds BIGINT CHECK (rpo_seconds IS NULL OR rpo_seconds > 0),
  rto_seconds BIGINT CHECK (rto_seconds IS NULL OR rto_seconds > 0),
  retention_days INTEGER CHECK (retention_days IS NULL OR retention_days > 0),
  immutable_backup_copies SMALLINT
    CHECK (immutable_backup_copies IS NULL OR immutable_backup_copies >= 1),
  responsible_person TEXT
    CHECK (responsible_person IS NULL OR length(btrim(responsible_person)) > 0),
  -- Exact approved source the values were transcribed from.
  policy_source_kind TEXT
    CHECK (policy_source_kind IS NULL OR policy_source_kind IN ('CONTROLLED_DOCUMENT', 'QMS_DECISION', 'OWNER_DECISION')),
  policy_reference TEXT
    CHECK (policy_reference IS NULL OR length(btrim(policy_reference)) > 0),
  policy_revision TEXT
    CHECK (policy_revision IS NULL OR length(btrim(policy_revision)) > 0),
  policy_source_sha256 CHAR(64)
    CHECK (policy_source_sha256 IS NULL OR policy_source_sha256 ~ '^[0-9a-f]{64}$'),
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  -- Internal owner approval reference. Never a signature row.
  approval_reference TEXT
    CHECK (approval_reference IS NULL OR length(btrim(approval_reference)) > 0),
  approval_authority TEXT
    CHECK (approval_authority IS NULL OR approval_authority = 'SYSTEM_OWNER_INTERNAL_APPROVAL'),
  approved_by UUID REFERENCES qc.users (id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  supersedes_id UUID REFERENCES qc.recovery_policy_versions (id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES qc.users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT uq_recovery_policy_versions_revision UNIQUE (policy_key, revision),
  CONSTRAINT ck_recovery_policy_versions_effective_range CHECK (
    effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from
  ),
  -- An APPROVED version must carry every objective and its approved source.
  CONSTRAINT ck_recovery_policy_versions_approved_complete CHECK (
    status <> 'APPROVED' OR (
      rpo_seconds IS NOT NULL
      AND rto_seconds IS NOT NULL
      AND retention_days IS NOT NULL
      AND immutable_backup_copies IS NOT NULL
      AND responsible_person IS NOT NULL
      AND policy_source_kind IS NOT NULL
      AND policy_reference IS NOT NULL
      AND policy_revision IS NOT NULL
      AND policy_source_sha256 IS NOT NULL
      AND effective_from IS NOT NULL
      AND approval_reference IS NOT NULL
      AND approval_authority IS NOT NULL
      AND approved_by IS NOT NULL
      AND approved_at IS NOT NULL
    )
  ),
  -- Only a never-approved version may lack approval fields. SUPERSEDED and
  -- EXPIRED rows keep the approval evidence they were approved with.
  CONSTRAINT ck_recovery_policy_versions_unapproved_fields CHECK (
    status NOT IN ('PENDING_APPROVAL', 'REJECTED') OR (
      approval_reference IS NULL
      AND approval_authority IS NULL
      AND approved_by IS NULL
      AND approved_at IS NULL
    )
  )
);

-- At most one currently approved objective set per policy key.
CREATE UNIQUE INDEX uq_recovery_policy_versions_current
  ON qc.recovery_policy_versions (policy_key)
  WHERE status = 'APPROVED';
CREATE INDEX idx_recovery_policy_versions_status
  ON qc.recovery_policy_versions (policy_key, status, effective_from DESC);

CREATE TABLE qc.recovery_policy_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  policy_version_id UUID NOT NULL REFERENCES qc.recovery_policy_versions (id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('DRAFTED', 'APPROVED', 'REJECTED', 'SUPERSEDED', 'EXPIRED')),
  actor_id UUID NOT NULL REFERENCES qc.users (id) ON DELETE RESTRICT,
  actor_login_identity TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  approval_reference TEXT,
  snapshot JSONB NOT NULL,
  snapshot_sha256 CHAR(64) NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  request_id TEXT NOT NULL UNIQUE CHECK (length(btrim(request_id)) > 0)
);
CREATE INDEX idx_recovery_policy_events_version
  ON qc.recovery_policy_events (policy_version_id, occurred_at);

CREATE FUNCTION qc.recovery_policy_event_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'recovery policy events are append-only'; END; $$;
CREATE TRIGGER trg_recovery_policy_events_immutable
  BEFORE UPDATE OR DELETE ON qc.recovery_policy_events
  FOR EACH ROW EXECUTE FUNCTION qc.recovery_policy_event_immutable();

-- Explicit storage boundary per environment. Identity labels only: no bucket
-- name, endpoint, key material or credential value is stored.
CREATE TABLE qc.recovery_storage_boundaries (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  environment TEXT NOT NULL CHECK (environment IN ('local', 'test', 'staging', 'production')),
  boundary_label TEXT NOT NULL CHECK (length(btrim(boundary_label)) > 0),
  artifact_store_kind TEXT NOT NULL
    CHECK (artifact_store_kind IN ('R2_OBJECT_STORE', 'LOCAL_EPHEMERAL', 'NONE')),
  isolation_state TEXT NOT NULL
    CHECK (isolation_state IN ('NOT_CONFIGURED', 'PENDING_VERIFICATION', 'VERIFIED', 'FAILED')),
  -- A recovery artifact set never moves objects across environments.
  cross_environment_read_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  cross_environment_write_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  source_reference TEXT,
  verified_by UUID REFERENCES qc.users (id) ON DELETE RESTRICT,
  verified_at TIMESTAMPTZ,
  recorded_by UUID NOT NULL REFERENCES qc.users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT ck_recovery_storage_boundaries_no_cross_environment_write CHECK (
    cross_environment_write_allowed = FALSE
  ),
  CONSTRAINT ck_recovery_storage_boundaries_verified CHECK (
    isolation_state <> 'VERIFIED' OR verified_at IS NOT NULL
  )
);
CREATE INDEX idx_recovery_storage_boundaries_environment
  ON qc.recovery_storage_boundaries (environment, created_at DESC);

CREATE FUNCTION qc.recovery_storage_boundary_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'recovery storage boundaries are append-only; record a new boundary'; END; $$;
CREATE TRIGGER trg_recovery_storage_boundaries_immutable
  BEFORE UPDATE OR DELETE ON qc.recovery_storage_boundaries
  FOR EACH ROW EXECUTE FUNCTION qc.recovery_storage_boundary_immutable();

CREATE TABLE qc.recovery_incidents (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  incident_reference TEXT NOT NULL UNIQUE CHECK (length(btrim(incident_reference)) > 0),
  kind TEXT NOT NULL CHECK (kind IN (
    'BACKUP_FAILURE',
    'RESTORE_FAILURE',
    'POLICY_GAP',
    'PROVIDER_OUTAGE',
    'DATA_LOSS',
    'OBJECT_STORE_GAP'
  )),
  environment TEXT NOT NULL CHECK (environment IN ('local', 'test', 'staging', 'production')),
  detected_at TIMESTAMPTZ NOT NULL,
  summary TEXT NOT NULL CHECK (length(btrim(summary)) > 0),
  state TEXT NOT NULL DEFAULT 'OPEN' CHECK (state IN ('OPEN', 'RESOLVED')),
  resolved_at TIMESTAMPTZ,
  resolution_summary TEXT,
  -- A resolution is recorded as its own append-only row that points at the
  -- incident it closes; the original observation is never rewritten.
  resolves_incident_id UUID REFERENCES qc.recovery_incidents (id) ON DELETE RESTRICT,
  recovered_data_as_of TIMESTAMPTZ,
  recovery_started_at TIMESTAMPTZ,
  recovery_validated_at TIMESTAMPTZ,
  observed_rpo_seconds BIGINT CHECK (observed_rpo_seconds IS NULL OR observed_rpo_seconds >= 0),
  observed_rto_seconds BIGINT CHECK (observed_rto_seconds IS NULL OR observed_rto_seconds >= 0),
  policy_version_id UUID REFERENCES qc.recovery_policy_versions (id) ON DELETE RESTRICT,
  storage_boundary_id UUID REFERENCES qc.recovery_storage_boundaries (id) ON DELETE RESTRICT,
  recorded_by UUID NOT NULL REFERENCES qc.users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT NOT NULL UNIQUE CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT ck_recovery_incidents_resolution CHECK (
    state <> 'RESOLVED' OR (resolved_at IS NOT NULL AND resolution_summary IS NOT NULL)
  ),
  CONSTRAINT ck_recovery_incidents_closure_link CHECK (
    (state = 'OPEN' AND resolves_incident_id IS NULL)
    OR (state = 'RESOLVED' AND resolves_incident_id IS NOT NULL)
  ),
  CONSTRAINT ck_recovery_incidents_closure_not_self CHECK (
    resolves_incident_id IS NULL OR resolves_incident_id <> id
  )
);
CREATE INDEX idx_recovery_incidents_state ON qc.recovery_incidents (state, detected_at DESC);
CREATE INDEX idx_recovery_incidents_environment ON qc.recovery_incidents (environment, detected_at DESC);
CREATE UNIQUE INDEX uq_recovery_incidents_single_closure
  ON qc.recovery_incidents (resolves_incident_id)
  WHERE resolves_incident_id IS NOT NULL;

CREATE FUNCTION qc.recovery_incident_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'recovery incidents are append-only; record a closure row instead'; END; $$;
CREATE TRIGGER trg_recovery_incidents_immutable
  BEFORE UPDATE OR DELETE ON qc.recovery_incidents
  FOR EACH ROW EXECUTE FUNCTION qc.recovery_incident_immutable();

-- A separate, environment-scoped approval of an actual recovery procedure.
-- Restore execution may not proceed without an APPROVED row here, and no code
-- path in this baseline inserts one: the controlled runner stays fail-closed.
CREATE TABLE qc.recovery_procedure_authorizations (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  environment TEXT NOT NULL CHECK (environment IN ('local', 'test', 'staging', 'production')),
  procedure_reference TEXT NOT NULL CHECK (length(btrim(procedure_reference)) > 0),
  procedure_revision TEXT NOT NULL CHECK (length(btrim(procedure_revision)) > 0),
  procedure_source_sha256 CHAR(64) NOT NULL CHECK (procedure_source_sha256 ~ '^[0-9a-f]{64}$'),
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
    CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REVOKED')),
  approval_reference TEXT,
  approval_authority TEXT
    CHECK (approval_authority IS NULL OR approval_authority = 'SYSTEM_OWNER_INTERNAL_APPROVAL'),
  approved_by UUID REFERENCES qc.users (id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT NOT NULL UNIQUE CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT ck_recovery_procedure_authorizations_approved CHECK (
    status <> 'APPROVED' OR (
      approval_reference IS NOT NULL
      AND approval_authority IS NOT NULL
      AND approved_by IS NOT NULL
      AND approved_at IS NOT NULL
      AND effective_from IS NOT NULL
    )
  ),
  CONSTRAINT ck_recovery_procedure_authorizations_effective_range CHECK (
    effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from
  )
);
CREATE UNIQUE INDEX uq_recovery_procedure_authorizations_current
  ON qc.recovery_procedure_authorizations (environment)
  WHERE status = 'APPROVED';

COMMENT ON TABLE qc.recovery_policy_versions IS
  'Versioned recovery policy. Defaults to PENDING_APPROVAL; no RPO/RTO/retention value is supplied by the system.';
COMMENT ON TABLE qc.recovery_incidents IS
  'Append-only recovery incidents and their closure rows; unresolved incidents are the exception evidence for recovery readiness.';
COMMENT ON TABLE qc.recovery_storage_boundaries IS
  'Append-only non-secret storage boundary labels per environment; cross-environment object write is refused by constraint.';
COMMENT ON TABLE qc.recovery_procedure_authorizations IS
  'Separate approved recovery procedure authorization. Empty by default; restore execution stays fail-closed without an APPROVED row.';
