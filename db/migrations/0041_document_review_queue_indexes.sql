-- Bounded review queue lookup. State is selective and the timestamp/id pair
-- provides the stable newest-first page order without sorting all versions.
CREATE INDEX idx_document_versions__review_queue
  ON qc.document_versions (created_at DESC, id DESC, document_id)
  WHERE state = 'IN_REVIEW';

-- Owner scope is resolved on active identities. The two partial indexes
-- support the owner and owner-fallback-to-creator arms of the same predicate.
CREATE INDEX idx_document_identities__active_owner
  ON qc.document_identities (owner_id, id)
  WHERE active = TRUE AND owner_id IS NOT NULL;

CREATE INDEX idx_document_identities__active_creator
  ON qc.document_identities (created_by, id)
  WHERE active = TRUE AND owner_id IS NULL;
