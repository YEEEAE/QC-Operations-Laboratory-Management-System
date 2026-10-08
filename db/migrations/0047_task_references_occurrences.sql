-- QC360-TASK-POLICY-2026-10-08. Additive source only; no scheduler or production execution.
ALTER TABLE qc.tasks
  ADD COLUMN specialized_record_type text,
  ADD COLUMN specialized_record_id uuid,
  ADD COLUMN recurrence_rule_id text,
  ADD COLUMN occurrence_key text,
  ADD COLUMN occurrence_fingerprint text,
  ADD CONSTRAINT tasks_specialized_reference_pair CHECK (
    (specialized_record_type IS NULL AND specialized_record_id IS NULL) OR
    (specialized_record_type IS NOT NULL AND specialized_record_type IN ('DOCUMENT','LAB_TEST','CHANGE_REQUEST','FINDING','NCR','RCA','CAPA') AND specialized_record_id IS NOT NULL)
  ),
  ADD CONSTRAINT tasks_occurrence_contract CHECK (
    (recurrence_rule_id IS NULL AND occurrence_key IS NULL AND occurrence_fingerprint IS NULL) OR
    (recurrence_rule_id IS NOT NULL AND recurrence_rule_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$'
      AND occurrence_key IS NOT NULL AND occurrence_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$'
      AND occurrence_fingerprint IS NOT NULL AND occurrence_fingerprint ~ '^[a-f0-9]{64}$')
  );
CREATE UNIQUE INDEX tasks_occurrence_unique ON qc.tasks(recurrence_rule_id, occurrence_key)
  WHERE recurrence_rule_id IS NOT NULL;
