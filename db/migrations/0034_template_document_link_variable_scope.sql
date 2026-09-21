-- Keep 0033 immutable: its trigger variable template_id conflicts with the
-- inspection_template_versions.template_id column under PL/pgSQL's default
-- variable-conflict policy. Use unambiguous local names and qualified columns.
CREATE OR REPLACE FUNCTION qc.guard_template_document_source_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  template_state TEXT;
  source_state TEXT;
  template_version_id_value UUID;
  document_version_id_value UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    template_version_id_value := NEW.template_version_id;
    document_version_id_value := NEW.document_version_id;
    IF TG_TABLE_NAME = 'inspection_template_document_sources' THEN
      SELECT template_version.state
        INTO template_state
        FROM qc.inspection_template_versions AS template_version
       WHERE template_version.id = template_version_id_value
       FOR KEY SHARE;
    ELSE
      SELECT template_version.state
        INTO template_state
        FROM qc.lab_test_template_versions AS template_version
       WHERE template_version.id = template_version_id_value
       FOR KEY SHARE;
    END IF;

    SELECT document_version.state
      INTO source_state
      FROM qc.document_versions AS document_version
     WHERE document_version.id = document_version_id_value
     FOR KEY SHARE;

    IF template_state IS DISTINCT FROM 'DRAFT' OR source_state IS DISTINCT FROM 'EFFECTIVE' THEN
      RAISE EXCEPTION 'template document sources require a draft template and an effective document version'
        USING ERRCODE = '55006';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'template document source evidence is append-only'
    USING ERRCODE = '55006';
END;
$$;
