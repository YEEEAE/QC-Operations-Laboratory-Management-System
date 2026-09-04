CREATE TABLE qc.approval_cases (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  subject_version BIGINT NOT NULL CHECK (subject_version > 0),
  workflow_type TEXT NOT NULL,
  state TEXT NOT NULL,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT fk_approval_cases__requested_by FOREIGN KEY (requested_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.approval_work_items (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  approval_case_id UUID NOT NULL,
  step_no INTEGER NOT NULL,
  work_type TEXT NOT NULL CHECK (work_type IN ('REVIEW', 'APPROVAL')),
  assigned_user_id UUID,
  assigned_role_requirement TEXT,
  state TEXT NOT NULL CHECK (state IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'RETURNED', 'CANCELLED', 'EXPIRED')),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_approval_work_items__step UNIQUE (approval_case_id, step_no),
  CONSTRAINT fk_approval_work_items__approval_case_id FOREIGN KEY (approval_case_id) REFERENCES qc.approval_cases (id) ON DELETE RESTRICT,
  CONSTRAINT fk_approval_work_items__assigned_user_id FOREIGN KEY (assigned_user_id) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.electronic_signatures (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  actor_id UUID NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  subject_version BIGINT NOT NULL CHECK (subject_version > 0),
  action TEXT NOT NULL,
  meaning TEXT NOT NULL CHECK (length(btrim(meaning)) > 0),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  snapshot_hash TEXT NOT NULL,
  reason TEXT,
  reauth_method TEXT NOT NULL,
  request_id TEXT NOT NULL,
  CONSTRAINT fk_electronic_signatures__actor_id FOREIGN KEY (actor_id) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.approval_decisions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  approval_case_id UUID NOT NULL,
  work_item_id UUID,
  actor_id UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVE', 'REJECT', 'RETURN')),
  subject_version BIGINT NOT NULL CHECK (subject_version > 0),
  reason TEXT,
  comments TEXT,
  signature_id UUID,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT NOT NULL,
  CONSTRAINT fk_approval_decisions__approval_case_id FOREIGN KEY (approval_case_id) REFERENCES qc.approval_cases (id) ON DELETE RESTRICT,
  CONSTRAINT fk_approval_decisions__work_item_id FOREIGN KEY (work_item_id) REFERENCES qc.approval_work_items (id) ON DELETE RESTRICT,
  CONSTRAINT fk_approval_decisions__actor_id FOREIGN KEY (actor_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_approval_decisions__signature_id FOREIGN KEY (signature_id) REFERENCES qc.electronic_signatures (id) ON DELETE RESTRICT
);

CREATE INDEX idx_approval_cases__subject ON qc.approval_cases (subject_type, subject_id);
CREATE INDEX idx_approval_cases__state ON qc.approval_cases (state);
CREATE INDEX idx_approval_work_items__approval_case_id ON qc.approval_work_items (approval_case_id);
CREATE INDEX idx_approval_work_items__assigned_user_id ON qc.approval_work_items (assigned_user_id);
CREATE INDEX idx_approval_decisions__approval_case_id ON qc.approval_decisions (approval_case_id);
CREATE INDEX idx_approval_decisions__request_id ON qc.approval_decisions (request_id);
CREATE INDEX idx_electronic_signatures__subject ON qc.electronic_signatures (subject_type, subject_id);
CREATE INDEX idx_electronic_signatures__request_id ON qc.electronic_signatures (request_id);

ALTER TABLE qc.approval_cases OWNER TO qc_migrator;
ALTER TABLE qc.approval_work_items OWNER TO qc_migrator;
ALTER TABLE qc.approval_decisions OWNER TO qc_migrator;
ALTER TABLE qc.electronic_signatures OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.approval_cases, qc.approval_work_items TO qc_app_runtime;
GRANT SELECT, INSERT ON qc.approval_decisions, qc.electronic_signatures TO qc_app_runtime;
