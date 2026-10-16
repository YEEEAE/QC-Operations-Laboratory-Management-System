-- audit/OWNER-APPROVAL/verify-owner-approval-guards.sql
--
-- Real PostgreSQL verification of the Owner-Controlled Internal Approval guards
-- introduced by db/migrations/0049_owner_approval_authority.sql.
--
-- Run against a disposable PostgreSQL 18 instance:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f audit/OWNER-APPROVAL/verify-owner-approval-guards.sql
--
-- The whole script runs inside one transaction that is rolled back, so it never
-- leaves fixture data behind. Every assertion is reported as PASS/FAIL.

BEGIN;

CREATE TEMP TABLE guard_results (n int, test text, result text) ON COMMIT DROP;

DO $verify$
DECLARE
  owner_id uuid;
  other_id uuid;
  case_id uuid;
  work_id uuid;
  audit_id uuid;
BEGIN
  INSERT INTO qc.users (login_identity, display_name, password_hash)
  VALUES ('yazeed', 'System Owner', 'x') RETURNING id INTO owner_id;
  INSERT INTO qc.users (login_identity, display_name, password_hash)
  VALUES ('qcm.one', 'QCM One', 'x') RETURNING id INTO other_id;

  INSERT INTO qc.approval_cases
    (subject_type, subject_id, subject_version, workflow_type, state, requested_by)
  VALUES ('CHANGE_REQUEST', gen_random_uuid(), 2, 'CHANGE_REQUEST', 'IN_PROGRESS', other_id)
  RETURNING id INTO case_id;

  INSERT INTO qc.approval_work_items (approval_case_id, step_no, work_type, assigned_user_id, state)
  VALUES (case_id, 1, 'APPROVAL', other_id, 'PENDING')
  RETURNING id INTO work_id;

  INSERT INTO qc.audit_events (actor_type, actor_id, subject_type, subject_id, action, request_id)
  VALUES ('USER', owner_id, 'APPROVAL_CASE', case_id, 'APPROVAL_APPROVE', 'req-1')
  RETURNING id INTO audit_id;

  -- 1. A valid owner decision with the deferred-signature marker is accepted and
  --    links a real audit event, with no signature row.
  BEGIN
    INSERT INTO qc.approval_decisions
      (approval_case_id, work_item_id, actor_id, decision, subject_version, request_id,
       decision_type, owner_authority, owner_login_identity,
       previous_state, resulting_state, authorization_context, evidence_references,
       signature_deferred, audit_event_id)
    VALUES (case_id, work_id, owner_id, 'APPROVE', 2, 'req-1',
       'OWNER_INTERNAL_APPROVAL', 'SYSTEM_OWNER', 'yazeed',
       'UNDER_REVIEW', 'APPROVED', '{"authority":"SYSTEM_OWNER"}'::jsonb,
       '{"snapshotHash":"abc"}'::jsonb, TRUE, audit_id);
    INSERT INTO guard_results VALUES (1, 'valid owner decision (deferred signature) accepted', 'PASS');
  EXCEPTION WHEN others THEN
    INSERT INTO guard_results VALUES (1, 'valid owner decision (deferred signature) accepted', 'FAIL: ' || SQLERRM);
  END;

  -- 2. The owner authority is a closed vocabulary: a non-canonical authority is rejected.
  BEGIN
    INSERT INTO qc.approval_decisions
      (approval_case_id, work_item_id, actor_id, decision, subject_version, request_id, owner_authority)
    VALUES (case_id, work_id, other_id, 'APPROVE', 2, 'req-2', 'ADMIN');
    INSERT INTO guard_results VALUES (2, 'non-canonical owner authority rejected', 'FAIL: accepted');
  EXCEPTION WHEN check_violation THEN
    INSERT INTO guard_results VALUES (2, 'non-canonical owner authority rejected', 'PASS');
  END;

  -- 3. A deferred signature cannot be claimed without owner authority.
  BEGIN
    INSERT INTO qc.approval_decisions
      (approval_case_id, work_item_id, actor_id, decision, subject_version, request_id, signature_deferred)
    VALUES (case_id, work_id, other_id, 'APPROVE', 2, 'req-3', TRUE);
    INSERT INTO guard_results VALUES (3, 'deferred signature requires owner authority', 'FAIL: accepted');
  EXCEPTION WHEN check_violation THEN
    INSERT INTO guard_results VALUES (3, 'deferred signature requires owner authority', 'PASS');
  END;

  -- 4. The recorded owner login identity is the canonical one only.
  BEGIN
    INSERT INTO qc.approval_decisions
      (approval_case_id, work_item_id, actor_id, decision, subject_version, request_id,
       owner_authority, owner_login_identity)
    VALUES (case_id, work_id, other_id, 'APPROVE', 2, 'req-4', 'SYSTEM_OWNER', 'someone-else');
    INSERT INTO guard_results VALUES (4, 'non-canonical owner login identity rejected', 'FAIL: accepted');
  EXCEPTION WHEN check_violation THEN
    INSERT INTO guard_results VALUES (4, 'non-canonical owner login identity rejected', 'PASS');
  END;

  -- 5. A workflow refusal is never recorded as a signature-deferred approval.
  BEGIN
    INSERT INTO qc.approval_decisions
      (approval_case_id, work_item_id, actor_id, decision, subject_version, request_id,
       owner_authority, signature_deferred)
    VALUES (case_id, work_id, owner_id, 'RETURN', 2, 'req-5', 'SYSTEM_OWNER', TRUE);
    INSERT INTO guard_results VALUES (5, 'deferred signature rejected on a refusal', 'FAIL: accepted');
  EXCEPTION WHEN check_violation THEN
    INSERT INTO guard_results VALUES (5, 'deferred signature rejected on a refusal', 'PASS');
  END;

  -- 6. Idempotency: the same request cannot produce a second decision row.
  BEGIN
    INSERT INTO qc.approval_decisions
      (approval_case_id, work_item_id, actor_id, decision, subject_version, request_id)
    VALUES (case_id, work_id, other_id, 'APPROVE', 2, 'req-1');
    INSERT INTO guard_results VALUES (6, 'duplicate request idempotency enforced', 'FAIL: accepted');
  EXCEPTION WHEN unique_violation THEN
    INSERT INTO guard_results VALUES (6, 'duplicate request idempotency enforced', 'PASS');
  END;

  -- 7. The audit reference must be a real audit event (FK enforced).
  BEGIN
    INSERT INTO qc.approval_decisions
      (approval_case_id, work_item_id, actor_id, decision, subject_version, request_id, audit_event_id)
    VALUES (case_id, work_id, other_id, 'APPROVE', 2, 'req-7', gen_random_uuid());
    INSERT INTO guard_results VALUES (7, 'audit event reference must exist', 'FAIL: accepted');
  EXCEPTION WHEN foreign_key_violation THEN
    INSERT INTO guard_results VALUES (7, 'audit event reference must exist', 'PASS');
  END;

  -- 8. Historical rows are untouched: every pre-existing decision has NULL authority.
  IF EXISTS (SELECT 1 FROM qc.approval_decisions WHERE owner_authority IS NOT NULL AND request_id <> 'req-1') THEN
    INSERT INTO guard_results VALUES (8, 'no fabricated owner authority on other rows', 'FAIL');
  ELSE
    INSERT INTO guard_results VALUES (8, 'no fabricated owner authority on other rows', 'PASS');
  END IF;

  -- 9. The deferred-signature decision created no electronic signature row.
  IF EXISTS (SELECT 1 FROM qc.electronic_signatures) THEN
    INSERT INTO guard_results VALUES (9, 'owner decision creates no electronic signature', 'FAIL');
  ELSE
    INSERT INTO guard_results VALUES (9, 'owner decision creates no electronic signature', 'PASS');
  END IF;
END
$verify$;

SELECT n, test, result FROM guard_results ORDER BY n;
SELECT count(*) FILTER (WHERE result = 'PASS') AS passed,
       count(*) FILTER (WHERE result <> 'PASS') AS failed
FROM guard_results;

ROLLBACK;
