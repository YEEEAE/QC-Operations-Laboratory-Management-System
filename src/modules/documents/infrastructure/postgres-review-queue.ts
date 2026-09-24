import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { DocumentReviewQueueItem, DocumentReviewQueueQuery } from '../ports/repository.js';

/** One indexed, actor-scoped query for both the exact total and bounded rows. */
export class PostgresDocumentReviewQueueQuery implements DocumentReviewQueueQuery {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async listForReviewer(input: {
    actorId: string;
    global: boolean;
    own: boolean;
    limit: number;
  }): Promise<{ total: number; items: readonly DocumentReviewQueueItem[] }> {
    let query = this.database
      .selectFrom('document_versions as version')
      .innerJoin('document_identities as document', 'document.id', 'version.document_id')
      .select([
        'version.id as versionId',
        'version.document_id as documentId',
        'document.document_no as documentNo',
        'document.title as title',
        'version.revision as revision',
        'version.created_by as authorId',
        'document.created_by as documentCreatorId',
        'document.owner_id as documentOwnerId',
        'version.created_at as createdAt',
        (eb) => eb.fn.countAll<number>().over().as('total'),
      ])
      .where('version.state', '=', 'IN_REVIEW')
      .where('document.active', '=', true)
      // Review and approval-review each require a grant. Self-review is denied
      // by the same author/actor separation enforced by ReviewVersionUseCase.
      .where('version.created_by', '!=', input.actorId);

    if (!input.global) {
      if (!input.own) return { total: 0, items: [] };
      query = query.where((eb) =>
        eb('document.owner_id', '=', input.actorId).or(
          eb.and([
            eb('document.owner_id', 'is', null),
            eb('document.created_by', '=', input.actorId),
          ]),
        ),
      ) as typeof query;
    }

    const rows = await query
      .orderBy('version.created_at', 'desc')
      .orderBy('version.id', 'desc')
      .limit(input.limit)
      .execute();
    const total = rows.length === 0 ? 0 : Number(rows[0]!.total);
    const items = rows.map((row): DocumentReviewQueueItem => ({
      versionId: row.versionId,
      documentId: row.documentId,
      documentNo: row.documentNo,
      title: row.title,
      revision: row.revision,
      state: 'IN_REVIEW',
      authorId: row.authorId,
      ownerId: row.documentOwnerId ?? row.documentCreatorId,
      createdAt: row.createdAt,
    }));
    return { total, items };
  }
}
