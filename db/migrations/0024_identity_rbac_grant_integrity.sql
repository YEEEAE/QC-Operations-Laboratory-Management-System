-- Identity/RBAC grant integrity. Historical migrations stay immutable: this
-- forward migration makes active grants safe under concurrent admin requests.
-- Earlier code could write duplicate active role grants. Preserve one oldest
-- grant per pair and close only its redundant duplicates before adding the
-- partial unique index required by the canonical idempotency contract.

WITH ranked_active_grants AS (
  SELECT
    id,
    assigned_by,
    row_number() OVER (
      PARTITION BY user_id, role_id
      ORDER BY assigned_at ASC, id ASC
    ) AS grant_rank
  FROM qc.user_roles
  WHERE revoked_at IS NULL
)
UPDATE qc.user_roles AS grant_row
SET revoked_at = CURRENT_TIMESTAMP,
    revoked_by = ranked_active_grants.assigned_by,
    reason = COALESCE(grant_row.reason, 'Closed redundant active role grant by migration 0024')
FROM ranked_active_grants
WHERE grant_row.id = ranked_active_grants.id
  AND ranked_active_grants.grant_rank > 1;

CREATE UNIQUE INDEX uq_user_roles__active
  ON qc.user_roles (user_id, role_id)
  WHERE revoked_at IS NULL;

ALTER TABLE qc.user_scopes
  DROP CONSTRAINT ck_user_scopes__value;

-- OWN/ASSIGNED/GLOBAL values were never interpreted by the evaluator. Clear
-- those non-canonical decorations before making the database contract strict.
UPDATE qc.user_scopes
SET scope_value = NULL
WHERE scope_kind IN ('OWN', 'ASSIGNED', 'GLOBAL')
  AND scope_value IS NOT NULL;

ALTER TABLE qc.user_scopes
  ADD CONSTRAINT ck_user_scopes__value
  CHECK (
    (scope_kind IN ('TEAM', 'DEPARTMENT', 'SITE', 'DOMAIN')
      AND length(btrim(COALESCE(scope_value, ''))) > 0)
    OR (scope_kind IN ('OWN', 'ASSIGNED', 'GLOBAL') AND scope_value IS NULL)
  );
