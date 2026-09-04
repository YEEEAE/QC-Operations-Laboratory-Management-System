CREATE TABLE qc.roles (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  code TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_roles__code UNIQUE (code)
);

CREATE TABLE qc.permissions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  code TEXT NOT NULL,
  domain TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  risk_level TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_permissions__code UNIQUE (code)
);

CREATE TABLE qc.role_permissions (
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions__role_id
    FOREIGN KEY (role_id) REFERENCES qc.roles (id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_permissions__permission_id
    FOREIGN KEY (permission_id) REFERENCES qc.permissions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_permissions__granted_by
    FOREIGN KEY (granted_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.user_roles (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  reason TEXT,
  CONSTRAINT ck_user_roles__valid_range
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from),
  CONSTRAINT ck_user_roles__revocation_pair
    CHECK ((revoked_at IS NULL) = (revoked_by IS NULL)),
  CONSTRAINT fk_user_roles__user_id
    FOREIGN KEY (user_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles__role_id
    FOREIGN KEY (role_id) REFERENCES qc.roles (id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles__assigned_by
    FOREIGN KEY (assigned_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles__revoked_by
    FOREIGN KEY (revoked_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_role_permissions__permission_id ON qc.role_permissions (permission_id);
CREATE INDEX idx_user_roles__user_id ON qc.user_roles (user_id);
CREATE INDEX idx_user_roles__role_id ON qc.user_roles (role_id);

INSERT INTO qc.roles (code, name, is_system_role)
VALUES
  ('EMPLOYEE', 'Employee', TRUE),
  ('SUPERVISOR', 'Supervisor', TRUE),
  ('MANAGER', 'Manager', TRUE),
  ('ADMIN', 'Admin', TRUE);

ALTER TABLE qc.roles OWNER TO qc_migrator;
ALTER TABLE qc.permissions OWNER TO qc_migrator;
ALTER TABLE qc.role_permissions OWNER TO qc_migrator;
ALTER TABLE qc.user_roles OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.roles TO qc_app_runtime;
GRANT SELECT, INSERT, UPDATE ON qc.permissions TO qc_app_runtime;
GRANT SELECT, INSERT, DELETE ON qc.role_permissions TO qc_app_runtime;
GRANT SELECT, INSERT, UPDATE ON qc.user_roles TO qc_app_runtime;
