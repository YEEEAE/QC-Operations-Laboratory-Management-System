-- NDB-05 read-only historical integrity inventory.
-- Run each SELECT separately with an authorized read-only principal only after
-- a separately approved review. This file is source documentation, not an
-- application query or migration; no row is changed or disposition inferred.

-- Cross-test or cross-run laboratory references that the NDB-05 composite
-- foreign keys would report. Rows are retained for review; this query does not
-- suggest that a historical mismatch is safe to repair automatically.
SELECT 'sample_batch_test_mismatch'::text AS exception_type,
       sample.id AS record_id,
       sample.batch_id AS related_record_id,
       sample.lab_test_id AS recorded_test_id,
       batch.lab_test_id AS related_test_id
FROM qc.lab_samples AS sample
JOIN qc.lab_test_batches AS batch ON batch.id = sample.batch_id
WHERE batch.lab_test_id <> sample.lab_test_id

UNION ALL

SELECT 'reading_batch_test_mismatch', reading.id, reading.batch_id,
       reading.lab_test_id, batch.lab_test_id
FROM qc.lab_readings AS reading
JOIN qc.lab_test_batches AS batch ON batch.id = reading.batch_id
WHERE batch.lab_test_id <> reading.lab_test_id

UNION ALL

SELECT 'reading_sample_test_mismatch', reading.id, reading.sample_id,
       reading.lab_test_id, sample.lab_test_id
FROM qc.lab_readings AS reading
JOIN qc.lab_samples AS sample ON sample.id = reading.sample_id
WHERE sample.lab_test_id <> reading.lab_test_id

UNION ALL

SELECT 'reading_sample_batch_mismatch', reading.id, reading.sample_id,
       reading.batch_id, sample.batch_id
FROM qc.lab_readings AS reading
JOIN qc.lab_samples AS sample ON sample.id = reading.sample_id
WHERE sample.batch_id IS DISTINCT FROM reading.batch_id

UNION ALL

SELECT 'sample_result_batch_test_mismatch', result.id, result.batch_id,
       result.lab_test_id, batch.lab_test_id
FROM qc.lab_sample_results AS result
JOIN qc.lab_test_batches AS batch ON batch.id = result.batch_id
WHERE batch.lab_test_id <> result.lab_test_id

UNION ALL

SELECT 'sample_result_sample_test_mismatch', result.id, result.sample_id,
       result.lab_test_id, sample.lab_test_id
FROM qc.lab_sample_results AS result
JOIN qc.lab_samples AS sample ON sample.id = result.sample_id
WHERE sample.lab_test_id <> result.lab_test_id

UNION ALL

SELECT 'sample_result_sample_batch_mismatch', result.id, result.sample_id,
       result.batch_id, sample.batch_id
FROM qc.lab_sample_results AS result
JOIN qc.lab_samples AS sample ON sample.id = result.sample_id
WHERE sample.batch_id IS DISTINCT FROM result.batch_id

UNION ALL

SELECT 'measurement_batch_test_mismatch', measurement.id, measurement.batch_id,
       measurement.lab_test_id, batch.lab_test_id
FROM qc.lab_measurements AS measurement
JOIN qc.lab_test_batches AS batch ON batch.id = measurement.batch_id
WHERE batch.lab_test_id <> measurement.lab_test_id

UNION ALL

SELECT 'measurement_sample_test_mismatch', measurement.id, measurement.sample_id,
       measurement.lab_test_id, sample.lab_test_id
FROM qc.lab_measurements AS measurement
JOIN qc.lab_samples AS sample ON sample.id = measurement.sample_id
WHERE sample.lab_test_id <> measurement.lab_test_id

UNION ALL

SELECT 'measurement_sample_batch_mismatch', measurement.id, measurement.sample_id,
       measurement.batch_id, sample.batch_id
FROM qc.lab_measurements AS measurement
JOIN qc.lab_samples AS sample ON sample.id = measurement.sample_id
WHERE measurement.batch_id IS NOT NULL
  AND sample.batch_id IS DISTINCT FROM measurement.batch_id

UNION ALL

SELECT 'reading_template_parameter_mismatch', reading.id, parameter.id,
       test.template_version_id, parameter.template_version_id
FROM qc.lab_readings AS reading
JOIN qc.lab_tests AS test ON test.id = reading.lab_test_id
JOIN qc.lab_test_template_parameters AS parameter
  ON parameter.id = reading.template_parameter_id
WHERE parameter.template_version_id <> test.template_version_id

UNION ALL

SELECT 'measurement_template_parameter_mismatch', measurement.id, parameter.id,
       test.template_version_id, parameter.template_version_id
FROM qc.lab_measurements AS measurement
JOIN qc.lab_tests AS test ON test.id = measurement.lab_test_id
JOIN qc.lab_test_template_parameters AS parameter
  ON parameter.id = measurement.template_parameter_id
WHERE parameter.template_version_id <> test.template_version_id

UNION ALL

SELECT 'inspection_result_template_version_mismatch', result.id,
       result.template_point_id, report.template_version_id,
       section.template_version_id
FROM qc.inspection_report_results AS result
JOIN qc.inspection_reports AS report
  ON report.id = result.inspection_report_id
JOIN qc.inspection_template_points AS point
  ON point.id = result.template_point_id
JOIN qc.inspection_template_sections AS section
  ON section.id = point.section_id
WHERE report.template_version_id <> section.template_version_id

UNION ALL

SELECT 'equipment_usage_batch_test_mismatch', usage.id, usage.batch_id,
       usage.lab_test_id, batch.lab_test_id
FROM qc.lab_equipment_usage AS usage
JOIN qc.lab_test_batches AS batch ON batch.id = usage.batch_id
WHERE batch.lab_test_id <> usage.lab_test_id

ORDER BY exception_type, record_id;

-- Duplicate retest sequence groups must be reviewed before migration 0055 can
-- create its unique index. No row is selected as authoritative here.
SELECT original_test_id,
       retest_sequence,
       count(*) AS conflicting_records,
       array_agg(id ORDER BY created_at, id) AS record_ids
FROM qc.lab_tests
WHERE original_test_id IS NOT NULL
GROUP BY original_test_id, retest_sequence
HAVING count(*) > 1
ORDER BY original_test_id, retest_sequence;
