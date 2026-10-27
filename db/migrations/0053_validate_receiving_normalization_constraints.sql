-- DATA-02: validate the forward-enforced receiving checks added as NOT VALID
-- in 0035. PostgreSQL checks existing rows here; this migration does not
-- rewrite or infer historical values. Any violation aborts this migration and
-- leaves the applied migration ledger unchanged.
ALTER TABLE qc.receiving_items
  VALIDATE CONSTRAINT receiving_items__quantity_unit_vocabulary;

ALTER TABLE qc.receiving_items
  VALIDATE CONSTRAINT receiving_items__expiry_not_before_receiving;

ALTER TABLE qc.receiving_items
  VALIDATE CONSTRAINT receiving_items__purchase_order_no_not_blank;

ALTER TABLE qc.receiving_items
  VALIDATE CONSTRAINT receiving_items__source_reference_not_blank;
