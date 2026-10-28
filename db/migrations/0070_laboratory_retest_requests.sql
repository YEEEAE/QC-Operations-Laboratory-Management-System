-- LAB-01: persist retest requests, investigation and internal authorization.
-- This records the SYS-05 workflow decision without inventing method-specific
-- eligibility, test-number allocation, conflicting-result criteria or final
-- disposition. Those remain gated by an approved effective method source.
CREATE TABLE qc.lab_retest_requests (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  original_test_id UUID NOT NULL REFERENCES qc.lab_tests(id) ON DELETE RESTRICT,
  original_test_version BIGINT NOT NULL CHECK (original_test_version > 0),
  original_scientific_result TEXT NOT NULL CHECK (original_scientific_result IN ('PASS','FAIL','HOLD')),
  requester_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  investigation TEXT NOT NULL CHECK (length(btrim(investigation)) > 0),
  status TEXT NOT NULL CHECK (status IN ('REQUESTED','INVESTIGATING','APPROVED','REJECTED')),
  decision_actor_id UUID REFERENCES qc.users(id) ON DELETE RESTRICT,
  decision_at TIMESTAMPTZ,
  decision_reason TEXT,
  source_method_reference TEXT NOT NULL CHECK (length(btrim(source_method_reference)) > 0),
  source_template_version_id UUID NOT NULL REFERENCES qc.lab_test_template_versions(id) ON DELETE RESTRICT,
  source_content_hash TEXT NOT NULL CHECK (source_content_hash ~ '^[0-9a-f]{64}$'),
  request_key TEXT NOT NULL CHECK (length(btrim(request_key)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT ck_lab_retest_requests__decision CHECK
    ((status IN ('REQUESTED','INVESTIGATING') AND decision_actor_id IS NULL AND decision_at IS NULL AND decision_reason IS NULL)
      OR (status = 'APPROVED' AND decision_actor_id IS NOT NULL AND decision_at IS NOT NULL AND decision_reason IS NOT NULL)
      OR (status = 'REJECTED' AND decision_actor_id IS NOT NULL AND decision_at IS NOT NULL AND decision_reason IS NOT NULL)),
  CONSTRAINT uq_lab_retest_requests__request_key UNIQUE(requester_id, request_key)
);
CREATE UNIQUE INDEX uq_lab_retest_requests__active_original
  ON qc.lab_retest_requests(original_test_id)
  WHERE status IN ('REQUESTED','INVESTIGATING','APPROVED');
CREATE INDEX idx_lab_retest_requests__requester_created
  ON qc.lab_retest_requests(requester_id, created_at DESC);

CREATE FUNCTION qc.guard_lab_retest_request_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'laboratory retest request evidence is immutable' USING ERRCODE = '55006';
  END IF;
  IF ROW(NEW.original_test_id, NEW.original_test_version, NEW.original_scientific_result,
      NEW.requester_id, NEW.reason, NEW.source_method_reference, NEW.source_template_version_id,
      NEW.source_content_hash, NEW.request_key, NEW.created_at)
    IS DISTINCT FROM ROW(OLD.original_test_id, OLD.original_test_version, OLD.original_scientific_result,
      OLD.requester_id, OLD.reason, OLD.source_method_reference, OLD.source_template_version_id,
      OLD.source_content_hash, OLD.request_key, OLD.created_at) THEN
    RAISE EXCEPTION 'laboratory retest request evidence is immutable' USING ERRCODE = '55006';
  END IF;
  IF NEW.version <> OLD.version + 1 OR NOT (
      (OLD.status = 'REQUESTED' AND NEW.status IN ('INVESTIGATING','APPROVED','REJECTED')) OR
      (OLD.status = 'INVESTIGATING' AND NEW.status IN ('INVESTIGATING','APPROVED','REJECTED'))
    ) THEN
    RAISE EXCEPTION 'invalid laboratory retest request version or transition' USING ERRCODE = '55006';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_lab_retest_requests__transition
  BEFORE UPDATE OR DELETE ON qc.lab_retest_requests
  FOR EACH ROW EXECUTE FUNCTION qc.guard_lab_retest_request_transition();

-- SYS-05.2: ordinary sequence 1 is unique. Further numbered attempts stay
-- denied until an explicit, separately approved exception source exists.
CREATE UNIQUE INDEX uq_lab_tests__one_ordinary_retest
  ON qc.lab_tests(original_test_id)
  WHERE original_test_id IS NOT NULL AND retest_sequence = 1;
CREATE FUNCTION qc.prevent_laboratory_retest_chains()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.original_test_id IS NOT NULL THEN
    IF NEW.retest_sequence > 1 THEN
      RAISE EXCEPTION 'additional laboratory retest attempts require a separately approved exception' USING ERRCODE = '23514';
    END IF;
    IF EXISTS (
      SELECT 1 FROM qc.lab_tests original
      WHERE original.id = NEW.original_test_id AND original.original_test_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'laboratory retests must link directly to an original test' USING ERRCODE = '23514';
    END IF;
    IF EXISTS (
      SELECT 1 FROM qc.lab_tests child
      WHERE child.original_test_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'a laboratory test with a retest cannot become a retest' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_lab_tests__no_retest_chains
  BEFORE INSERT OR UPDATE OF original_test_id, retest_sequence ON qc.lab_tests
  FOR EACH ROW EXECUTE FUNCTION qc.prevent_laboratory_retest_chains();

CREATE TABLE qc.lab_retest_request_events (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  request_id UUID NOT NULL REFERENCES qc.lab_retest_requests(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('REQUESTED','INVESTIGATION_RECORDED','APPROVED','REJECTED')),
  actor_id UUID NOT NULL REFERENCES qc.users(id) ON DELETE RESTRICT,
  request_key TEXT NOT NULL CHECK (length(btrim(request_key)) > 0),
  event_payload JSONB NOT NULL CHECK (jsonb_typeof(event_payload) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_lab_retest_request_events__key UNIQUE(request_id, actor_id, request_key)
);

CREATE FUNCTION qc.prevent_lab_retest_event_rewrite()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'laboratory retest request events are append-only' USING ERRCODE = '55006';
END $$;
CREATE TRIGGER trg_lab_retest_request_events__immutable
  BEFORE UPDATE OR DELETE ON qc.lab_retest_request_events
  FOR EACH ROW EXECUTE FUNCTION qc.prevent_lab_retest_event_rewrite();
