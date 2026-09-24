-- QC-ADP-19: lab equipment/calibration evidence is a source snapshot taken
-- server-side at use time. Preserve each recorded usage as append-only history.
CREATE TRIGGER lab_equipment_usage_append_only
  BEFORE UPDATE OR DELETE ON qc.lab_equipment_usage
  FOR EACH ROW EXECUTE FUNCTION qc.reject_controlled_history_mutation();

CREATE TRIGGER lab_equipment_usage_no_truncate
  BEFORE TRUNCATE ON qc.lab_equipment_usage
  FOR EACH STATEMENT EXECUTE FUNCTION qc.reject_controlled_history_mutation();
