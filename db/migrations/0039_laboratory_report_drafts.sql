CREATE TABLE qc.laboratory_report_drafts (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  report_type TEXT NOT NULL CHECK (report_type IN ('SUBATMOSPHERIC_AIR_LEAKAGE', 'PRESSURE_DECAY')),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(form_data) = 'object'),
  author_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX idx_laboratory_report_drafts_author_updated
  ON qc.laboratory_report_drafts (author_id, updated_at DESC);
