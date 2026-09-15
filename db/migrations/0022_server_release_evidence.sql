CREATE TABLE qc.release_gate_evidence (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  release_id UUID NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('ci','security','database','e2e','uat','signatures','criticalRisks','residualRisk')),
  status TEXT NOT NULL CHECK (status IN ('PASS','PARTIAL','FAIL','UNVERIFIED','NOT_APPLICABLE')),
  source TEXT NOT NULL CHECK (length(btrim(source)) > 0),
  immutable_reference TEXT NOT NULL CHECK (length(btrim(immutable_reference)) > 0),
  observed_at TIMESTAMPTZ NOT NULL,
  git_sha TEXT NOT NULL CHECK (git_sha ~ '^[0-9a-fA-F]{40}$'),
  build_id TEXT NOT NULL CHECK (length(btrim(build_id)) > 0),
  application_version TEXT NOT NULL CHECK (length(btrim(application_version)) > 0),
  migration_head TEXT NOT NULL CHECK (length(btrim(migration_head)) > 0),
  uat_cycle_id TEXT NOT NULL CHECK (length(btrim(uat_cycle_id)) > 0),
  release_version BIGINT NOT NULL CHECK (release_version > 0),
  evidence_version BIGINT NOT NULL CHECK (evidence_version > 0),
  recorded_by TEXT NOT NULL CHECK (length(btrim(recorded_by)) > 0),
  audit_info JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_release_gate_evidence__release FOREIGN KEY (release_id) REFERENCES qc.release_candidates (id) ON DELETE RESTRICT
);

CREATE TABLE qc.release_risk_evidence (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  release_id UUID NOT NULL,
  risk_id TEXT NOT NULL CHECK (length(btrim(risk_id)) > 0),
  severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','MODERATE','HIGH','VERY_HIGH','CRITICAL')),
  status TEXT NOT NULL CHECK (status IN ('OPEN','MITIGATED','ACCEPTED','CLOSED','BLOCKED')),
  source TEXT NOT NULL CHECK (source = 'CONTROLLED_RISK_REGISTER'),
  immutable_reference TEXT NOT NULL CHECK (length(btrim(immutable_reference)) > 0),
  observed_at TIMESTAMPTZ NOT NULL,
  git_sha TEXT NOT NULL CHECK (git_sha ~ '^[0-9a-fA-F]{40}$'),
  build_id TEXT NOT NULL CHECK (length(btrim(build_id)) > 0),
  application_version TEXT NOT NULL CHECK (length(btrim(application_version)) > 0),
  migration_head TEXT NOT NULL CHECK (length(btrim(migration_head)) > 0),
  uat_cycle_id TEXT NOT NULL CHECK (length(btrim(uat_cycle_id)) > 0),
  release_version BIGINT NOT NULL CHECK (release_version > 0),
  evidence_version BIGINT NOT NULL CHECK (evidence_version > 0),
  recorded_by TEXT NOT NULL CHECK (length(btrim(recorded_by)) > 0),
  acceptance JSONB,
  audit_info JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_release_risk_evidence__release FOREIGN KEY (release_id) REFERENCES qc.release_candidates (id) ON DELETE RESTRICT
);

CREATE INDEX idx_release_gate_evidence__release ON qc.release_gate_evidence (release_id, evidence_type, evidence_version DESC);
CREATE INDEX idx_release_risk_evidence__release ON qc.release_risk_evidence (release_id, risk_id, evidence_version DESC);
