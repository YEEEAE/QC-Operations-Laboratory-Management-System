-- QC-DATA-001: receiving_items — structured quantity unit, purchase order and
-- source/import traceability.
--
-- Forward-only. Historical rows are never rewritten and never guessed: every
-- new column is nullable, and the new CHECK constraints are added NOT VALID so
-- pre-existing rows stay untouched while every new write is enforced.
--
-- The unit vocabulary is the receiving quantity-unit contract owned by
-- `src/modules/quarantine/receiving/domain/receiving-units.ts`; the column may
-- be NULL only for rows that predate this migration (application writes always
-- supply a unit, validated server-side).

ALTER TABLE qc.receiving_items
  ADD COLUMN quantity_unit TEXT,
  ADD COLUMN purchase_order_no TEXT,
  ADD COLUMN source_system TEXT,
  ADD COLUMN source_reference TEXT,
  ADD COLUMN imported_at TIMESTAMPTZ;

ALTER TABLE qc.receiving_items
  ADD CONSTRAINT receiving_items__quantity_unit_vocabulary
  CHECK (
    quantity_unit IS NULL
    OR quantity_unit IN ('PCS', 'KG', 'G', 'MG', 'L', 'ML', 'M', 'M2', 'BOX', 'PACK', 'ROLL', 'SET')
  ) NOT VALID;

-- An expiry date can never precede the receiving date.
ALTER TABLE qc.receiving_items
  ADD CONSTRAINT receiving_items__expiry_not_before_receiving
  CHECK (expiry_date IS NULL OR expiry_date >= receiving_date) NOT VALID;

ALTER TABLE qc.receiving_items
  ADD CONSTRAINT receiving_items__purchase_order_no_not_blank
  CHECK (purchase_order_no IS NULL OR length(btrim(purchase_order_no)) > 0) NOT VALID;

ALTER TABLE qc.receiving_items
  ADD CONSTRAINT receiving_items__source_reference_not_blank
  CHECK (
    source_reference IS NULL
    OR (source_system IS NOT NULL AND length(btrim(source_reference)) > 0)
  ) NOT VALID;

-- Register filters: receiving date window, item/lot/supplier/PO lookups.
CREATE INDEX idx_receiving_items__receiving_date ON qc.receiving_items (receiving_date);
CREATE INDEX idx_receiving_items__item_code ON qc.receiving_items (item_code);
CREATE INDEX idx_receiving_items__lot ON qc.receiving_items (lot);
CREATE INDEX idx_receiving_items__supplier_name ON qc.receiving_items (supplier_name);
CREATE INDEX idx_receiving_items__purchase_order_no ON qc.receiving_items (purchase_order_no);

-- Deterministic duplicate key for imported rows: one source row maps to at most
-- one receiving record, so a re-run of the same import is a no-op.
CREATE UNIQUE INDEX uq_receiving_items__source_reference
  ON qc.receiving_items (source_system, source_reference)
  WHERE source_system IS NOT NULL AND source_reference IS NOT NULL;
