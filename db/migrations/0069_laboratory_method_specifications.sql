-- LAB-02: product- and method-bound scientific specification source.
-- Pending rows are requests only; they cannot drive evaluation. No criteria
-- are seeded or inferred from existing templates or historical results.
CREATE TABLE qc.lab_method_specifications (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  method_reference TEXT NOT NULL CHECK (length(btrim(method_reference)) > 0),
  product_code TEXT NOT NULL CHECK (length(btrim(product_code)) > 0),
  parameter_code TEXT NOT NULL CHECK (length(btrim(parameter_code)) > 0),
  unit TEXT NOT NULL CHECK (length(btrim(unit)) > 0),
  precision_scale INTEGER NOT NULL CHECK (precision_scale BETWEEN 0 AND 18),
  sample_plan JSONB NOT NULL CHECK (jsonb_typeof(sample_plan) = 'object'),
  acceptance_expression JSONB NOT NULL CHECK (jsonb_typeof(acceptance_expression) = 'object'),
  valid_range JSONB CHECK (valid_range IS NULL OR jsonb_typeof(valid_range) = 'object'),
  calculation_policy JSONB CHECK (calculation_policy IS NULL OR jsonb_typeof(calculation_policy) = 'object'),
  source_document_id UUID NOT NULL REFERENCES qc.document_identities(id) ON DELETE RESTRICT,
  source_document_version_id UUID NOT NULL REFERENCES qc.document_versions(id) ON DELETE RESTRICT,
  source_revision TEXT NOT NULL CHECK (length(btrim(source_revision)) > 0),
  source_content_hash TEXT NOT NULL CHECK (source_content_hash ~ '^[0-9a-f]{64}$'),
  qualification_policy JSONB NOT NULL CHECK (jsonb_typeof(qualification_policy) = 'object'),
  state TEXT NOT NULL DEFAULT 'PENDING_POLICY' CHECK (state IN ('PENDING_POLICY','APPROVED','RETIRED')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES qc.users(id) ON DELETE RESTRICT,
  effective_at TIMESTAMPTZ,
  effective_until TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT NOT NULL CHECK (length(btrim(request_id)) > 0),
  CONSTRAINT ck_lab_method_specifications__approval CHECK ((state = 'PENDING_POLICY' AND approved_at IS NULL AND approved_by IS NULL AND effective_at IS NULL) OR (state IN ('APPROVED','RETIRED') AND approved_at IS NOT NULL AND approved_by IS NOT NULL AND effective_at IS NOT NULL)),
  CONSTRAINT ck_lab_method_specifications__effective_window CHECK (effective_until IS NULL OR effective_until > effective_at)
);
CREATE INDEX idx_lab_method_specifications__effective
  ON qc.lab_method_specifications(method_reference, product_code, parameter_code, effective_at DESC)
  WHERE state = 'APPROVED';
CREATE UNIQUE INDEX uq_lab_method_specifications__approved_revision
  ON qc.lab_method_specifications(method_reference, product_code, parameter_code, source_document_version_id)
  WHERE state IN ('APPROVED','RETIRED');

CREATE FUNCTION qc.prevent_lab_method_specification_rewrite()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.state <> 'PENDING_POLICY' THEN
    RAISE EXCEPTION 'method specifications enter through pending review and cannot self-approve' USING ERRCODE = '55006';
  END IF;
  IF TG_OP = 'INSERT' THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'laboratory method specifications are append-only; submit a new revision' USING ERRCODE = '55006';
END $$;
CREATE TRIGGER trg_lab_method_specifications__immutable
  BEFORE INSERT OR UPDATE OR DELETE ON qc.lab_method_specifications
  FOR EACH ROW EXECUTE FUNCTION qc.prevent_lab_method_specification_rewrite();
