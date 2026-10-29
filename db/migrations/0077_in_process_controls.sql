-- INP-01: independent In-Process Controls workspace.
--
-- In-process production control is its own controlled record family. This
-- migration creates no inspection report row and no receiving row: an
-- in-process check is NOT an incoming or final inspection unless an approved
-- work instruction requires that separately. No report auto-generation exists
-- in this schema.
--
-- The schema stores no intrinsic acceptance limit. Parameter name, unit,
-- frequency, sampling and acceptance text are transcribed from one pinned
-- EFFECTIVE Work Instruction version and are marked with the exact WI revision
-- and clause reference they came from. Nothing here supplies a default,
-- tolerance, AQL, sample size or ISO rule.
--
-- Authority: only the read permission has an approved baseline grant
-- (AVD-001/004 universal operational read). In-process write authority has no
-- approved permission-matrix entry on this checkout, so no write grant is
-- inserted; the module fails closed with an explicit pending-authority state.

INSERT INTO qc.permissions (id, code, domain, action, description, risk_level, active)
SELECT uuidv7(), seed.code, 'INP', seed.action_code, seed.description, 'UNSPECIFIED', TRUE
FROM (
  VALUES
    ('PERM-INP-VIEW', 'VIEW', 'View in-process control runs and their recorded evidence.'),
    ('PERM-INP-CREATE', 'CREATE', 'Start an in-process control run from an effective work instruction.'),
    ('PERM-INP-RECORD', 'RECORD', 'Transcribe in-process checkpoints and record check readings.'),
    ('PERM-INP-VERIFY', 'VERIFY', 'Verify transcribed checkpoint criteria against the pinned work instruction.'),
    ('PERM-INP-DEVIATION', 'DEVIATION', 'Flag an in-process deviation against a recorded reading.'),
    ('PERM-INP-HOLD', 'HOLD', 'Request a QC hold for an in-process run.'),
    ('PERM-INP-HANDOVER', 'HANDOVER', 'Record and accept a cross-shift in-process handover.'),
    ('PERM-INP-SUBMIT', 'SUBMIT', 'Submit an in-process run for QC review.'),
    ('PERM-INP-REVIEW', 'REVIEW', 'Return or QC-review a submitted in-process run.'),
    ('PERM-INP-CLOSE', 'CLOSE', 'Close an in-process run with a recorded human disposition.')
) AS seed (code, action_code, description)
ON CONFLICT (code) DO NOTHING;

-- Read-only baseline grant only. Write permissions stay ungranted until the
-- approved permission matrix defines the in-process authority; requesting a
-- grant remains an audited administration action.
INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code IN ('EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'ADMIN')
  AND permission.code = 'PERM-INP-VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE TABLE qc.in_process_runs (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  run_no TEXT NOT NULL CHECK (length(btrim(run_no)) > 0),
  item_code TEXT NOT NULL CHECK (length(btrim(item_code)) > 0),
  item_name TEXT NOT NULL CHECK (length(btrim(item_name)) > 0),
  lot_no TEXT NOT NULL CHECK (length(btrim(lot_no)) > 0),
  work_order_no TEXT,
  batch_no TEXT,
  production_line TEXT NOT NULL CHECK (length(btrim(production_line)) > 0),
  station TEXT,
  machine TEXT,
  shift_code TEXT NOT NULL CHECK (length(btrim(shift_code)) > 0),
  state TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (
    state IN ('IN_PROGRESS', 'AWAITING_QC_REVIEW', 'RETURNED', 'QC_REVIEWED', 'CLOSED')
  ),
  -- Pinned effective work instruction. Every column below is an immutable
  -- snapshot of the source document at run start.
  wi_document_id UUID NOT NULL,
  wi_document_version_id UUID NOT NULL,
  wi_document_no TEXT NOT NULL CHECK (length(btrim(wi_document_no)) > 0),
  wi_revision TEXT NOT NULL CHECK (length(btrim(wi_revision)) > 0),
  wi_content_hash TEXT NOT NULL CHECK (wi_content_hash ~ '^[0-9a-f]{64}$'),
  wi_effective_at TIMESTAMPTZ NOT NULL,
  wi_source_file_digest TEXT NOT NULL CHECK (wi_source_file_digest ~ '^[0-9a-f]{64}$'),
  wi_source_files_snapshot JSONB NOT NULL,
  -- No approved item-to-work-instruction applicability mapping exists yet, so
  -- applicability is asserted by the operator and verified by the QC observer
  -- instead of being inferred by the application.
  wi_applicability_asserted_by UUID NOT NULL,
  wi_applicability_verified_by UUID,
  wi_applicability_verified_at TIMESTAMPTZ,
  -- Optional controlled F-823 in-process form, captured as a snapshot when an
  -- effective controlled form is attached.
  form_document_id UUID,
  form_document_version_id UUID,
  form_document_no TEXT,
  form_revision TEXT,
  form_content_hash TEXT CHECK (form_content_hash IS NULL OR form_content_hash ~ '^[0-9a-f]{64}$'),
  form_source_files_snapshot JSONB,
  form_attachment_state TEXT NOT NULL CHECK (
    form_attachment_state IN ('ATTACHED', 'NOT_ATTACHED_SOURCE_REQUIRED')
  ),
  operator_id UUID NOT NULL,
  operator_login_identity TEXT NOT NULL CHECK (length(btrim(operator_login_identity)) > 0),
  qc_observer_id UUID,
  qc_observer_login_identity TEXT,
  qc_hold_state TEXT NOT NULL DEFAULT 'NONE' CHECK (
    qc_hold_state IN ('NONE', 'REQUESTED', 'ACKNOWLEDGED', 'DECLINED')
  ),
  -- An in-process run never releases product by itself.
  product_release_state TEXT NOT NULL DEFAULT 'NOT_RELEASED' CHECK (product_release_state = 'NOT_RELEASED'),
  disposition TEXT CHECK (
    disposition IS NULL
      OR disposition IN ('ACCEPTED_FOR_CONTINUATION', 'QC_HOLD_REQUESTED', 'ESCALATED')
  ),
  disposition_note TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_in_process_runs__run_no UNIQUE (run_no),
  CONSTRAINT fk_in_process_runs__wi_document FOREIGN KEY (wi_document_id)
    REFERENCES qc.document_identities (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_runs__wi_version FOREIGN KEY (wi_document_version_id)
    REFERENCES qc.document_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_runs__form_document FOREIGN KEY (form_document_id)
    REFERENCES qc.document_identities (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_runs__form_version FOREIGN KEY (form_document_version_id)
    REFERENCES qc.document_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_runs__operator FOREIGN KEY (operator_id)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_runs__qc_observer FOREIGN KEY (qc_observer_id)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_runs__wi_asserted_by FOREIGN KEY (wi_applicability_asserted_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_runs__wi_verified_by FOREIGN KEY (wi_applicability_verified_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT ck_in_process_runs__form_snapshot CHECK (
    (form_attachment_state = 'ATTACHED'
      AND form_document_id IS NOT NULL AND form_document_version_id IS NOT NULL
      AND form_document_no IS NOT NULL AND form_revision IS NOT NULL
      AND form_content_hash IS NOT NULL AND form_source_files_snapshot IS NOT NULL)
    OR (form_attachment_state = 'NOT_ATTACHED_SOURCE_REQUIRED'
      AND form_document_id IS NULL AND form_document_version_id IS NULL
      AND form_document_no IS NULL AND form_revision IS NULL
      AND form_content_hash IS NULL AND form_source_files_snapshot IS NULL)
  ),
  CONSTRAINT ck_in_process_runs__applicability_verification CHECK (
    (wi_applicability_verified_by IS NULL AND wi_applicability_verified_at IS NULL)
    OR (wi_applicability_verified_by IS NOT NULL AND wi_applicability_verified_at IS NOT NULL)
  ),
  CONSTRAINT ck_in_process_runs__closure_disposition CHECK (
    (state = 'CLOSED' AND closed_at IS NOT NULL AND disposition IS NOT NULL
      AND length(btrim(coalesce(disposition_note, ''))) > 0)
    OR (state <> 'CLOSED' AND closed_at IS NULL AND disposition IS NULL AND disposition_note IS NULL)
  ),
  CONSTRAINT ck_in_process_runs__submission_timestamp CHECK (
    (state IN ('AWAITING_QC_REVIEW', 'RETURNED', 'QC_REVIEWED', 'CLOSED') AND submitted_at IS NOT NULL)
    OR (state = 'IN_PROGRESS')
  )
);

CREATE TABLE qc.in_process_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  run_id UUID NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  -- Clause/section identity inside the pinned WI revision the requirement text
  -- was transcribed from. Never a free-standing limit.
  step_reference TEXT NOT NULL CHECK (length(btrim(step_reference)) > 0),
  parameter_name TEXT NOT NULL CHECK (length(btrim(parameter_name)) > 0),
  unit TEXT,
  frequency_text TEXT NOT NULL CHECK (length(btrim(frequency_text)) > 0),
  sampling_text TEXT,
  acceptance_criteria_text TEXT NOT NULL CHECK (length(btrim(acceptance_criteria_text)) > 0),
  -- Exact transcribed numeric bounds (text, never a coerced float). They are
  -- material only after QC verification against the pinned revision.
  lower_limit_text TEXT,
  upper_limit_text TEXT,
  requirement_source TEXT NOT NULL DEFAULT 'WI_TRANSCRIPTION' CHECK (requirement_source = 'WI_TRANSCRIPTION'),
  wi_revision TEXT NOT NULL CHECK (length(btrim(wi_revision)) > 0),
  verification_state TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (
    verification_state IN ('UNVERIFIED', 'QC_VERIFIED')
  ),
  transcribed_by UUID NOT NULL,
  transcribed_login_identity TEXT NOT NULL,
  transcribed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  verified_against_revision TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_in_process_checkpoints__run_position UNIQUE (run_id, position),
  CONSTRAINT fk_in_process_checkpoints__run FOREIGN KEY (run_id)
    REFERENCES qc.in_process_runs (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_checkpoints__transcribed_by FOREIGN KEY (transcribed_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_checkpoints__verified_by FOREIGN KEY (verified_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT ck_in_process_checkpoints__numeric_bounds CHECK (
    (lower_limit_text IS NULL AND upper_limit_text IS NULL)
    OR (lower_limit_text IS NOT NULL AND upper_limit_text IS NOT NULL
      AND lower_limit_text ~ '^[0-9]+(\.[0-9]+)?$' AND upper_limit_text ~ '^[0-9]+(\.[0-9]+)?$')
  ),
  CONSTRAINT ck_in_process_checkpoints__verification CHECK (
    (verification_state = 'UNVERIFIED' AND verified_by IS NULL AND verified_at IS NULL
      AND verified_against_revision IS NULL)
    OR (verification_state = 'QC_VERIFIED' AND verified_by IS NOT NULL AND verified_at IS NOT NULL
      AND verified_against_revision IS NOT NULL)
  )
);

CREATE TABLE qc.in_process_readings (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  run_id UUID NOT NULL,
  checkpoint_id UUID NOT NULL,
  sample_reference TEXT,
  entry_state TEXT NOT NULL CHECK (entry_state IN ('DRAFT', 'RECORDED', 'SUPERSEDED')),
  value_text TEXT NOT NULL CHECK (length(btrim(value_text)) > 0),
  unit TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  comparison_state TEXT NOT NULL CHECK (
    comparison_state IN (
      'NOT_COMPARABLE', 'WITHIN_TRANSCRIBED_LIMITS', 'OUTSIDE_TRANSCRIBED_LIMITS', 'QUALITATIVE_RECORDED'
    )
  ),
  -- Comparison against transcribed bounds is a presentation fact, never a
  -- scientific PASS/FAIL result and never a release decision.
  comparison_note TEXT,
  recorded_by UUID NOT NULL,
  recorded_login_identity TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  superseded_by_reading_id UUID,
  superseded_at TIMESTAMPTZ,
  superseded_reason TEXT,
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT fk_in_process_readings__run FOREIGN KEY (run_id)
    REFERENCES qc.in_process_runs (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_readings__checkpoint FOREIGN KEY (checkpoint_id)
    REFERENCES qc.in_process_checkpoints (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_readings__recorded_by FOREIGN KEY (recorded_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT ck_in_process_readings__supersede CHECK (
    (entry_state = 'SUPERSEDED' AND superseded_at IS NOT NULL
      AND length(btrim(coalesce(superseded_reason, ''))) > 0)
    OR (entry_state <> 'SUPERSEDED' AND superseded_by_reading_id IS NULL
      AND superseded_at IS NULL AND superseded_reason IS NULL)
  )
);

CREATE TABLE qc.in_process_deviations (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  deviation_no TEXT NOT NULL CHECK (length(btrim(deviation_no)) > 0),
  run_id UUID NOT NULL,
  run_revision BIGINT NOT NULL CHECK (run_revision > 0),
  checkpoint_id UUID,
  reading_id UUID,
  category TEXT NOT NULL CHECK (
    category IN ('PROCESS_PARAMETER', 'MATERIAL', 'EQUIPMENT', 'DOCUMENT', 'OTHER')
  ),
  severity TEXT NOT NULL DEFAULT 'PENDING_QC_CLASSIFICATION' CHECK (
    severity IN ('PENDING_QC_CLASSIFICATION', 'MINOR', 'MAJOR', 'CRITICAL')
  ),
  description TEXT NOT NULL CHECK (length(btrim(description)) > 0),
  containment_state TEXT NOT NULL CHECK (containment_state IN ('DEFINED', 'NOT_YET_DEFINED')),
  immediate_containment TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (
    status IN ('OPEN', 'UNDER_QC_REVIEW', 'ACCEPTED_FOR_CONTINUATION', 'ESCALATED', 'CLOSED')
  ),
  disposition_note TEXT,
  classified_by UUID,
  classified_at TIMESTAMPTZ,
  flagged_by UUID NOT NULL,
  flagged_login_identity TEXT NOT NULL,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  snapshot JSONB NOT NULL,
  snapshot_sha256 TEXT NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT uq_in_process_deviations__deviation_no UNIQUE (deviation_no),
  CONSTRAINT fk_in_process_deviations__run FOREIGN KEY (run_id)
    REFERENCES qc.in_process_runs (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_deviations__checkpoint FOREIGN KEY (checkpoint_id)
    REFERENCES qc.in_process_checkpoints (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_deviations__reading FOREIGN KEY (reading_id)
    REFERENCES qc.in_process_readings (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_deviations__flagged_by FOREIGN KEY (flagged_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_deviations__classified_by FOREIGN KEY (classified_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT ck_in_process_deviations__containment CHECK (
    (containment_state = 'DEFINED' AND length(btrim(coalesce(immediate_containment, ''))) > 0)
    OR (containment_state = 'NOT_YET_DEFINED' AND immediate_containment IS NULL)
  ),
  CONSTRAINT ck_in_process_deviations__classification CHECK (
    (severity = 'PENDING_QC_CLASSIFICATION' AND classified_by IS NULL AND classified_at IS NULL)
    OR (severity <> 'PENDING_QC_CLASSIFICATION' AND classified_by IS NOT NULL AND classified_at IS NOT NULL)
  ),
  CONSTRAINT ck_in_process_deviations__disposition CHECK (
    (status IN ('OPEN', 'UNDER_QC_REVIEW') AND disposition_note IS NULL)
    OR (status IN ('ACCEPTED_FOR_CONTINUATION', 'ESCALATED', 'CLOSED')
      AND length(btrim(coalesce(disposition_note, ''))) > 0)
  )
);

-- A QC hold is a request. Nothing in this schema applies an inventory or
-- quarantine hold, because no approved mapping from an in-process run to a
-- held stock identity exists.
CREATE TABLE qc.in_process_hold_requests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  run_id UUID NOT NULL,
  run_revision BIGINT NOT NULL CHECK (run_revision > 0),
  deviation_id UUID,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (
    status IN ('REQUESTED', 'ACKNOWLEDGED', 'DECLINED')
  ),
  decision_note TEXT,
  requested_by UUID NOT NULL,
  requested_login_identity TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT fk_in_process_hold_requests__run FOREIGN KEY (run_id)
    REFERENCES qc.in_process_runs (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_hold_requests__deviation FOREIGN KEY (deviation_id)
    REFERENCES qc.in_process_deviations (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_hold_requests__requested_by FOREIGN KEY (requested_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_hold_requests__decided_by FOREIGN KEY (decided_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT ck_in_process_hold_requests__decision CHECK (
    (status = 'REQUESTED' AND decided_by IS NULL AND decided_at IS NULL AND decision_note IS NULL)
    OR (status IN ('ACKNOWLEDGED', 'DECLINED') AND decided_by IS NOT NULL AND decided_at IS NOT NULL
      AND length(btrim(coalesce(decision_note, ''))) > 0)
  )
);

CREATE TABLE qc.in_process_handovers (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  run_id UUID NOT NULL,
  run_revision BIGINT NOT NULL CHECK (run_revision > 0),
  from_shift_code TEXT NOT NULL CHECK (length(btrim(from_shift_code)) > 0),
  to_shift_code TEXT NOT NULL CHECK (length(btrim(to_shift_code)) > 0),
  from_operator_id UUID NOT NULL,
  -- The receiving operator is recorded only when they accept the handover with
  -- their own authenticated session; no directory entry is invented here.
  to_operator_id UUID,
  handover_note TEXT NOT NULL CHECK (length(btrim(handover_note)) > 0),
  status TEXT NOT NULL DEFAULT 'PENDING_ACCEPTANCE' CHECK (
    status IN ('PENDING_ACCEPTANCE', 'ACCEPTED', 'CANCELLED')
  ),
  handed_over_by UUID NOT NULL,
  handed_over_login_identity TEXT NOT NULL,
  handed_over_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_by UUID,
  accepted_at TIMESTAMPTZ,
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT fk_in_process_handovers__run FOREIGN KEY (run_id)
    REFERENCES qc.in_process_runs (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_handovers__from_operator FOREIGN KEY (from_operator_id)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_handovers__to_operator FOREIGN KEY (to_operator_id)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_handovers__handed_over_by FOREIGN KEY (handed_over_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_handovers__accepted_by FOREIGN KEY (accepted_by)
    REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT ck_in_process_handovers__acceptance CHECK (
    (status = 'PENDING_ACCEPTANCE' AND to_operator_id IS NULL
      AND accepted_by IS NULL AND accepted_at IS NULL)
    OR (status = 'CANCELLED' AND to_operator_id IS NULL
      AND accepted_by IS NULL AND accepted_at IS NULL)
    OR (status = 'ACCEPTED' AND to_operator_id IS NOT NULL
      AND accepted_by IS NOT NULL AND accepted_at IS NOT NULL)
  )
);

-- Append-only lifecycle and revision snapshots. `revision_number` is the run
-- version the snapshot was taken at, so historical evidence cannot be
-- rewritten by a later transition.
CREATE TABLE qc.in_process_run_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  run_id UUID NOT NULL,
  revision_number BIGINT NOT NULL CHECK (revision_number > 0),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'STARTED', 'WI_APPLICABILITY_VERIFIED', 'CHECKPOINT_TRANSCRIBED', 'CHECKPOINT_VERIFIED',
      'READING_DRAFTED', 'READING_RECORDED', 'READING_SUPERSEDED', 'DEVIATION_FLAGGED',
      'DEVIATION_CLASSIFIED', 'DEVIATION_DISPOSITIONED', 'HOLD_REQUESTED', 'HOLD_DECIDED',
      'HANDOVER_RECORDED', 'HANDOVER_ACCEPTED', 'SUBMITTED', 'RETURNED', 'QC_REVIEWED', 'CLOSED'
    )
  ),
  actor_id UUID NOT NULL,
  actor_login_identity TEXT NOT NULL,
  reason TEXT,
  snapshot JSONB NOT NULL,
  snapshot_sha256 TEXT NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT uq_in_process_run_events__run_revision UNIQUE (run_id, revision_number),
  CONSTRAINT fk_in_process_run_events__run FOREIGN KEY (run_id)
    REFERENCES qc.in_process_runs (id) ON DELETE RESTRICT,
  CONSTRAINT fk_in_process_run_events__actor FOREIGN KEY (actor_id)
    REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_in_process_runs__state ON qc.in_process_runs (state);
CREATE INDEX idx_in_process_runs__item_code ON qc.in_process_runs (item_code);
CREATE INDEX idx_in_process_runs__lot_no ON qc.in_process_runs (lot_no);
CREATE INDEX idx_in_process_runs__operator ON qc.in_process_runs (operator_id);
CREATE INDEX idx_in_process_runs__wi_version ON qc.in_process_runs (wi_document_version_id);
CREATE INDEX idx_in_process_checkpoints__run ON qc.in_process_checkpoints (run_id);
CREATE INDEX idx_in_process_readings__run ON qc.in_process_readings (run_id);
CREATE INDEX idx_in_process_readings__checkpoint ON qc.in_process_readings (checkpoint_id);
CREATE INDEX idx_in_process_deviations__run ON qc.in_process_deviations (run_id);
CREATE INDEX idx_in_process_hold_requests__run ON qc.in_process_hold_requests (run_id);
CREATE INDEX idx_in_process_handovers__run ON qc.in_process_handovers (run_id);
CREATE INDEX idx_in_process_run_events__run ON qc.in_process_run_events (run_id);
