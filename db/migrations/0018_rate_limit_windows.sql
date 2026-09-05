-- 0018: Rate-limit fixed-window counters (MASTER-031).
-- Durable shared counter storage for high-risk endpoint abuse protection
-- (SECURITY-ARCHITECTURE §33/§141/§142). Thresholds live in configuration,
-- never in the schema. Expired windows are prunable; history is not auditable
-- business data and safe to remove.

CREATE TABLE qc.rate_limit_windows (
  policy_name TEXT NOT NULL,
  bucket_key TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  window_ended_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_rate_limit_windows PRIMARY KEY (policy_name, bucket_key, window_started_at),
  CONSTRAINT ck_rate_limit_windows__window CHECK (window_ended_at > window_started_at)
);

CREATE INDEX idx_rate_limit_windows__expiry ON qc.rate_limit_windows (window_ended_at);

ALTER TABLE qc.rate_limit_windows OWNER TO qc_migrator;
GRANT SELECT, INSERT, UPDATE, DELETE ON qc.rate_limit_windows TO qc_app_runtime;
