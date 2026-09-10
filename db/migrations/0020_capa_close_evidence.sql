CREATE TABLE qc.capa_close_snapshots (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  capa_id UUID NOT NULL,
  capa_version BIGINT NOT NULL CHECK (capa_version > 0),
  snapshot JSONB NOT NULL,
  snapshot_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_capa_close_snapshots__version UNIQUE (capa_id, capa_version),
  CONSTRAINT fk_capa_close_snapshots__capa_id FOREIGN KEY (capa_id) REFERENCES qc.capas (id) ON DELETE RESTRICT
);

CREATE INDEX idx_capa_close_snapshots__capa_id ON qc.capa_close_snapshots (capa_id);
