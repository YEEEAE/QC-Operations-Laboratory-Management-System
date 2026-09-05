import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/db-types';
import { stableJson } from '../json/stable-stringify';
import { uuidv7 } from '../id/uuid';
import type { AuditEventInput } from './audit-event';
import type { AuditRepository } from './audit-repository';
export class PostgresAuditRepository implements AuditRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async append(event: AuditEventInput): Promise<void> {
    await this.database
      .insertInto('audit_events')
      .values({
        id: uuidv7(),
        actor_type: event.actorType,
        actor_id: event.actorId ?? null,
        subject_type: event.subjectType,
        subject_id: event.subjectId,
        action: event.action,
        transition_id: event.transitionId ?? null,
        old_state: event.oldState ?? null,
        new_state: event.newState ?? null,
        reason: event.reason ?? null,
        request_id: event.requestId,
        signature_id: event.signatureId ?? null,
        payload: event.payload ? stableJson(event.payload) : null,
      })
      .execute();
  }
}
