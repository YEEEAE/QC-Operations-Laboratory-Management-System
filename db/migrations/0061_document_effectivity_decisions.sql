-- DOC-01: separate internal approval from controlled document effectivity.
-- Additive only: no existing draft or historical revision is promoted.

ALTER TABLE qc.document_versions
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN reviewed_by UUID REFERENCES qc.users(id) ON DELETE RESTRICT,
  ADD COLUMN effective_until TIMESTAMPTZ,
  ADD COLUMN scheduled_effective_at TIMESTAMPTZ;

ALTER TABLE qc.document_versions
  ADD CONSTRAINT ck_document_versions__review_evidence_pair
  CHECK ((reviewed_at IS NULL) = (reviewed_by IS NULL));

CREATE FUNCTION qc.guard_document_version_review_evidence()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.reviewed_at IS NOT NULL AND
     (NEW.reviewed_at, NEW.reviewed_by) IS DISTINCT FROM (OLD.reviewed_at, OLD.reviewed_by) THEN
    RAISE EXCEPTION 'document version review evidence is immutable' USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER document_version_review_evidence_guard
  BEFORE UPDATE ON qc.document_versions
  FOR EACH ROW EXECUTE FUNCTION qc.guard_document_version_review_evidence();

ALTER TABLE qc.document_versions
  ADD CONSTRAINT ck_document_versions__effective_interval
  CHECK (effective_until IS NULL OR (effective_at IS NOT NULL AND effective_until > effective_at));

-- Close only historical effective intervals whose supersession timestamp was
-- already recorded. Never infer or assign an effective start date.
UPDATE qc.document_versions
SET effective_until = superseded_at
WHERE state = 'SUPERSEDED'
  AND effective_at IS NOT NULL
  AND superseded_at IS NOT NULL
  AND superseded_at > effective_at
  AND effective_until IS NULL;

-- Explicit, version-bound requests are safe to record while Document Control /
-- QMS effectivity authority is absent. They do not change lifecycle state.
CREATE TABLE qc.document_effectivity_requests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  document_id UUID NOT NULL REFERENCES qc.document_identities(id) ON DELETE RESTRICT,
  document_version_id UUID NOT NULL REFERENCES qc.document_versions(id) ON DELETE RESTRICT,
  requested_action TEXT NOT NULL CHECK (requested_action IN ('ACTIVATE_NOW', 'SCHEDULE_ACTIVATION', 'SUPERSEDE', 'ARCHIVE')),
  replacement_version_id UUID REFERENCES qc.document_versions(id) ON DELETE RESTRICT,
  expected_replacement_version BIGINT,
  replacement_content_hash TEXT,
  requested_effective_at TIMESTAMPTZ,
  expected_document_version BIGINT NOT NULL CHECK (expected_document_version > 0),
  expected_content_hash TEXT NOT NULL CHECK (expected_content_hash ~ '^[0-9a-f]{64}$'),
  request_reason TEXT NOT NULL CHECK (length(btrim(request_reason)) > 0),
  requested_by UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'PENDING_POLICY' CHECK (status IN ('PENDING_POLICY', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXECUTED')),
  policy_reference TEXT,
  policy_revision TEXT,
  policy_digest TEXT,
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES qc.users(id) ON DELETE RESTRICT,
  decision_audit_event_id UUID REFERENCES qc.audit_events(id) ON DELETE RESTRICT,
  decision_reason TEXT,
  executed_at TIMESTAMPTZ,
  request_id TEXT NOT NULL,
  CONSTRAINT uq_document_effectivity_request__idempotency UNIQUE (requested_by, request_id),
  CONSTRAINT ck_document_effectivity_request__schedule_date CHECK (
    (requested_action = 'SCHEDULE_ACTIVATION' AND requested_effective_at IS NOT NULL)
    OR (requested_action <> 'SCHEDULE_ACTIVATION' AND requested_effective_at IS NULL)
  ),
  CONSTRAINT ck_document_effectivity_request__replacement CHECK (
    (requested_action = 'SUPERSEDE' AND replacement_version_id IS NOT NULL
      AND expected_replacement_version > 0 AND replacement_content_hash ~ '^[0-9a-f]{64}$')
    OR (requested_action <> 'SUPERSEDE' AND replacement_version_id IS NULL
      AND expected_replacement_version IS NULL AND replacement_content_hash IS NULL)
  ),
  CONSTRAINT ck_document_effectivity_request__policy_evidence CHECK (
    status NOT IN ('APPROVED', 'EXECUTED') OR
    (policy_reference IS NOT NULL AND length(btrim(policy_reference)) > 0
     AND policy_revision IS NOT NULL AND length(btrim(policy_revision)) > 0
     AND policy_digest IS NOT NULL AND policy_digest ~ '^[0-9a-f]{64}$' AND decided_at IS NOT NULL AND decided_by IS NOT NULL AND decision_audit_event_id IS NOT NULL)
  )
);

CREATE INDEX idx_document_effectivity_requests__pending
  ON qc.document_effectivity_requests (requested_effective_at, requested_at, id)
  WHERE status = 'APPROVED' AND requested_action = 'SCHEDULE_ACTIVATION';
CREATE INDEX idx_document_effectivity_requests__approved_now
  ON qc.document_effectivity_requests (requested_at, id)
  WHERE status = 'APPROVED' AND requested_action = 'ACTIVATE_NOW';
CREATE UNIQUE INDEX uq_document_effectivity_requests__unresolved_version
  ON qc.document_effectivity_requests (document_version_id)
  WHERE status IN ('PENDING_POLICY', 'APPROVED');

-- Immutable effectivity decision evidence. A separate row records each
-- transition, including its policy and frozen source revision/digest.
CREATE TABLE qc.document_effectivity_decisions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  document_id UUID NOT NULL REFERENCES qc.document_identities(id) ON DELETE RESTRICT,
  document_version_id UUID NOT NULL REFERENCES qc.document_versions(id) ON DELETE RESTRICT,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVE', 'ACTIVATE_NOW', 'SCHEDULE_ACTIVATION', 'ACTIVATE_APPROVED', 'SUPERSEDE', 'ARCHIVE')),
  decided_at TIMESTAMPTZ NOT NULL,
  effective_at TIMESTAMPTZ,
  previous_revision TEXT,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  policy_reference TEXT NOT NULL CHECK (length(btrim(policy_reference)) > 0),
  policy_revision TEXT NOT NULL CHECK (length(btrim(policy_revision)) > 0),
  policy_digest TEXT NOT NULL CHECK (policy_digest ~ '^[0-9a-f]{64}$'),
  source_revision TEXT NOT NULL CHECK (length(btrim(source_revision)) > 0),
  source_digest TEXT NOT NULL CHECK (source_digest ~ '^[0-9a-f]{64}$'),
  audit_event_id UUID NOT NULL REFERENCES qc.audit_events(id) ON DELETE RESTRICT,
  request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_document_effectivity_decision__request UNIQUE (document_version_id, decision, request_id)
);

CREATE FUNCTION qc.reject_document_effectivity_decision_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'document effectivity decisions are immutable' USING ERRCODE = '55006';
END;
$$;

CREATE TRIGGER document_effectivity_decisions_immutable
  BEFORE UPDATE OR DELETE ON qc.document_effectivity_decisions
  FOR EACH ROW EXECUTE FUNCTION qc.reject_document_effectivity_decision_mutation();

CREATE FUNCTION qc.guard_document_effectivity_request_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.id, NEW.document_id, NEW.document_version_id, NEW.requested_action,
      NEW.requested_effective_at, NEW.expected_document_version, NEW.expected_content_hash,
      NEW.replacement_version_id, NEW.expected_replacement_version, NEW.replacement_content_hash,
      NEW.request_reason, NEW.requested_by, NEW.requested_at, NEW.request_id)
     IS DISTINCT FROM
     (OLD.id, OLD.document_id, OLD.document_version_id, OLD.requested_action,
      OLD.requested_effective_at, OLD.expected_document_version, OLD.expected_content_hash,
      OLD.replacement_version_id, OLD.expected_replacement_version, OLD.replacement_content_hash,
      OLD.request_reason, OLD.requested_by, OLD.requested_at, OLD.request_id)
  THEN RAISE EXCEPTION 'document effectivity request identity is immutable' USING ERRCODE = '55006';
  END IF;
  IF OLD.status <> 'PENDING_POLICY' AND
     (NEW.policy_reference, NEW.policy_revision, NEW.policy_digest, NEW.decided_at,
      NEW.decided_by, NEW.decision_audit_event_id, NEW.decision_reason) IS DISTINCT FROM
     (OLD.policy_reference, OLD.policy_revision, OLD.policy_digest, OLD.decided_at,
      OLD.decided_by, OLD.decision_audit_event_id, OLD.decision_reason) THEN
    RAISE EXCEPTION 'document effectivity request decision evidence is immutable' USING ERRCODE = '55006';
  END IF;
  IF NOT (
    (OLD.status = 'PENDING_POLICY' AND NEW.status IN ('APPROVED', 'REJECTED', 'CANCELLED')) OR
    (OLD.status = 'APPROVED' AND NEW.status = 'EXECUTED')
  ) THEN
    RAISE EXCEPTION 'invalid document effectivity request decision' USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER document_effectivity_requests_history_guard
  BEFORE UPDATE ON qc.document_effectivity_requests
  FOR EACH ROW EXECUTE FUNCTION qc.guard_document_effectivity_request_history();

CREATE TRIGGER document_effectivity_requests_no_delete
  BEFORE DELETE ON qc.document_effectivity_requests
  FOR EACH ROW EXECUTE FUNCTION qc.reject_document_effectivity_decision_mutation();
