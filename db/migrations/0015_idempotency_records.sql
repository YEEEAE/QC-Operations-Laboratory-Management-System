CREATE TABLE qc.idempotency_records (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL CHECK (request_fingerprint ~ '^[0-9a-f]{64}$'),
  status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  CONSTRAINT uq_idempotency_records__key UNIQUE (key),
  CONSTRAINT ck_idempotency_records__completed_pair CHECK ((status = 'COMPLETED') = (completed_at IS NOT NULL))
);

ALTER TABLE qc.idempotency_records OWNER TO qc_migrator;
GRANT SELECT, INSERT, UPDATE ON qc.idempotency_records TO qc_app_runtime;
