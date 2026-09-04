CREATE INDEX idx_audit_events__actor ON qc.audit_events (actor_id);
CREATE INDEX idx_audit_events__occurred_at ON qc.audit_events (occurred_at);
CREATE INDEX idx_audit_events__action ON qc.audit_events (action);
CREATE INDEX idx_outbox_events__aggregate
  ON qc.outbox_events (aggregate_type, aggregate_id);
CREATE INDEX idx_outbox_events__event_type
  ON qc.outbox_events (event_type);

-- The approved data model keeps idempotent_commands architecture-dependent and
-- the dictionary explicitly defers its migration until the API command strategy
-- is approved. Existing outbox rows remain durable and transactional.
