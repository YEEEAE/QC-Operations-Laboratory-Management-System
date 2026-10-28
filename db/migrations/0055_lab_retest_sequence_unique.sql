-- NDB-05: one numbered retest sequence per original laboratory test.
--
-- CreateRetestUseCase requires a positive sequence from the controlled retest
-- policy. There is no safe NOT VALID form for a unique index, so stop this
-- migration before changing the schema if historical duplicates need owner
-- disposition. Review db/diagnostics/NDB-05-laboratory-integrity-exceptions.sql
-- first; do not rewrite or delete historic records to make this index succeed.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM qc.lab_tests
    WHERE original_test_id IS NOT NULL
    GROUP BY original_test_id, retest_sequence
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'NDB-05 retest sequence uniqueness deferred: historical duplicate groups require reviewed disposition';
  END IF;
END
$migration$;

CREATE UNIQUE INDEX uq_lab_tests__original_retest_sequence
  ON qc.lab_tests (original_test_id, retest_sequence)
  WHERE original_test_id IS NOT NULL;
