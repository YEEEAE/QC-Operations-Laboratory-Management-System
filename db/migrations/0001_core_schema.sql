CREATE SCHEMA IF NOT EXISTS qc;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA qc FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qc_migrator') THEN
    CREATE ROLE qc_migrator NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qc_app_runtime') THEN
    CREATE ROLE qc_app_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

CREATE TABLE qc.schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  checksum TEXT NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  execution_ms INTEGER CHECK (execution_ms IS NULL OR execution_ms >= 0),
  runner_version TEXT
);

CREATE TABLE qc.users (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  login_identity TEXT NOT NULL,
  email TEXT,
  display_name TEXT NOT NULL CHECK (length(btrim(display_name)) > 0),
  password_hash TEXT NOT NULL,
  account_state TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (account_state IN ('ACTIVE', 'INACTIVE', 'DISABLED')),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_users__login_identity UNIQUE (login_identity),
  CONSTRAINT fk_users__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_users__updated_by FOREIGN KEY (updated_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.sessions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL,
  session_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_sessions__token_hash UNIQUE (session_token_hash),
  CONSTRAINT ck_sessions__expires_after_creation CHECK (expires_at > created_at),
  CONSTRAINT ck_sessions__revocation_pair CHECK ((revoked_at IS NULL) = (revoked_reason IS NULL)),
  CONSTRAINT fk_sessions__user_id FOREIGN KEY (user_id) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.audit_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  event_no BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('USER', 'SYSTEM', 'SERVICE')),
  actor_id UUID,
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  action TEXT NOT NULL,
  transition_id TEXT,
  old_state TEXT,
  new_state TEXT,
  reason TEXT,
  request_id TEXT NOT NULL,
  signature_id UUID,
  payload JSONB,
  CONSTRAINT fk_audit_events__actor_id FOREIGN KEY (actor_id) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.outbox_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  available_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error TEXT,
  dedupe_key TEXT,
  CONSTRAINT uq_outbox_events__dedupe_key UNIQUE (dedupe_key)
);

CREATE INDEX idx_sessions__user_id ON qc.sessions (user_id);
CREATE INDEX idx_sessions__active_expiry ON qc.sessions (expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_audit_events__request_id ON qc.audit_events (request_id);
CREATE INDEX idx_audit_events__subject ON qc.audit_events (subject_type, subject_id);
CREATE INDEX idx_outbox_events__available ON qc.outbox_events (available_at) WHERE processed_at IS NULL;

ALTER SCHEMA qc OWNER TO qc_migrator;
ALTER TABLE qc.schema_migrations OWNER TO qc_migrator;
ALTER TABLE qc.users OWNER TO qc_migrator;
ALTER TABLE qc.sessions OWNER TO qc_migrator;
ALTER TABLE qc.audit_events OWNER TO qc_migrator;
ALTER TABLE qc.outbox_events OWNER TO qc_migrator;

GRANT USAGE ON SCHEMA qc TO qc_app_runtime;
GRANT SELECT, INSERT, UPDATE ON qc.users TO qc_app_runtime;
GRANT SELECT, INSERT, UPDATE ON qc.sessions TO qc_app_runtime;
GRANT SELECT, INSERT ON qc.audit_events TO qc_app_runtime;
GRANT SELECT, INSERT, UPDATE ON qc.outbox_events TO qc_app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA qc TO qc_app_runtime;
