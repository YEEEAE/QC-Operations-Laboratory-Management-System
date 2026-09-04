CREATE TABLE qc.files (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  original_filename TEXT NOT NULL CHECK (length(btrim(original_filename)) > 0),
  storage_key TEXT NOT NULL,
  storage_provider TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-fA-F]{64}$'),
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  state TEXT NOT NULL,
  CONSTRAINT uq_files__storage_key UNIQUE (storage_key),
  CONSTRAINT fk_files__uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.evidence_links (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  file_id UUID NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  evidence_type TEXT,
  description TEXT,
  linked_by UUID NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removed_at TIMESTAMPTZ,
  removal_reason TEXT,
  CONSTRAINT ck_evidence_links__removal_pair
    CHECK ((removed_at IS NULL AND removal_reason IS NULL)
        OR (removed_at IS NOT NULL AND removal_reason IS NOT NULL)),
  CONSTRAINT fk_evidence_links__file_id
    FOREIGN KEY (file_id) REFERENCES qc.files (id) ON DELETE RESTRICT,
  CONSTRAINT fk_evidence_links__linked_by
    FOREIGN KEY (linked_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.notifications (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  recipient_user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  message TEXT NOT NULL CHECK (length(btrim(message)) > 0),
  subject_type TEXT,
  subject_id UUID,
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMPTZ,
  CONSTRAINT ck_notifications__subject_pair
    CHECK ((subject_type IS NULL) = (subject_id IS NULL)),
  CONSTRAINT uq_notifications__dedupe_key UNIQUE (dedupe_key),
  CONSTRAINT fk_notifications__recipient_user_id
    FOREIGN KEY (recipient_user_id) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  notification_id UUID NOT NULL,
  channel TEXT NOT NULL,
  state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_code TEXT,
  CONSTRAINT fk_notification_deliveries__notification_id
    FOREIGN KEY (notification_id) REFERENCES qc.notifications (id) ON DELETE RESTRICT
);

CREATE INDEX idx_files__uploaded_by ON qc.files (uploaded_by);
CREATE INDEX idx_evidence_links__subject ON qc.evidence_links (subject_type, subject_id);
CREATE INDEX idx_notifications__recipient_unread
  ON qc.notifications (recipient_user_id, created_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_notification_deliveries__notification_id
  ON qc.notification_deliveries (notification_id);

ALTER TABLE qc.files OWNER TO qc_migrator;
ALTER TABLE qc.evidence_links OWNER TO qc_migrator;
ALTER TABLE qc.notifications OWNER TO qc_migrator;
ALTER TABLE qc.notification_deliveries OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.files TO qc_app_runtime;
GRANT SELECT, INSERT, UPDATE ON qc.evidence_links TO qc_app_runtime;
GRANT SELECT, INSERT, UPDATE ON qc.notifications TO qc_app_runtime;
GRANT SELECT, INSERT, UPDATE ON qc.notification_deliveries TO qc_app_runtime;
