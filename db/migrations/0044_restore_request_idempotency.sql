DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM qc.restore_runs
    GROUP BY backup_run_id, request_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add restore request idempotency index: duplicate backup_run_id/request_id pairs exist';
  END IF;
END
$migration$;

CREATE UNIQUE INDEX uq_restore_runs__backup_run_request_id
  ON qc.restore_runs (backup_run_id, request_id);
