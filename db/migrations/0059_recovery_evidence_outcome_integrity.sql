-- NDB-12: a verified restore outcome must be backed by a linked restore run,
-- completion time, and passing database/object/security/business evidence.
-- NOT VALID preserves existing rows while enforcing the contract on new writes.
ALTER TABLE qc.recovery_evidence
  ADD CONSTRAINT ck_recovery_evidence__verified_outcome
  CHECK (
    result <> 'VERIFIED' OR (
      restore_run_id IS NOT NULL
      AND completed_at IS NOT NULL
      AND database_validation = 'PASS'
      AND object_validation = 'PASS'
      AND security_validation = 'PASS'
      AND business_validation = 'PASS'
      AND (session_invalidation IS NULL OR session_invalidation <> 'FAIL')
    )
  ) NOT VALID;

ALTER TABLE qc.recovery_evidence
  ADD CONSTRAINT ck_recovery_evidence__failed_outcome
  CHECK (
    result <> 'VERIFICATION_FAILED' OR (
      database_validation = 'FAIL'
      OR object_validation = 'FAIL'
      OR security_validation = 'FAIL'
      OR business_validation = 'FAIL'
      OR session_invalidation = 'FAIL'
    )
  ) NOT VALID;
