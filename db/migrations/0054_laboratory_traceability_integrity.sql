-- NDB-05: enforce laboratory run/sample/test traceability for new writes while
-- preserving the meaning and contents of historical rows.
--
-- The child tables currently reference each record independently. Those FKs
-- prove that each referenced row exists, but do not prove that a sample or run
-- belongs to the same lab test recorded by its reading/result. Composite FKs
-- close that cross-record gap. NOT VALID leaves existing rows unscanned while
-- PostgreSQL enforces the constraints for new and changed rows.

-- These parent keys are logically unique because id is already a primary key;
-- the explicit composite keys let PostgreSQL enforce the ownership pairs.
CREATE UNIQUE INDEX uq_lab_test_batches__id_lab_test
  ON qc.lab_test_batches (id, lab_test_id);

CREATE UNIQUE INDEX uq_lab_samples__id_lab_test
  ON qc.lab_samples (id, lab_test_id);

CREATE UNIQUE INDEX uq_lab_samples__id_batch
  ON qc.lab_samples (id, batch_id);

CREATE UNIQUE INDEX uq_lab_tests__id_template_version
  ON qc.lab_tests (id, template_version_id);

CREATE UNIQUE INDEX uq_lab_test_template_parameters__id_template_version
  ON qc.lab_test_template_parameters (id, template_version_id);

-- Measurements and readings carry a parameter reference as well as their test
-- identity. Preserve NULL on historical rows; application writes bind the
-- immutable revision captured by the parent test, and the composite FKs keep
-- each parameter in that same revision.
ALTER TABLE qc.lab_readings
  ADD COLUMN template_version_id UUID;

ALTER TABLE qc.lab_readings
  ADD CONSTRAINT ck_lab_readings__template_version_required
    CHECK (template_version_id IS NOT NULL) NOT VALID,
  ADD CONSTRAINT fk_lab_readings__test_template_version
    FOREIGN KEY (lab_test_id, template_version_id)
    REFERENCES qc.lab_tests (id, template_version_id)
    NOT VALID,
  ADD CONSTRAINT fk_lab_readings__parameter_template_version
    FOREIGN KEY (template_parameter_id, template_version_id)
    REFERENCES qc.lab_test_template_parameters (id, template_version_id)
    NOT VALID;

ALTER TABLE qc.lab_measurements
  ADD COLUMN template_version_id UUID;

ALTER TABLE qc.lab_measurements
  ADD CONSTRAINT ck_lab_measurements__template_version_required
    CHECK (template_version_id IS NOT NULL) NOT VALID,
  ADD CONSTRAINT fk_lab_measurements__test_template_version
    FOREIGN KEY (lab_test_id, template_version_id)
    REFERENCES qc.lab_tests (id, template_version_id)
    NOT VALID,
  ADD CONSTRAINT fk_lab_measurements__parameter_template_version
    FOREIGN KEY (template_parameter_id, template_version_id)
    REFERENCES qc.lab_test_template_parameters (id, template_version_id)
    NOT VALID;

-- A legacy sample may have NULL batch_id. MATCH SIMPLE preserves that
-- test-level representation while checking every sample that names a run.
ALTER TABLE qc.lab_samples
  ADD CONSTRAINT fk_lab_samples__batch_test
  FOREIGN KEY (batch_id, lab_test_id)
  REFERENCES qc.lab_test_batches (id, lab_test_id)
  NOT VALID;

-- The row's run and sample must both belong to its recorded lab test, and the
-- sample must be assigned to that same run.
ALTER TABLE qc.lab_readings
  ADD CONSTRAINT fk_lab_readings__batch_test
    FOREIGN KEY (batch_id, lab_test_id)
    REFERENCES qc.lab_test_batches (id, lab_test_id)
    NOT VALID,
  ADD CONSTRAINT fk_lab_readings__sample_test
    FOREIGN KEY (sample_id, lab_test_id)
    REFERENCES qc.lab_samples (id, lab_test_id)
    NOT VALID,
  ADD CONSTRAINT fk_lab_readings__sample_batch
    FOREIGN KEY (sample_id, batch_id)
    REFERENCES qc.lab_samples (id, batch_id)
    NOT VALID;

ALTER TABLE qc.lab_sample_results
  ADD CONSTRAINT fk_lab_sample_results__batch_test
    FOREIGN KEY (batch_id, lab_test_id)
    REFERENCES qc.lab_test_batches (id, lab_test_id)
    NOT VALID,
  ADD CONSTRAINT fk_lab_sample_results__sample_test
    FOREIGN KEY (sample_id, lab_test_id)
    REFERENCES qc.lab_samples (id, lab_test_id)
    NOT VALID,
  ADD CONSTRAINT fk_lab_sample_results__sample_batch
    FOREIGN KEY (sample_id, batch_id)
    REFERENCES qc.lab_samples (id, batch_id)
    NOT VALID;

-- Measurements retain legacy NULL run/sample references. When either is
-- present, the composite FK checks its test ownership; when both are present,
-- the sample must also belong to the recorded run.
ALTER TABLE qc.lab_measurements
  ADD CONSTRAINT fk_lab_measurements__batch_test
    FOREIGN KEY (batch_id, lab_test_id)
    REFERENCES qc.lab_test_batches (id, lab_test_id)
    NOT VALID,
  ADD CONSTRAINT fk_lab_measurements__sample_test
    FOREIGN KEY (sample_id, lab_test_id)
    REFERENCES qc.lab_samples (id, lab_test_id)
    NOT VALID,
  ADD CONSTRAINT fk_lab_measurements__sample_batch
    FOREIGN KEY (sample_id, batch_id)
    REFERENCES qc.lab_samples (id, batch_id)
    NOT VALID;

-- Run-level equipment evidence also belongs to the test that owns the run;
-- legacy test-level rows retain NULL batch_id.
ALTER TABLE qc.lab_equipment_usage
  ADD CONSTRAINT fk_lab_equipment_usage__batch_test
  FOREIGN KEY (batch_id, lab_test_id)
  REFERENCES qc.lab_test_batches (id, lab_test_id)
  NOT VALID;

-- Inspection results identify a report and a template point, while the point's
-- revision is reached through its section. Preserve this normalized model and
-- enforce the existing relation for new/retargeted rows without backfilling
-- historical records.
CREATE FUNCTION qc.enforce_inspection_result_template_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, qc
AS $function$
DECLARE
  report_template_version UUID;
  point_template_version UUID;
BEGIN
  SELECT report.template_version_id, section.template_version_id
    INTO report_template_version, point_template_version
  FROM qc.inspection_reports AS report
  JOIN qc.inspection_template_points AS point
    ON point.id = NEW.template_point_id
  JOIN qc.inspection_template_sections AS section
    ON section.id = point.section_id
  WHERE report.id = NEW.inspection_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inspection result references missing report or template point'
      USING ERRCODE = '23503';
  END IF;

  IF report_template_version IS DISTINCT FROM point_template_version THEN
    RAISE EXCEPTION 'Inspection result template point belongs to a different template revision'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END
$function$;

CREATE TRIGGER inspection_report_results_template_version_guard
  BEFORE INSERT OR UPDATE OF inspection_report_id, template_point_id
  ON qc.inspection_report_results
  FOR EACH ROW
  EXECUTE FUNCTION qc.enforce_inspection_result_template_version();

-- PostgresLabRepository.list/workload apply author_id for OWN-scope reads and
-- order by updated_at DESC, id DESC. The existing author/state index cannot
-- provide that ordering when state is not filtered.
CREATE INDEX idx_lab_tests__author_updated
  ON qc.lab_tests (author_id, updated_at DESC, id DESC);
