-- REJ-02: threshold policy is inert until its source is reviewed and the
-- canonical owner activates a revision. No historical report is recalculated.
CREATE TABLE qc.reject_limit_profiles (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  item_code TEXT NOT NULL CHECK (length(btrim(item_code)) > 0),
  line TEXT,
  site TEXT,
  shift TEXT,
  formula_id TEXT NOT NULL CHECK (length(btrim(formula_id)) > 0),
  formula_version INTEGER NOT NULL CHECK (formula_version > 0),
  denominator TEXT NOT NULL CHECK (length(btrim(denominator)) > 0),
  limit_value NUMERIC NOT NULL CHECK (limit_value >= 0),
  unit TEXT NOT NULL CHECK (length(btrim(unit)) > 0),
  baseline_period_start DATE NOT NULL,
  baseline_period_end DATE NOT NULL,
  source_file_name TEXT NOT NULL CHECK (length(btrim(source_file_name)) > 0),
  source_file_digest CHAR(64) NOT NULL CHECK (source_file_digest ~ '^[0-9a-f]{64}$'),
  revision INTEGER NOT NULL CHECK (revision > 0),
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'REVIEW_REQUIRED', 'REVIEWED', 'ACTIVE', 'SUPERSEDED', 'REJECTED')),
  created_by UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by UUID REFERENCES qc.users(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES qc.users(id) ON DELETE RESTRICT,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT ck_reject_limit_baseline_range CHECK (
    baseline_period_end >= baseline_period_start
    AND baseline_period_start >= DATE '2025-01-01'
    AND baseline_period_end < DATE '2026-01-01'
  ),
  CONSTRAINT ck_reject_limit_effective_range CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from),
  CONSTRAINT ck_reject_limit_active_approval CHECK (state <> 'ACTIVE' OR (approved_by IS NOT NULL AND effective_from IS NOT NULL))
);
CREATE UNIQUE INDEX uq_reject_limit_profile_revision ON qc.reject_limit_profiles
  (item_code, coalesce(line, ''), coalesce(site, ''), coalesce(shift, ''), formula_id, revision);
CREATE INDEX idx_reject_limit_profile_match ON qc.reject_limit_profiles
  (item_code, formula_id, state, effective_from, effective_to);

CREATE TABLE qc.reject_limit_profile_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  profile_id UUID NOT NULL REFERENCES qc.reject_limit_profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('DRAFTED', 'SUBMITTED_FOR_REVIEW', 'REVIEWED', 'REJECTED', 'ACTIVATED', 'SUPERSEDED', 'CANCELLED')),
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL,
  profile_revision INTEGER NOT NULL CHECK (profile_revision > 0),
  snapshot JSONB NOT NULL,
  snapshot_sha256 CHAR(64) NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  request_id TEXT NOT NULL UNIQUE
);
CREATE INDEX idx_reject_limit_profile_events_profile ON qc.reject_limit_profile_events(profile_id, occurred_at);

CREATE FUNCTION qc.reject_limit_profile_event_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'reject limit profile events are append-only'; END; $$;
CREATE TRIGGER trg_reject_limit_profile_events_immutable
  BEFORE UPDATE OR DELETE ON qc.reject_limit_profile_events
  FOR EACH ROW EXECUTE FUNCTION qc.reject_limit_profile_event_immutable();

CREATE TABLE qc.daily_reject_threshold_decisions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  report_id UUID NOT NULL REFERENCES qc.reject_reports(id) ON DELETE RESTRICT,
  report_version BIGINT NOT NULL CHECK (report_version > 0),
  entry_id UUID NOT NULL REFERENCES qc.daily_reject_entries(id) ON DELETE RESTRICT,
  decision_state TEXT NOT NULL CHECK (decision_state IN ('REVIEW_REQUIRED', 'NO_MATCH', 'CONFLICT', 'BELOW_LIMIT', 'ESCALATED')),
  profile_id UUID REFERENCES qc.reject_limit_profiles(id) ON DELETE RESTRICT,
  observed_rate NUMERIC,
  threshold_value NUMERIC,
  formula_id TEXT,
  source_file_digest CHAR(64),
  approval_case_id UUID REFERENCES qc.approval_cases(id) ON DELETE RESTRICT,
  approval_state TEXT NOT NULL DEFAULT 'PENDING' CHECK (approval_state IN ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'CANCELLED')),
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  snapshot JSONB NOT NULL,
  snapshot_sha256 CHAR(64) NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (report_id, report_version, entry_id),
  CONSTRAINT ck_daily_reject_threshold_approval CHECK ((decision_state = 'ESCALATED') = (approval_case_id IS NOT NULL))
);
CREATE INDEX idx_daily_reject_threshold_report ON qc.daily_reject_threshold_decisions(report_id, report_version);
CREATE UNIQUE INDEX uq_daily_reject_threshold_approval_request ON qc.approval_cases(subject_type, subject_id, subject_version, workflow_type)
  WHERE subject_type = 'DAILY_REJECT_THRESHOLD' AND workflow_type = 'REJECT_THRESHOLD_ESCALATION';

ALTER TABLE qc.daily_reject_entries
  ADD COLUMN threshold_decision_state TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED'
    CHECK (threshold_decision_state IN ('REVIEW_REQUIRED', 'NO_MATCH', 'CONFLICT', 'BELOW_LIMIT', 'ESCALATED')),
  ADD COLUMN threshold_profile_id UUID REFERENCES qc.reject_limit_profiles(id) ON DELETE RESTRICT;

INSERT INTO qc.permissions (id, code, domain, action, description, risk_level, active)
SELECT uuidv7(), code, 'RREJ', action, description, 'HIGH', TRUE
FROM (VALUES
  ('PERM-RREJ-APPROVE', 'APPROVE', 'Resolve an assigned reject threshold escalation request.'),
  ('PERM-RREJ-REJECT', 'REJECT', 'Reject an assigned reject threshold escalation request.'),
  ('PERM-RREJ-RETURN', 'RETURN', 'Return an assigned reject threshold escalation request for review.')
) AS p(code, action, description)
ON CONFLICT (code) DO NOTHING;
