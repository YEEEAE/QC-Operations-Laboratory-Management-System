-- REJ-05: versioned Production -> QC -> Supervisor review for new daily
-- reject decisions. Existing DAILY_REJECT states and records are not promoted.
ALTER TABLE qc.reject_reports DROP CONSTRAINT reject_reports_status_check;
ALTER TABLE qc.reject_reports ADD CONSTRAINT ck_reject_reports__status_by_type CHECK (
  (report_type = 'ISSUE_SLIP' AND status IN ('DRAFT', 'ISSUED', 'APPROVAL_TRACKING', 'COMPLETED', 'VOID'))
  OR (report_type = 'DAILY_REJECT' AND status IN
    ('DRAFT', 'SUBMITTED_FOR_QC', 'QC_REVIEWED', 'RETURNED', 'SUPERVISOR_APPROVED', 'CORRECTED', 'FINALIZED', 'VOID'))
);

CREATE TABLE qc.daily_reject_review_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  report_id UUID NOT NULL REFERENCES qc.reject_reports(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('SUBMIT_FOR_QC', 'QC_REVIEW', 'QC_RETURN', 'SUPERVISOR_APPROVE')),
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  permission_code TEXT NOT NULL CHECK (permission_code IN
    ('PERM-RREJ-SUBMIT-QC', 'PERM-RREJ-QC-REVIEW', 'PERM-RREJ-SUPERVISOR-APPROVE')),
  reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  report_version BIGINT NOT NULL CHECK (report_version > 0),
  idempotency_key TEXT NOT NULL UNIQUE,
  command_fingerprint CHAR(64) NOT NULL,
  approved_snapshot JSONB,
  snapshot_sha256 CHAR(64),
  CONSTRAINT uq_daily_reject_review_version UNIQUE (report_id, report_version),
  CONSTRAINT ck_daily_reject_review_reason CHECK (action IN ('SUBMIT_FOR_QC') OR length(btrim(reason)) > 0),
  CONSTRAINT ck_daily_reject_approved_snapshot CHECK (
    (action = 'SUPERVISOR_APPROVE' AND approved_snapshot IS NOT NULL AND snapshot_sha256 IS NOT NULL)
    OR (action <> 'SUPERVISOR_APPROVE' AND approved_snapshot IS NULL AND snapshot_sha256 IS NULL)
  )
);
CREATE INDEX idx_daily_reject_review_due ON qc.reject_reports(report_date, department, shift, updated_at)
  WHERE report_type = 'DAILY_REJECT' AND status IN ('SUBMITTED_FOR_QC', 'QC_REVIEWED', 'RETURNED');

CREATE FUNCTION qc.reject_daily_review_event_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'daily reject review events are append-only';
END;
$$;
CREATE TRIGGER trg_daily_reject_review_events_immutable
  BEFORE UPDATE OR DELETE ON qc.daily_reject_review_events
  FOR EACH ROW EXECUTE FUNCTION qc.reject_daily_review_event_immutable();

INSERT INTO qc.permissions (id, code, domain, action, description, risk_level, active)
SELECT uuidv7(), code, 'RREJ', action, description, 'HIGH', TRUE
FROM (VALUES
  ('PERM-RREJ-SUBMIT-QC', 'SUBMIT_FOR_QC', 'Submit own production record for QC review.'),
  ('PERM-RREJ-QC-REVIEW', 'QC_REVIEW', 'Review or return a daily reject record as QC.'),
  ('PERM-RREJ-SUPERVISOR-APPROVE', 'SUPERVISOR_APPROVE', 'Approve a QC-reviewed daily reject record as area Supervisor.')
) AS p(code, action, description)
ON CONFLICT (code) DO NOTHING;
-- No role grants are seeded: the approved Reject Reports area/role mapping is
-- absent. The new decisions therefore remain authorization-denied by default.
