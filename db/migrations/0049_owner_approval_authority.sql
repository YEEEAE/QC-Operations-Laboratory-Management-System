-- 0049_owner_approval_authority
--
-- Owner-Controlled Internal Approval.
--
-- Owner decision governing this change: for the current release the internal
-- governed approval pathway is completed by the authenticated, active System
-- Owner account (`yazeed`) with role `SYSTEM_OWNER`. Electronic signatures,
-- handwritten signatures and mandatory internal multi-person approval chains
-- are DEFERRED to a future development phase, so an internal owner approval is
-- recorded as a durable, auditable decision event WITHOUT creating or claiming
-- an electronic signature.
--
-- This migration is additive and forward-only:
--   * it never rewrites or deletes existing approval_decisions rows;
--   * every new column is nullable (signature_deferred defaults to FALSE), so
--     historical decisions remain exactly as they were recorded;
--   * the linked audit event is a real FK, not a copied label.
--
-- It does NOT relax any scientific, safety, scope, version, separation-of-duties
-- or data-completeness control. Those remain enforced by the domain use cases.

ALTER TABLE qc.approval_decisions
  ADD COLUMN decision_type TEXT,
  ADD COLUMN owner_authority TEXT,
  ADD COLUMN owner_login_identity TEXT,
  ADD COLUMN previous_state TEXT,
  ADD COLUMN resulting_state TEXT,
  ADD COLUMN authorization_context JSONB,
  ADD COLUMN evidence_references JSONB,
  ADD COLUMN signature_deferred BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN audit_event_id UUID;

-- The owner authority is a closed vocabulary. A stored value may only ever be
-- the canonical System Owner authority; an actor id is never authority.
ALTER TABLE qc.approval_decisions
  ADD CONSTRAINT ck_approval_decisions__decision_type
    CHECK (
      decision_type IS NULL
      OR decision_type IN ('OWNER_INTERNAL_APPROVAL', 'STANDARD_WORKFLOW')
    );

ALTER TABLE qc.approval_decisions
  ADD CONSTRAINT ck_approval_decisions__owner_authority
    CHECK (owner_authority IS NULL OR owner_authority = 'SYSTEM_OWNER');

-- The login identity recorded with an owner decision is the server-derived
-- canonical identity. It is evidence of who decided, not an authorization input.
ALTER TABLE qc.approval_decisions
  ADD CONSTRAINT ck_approval_decisions__owner_login_identity
    CHECK (owner_login_identity IS NULL OR owner_login_identity = 'yazeed');

-- A deferred signature is only ever valid on an owner APPROVE decision. A
-- non-owner decision can never claim the deferral, and an owner RETURN/REJECT
-- refusal is not a signed approval at all. The `IS NOT NULL` guard is required:
-- without it, `owner_authority = 'SYSTEM_OWNER'` evaluates to NULL (not FALSE)
-- for a missing authority and the CHECK would pass.
ALTER TABLE qc.approval_decisions
  ADD CONSTRAINT ck_approval_decisions__signature_deferred
    CHECK (
      NOT signature_deferred
      OR (
        decision = 'APPROVE'
        AND owner_authority IS NOT NULL
        AND owner_authority = 'SYSTEM_OWNER'
      )
    );

ALTER TABLE qc.approval_decisions
  ADD CONSTRAINT fk_approval_decisions__audit_event_id
    FOREIGN KEY (audit_event_id) REFERENCES qc.audit_events (id) ON DELETE RESTRICT;

-- Concurrency and idempotency: the same request must resolve to exactly one
-- decision row. Fail closed (loudly) if historical duplicates already exist;
-- repairing history is never done by editing it here.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM qc.approval_decisions
    GROUP BY approval_case_id, work_item_id, request_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add approval-decision idempotency index: duplicate approval_case_id/work_item_id/request_id triples exist';
  END IF;
END
$migration$;

CREATE UNIQUE INDEX uq_approval_decisions__case_work_request
  ON qc.approval_decisions (approval_case_id, work_item_id, request_id);

CREATE INDEX idx_approval_decisions__owner_authority
  ON qc.approval_decisions (owner_authority)
  WHERE owner_authority IS NOT NULL;

COMMENT ON COLUMN qc.approval_decisions.owner_authority IS
  'Owner-Controlled Internal Approval: exact authority that produced the decision. SYSTEM_OWNER means the authenticated, active named owner (yazeed) decided under the deferred-signature governance model. NULL = historical/standard-workflow decision that predates this governance change.';
COMMENT ON COLUMN qc.approval_decisions.signature_deferred IS
  'TRUE only for an owner APPROVE that was recorded under the deferred-signature governance model. This is NOT an electronic signature and must never be reported as one.';
