-- Role matrix proposals are retained as pending requests until an approved
-- responsibility and scope source defines who may receive each grant.
CREATE TABLE qc.authorization_matrix_change_requests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  role_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  request_id TEXT NOT NULL,
  idempotency_key UUID NOT NULL,
  expected_role_version BIGINT NOT NULL CHECK (expected_role_version > 0),
  reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 8 AND 500),
  proposed_permission_codes JSONB NOT NULL CHECK (jsonb_typeof(proposed_permission_codes) = 'array'),
  proposed_scope_assignments JSONB NOT NULL CHECK (jsonb_typeof(proposed_scope_assignments) = 'array'),
  status TEXT NOT NULL DEFAULT 'PENDING_POLICY' CHECK (status = 'PENDING_POLICY'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_authorization_matrix_change_requests__request_id UNIQUE (request_id),
  CONSTRAINT uq_authorization_matrix_change_requests__actor_idempotency UNIQUE (requested_by, idempotency_key),
  CONSTRAINT fk_authorization_matrix_change_requests__role_id
    FOREIGN KEY (role_id) REFERENCES qc.roles (id) ON DELETE RESTRICT,
  CONSTRAINT fk_authorization_matrix_change_requests__requested_by
    FOREIGN KEY (requested_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_authorization_matrix_change_requests__role_status
  ON qc.authorization_matrix_change_requests (role_id, status, created_at DESC);

CREATE FUNCTION qc.prevent_authorization_matrix_change_request_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'authorization matrix change requests are immutable';
END;
$function$;

CREATE TRIGGER trg_authorization_matrix_change_requests_immutable
  BEFORE UPDATE OR DELETE ON qc.authorization_matrix_change_requests
  FOR EACH ROW EXECUTE FUNCTION qc.prevent_authorization_matrix_change_request_mutation();

CREATE TABLE qc.authorization_scope_change_requests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  request_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 8 AND 500),
  proposed_scope_assignments JSONB NOT NULL CHECK (jsonb_typeof(proposed_scope_assignments) = 'array'),
  status TEXT NOT NULL DEFAULT 'PENDING_POLICY' CHECK (status = 'PENDING_POLICY'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_authorization_scope_change_requests__request_id UNIQUE (request_id),
  CONSTRAINT fk_authorization_scope_change_requests__user_id
    FOREIGN KEY (user_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_authorization_scope_change_requests__requested_by
    FOREIGN KEY (requested_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_authorization_scope_change_requests__user_status
  ON qc.authorization_scope_change_requests (user_id, status, created_at DESC);

CREATE TRIGGER trg_authorization_scope_change_requests_immutable
  BEFORE UPDATE OR DELETE ON qc.authorization_scope_change_requests
  FOR EACH ROW EXECUTE FUNCTION qc.prevent_authorization_matrix_change_request_mutation();
