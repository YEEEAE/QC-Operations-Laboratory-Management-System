-- ASSET-01: source-bound operational equipment eligibility.
-- No equipment is imported or approved by this migration.

ALTER TABLE qc.equipment
  ADD COLUMN source_state TEXT NOT NULL DEFAULT 'UNKNOWN_SOURCE'
    CHECK (source_state IN ('UNKNOWN_SOURCE', 'PENDING_SOURCE_APPROVAL', 'APPROVED', 'REJECTED')),
  ADD COLUMN site_code TEXT,
  ADD COLUMN allowed_method_codes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN allowed_area_codes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN source_evidence JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(source_evidence) = 'array'),
  ADD COLUMN source_revision_id UUID REFERENCES qc.master_data_import_revisions(id) ON DELETE RESTRICT;

ALTER TABLE qc.equipment
  ADD CONSTRAINT ck_equipment__approved_source_complete CHECK (
    source_state <> 'APPROVED' OR (
      source_revision_id IS NOT NULL
      AND site_code IS NOT NULL AND length(btrim(site_code)) > 0
      AND serial_no IS NOT NULL AND length(btrim(serial_no)) > 0
      AND jsonb_array_length(source_evidence) > 0
      AND cardinality(allowed_method_codes) > 0
      AND cardinality(allowed_area_codes) > 0
    )
  );

CREATE TABLE qc.equipment_source_requests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  equipment_id UUID NOT NULL REFERENCES qc.equipment(id) ON DELETE RESTRICT,
  requested_by UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  source_revision_id UUID REFERENCES qc.master_data_import_revisions(id) ON DELETE RESTRICT,
  site_code TEXT,
  serial_no TEXT,
  proposed_method_codes TEXT[] NOT NULL DEFAULT '{}',
  proposed_area_codes TEXT[] NOT NULL DEFAULT '{}',
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  request_id TEXT NOT NULL UNIQUE CHECK (length(btrim(request_id)) > 0),
  state TEXT NOT NULL DEFAULT 'PENDING_SOURCE_APPROVAL'
    CHECK (state IN ('PENDING_SOURCE_APPROVAL', 'PENDING_POLICY', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (state <> 'PENDING_SOURCE_APPROVAL' OR source_revision_id IS NOT NULL)
);

CREATE INDEX idx_equipment_source_requests__pending
  ON qc.equipment_source_requests (state, created_at, id);

CREATE FUNCTION qc.reject_equipment_source_request_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'equipment source requests are immutable; submit a new request';
END;
$$;
CREATE TRIGGER equipment_source_requests_append_only
  BEFORE UPDATE OR DELETE ON qc.equipment_source_requests
  FOR EACH ROW EXECUTE FUNCTION qc.reject_equipment_source_request_mutation();

COMMENT ON COLUMN qc.equipment.source_state IS
  'Source approval state; migration leaves all existing equipment UNKNOWN_SOURCE and imports none.';
COMMENT ON TABLE qc.equipment_source_requests IS
  'Immutable source-onboarding requests. No approval transition is available until SYS-10 authority is approved.';
