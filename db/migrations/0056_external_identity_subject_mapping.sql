CREATE TABLE qc.external_identity_links (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL,
  issuer TEXT NOT NULL CHECK (issuer ~ '^https://[^[:space:]]+$'),
  subject TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 512 AND subject = btrim(subject)),
  state TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (state IN ('ACTIVE', 'DEACTIVATED')),
  source TEXT NOT NULL CHECK (source IN ('OPERATOR_VERIFIED')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deactivated_by UUID,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT CHECK (
    deactivation_reason IS NULL OR deactivation_reason IN (
      'REVOKED', 'MERGED', 'DUPLICATE_IDENTITY', 'OPERATOR_REMOVAL'
    )
  ),
  deactivation_note TEXT,
  CONSTRAINT uq_external_identity_links__issuer_subject UNIQUE (issuer, subject),
  CONSTRAINT uq_external_identity_links__issuer_user UNIQUE (issuer, user_id),
  CONSTRAINT ck_external_identity_links__deactivation_pair CHECK (
    (state = 'ACTIVE' AND deactivated_by IS NULL AND deactivated_at IS NULL AND deactivation_reason IS NULL)
    OR
    (state = 'DEACTIVATED' AND deactivated_by IS NOT NULL AND deactivated_at IS NOT NULL AND deactivation_reason IS NOT NULL)
  ),
  CONSTRAINT fk_external_identity_links__user_id
    FOREIGN KEY (user_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_external_identity_links__created_by
    FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_external_identity_links__approved_by
    FOREIGN KEY (approved_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_external_identity_links__deactivated_by
    FOREIGN KEY (deactivated_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_external_identity_links__user_id
  ON qc.external_identity_links (user_id, issuer);

COMMENT ON TABLE qc.external_identity_links IS
  'Operator-approved external issuer/subject mapping to existing QC users. Subject references are not credentials; links are never auto-provisioned and deactivated identity keys remain reserved.';
