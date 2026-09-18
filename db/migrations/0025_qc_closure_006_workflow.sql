-- QC-CLOSURE-006: close the receiving -> inspection -> disposition contract.
-- Nullable columns preserve historical rows; new application writes validate
-- the required values before persistence.
ALTER TABLE qc.receiving_items
  ADD COLUMN supplier_name TEXT;

ALTER TABLE qc.inspection_reports
  ADD COLUMN assigned_user_id UUID;

ALTER TABLE qc.inspection_reports
  ADD CONSTRAINT fk_inspection_reports__assigned_user_id
  FOREIGN KEY (assigned_user_id) REFERENCES qc.users (id) ON DELETE RESTRICT;

CREATE INDEX idx_inspection_reports__assigned_user_id
  ON qc.inspection_reports (assigned_user_id);
