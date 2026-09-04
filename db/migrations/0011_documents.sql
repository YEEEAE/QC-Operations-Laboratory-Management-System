CREATE TABLE qc.document_identities (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  document_no TEXT NOT NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  owner_id UUID,
  active BOOLEAN NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_document_identities__document_no UNIQUE (document_no),
  CONSTRAINT fk_document_identities__owner_id FOREIGN KEY (owner_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_document_identities__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.document_versions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  document_id UUID NOT NULL,
  revision TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('CATALOG_ONLY', 'DRAFT', 'IN_REVIEW', 'RETURNED', 'APPROVED', 'EFFECTIVE', 'SUPERSEDED', 'ARCHIVED', 'VOID')),
  effective_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  superseded_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  change_summary TEXT,
  content_hash TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_document_versions__revision UNIQUE (document_id, revision),
  CONSTRAINT fk_document_versions__document_id FOREIGN KEY (document_id) REFERENCES qc.document_identities (id) ON DELETE RESTRICT,
  CONSTRAINT fk_document_versions__approved_by FOREIGN KEY (approved_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_document_versions__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.document_version_files (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  document_version_id UUID NOT NULL,
  file_id UUID NOT NULL,
  file_role TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  linked_by UUID NOT NULL,
  CONSTRAINT fk_document_version_files__document_version_id FOREIGN KEY (document_version_id) REFERENCES qc.document_versions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_document_version_files__file_id FOREIGN KEY (file_id) REFERENCES qc.files (id) ON DELETE RESTRICT,
  CONSTRAINT fk_document_version_files__linked_by FOREIGN KEY (linked_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX uq_document_versions__effective_one
  ON qc.document_versions (document_id) WHERE state = 'EFFECTIVE';

ALTER TABLE qc.lab_document_usage
  ADD CONSTRAINT fk_lab_document_usage__document_version_id FOREIGN KEY (document_version_id) REFERENCES qc.document_versions (id) ON DELETE RESTRICT;

CREATE INDEX idx_document_versions__document_id ON qc.document_versions (document_id);
CREATE INDEX idx_document_versions__state ON qc.document_versions (state);
CREATE INDEX idx_document_version_files__document_version_id ON qc.document_version_files (document_version_id);
CREATE INDEX idx_document_version_files__file_id ON qc.document_version_files (file_id);

ALTER TABLE qc.document_identities OWNER TO qc_migrator;
ALTER TABLE qc.document_versions OWNER TO qc_migrator;
ALTER TABLE qc.document_version_files OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.document_identities, qc.document_versions TO qc_app_runtime;
GRANT SELECT, INSERT ON qc.document_version_files TO qc_app_runtime;
