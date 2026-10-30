CREATE TABLE qc.ai_advisory_policy_versions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  revision INTEGER NOT NULL UNIQUE CHECK (revision > 0),
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
    CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUPERSEDED', 'EXPIRED')),
  external_processing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  approved_data_classes TEXT[] NOT NULL DEFAULT '{}',
  provider_allowlist TEXT[] NOT NULL DEFAULT '{}',
  consent_scope TEXT,
  retention_days INTEGER CHECK (retention_days IS NULL OR retention_days >= 0),
  destination TEXT,
  owner_user_id UUID REFERENCES qc.users (id) ON DELETE RESTRICT,
  source_reference TEXT,
  source_revision TEXT,
  source_sha256 CHAR(64) CHECK (source_sha256 IS NULL OR source_sha256 ~ '^[0-9a-f]{64}$'),
  legal_clearance_reference TEXT,
  it_clearance_reference TEXT,
  internal_approval_reference TEXT,
  approved_by UUID REFERENCES qc.users (id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES qc.users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK (effective_to IS NULL OR effective_from IS NOT NULL AND effective_to > effective_from),
  CHECK (NOT external_processing_enabled OR status = 'APPROVED'),
  CHECK (status <> 'APPROVED' OR (
    owner_user_id IS NOT NULL AND approved_by IS NOT NULL AND approved_at IS NOT NULL
    AND effective_from IS NOT NULL AND retention_days IS NOT NULL
    AND cardinality(approved_data_classes) > 0 AND cardinality(provider_allowlist) > 0
    AND NULLIF(btrim(consent_scope), '') IS NOT NULL AND NULLIF(btrim(destination), '') IS NOT NULL
    AND NULLIF(btrim(source_reference), '') IS NOT NULL AND NULLIF(btrim(source_revision), '') IS NOT NULL
    AND source_sha256 IS NOT NULL AND NULLIF(btrim(legal_clearance_reference), '') IS NOT NULL
    AND NULLIF(btrim(it_clearance_reference), '') IS NOT NULL
    AND NULLIF(btrim(internal_approval_reference), '') IS NOT NULL
  ))
);

CREATE TABLE qc.ai_advisory_policy_decisions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  policy_version_id UUID REFERENCES qc.ai_advisory_policy_versions (id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES qc.users (id) ON DELETE RESTRICT,
  request_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('SUMMARIZE', 'SUGGEST', 'DRAFT')),
  data_class TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('REFUSED', 'UNAVAILABLE', 'ALLOWED')),
  reason_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
