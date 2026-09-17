-- Controlled UAT evidence. These records are append-only evidence snapshots;
-- CSV/operator files are inputs, never production release truth.
CREATE TABLE qc.uat_cycles (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  cycle_id TEXT NOT NULL UNIQUE CHECK (length(btrim(cycle_id)) > 0),
  release_id TEXT NOT NULL CHECK (length(btrim(release_id)) > 0),
  git_sha TEXT NOT NULL CHECK (git_sha ~ '^[0-9a-fA-F]{40}$'),
  build_id TEXT NOT NULL CHECK (length(btrim(build_id)) > 0),
  application_version TEXT NOT NULL CHECK (length(btrim(application_version)) > 0),
  migration_head TEXT NOT NULL CHECK (length(btrim(migration_head)) > 0),
  environment TEXT NOT NULL CHECK (environment IN ('test', 'staging')),
  plan_reference TEXT NOT NULL CHECK (length(btrim(plan_reference)) > 0),
  status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (status IN ('UNVERIFIED', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
  evidence_snapshot_hash TEXT NOT NULL CHECK (length(btrim(evidence_snapshot_hash)) > 0),
  execution_started_at TIMESTAMPTZ,
  execution_ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (execution_ended_at IS NULL OR execution_started_at IS NOT NULL AND execution_ended_at >= execution_started_at)
);

CREATE TABLE qc.uat_session_evidence (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  cycle_id UUID NOT NULL REFERENCES qc.uat_cycles (id) ON DELETE RESTRICT,
  session_id TEXT NOT NULL CHECK (length(btrim(session_id)) > 0),
  participant_role TEXT NOT NULL CHECK (length(btrim(participant_role)) > 0),
  participant_code TEXT NOT NULL CHECK (length(btrim(participant_code)) > 0),
  task_id TEXT NOT NULL CHECK (length(btrim(task_id)) > 0),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  time_on_task_seconds INTEGER NOT NULL CHECK (time_on_task_seconds >= 0),
  task_success BOOLEAN NOT NULL,
  error_count INTEGER NOT NULL CHECK (error_count >= 0),
  backtracking_count INTEGER NOT NULL CHECK (backtracking_count >= 0),
  failed_navigation_count INTEGER NOT NULL CHECK (failed_navigation_count >= 0),
  form_correction_count INTEGER NOT NULL CHECK (form_correction_count >= 0),
  assistance TEXT NOT NULL CHECK (assistance IN ('none', 'clarification', 'coaching')),
  wrong_action_attempts INTEGER NOT NULL CHECK (wrong_action_attempts >= 0),
  confidence_1_to_5 INTEGER NOT NULL CHECK (confidence_1_to_5 BETWEEN 1 AND 5),
  seq_1_to_7 INTEGER NOT NULL CHECK (seq_1_to_7 BETWEEN 1 AND 7),
  observations TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC', 'NONE')),
  participant_comments TEXT NOT NULL,
  scenario_status TEXT NOT NULL CHECK (scenario_status IN ('PASS', 'FAIL', 'BLOCKED', 'NOT EXECUTED', 'NOT APPLICABLE')),
  task_accept_reject TEXT NOT NULL CHECK (task_accept_reject IN ('ACCEPT', 'REJECT', 'BLOCKED', 'NOT EXECUTED')),
  evidence_reference TEXT NOT NULL CHECK (length(btrim(evidence_reference)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cycle_id, session_id, task_id),
  CHECK (ended_at >= started_at)
);

CREATE TABLE qc.uat_defects (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  cycle_id UUID NOT NULL REFERENCES qc.uat_cycles (id) ON DELETE RESTRICT,
  defect_id TEXT NOT NULL CHECK (length(btrim(defect_id)) > 0),
  session_id TEXT NOT NULL CHECK (length(btrim(session_id)) > 0),
  task_id TEXT NOT NULL CHECK (length(btrim(task_id)) > 0),
  severity TEXT NOT NULL CHECK (severity IN ('BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC')),
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  observed_evidence TEXT NOT NULL CHECK (length(btrim(observed_evidence)) > 0),
  expected_business_outcome TEXT NOT NULL,
  actual_business_outcome TEXT NOT NULL,
  request_id_or_ref TEXT NOT NULL CHECK (length(btrim(request_id_or_ref)) > 0),
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'ACCEPTED_RISK', 'FIXED', 'RETEST_REQUIRED', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cycle_id, defect_id)
);

CREATE TABLE qc.uat_acceptances (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  cycle_id UUID NOT NULL REFERENCES qc.uat_cycles (id) ON DELETE RESTRICT,
  outcome TEXT NOT NULL CHECK (outcome IN ('ACCEPTED', 'REJECTED', 'BLOCKED')),
  authorized_signer_id UUID NOT NULL REFERENCES qc.users (id) ON DELETE RESTRICT,
  signature_evidence_id UUID NOT NULL REFERENCES qc.electronic_signatures (id) ON DELETE RESTRICT,
  reauthenticated_at TIMESTAMPTZ NOT NULL,
  evidence_snapshot_hash TEXT NOT NULL CHECK (length(btrim(evidence_snapshot_hash)) > 0),
  request_id TEXT NOT NULL UNIQUE CHECK (length(btrim(request_id)) > 0),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cycle_id)
);

CREATE INDEX idx_uat_session_evidence__cycle ON qc.uat_session_evidence (cycle_id, task_id);
CREATE INDEX idx_uat_defects__cycle ON qc.uat_defects (cycle_id, severity, status);
