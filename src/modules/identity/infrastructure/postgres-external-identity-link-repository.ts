import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ExternalIdentityLinksTable } from '../../../shared/database/db-types.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ExternalIdentityLinkRepository } from '../ports/external-identity-link-repository.js';
import type { ExternalIdentityDeactivationReason } from '../domain/external-identity-link.js';

const map = (row: Selectable<ExternalIdentityLinksTable>) => ({
  id: row.id,
  userId: row.user_id,
  issuer: row.issuer,
  subject: row.subject,
  state: row.state,
  source: row.source,
  createdBy: row.created_by,
  createdAt: row.created_at,
  approvedBy: row.approved_by,
  approvedAt: row.approved_at,
  ...(row.deactivated_by ? { deactivatedBy: row.deactivated_by } : {}),
  ...(row.deactivated_at ? { deactivatedAt: row.deactivated_at } : {}),
  ...(row.deactivation_reason ? { deactivationReason: row.deactivation_reason } : {}),
  ...(row.deactivation_note ? { deactivationNote: row.deactivation_note } : {}),
});

export class PostgresExternalIdentityLinkRepository implements ExternalIdentityLinkRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async findById(id: string) {
    const row = await this.database
      .selectFrom('external_identity_links')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? map(row) : undefined;
  }

  private async selectForUser(userId: string, issuer: string) {
    return this.database
      .selectFrom('external_identity_links')
      .selectAll()
      .where('user_id', '=', userId)
      .where('issuer', '=', issuer)
      .executeTakeFirst();
  }

  async findForUser(userId: string, issuer: string) {
    const row = await this.selectForUser(userId, issuer);
    return row ? map(row) : undefined;
  }

  async createApproved(input: {
    userId: string;
    issuer: string;
    subject: string;
    actorId: string;
    requestId: string;
    note: string;
  }) {
    return this.database.transaction().execute(async (trx) => {
      const id = uuidv7();
      const row = await trx
        .insertInto('external_identity_links')
        .values({
          id,
          user_id: input.userId,
          issuer: input.issuer,
          subject: input.subject,
          state: 'ACTIVE',
          source: 'OPERATOR_VERIFIED',
          created_by: input.actorId,
          approved_by: input.actorId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await new PostgresAuditRepository(trx).append({
        actorType: 'USER',
        actorId: input.actorId,
        subjectType: 'USER',
        subjectId: input.userId,
        action: 'EXTERNAL_IDENTITY_LINK_APPROVED',
        newState: 'ACTIVE',
        reason: input.note,
        requestId: input.requestId,
        payload: { identityLinkId: id, issuer: input.issuer, subject: input.subject, source: 'OPERATOR_VERIFIED' },
      });
      return map(row);
    });
  }

  async deactivate(input: {
    id: string;
    actorId: string;
    requestId: string;
    reason: ExternalIdentityDeactivationReason;
    note: string;
  }): Promise<void> {
    await this.database.transaction().execute(async (trx) => {
      const current = await trx
        .selectFrom('external_identity_links')
        .selectAll()
        .where('id', '=', input.id)
        .forUpdate()
        .executeTakeFirst();
      if (!current || current.state !== 'ACTIVE') return;
      await trx
        .updateTable('external_identity_links')
        .set({
          state: 'DEACTIVATED',
          deactivated_by: input.actorId,
          deactivated_at: new Date(),
          deactivation_reason: input.reason,
          deactivation_note: input.note,
        })
        .where('id', '=', input.id)
        .where('state', '=', 'ACTIVE')
        .executeTakeFirst();
      await new PostgresAuditRepository(trx).append({
        actorType: 'USER',
        actorId: input.actorId,
        subjectType: 'USER',
        subjectId: current.user_id,
        action: 'EXTERNAL_IDENTITY_LINK_DEACTIVATED',
        oldState: 'ACTIVE',
        newState: 'DEACTIVATED',
        reason: input.note,
        requestId: input.requestId,
        payload: {
          identityLinkId: input.id,
          issuer: current.issuer,
          subject: current.subject,
          deactivationReason: input.reason,
        },
      });
    });
  }
}
