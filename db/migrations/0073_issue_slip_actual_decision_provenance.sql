-- REJ-04: distinguish a real decision by an authenticated approver from a
-- submitter/QC Compliance report of an external fact. Existing confirmations
-- remain self-reported; no historical row is promoted to a decision.
ALTER TABLE qc.issue_slip_approval_confirmations
  ADD COLUMN actual_decision_by UUID,
  ADD COLUMN actual_decision_at TIMESTAMPTZ,
  ADD CONSTRAINT fk_issue_slip_approvals__actual_decision_by
    FOREIGN KEY (actual_decision_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  ADD CONSTRAINT ck_issue_slip_approver_decision_provenance CHECK (
    (confirmation_basis = 'APPROVER_CONFIRMED'
      AND status IN ('CONFIRMED', 'REVERSED')
      AND outcome IN ('APPROVED', 'REJECTED')
      AND actual_decision_by IS NOT NULL
      AND actual_decision_at IS NOT NULL)
    OR
    (confirmation_basis = 'SELF_REPORTED'
      AND actual_decision_by IS NULL
      AND actual_decision_at IS NULL)
  );

COMMENT ON COLUMN qc.issue_slip_approval_confirmations.actual_decision_by IS
  'Authenticated user who made the recorded approval decision; never populated from approver_name or approver_identity.';
COMMENT ON COLUMN qc.issue_slip_approval_confirmations.actual_decision_at IS
  'Time of the actual approver decision; distinct from the time a reporter entered an external fact.';
