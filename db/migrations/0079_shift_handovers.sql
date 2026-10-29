-- OPS-03: accountable cross-shift handovers.
-- Organizational values and write authority remain pending approved sources.
-- No roles are granted these permissions here and no notifications are sent.
ALTER TABLE qc.tasks
  ADD COLUMN IF NOT EXISTS area_code TEXT,
  ADD COLUMN IF NOT EXISTS shift_code TEXT;

INSERT INTO qc.permissions (id, code, domain, action, description, risk_level, active)
SELECT uuidv7(), seed.code, 'TASK', seed.action_code, seed.description, 'UNSPECIFIED', TRUE
FROM (VALUES
  ('PERM-TASK-HANDOVER-PREPARE', 'PREPARE_HANDOVER', 'Prepare a shift handover with linked operational records.'),
  ('PERM-TASK-HANDOVER-REVIEW', 'REVIEW_HANDOVER', 'Review a prepared shift handover.'),
  ('PERM-TASK-HANDOVER-ACCEPT', 'ACCEPT_HANDOVER', 'Accept a reviewed shift handover.'),
  ('PERM-TASK-HANDOVER-RETURN', 'RETURN_HANDOVER', 'Return a handover for correction.'),
  ('PERM-TASK-HANDOVER-ACK', 'ACK_HANDOVER', 'Acknowledge a shift handover.'),
  ('PERM-TASK-HANDOVER-REASSIGN', 'REASSIGN_HANDOVER_TASK', 'Reassign task ownership under explicit authorization.')
) AS seed(code, action_code, description)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE qc.shift_handovers (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  handover_no TEXT NOT NULL UNIQUE CHECK (length(btrim(handover_no)) > 0),
  from_shift_code TEXT NOT NULL CHECK (length(btrim(from_shift_code)) > 0),
  to_shift_code TEXT NOT NULL CHECK (length(btrim(to_shift_code)) > 0),
  area_code TEXT NOT NULL CHECK (length(btrim(area_code)) > 0),
  line_code TEXT NOT NULL CHECK (length(btrim(line_code)) > 0),
  initiated_by UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  accepted_by UUID REFERENCES qc.users(id) ON DELETE RESTRICT,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMPTZ,
  state TEXT NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT','PREPARED','IN_REVIEW','RETURNED','ACCEPTED','ACKNOWLEDGED')),
  -- Each entry names an existing record by type/id. No copied free-text statuses.
  linked_items JSONB NOT NULL CHECK (jsonb_typeof(linked_items) = 'array'),
  -- Captured source facts and restricted equipment identifiers at handover time.
  snapshot JSONB NOT NULL,
  snapshot_sha256 TEXT NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  return_reason TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  request_id TEXT NOT NULL UNIQUE CHECK (length(btrim(request_id)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((state IN ('ACCEPTED','ACKNOWLEDGED') AND accepted_by IS NOT NULL AND accepted_at IS NOT NULL)
    OR (state NOT IN ('ACCEPTED','ACKNOWLEDGED') AND accepted_by IS NULL AND accepted_at IS NULL))
);

CREATE TABLE qc.shift_handover_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  handover_id UUID NOT NULL REFERENCES qc.shift_handovers(id) ON DELETE RESTRICT,
  revision BIGINT NOT NULL CHECK (revision > 0),
  event_type TEXT NOT NULL CHECK (event_type IN ('PREPARED','REVIEWED','RETURNED','ACCEPTED','ACKNOWLEDGED','REASSIGNMENT_REQUESTED')),
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  snapshot JSONB NOT NULL,
  snapshot_sha256 TEXT NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  request_id TEXT NOT NULL,
  UNIQUE (handover_id, revision),
  UNIQUE (request_id)
);

CREATE INDEX idx_shift_handovers__inbox ON qc.shift_handovers(area_code, to_shift_code, state, initiated_at DESC);
CREATE INDEX idx_shift_handovers__outbox ON qc.shift_handovers(area_code, from_shift_code, state, initiated_at DESC);

CREATE FUNCTION qc.reject_shift_handover_evidence_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'shift handover evidence is append-only'; END $$;
CREATE TRIGGER trg_shift_handover_events__immutable
BEFORE UPDATE OR DELETE ON qc.shift_handover_events
FOR EACH ROW EXECUTE FUNCTION qc.reject_shift_handover_evidence_mutation();

CREATE FUNCTION qc.protect_shift_handover_snapshot() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.from_shift_code, NEW.to_shift_code, NEW.area_code, NEW.line_code,
      NEW.initiated_by, NEW.initiated_at, NEW.linked_items, NEW.snapshot, NEW.snapshot_sha256)
     IS DISTINCT FROM
     (OLD.from_shift_code, OLD.to_shift_code, OLD.area_code, OLD.line_code,
      OLD.initiated_by, OLD.initiated_at, OLD.linked_items, OLD.snapshot, OLD.snapshot_sha256) THEN
    RAISE EXCEPTION 'shift handover snapshot is immutable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_shift_handovers__snapshot_immutable
BEFORE UPDATE ON qc.shift_handovers
FOR EACH ROW EXECUTE FUNCTION qc.protect_shift_handover_snapshot();
