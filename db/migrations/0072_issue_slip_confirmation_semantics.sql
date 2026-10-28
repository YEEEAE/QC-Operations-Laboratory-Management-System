-- REJ-04: preserve historical creator attestations as reported facts and
-- separate them from decisions made by an authenticated approver. No rows are
-- promoted to an approver-confirmed or internal-approved state by this change.
ALTER TABLE qc.issue_slip_approval_confirmations
  ADD COLUMN confirmation_basis TEXT NOT NULL DEFAULT 'SELF_REPORTED',
  ADD COLUMN outcome TEXT,
  ADD COLUMN approver_identity TEXT,
  ADD COLUMN evidence_confidence TEXT NOT NULL DEFAULT 'UNASSESSED',
  ADD COLUMN recorder_class TEXT;

UPDATE qc.issue_slip_approval_confirmations
SET outcome = 'UNKNOWN',
    recorder_class = 'ORIGINAL_SUBMITTER'
WHERE status IN ('CONFIRMED', 'REVERSED');

ALTER TABLE qc.issue_slip_approval_confirmations
  ADD CONSTRAINT ck_issue_slip_approval_basis
    CHECK (confirmation_basis IN ('SELF_REPORTED', 'APPROVER_CONFIRMED')),
  ADD CONSTRAINT ck_issue_slip_approval_outcome
    CHECK (outcome IS NULL OR outcome IN ('APPROVED', 'REJECTED', 'UNKNOWN')),
  ADD CONSTRAINT ck_issue_slip_evidence_confidence
    CHECK (evidence_confidence IN ('UNASSESSED', 'LOW', 'MEDIUM', 'HIGH')),
  ADD CONSTRAINT ck_issue_slip_recorder_class
    CHECK (recorder_class IS NULL OR recorder_class IN ('ORIGINAL_SUBMITTER', 'QC_COMPLIANCE_DATA_ENTRY')),
  ADD CONSTRAINT ck_issue_slip_confirmed_provenance
    CHECK (status NOT IN ('CONFIRMED', 'REVERSED') OR
      (outcome IS NOT NULL AND recorder_class IS NOT NULL));
