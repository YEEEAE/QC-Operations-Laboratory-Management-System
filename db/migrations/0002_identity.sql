CREATE TABLE qc.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL,
  requested_by UUID,
  token_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  request_method TEXT NOT NULL,
  CONSTRAINT ck_password_reset_requests__expires_after_creation
    CHECK (expires_at > created_at),
  CONSTRAINT fk_password_reset_requests__user_id
    FOREIGN KEY (user_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_password_reset_requests__requested_by
    FOREIGN KEY (requested_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_password_reset_requests__user_id
  ON qc.password_reset_requests (user_id);
CREATE INDEX idx_password_reset_requests__active_expiry
  ON qc.password_reset_requests (expires_at)
  WHERE used_at IS NULL AND revoked_at IS NULL;

ALTER TABLE qc.password_reset_requests OWNER TO qc_migrator;
GRANT SELECT, INSERT, UPDATE ON qc.password_reset_requests TO qc_app_runtime;
