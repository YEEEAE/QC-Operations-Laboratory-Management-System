-- NDB-11: leased, bounded outbox recovery and explicit manual Focus evidence.
-- Source only. This migration is forward-only and is not applied here.

ALTER TABLE qc.outbox_events
  ADD COLUMN lease_token UUID,
  ADD COLUMN lease_until TIMESTAMPTZ,
  ADD COLUMN dead_lettered_at TIMESTAMPTZ,
  ADD COLUMN last_failure_class TEXT;

ALTER TABLE qc.outbox_events
  ADD CONSTRAINT ck_outbox_events__lease_pair
    CHECK ((lease_token IS NULL) = (lease_until IS NULL)),
  ADD CONSTRAINT ck_outbox_events__failure_class
    CHECK (last_failure_class IS NULL OR last_failure_class IN
      ('VALIDATION', 'AUTHORIZATION', 'STALE_STATE', 'DUPLICATE', 'DEPENDENCY', 'UNKNOWN')),
  ADD CONSTRAINT ck_outbox_events__terminal_state
    CHECK (dead_lettered_at IS NULL OR (processed_at IS NULL AND lease_token IS NULL));

CREATE INDEX idx_outbox_events__claimable
  ON qc.outbox_events (available_at, created_at, id)
  WHERE processed_at IS NULL AND dead_lettered_at IS NULL;

-- Manual delivery evidence only. No worker/provider may infer SENT or CONFIRMED
-- from a queue insert or successful internal projection.
CREATE TABLE qc.event_delivery_statuses (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  source_event_id UUID NOT NULL,
  delivery_target TEXT NOT NULL CHECK (length(btrim(delivery_target)) > 0),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'CONFIRMED', 'FAILED')),
  source_event_reference UUID NOT NULL,
  evidence_note TEXT,
  evidence_file_id UUID,
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_delivery_statuses__event
    FOREIGN KEY (source_event_id) REFERENCES qc.outbox_events (id) ON DELETE RESTRICT,
  CONSTRAINT fk_event_delivery_statuses__source_reference
    FOREIGN KEY (source_event_reference) REFERENCES qc.outbox_events (id) ON DELETE RESTRICT,
  CONSTRAINT fk_event_delivery_statuses__file
    FOREIGN KEY (evidence_file_id) REFERENCES qc.files (id) ON DELETE RESTRICT,
  CONSTRAINT fk_event_delivery_statuses__actor
    FOREIGN KEY (recorded_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT uq_event_delivery_statuses__event_target_state
    UNIQUE (source_event_id, delivery_target, status),
  CONSTRAINT ck_event_delivery_statuses__source_same
    CHECK (source_event_id = source_event_reference),
  CONSTRAINT ck_event_delivery_statuses__evidence
    CHECK (status IN ('PENDING', 'FAILED') OR
      (evidence_file_id IS NOT NULL OR length(btrim(coalesce(evidence_note, ''))) > 0))
);

CREATE INDEX idx_event_delivery_statuses__source
  ON qc.event_delivery_statuses (source_event_id, delivery_target, recorded_at DESC, id DESC);

-- SYS-09 is unapproved: these rows record a human-entered QC Compliance step;
-- they do not call, sync with, or attest to a Focus provider API.
CREATE TABLE qc.focus_compliance_entries (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  source_event_id UUID NOT NULL,
  report_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_FOCUS_ENTRY'
    CHECK (status IN ('PENDING_FOCUS_ENTRY', 'ENTERED_IN_FOCUS', 'VERIFIED')),
  entry_evidence_note TEXT,
  entry_evidence_file_id UUID,
  entered_by UUID,
  entered_at TIMESTAMPTZ,
  verification_evidence_note TEXT,
  verification_evidence_file_id UUID,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_focus_compliance_entries__source UNIQUE (source_event_id),
  CONSTRAINT fk_focus_compliance_entries__event
    FOREIGN KEY (source_event_id) REFERENCES qc.outbox_events (id) ON DELETE RESTRICT,
  CONSTRAINT fk_focus_compliance_entries__report
    FOREIGN KEY (report_id) REFERENCES qc.reject_reports (id) ON DELETE RESTRICT,
  CONSTRAINT fk_focus_compliance_entries__entry_file
    FOREIGN KEY (entry_evidence_file_id) REFERENCES qc.files (id) ON DELETE RESTRICT,
  CONSTRAINT fk_focus_compliance_entries__verification_file
    FOREIGN KEY (verification_evidence_file_id) REFERENCES qc.files (id) ON DELETE RESTRICT,
  CONSTRAINT fk_focus_compliance_entries__entered_by
    FOREIGN KEY (entered_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_focus_compliance_entries__verified_by
    FOREIGN KEY (verified_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT ck_focus_compliance_entries__entry_evidence CHECK (
    (status = 'PENDING_FOCUS_ENTRY' AND entered_by IS NULL AND entered_at IS NULL)
    OR (status IN ('ENTERED_IN_FOCUS', 'VERIFIED') AND entered_by IS NOT NULL AND entered_at IS NOT NULL
      AND (entry_evidence_file_id IS NOT NULL OR length(btrim(coalesce(entry_evidence_note, ''))) > 0))
  ),
  CONSTRAINT ck_focus_compliance_entries__verification_evidence CHECK (
    (status <> 'VERIFIED' AND verified_by IS NULL AND verified_at IS NULL
      AND verification_evidence_file_id IS NULL AND verification_evidence_note IS NULL)
    OR (status = 'VERIFIED' AND verified_by IS NOT NULL AND verified_at IS NOT NULL
      AND (verification_evidence_file_id IS NOT NULL
        OR length(btrim(coalesce(verification_evidence_note, ''))) > 0))
  )
);

CREATE INDEX idx_focus_compliance_entries__report
  ON qc.focus_compliance_entries (report_id, id);

-- Retention is an owner policy decision. This hook only classifies outbox
-- candidates and never deletes records. Audit, laboratory, scientific and
-- controlled-document evidence are outside this retention surface.
ALTER TABLE qc.outbox_events
  ADD COLUMN retention_review_state TEXT NOT NULL DEFAULT 'NOT_REVIEWED'
    CHECK (retention_review_state IN ('NOT_REVIEWED', 'RETAIN', 'ELIGIBLE_AFTER_APPROVAL')),
  ADD COLUMN retention_policy_reference TEXT;
ALTER TABLE qc.outbox_events
  ADD CONSTRAINT ck_outbox_events__retention_reference
    CHECK (retention_review_state <> 'ELIGIBLE_AFTER_APPROVAL'
      OR length(btrim(coalesce(retention_policy_reference, ''))) > 0);
