-- QC-POST-100-014: provider nonce values must be uniquely consumed per signer key.
-- Keep existing append-only evidence untouched; this side table indexes its
-- original audit_info nonce and links the claim to the immutable evidence row.

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM qc.release_gate_evidence
    WHERE source = 'SIGNED_PROVIDER_ATTESTATION'
      AND (audit_info->>'nonce' IS NULL OR audit_info->>'nonce' !~ '^[A-Za-z0-9_-]{16,128}$')
  ) THEN
    RAISE EXCEPTION 'Cannot enforce provider nonce replay protection: existing signed evidence has no valid nonce';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM qc.release_gate_evidence
    WHERE source = 'SIGNED_PROVIDER_ATTESTATION'
    GROUP BY signer_id, signer_key_id, audit_info->>'nonce'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce provider nonce replay protection: duplicate signer nonce exists';
  END IF;
END
$migration$;

ALTER TABLE qc.release_gate_evidence
  ADD CONSTRAINT uq_release_gate_evidence__id_signer_key UNIQUE (id, signer_id, signer_key_id);

CREATE TABLE qc.release_provider_nonce_claims (
  release_gate_evidence_id UUID PRIMARY KEY,
  signer_id TEXT NOT NULL CHECK (length(btrim(signer_id)) > 0),
  signer_key_id TEXT NOT NULL CHECK (length(btrim(signer_key_id)) > 0),
  nonce TEXT NOT NULL CHECK (nonce ~ '^[A-Za-z0-9_-]{16,128}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_release_provider_nonce_claims__evidence FOREIGN KEY (
    release_gate_evidence_id, signer_id, signer_key_id
  ) REFERENCES qc.release_gate_evidence (id, signer_id, signer_key_id) ON DELETE RESTRICT,
  CONSTRAINT uq_release_provider_nonce_claims__signer_nonce UNIQUE (signer_id, signer_key_id, nonce)
);

INSERT INTO qc.release_provider_nonce_claims (release_gate_evidence_id, signer_id, signer_key_id, nonce)
SELECT id, signer_id, signer_key_id, audit_info->>'nonce'
FROM qc.release_gate_evidence
WHERE source = 'SIGNED_PROVIDER_ATTESTATION';
