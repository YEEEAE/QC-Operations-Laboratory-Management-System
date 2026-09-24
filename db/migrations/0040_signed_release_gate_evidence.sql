-- QC-ADP-03: bind imported provider evidence to an authenticated signer and
-- its owner-approved gate scope. Existing signed UAT evidence remains owned by
-- the UAT acceptance transaction.
ALTER TABLE qc.release_gate_evidence
  ADD COLUMN evidence_digest TEXT,
  ADD COLUMN signer_id TEXT,
  ADD COLUMN signer_key_id TEXT,
  ADD COLUMN signer_scope JSONB,
  ADD COLUMN signature_digest TEXT;

ALTER TABLE qc.release_gate_evidence
  ADD CONSTRAINT ck_release_gate_evidence__provider_attestation
  CHECK (
    (source = 'SIGNED_PROVIDER_ATTESTATION'
      AND evidence_digest IS NOT NULL AND evidence_digest ~ '^[0-9a-f]{64}$'
      AND signer_id IS NOT NULL AND length(btrim(signer_id)) > 0
      AND signer_key_id IS NOT NULL AND length(btrim(signer_key_id)) > 0
      AND signer_scope IS NOT NULL AND jsonb_typeof(signer_scope) = 'array'
      AND signer_scope <> '[]'::jsonb
      AND signature_digest IS NOT NULL AND signature_digest ~ '^[0-9a-f]{64}$')
    OR
    (source <> 'SIGNED_PROVIDER_ATTESTATION'
      AND evidence_digest IS NULL AND signer_id IS NULL AND signer_key_id IS NULL
      AND signer_scope IS NULL AND signature_digest IS NULL)
  );

CREATE UNIQUE INDEX uq_release_gate_evidence__provider_digest
  ON qc.release_gate_evidence (release_id, evidence_type, evidence_digest)
  WHERE evidence_digest IS NOT NULL;

CREATE TRIGGER release_gate_evidence_append_only
  BEFORE UPDATE OR DELETE ON qc.release_gate_evidence
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER release_gate_evidence_no_truncate
  BEFORE TRUNCATE ON qc.release_gate_evidence
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
