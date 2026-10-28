-- 0062_unified_approval_decision_events
-- Append-only cross-domain record of internal approval decisions. Each event is
-- linked to the audit row created by the same domain transaction. This table
-- records authorization path metadata; it is not an electronic-signature store.

CREATE TABLE qc.approval_decision_events (
  id UUID PRIMARY KEY,
  approval_path TEXT NOT NULL CHECK (approval_path IN ('OWNER_INTERNAL_APPROVAL', 'STANDARD_WORKFLOW')),
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  actor_login_identity TEXT,
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  subject_version BIGINT NOT NULL CHECK (subject_version > 0),
  decision TEXT NOT NULL,
  decision_reason TEXT,
  policy_revision TEXT NOT NULL,
  signature_deferred BOOLEAN NOT NULL DEFAULT FALSE,
  reauthentication_status TEXT CHECK (reauthentication_status IN ('VERIFIED')),
  audit_event_id UUID NOT NULL UNIQUE REFERENCES qc.audit_events(id) ON DELETE RESTRICT,
  request_id TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT ck_approval_decision_events_owner_identity CHECK (
    (approval_path = 'OWNER_INTERNAL_APPROVAL' AND actor_login_identity = 'yazeed'
      AND policy_revision = 'OWNER-DECISION-2026-10-16-OWNER-CONTROLLED-APPROVAL'
      AND reauthentication_status IS NULL)
    OR (approval_path = 'STANDARD_WORKFLOW' AND actor_login_identity IS NULL)
  ),
  CONSTRAINT ck_approval_decision_events_signature_deferral CHECK (
    NOT signature_deferred OR (
      approval_path = 'OWNER_INTERNAL_APPROVAL'
      AND decision IN ('APPROVE', 'FINAL_APPROVE', 'STAGE1_APPROVE', 'CLOSE_EXCEPTION')
    )
  )
);

CREATE UNIQUE INDEX uq_approval_decision_events_subject_request
  ON qc.approval_decision_events(subject_type, subject_id, request_id);

CREATE INDEX idx_approval_decision_events_subject_history
  ON qc.approval_decision_events(subject_type, subject_id, decided_at, id);

CREATE TRIGGER trg_approval_decision_events_immutable
  BEFORE UPDATE OR DELETE ON qc.approval_decision_events
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER trg_approval_decision_events_truncate_guard
  BEFORE TRUNCATE ON qc.approval_decision_events
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();

COMMENT ON TABLE qc.approval_decision_events IS
  'Append-only domain approval-path events linked atomically to audit_events. OWNER_INTERNAL_APPROVAL is not an electronic signature and does not authorize physical product release.';
