-- Preserve the historical paper-form percentage and add an independently
-- stored Reject / Total Produced metric. Existing reports are not recalculated
-- and no production denominator is inferred for them.
ALTER TABLE qc.daily_reject_entries
  ADD COLUMN total_produced_qty NUMERIC,
  ADD COLUMN rework_qty NUMERIC,
  ADD COLUMN hold_qty NUMERIC,
  ADD COLUMN quantity_unit TEXT,
  ADD COLUMN quantity_source_reference TEXT,
  ADD COLUMN operational_reject_pct NUMERIC,
  ADD COLUMN operational_reject_pct_status TEXT NOT NULL DEFAULT 'NOT_AVAILABLE',
  ADD COLUMN paper_formula_id TEXT,
  ADD COLUMN paper_formula_version INTEGER,
  ADD COLUMN operational_formula_id TEXT,
  ADD COLUMN operational_formula_version INTEGER,
  ADD COLUMN quantity_provenance TEXT,
  ADD COLUMN production_balance_status TEXT;

ALTER TABLE qc.daily_reject_entries
  ADD CONSTRAINT daily_reject_entries__total_produced_nonnegative
    CHECK (total_produced_qty IS NULL OR total_produced_qty >= 0),
  ADD CONSTRAINT daily_reject_entries__rework_nonnegative
    CHECK (rework_qty IS NULL OR rework_qty >= 0),
  ADD CONSTRAINT daily_reject_entries__hold_nonnegative
    CHECK (hold_qty IS NULL OR hold_qty >= 0),
  ADD CONSTRAINT daily_reject_entries__quantity_unit_required
    CHECK ((total_produced_qty IS NULL AND rework_qty IS NULL AND hold_qty IS NULL)
      OR (quantity_unit IS NOT NULL AND length(btrim(quantity_unit)) > 0)),
  ADD CONSTRAINT daily_reject_entries__operational_pct_state
    CHECK (
      (operational_reject_pct_status = 'NOT_AVAILABLE'
        AND total_produced_qty IS NULL AND operational_reject_pct IS NULL)
      OR (operational_reject_pct_status = 'AVAILABLE'
        AND total_produced_qty IS NOT NULL AND total_produced_qty > 0
        AND operational_reject_pct IS NOT NULL)
      OR (operational_reject_pct_status = 'ZERO_DENOMINATOR'
        AND total_produced_qty IS NOT NULL AND total_produced_qty = 0
        AND operational_reject_pct IS NULL)
    ),
  ADD CONSTRAINT daily_reject_entries__formula_versions_positive
    CHECK ((paper_formula_version IS NULL OR paper_formula_version > 0)
      AND (operational_formula_version IS NULL OR operational_formula_version > 0)),
  ADD CONSTRAINT daily_reject_entries__formula_identity
    CHECK ((paper_formula_id IS NULL AND paper_formula_version IS NULL)
        OR (paper_formula_id IS NOT NULL AND paper_formula_version IS NOT NULL
          AND paper_formula_id = 'REJECT_OVER_GOOD' AND paper_formula_version = 1)),
  ADD CONSTRAINT daily_reject_entries__operational_formula_identity
    CHECK ((operational_formula_id IS NULL AND operational_formula_version IS NULL)
        OR (operational_formula_id IS NOT NULL AND operational_formula_version IS NOT NULL
          AND operational_formula_id = 'REJECT_OVER_TOTAL_PRODUCED' AND operational_formula_version = 1)),
  ADD CONSTRAINT daily_reject_entries__balance_status_vocabulary
    CHECK (production_balance_status IS NULL OR production_balance_status = 'NOT_CONFIGURED'),
  ADD CONSTRAINT daily_reject_entries__quantity_provenance_vocabulary
    CHECK (quantity_provenance IS NULL OR quantity_provenance = 'USER_RECORDED');
