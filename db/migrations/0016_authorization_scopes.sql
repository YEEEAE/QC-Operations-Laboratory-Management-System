CREATE TABLE qc.user_scopes (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL,
  scope_kind TEXT NOT NULL CHECK (scope_kind IN ('OWN', 'ASSIGNED', 'TEAM', 'DEPARTMENT', 'SITE', 'DOMAIN', 'GLOBAL')),
  scope_value TEXT,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  reason TEXT,
  CONSTRAINT ck_user_scopes__value CHECK (scope_kind IN ('OWN', 'ASSIGNED', 'GLOBAL') OR length(btrim(COALESCE(scope_value, ''))) > 0),
  CONSTRAINT ck_user_scopes__revocation_pair CHECK ((revoked_at IS NULL) = (revoked_by IS NULL)),
  CONSTRAINT fk_user_scopes__user_id FOREIGN KEY (user_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_scopes__assigned_by FOREIGN KEY (assigned_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_scopes__revoked_by FOREIGN KEY (revoked_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX uq_user_scopes__active ON qc.user_scopes (user_id, scope_kind, COALESCE(scope_value, '')) WHERE revoked_at IS NULL;
CREATE INDEX idx_user_scopes__user_id ON qc.user_scopes (user_id);
ALTER TABLE qc.user_scopes OWNER TO qc_migrator;
GRANT SELECT, INSERT, UPDATE ON qc.user_scopes TO qc_app_runtime;
