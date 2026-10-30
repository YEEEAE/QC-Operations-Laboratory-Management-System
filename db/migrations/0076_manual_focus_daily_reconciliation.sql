-- REJ-03: manual, evidence-first Focus transfer and reconciliation.
-- SYS-09 remains unapproved; no provider, import or Focus API is enabled.
ALTER TABLE qc.focus_compliance_entries
  DROP CONSTRAINT focus_compliance_entries_status_check,
  DROP CONSTRAINT ck_focus_compliance_entries__entry_evidence,
  DROP CONSTRAINT ck_focus_compliance_entries__verification_evidence,
  ADD COLUMN report_revision BIGINT CHECK (report_revision IS NULL OR report_revision > 0),
  ADD COLUMN focus_entry_date DATE,
  ADD COLUMN focus_entry_at TIMESTAMPTZ,
  ADD COLUMN external_reference TEXT,
  ADD COLUMN reconciliation_state TEXT NOT NULL DEFAULT 'NOT_RECONCILED'
    CHECK (reconciliation_state IN ('NOT_RECONCILED', 'MATCHED', 'MISMATCH_REQUIRES_REVIEW', 'CORRECTED')),
  ADD COLUMN reported_qty TEXT,
  ADD COLUMN reported_lot TEXT,
  ADD COLUMN reported_report_number TEXT,
  ADD COLUMN reconciliation_note TEXT;

UPDATE qc.focus_compliance_entries
SET status = CASE focus_compliance_entries.status
      WHEN 'PENDING_FOCUS_ENTRY' THEN CASE
        WHEN (r.report_type = 'ISSUE_SLIP' AND r.status IN ('ISSUED', 'APPROVAL_TRACKING', 'COMPLETED'))
          OR (r.report_type = 'DAILY_REJECT' AND r.status = 'SUPERVISOR_APPROVED')
          THEN 'PENDING_ENTRY'
        ELSE 'FAILED_OR_REQUIRES_REVIEW' END
      WHEN 'ENTERED_IN_FOCUS' THEN 'FAILED_OR_REQUIRES_REVIEW'
      WHEN 'VERIFIED' THEN 'FAILED_OR_REQUIRES_REVIEW'
      ELSE focus_compliance_entries.status END,
    report_revision = CASE
      WHEN focus_compliance_entries.status = 'PENDING_FOCUS_ENTRY'
        AND ((r.report_type = 'ISSUE_SLIP' AND r.status IN ('ISSUED', 'APPROVAL_TRACKING', 'COMPLETED'))
          OR (r.report_type = 'DAILY_REJECT' AND r.status = 'SUPERVISOR_APPROVED'))
        THEN r.version
      ELSE NULL END,
    reconciliation_state = CASE WHEN focus_compliance_entries.status = 'PENDING_FOCUS_ENTRY'
      AND ((r.report_type = 'ISSUE_SLIP' AND r.status IN ('ISSUED', 'APPROVAL_TRACKING', 'COMPLETED'))
        OR (r.report_type = 'DAILY_REJECT' AND r.status = 'SUPERVISOR_APPROVED')) THEN 'NOT_RECONCILED'
      ELSE 'MISMATCH_REQUIRES_REVIEW' END
FROM qc.reject_reports r
WHERE r.id = focus_compliance_entries.report_id;

ALTER TABLE qc.focus_compliance_entries
  ADD CONSTRAINT ck_focus_compliance_entries__status CHECK (status IN (
    'PENDING_ENTRY', 'ENTERED_UNVERIFIED', 'VERIFIED',
    'FAILED_OR_REQUIRES_REVIEW', 'CORRECTED'
  )),
  ADD CONSTRAINT ck_focus_compliance_entries__entry_evidence CHECK (
    (status = 'PENDING_ENTRY' AND entered_by IS NULL AND entered_at IS NULL
      AND focus_entry_at IS NULL AND focus_entry_date IS NULL)
    OR (status = 'FAILED_OR_REQUIRES_REVIEW' AND report_revision IS NULL
      AND entered_by IS NULL AND entered_at IS NULL
      AND focus_entry_at IS NULL AND focus_entry_date IS NULL)
    OR (status <> 'PENDING_ENTRY' AND entered_by IS NOT NULL AND entered_at IS NOT NULL
      AND (entry_evidence_file_id IS NOT NULL OR length(btrim(coalesce(entry_evidence_note, ''))) > 0))
  ),
  ADD CONSTRAINT ck_focus_compliance_entries__verification_evidence CHECK (
    (status <> 'VERIFIED' AND (
      (verified_by IS NULL AND verified_at IS NULL AND verification_evidence_file_id IS NULL AND verification_evidence_note IS NULL)
      OR (verified_by IS NOT NULL AND verified_at IS NOT NULL
        AND (verification_evidence_file_id IS NOT NULL OR length(btrim(coalesce(verification_evidence_note, ''))) > 0))
    ))
    OR (status = 'VERIFIED' AND verified_by IS NOT NULL AND verified_at IS NOT NULL
      AND (verification_evidence_file_id IS NOT NULL
        OR length(btrim(coalesce(verification_evidence_note, ''))) > 0))
  );

CREATE TABLE qc.focus_reconciliation_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  entry_id UUID NOT NULL REFERENCES qc.focus_compliance_entries(id) ON DELETE RESTRICT,
  report_id UUID NOT NULL REFERENCES qc.reject_reports(id) ON DELETE RESTRICT,
  report_revision BIGINT NOT NULL CHECK (report_revision > 0),
  action TEXT NOT NULL CHECK (action IN ('MISMATCH_RECORDED', 'MATCH_CONFIRMED', 'CORRECTION_RECORDED')),
  expected_qty TEXT,
  reported_qty TEXT,
  expected_lot TEXT,
  reported_lot TEXT,
  expected_report_number TEXT NOT NULL,
  reported_report_number TEXT,
  evidence_note TEXT NOT NULL CHECK (length(btrim(evidence_note)) > 0),
  evidence_file_id UUID REFERENCES qc.files(id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  request_id TEXT NOT NULL UNIQUE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_focus_reconciliation_events__report
  ON qc.focus_reconciliation_events(report_id, report_revision, occurred_at, id);
CREATE FUNCTION qc.focus_reconciliation_event_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Focus reconciliation events are append-only'; END; $$;
CREATE TRIGGER trg_focus_reconciliation_events_immutable
  BEFORE UPDATE OR DELETE ON qc.focus_reconciliation_events
  FOR EACH ROW EXECUTE FUNCTION qc.focus_reconciliation_event_immutable();

-- Preserve a manual entry queue for already-approved, eligible reports when
-- their approval/issue outbox event has a traceable source revision. Legacy
-- Focus claims without that provenance remain in review and are not promoted.
INSERT INTO qc.focus_compliance_entries (
  source_event_id, report_id, status, report_revision, reconciliation_state
)
SELECT event.id, report.id, 'PENDING_ENTRY', approval.report_version, 'NOT_RECONCILED'
FROM qc.reject_reports report
JOIN LATERAL (
  SELECT review.report_version
  FROM qc.daily_reject_review_events review
  WHERE review.report_id = report.id AND review.action = 'SUPERVISOR_APPROVE'
  ORDER BY review.report_version DESC
  LIMIT 1
) approval ON TRUE
JOIN qc.outbox_events event
  ON event.dedupe_key = 'daily-reject-approved:' || report.id::text || ':' || approval.report_version::text
WHERE report.report_type = 'DAILY_REJECT'
  AND report.status = 'SUPERVISOR_APPROVED'
  AND NOT EXISTS (
    SELECT 1 FROM qc.focus_compliance_entries existing WHERE existing.report_id = report.id
  )
ON CONFLICT (source_event_id) DO NOTHING;

INSERT INTO qc.focus_compliance_entries (
  source_event_id, report_id, status, report_revision, reconciliation_state
)
SELECT event.id, report.id, 'PENDING_ENTRY', report.version, 'NOT_RECONCILED'
FROM qc.reject_reports report
JOIN qc.outbox_events event
  ON event.dedupe_key = 'issue-slip-issued:' || report.id::text
WHERE report.report_type = 'ISSUE_SLIP'
  AND report.status IN ('ISSUED', 'APPROVAL_TRACKING', 'COMPLETED')
  AND NOT EXISTS (
    SELECT 1 FROM qc.focus_compliance_entries existing WHERE existing.report_id = report.id
  )
ON CONFLICT (source_event_id) DO NOTHING;
