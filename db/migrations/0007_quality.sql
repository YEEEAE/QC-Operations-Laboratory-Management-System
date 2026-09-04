CREATE TABLE qc.findings (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  finding_no TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT NOT NULL CHECK (length(btrim(description)) > 0),
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'OPEN', 'UNDER_REVIEW', 'CLOSED', 'VOID')),
  severity TEXT,
  owner_id UUID,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_findings__finding_no UNIQUE (finding_no),
  CONSTRAINT fk_findings__owner_id FOREIGN KEY (owner_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_findings__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.ncrs (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  ncr_no TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT NOT NULL CHECK (length(btrim(description)) > 0),
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'OPEN', 'UNDER_INVESTIGATION', 'RCA_IN_PROGRESS', 'CAPA_IN_PROGRESS', 'READY_FOR_CLOSURE', 'CLOSED', 'VOID')),
  finding_id UUID,
  affected_item_code TEXT,
  affected_lot TEXT,
  owner_id UUID,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_ncrs__ncr_no UNIQUE (ncr_no),
  CONSTRAINT fk_ncrs__finding_id FOREIGN KEY (finding_id) REFERENCES qc.findings (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ncrs__owner_id FOREIGN KEY (owner_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ncrs__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.rcas (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  rca_no TEXT,
  ncr_id UUID NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'RETURNED', 'VOID')),
  method TEXT,
  analysis TEXT,
  root_cause TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_rcas__rca_no UNIQUE (rca_no),
  CONSTRAINT fk_rcas__ncr_id FOREIGN KEY (ncr_id) REFERENCES qc.ncrs (id) ON DELETE RESTRICT,
  CONSTRAINT fk_rcas__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.capas (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  capa_no TEXT NOT NULL,
  ncr_id UUID,
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'EFFECTIVENESS_REVIEW', 'READY_FOR_CLOSURE', 'CLOSED', 'VOID')),
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT NOT NULL CHECK (length(btrim(description)) > 0),
  owner_id UUID,
  target_date DATE,
  verification_required BOOLEAN NOT NULL,
  effectiveness_required BOOLEAN NOT NULL,
  closed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_capas__capa_no UNIQUE (capa_no),
  CONSTRAINT fk_capas__ncr_id FOREIGN KEY (ncr_id) REFERENCES qc.ncrs (id) ON DELETE RESTRICT,
  CONSTRAINT fk_capas__owner_id FOREIGN KEY (owner_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_capas__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.capa_actions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  capa_id UUID NOT NULL,
  sequence_no INTEGER NOT NULL,
  description TEXT NOT NULL CHECK (length(btrim(description)) > 0),
  owner_id UUID NOT NULL,
  due_at TIMESTAMPTZ,
  state TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  verification_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_capa_actions__sequence UNIQUE (capa_id, sequence_no),
  CONSTRAINT fk_capa_actions__capa_id FOREIGN KEY (capa_id) REFERENCES qc.capas (id) ON DELETE RESTRICT,
  CONSTRAINT fk_capa_actions__owner_id FOREIGN KEY (owner_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_capa_actions__completed_by FOREIGN KEY (completed_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_findings__state ON qc.findings (state);
CREATE INDEX idx_findings__owner_id ON qc.findings (owner_id);
CREATE INDEX idx_ncrs__state ON qc.ncrs (state);
CREATE INDEX idx_ncrs__finding_id ON qc.ncrs (finding_id);
CREATE INDEX idx_ncrs__owner_id ON qc.ncrs (owner_id);
CREATE INDEX idx_rcas__ncr_id ON qc.rcas (ncr_id);
CREATE INDEX idx_capas__state ON qc.capas (state);
CREATE INDEX idx_capas__ncr_id ON qc.capas (ncr_id);
CREATE INDEX idx_capas__owner_id ON qc.capas (owner_id);
CREATE INDEX idx_capa_actions__capa_id ON qc.capa_actions (capa_id);
CREATE INDEX idx_capa_actions__owner_id ON qc.capa_actions (owner_id);

ALTER TABLE qc.findings OWNER TO qc_migrator;
ALTER TABLE qc.ncrs OWNER TO qc_migrator;
ALTER TABLE qc.rcas OWNER TO qc_migrator;
ALTER TABLE qc.capas OWNER TO qc_migrator;
ALTER TABLE qc.capa_actions OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.findings, qc.ncrs, qc.rcas, qc.capas, qc.capa_actions TO qc_app_runtime;
