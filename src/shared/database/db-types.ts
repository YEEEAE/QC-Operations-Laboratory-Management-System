import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface SchemaMigrationsTable {
  version: string;
  name: string;
  checksum: string;
  applied_at: Generated<Date>;
  execution_ms: number | null;
  runner_version: string | null;
}

export interface UsersTable {
  id: Generated<string>;
  login_identity: string;
  email: string | null;
  display_name: string;
  password_hash: string;
  account_state: string;
  must_change_password: Generated<boolean>;
  last_login_at: Date | null;
  created_at: Generated<Date>;
  created_by: string | null;
  updated_at: Generated<Date>;
  updated_by: string | null;
  version: Generated<bigint>;
}

export interface SessionsTable {
  id: Generated<string>;
  user_id: string;
  session_token_hash: string;
  created_at: Generated<Date>;
  last_seen_at: Date | null;
  expires_at: Date;
  revoked_at: Date | null;
  revoked_reason: string | null;
  version: Generated<bigint>;
}

export interface AuditEventsTable {
  id: Generated<string>;
  event_no: Generated<bigint>;
  occurred_at: Generated<Date>;
  actor_type: string;
  actor_id: string | null;
  subject_type: string;
  subject_id: string;
  action: string;
  transition_id: string | null;
  old_state: string | null;
  new_state: string | null;
  reason: string | null;
  request_id: string;
  signature_id: string | null;
  payload: unknown | null;
}

export interface OutboxEventsTable {
  id: Generated<string>;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: unknown;
  created_at: Generated<Date>;
  available_at: Generated<Date>;
  processed_at: Date | null;
  attempt_count: Generated<number>;
  last_error: string | null;
  dedupe_key: string | null;
}

export interface IdempotencyRecordsTable {
  id: Generated<string>;
  key: string;
  request_fingerprint: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response_payload: unknown | null;
  created_at: Generated<Date>;
  completed_at: Date | null;
}

export interface DatabaseSchema {
  schema_migrations: SchemaMigrationsTable;
  users: UsersTable;
  sessions: SessionsTable;
  audit_events: AuditEventsTable;
  outbox_events: OutboxEventsTable;
  idempotency_records: IdempotencyRecordsTable;
}

export type DatabaseRow<T extends keyof DatabaseSchema> = Selectable<DatabaseSchema[T]>;
export type DatabaseInsert<T extends keyof DatabaseSchema> = Insertable<DatabaseSchema[T]>;
export type DatabaseUpdate<T extends keyof DatabaseSchema> = Updateable<DatabaseSchema[T]>;
