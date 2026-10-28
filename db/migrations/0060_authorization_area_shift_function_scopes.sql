-- Add the controlled dimensions already represented in the authorization
-- model to persisted user scopes. Existing grants are preserved as-is.
ALTER TABLE qc.user_scopes DROP CONSTRAINT user_scopes_scope_kind_check;
ALTER TABLE qc.user_scopes
  ADD CONSTRAINT user_scopes_scope_kind_check
  CHECK (scope_kind IN (
    'OWN', 'ASSIGNED', 'TEAM', 'AREA', 'DEPARTMENT', 'SITE', 'DOMAIN',
    'SHIFT', 'FUNCTION', 'GLOBAL'
  ));
ALTER TABLE qc.user_scopes DROP CONSTRAINT ck_user_scopes__value;
ALTER TABLE qc.user_scopes
  ADD CONSTRAINT ck_user_scopes__value
  CHECK (
    (scope_kind IN ('TEAM', 'AREA', 'DEPARTMENT', 'SITE', 'DOMAIN', 'SHIFT', 'FUNCTION')
      AND length(btrim(COALESCE(scope_value, ''))) > 0)
    OR (scope_kind IN ('OWN', 'ASSIGNED', 'GLOBAL') AND scope_value IS NULL)
  );

