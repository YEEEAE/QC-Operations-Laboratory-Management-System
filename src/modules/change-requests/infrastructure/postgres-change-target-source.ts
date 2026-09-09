import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isUuid } from '../../../shared/id/uuid.js';
import type {
  ChangeTargetSource,
  DocumentVersionChangeTarget,
} from '../ports/change-target-source.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIST_LIMIT = 200;

function authorizeTargetView(
  actor: ActorContext,
  target: { id: string; state: string; ownerId: string; version: bigint; active: boolean },
): void {
  authorize(
    {
      actor,
      permission: 'PERM-DOC-VIEW',
      action: 'VIEW',
      entity: {
        type: 'DOCUMENT_VERSION',
        id: target.id,
        state: target.state,
        ownerId: target.ownerId,
      },
      scope: { ownerId: target.ownerId },
      currentVersion: target.version,
      expectedVersion: target.version,
      businessCondition: target.active,
    },
    { throwOnDeny: true },
  );
}

/**
 * Postgres read model for DOCUMENT_VERSION change targets, owned by the
 * controlled-documents tables but projected for the change-request workflow.
 * Every returned target passed PERM-DOC-VIEW for the calling actor; the
 * creation path re-loads the selected target and re-verifies the expected
 * version inside the write transaction (see `createForDocumentVersion`).
 */
export class PostgresChangeTargetSource implements ChangeTargetSource {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async listChangeTargets(input: {
    actor: ActorContext;
  }): Promise<readonly DocumentVersionChangeTarget[]> {
    try {
      const rows = await this.database
        .selectFrom('document_versions as v')
        .innerJoin('document_identities as d', 'd.id', 'v.document_id')
        .select([
          'v.id as id',
          'v.document_id as documentId',
          'v.revision as revision',
          'v.change_summary as changeSummary',
          'v.content_hash as contentHash',
          'v.state as state',
          'v.version as version',
          'd.document_no as documentNo',
          'd.document_type as documentType',
          'd.title as title',
          'd.owner_id as ownerId',
          'd.created_by as createdBy',
          'd.active as active',
        ])
        .orderBy('d.updated_at', 'desc')
        .limit(LIST_LIMIT)
        .execute();
      const targets: DocumentVersionChangeTarget[] = [];
      for (const row of rows) {
        const ownerId = (row.ownerId as string | null) ?? (row.createdBy as string);
        const target = {
          id: row.id as string,
          documentId: row.documentId as string,
          documentNo: row.documentNo as string,
          documentType: row.documentType as string,
          title: row.title as string,
          revision: row.revision as string,
          ...((row.changeSummary as string | null)
            ? { changeSummary: row.changeSummary as string }
            : {}),
          ...((row.contentHash as string | null) ? { contentHash: row.contentHash as string } : {}),
          state: row.state as string,
          version: BigInt(row.version as bigint | number | string),
        };
        try {
          authorizeTargetView(input.actor, {
            id: target.id,
            state: target.state,
            ownerId,
            version: target.version,
            active: row.active as boolean,
          });
          targets.push(target);
        } catch {
          continue;
        }
      }
      return targets;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async loadChangeTarget(input: {
    id: string;
    actor: ActorContext;
  }): Promise<DocumentVersionChangeTarget> {
    if (!UUID_PATTERN.test(input.id) || !isUuid(input.id)) {
      throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    }
    try {
      const row = await this.database
        .selectFrom('document_versions as v')
        .innerJoin('document_identities as d', 'd.id', 'v.document_id')
        .select([
          'v.id as id',
          'v.document_id as documentId',
          'v.revision as revision',
          'v.change_summary as changeSummary',
          'v.content_hash as contentHash',
          'v.state as state',
          'v.version as version',
          'd.document_no as documentNo',
          'd.document_type as documentType',
          'd.title as title',
          'd.owner_id as ownerId',
          'd.created_by as createdBy',
          'd.active as active',
        ])
        .where('v.id', '=', input.id)
        .executeTakeFirst();
      if (!row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      const ownerId = (row.ownerId as string | null) ?? (row.createdBy as string);
      const target: DocumentVersionChangeTarget = {
        id: row.id as string,
        documentId: row.documentId as string,
        documentNo: row.documentNo as string,
        documentType: row.documentType as string,
        title: row.title as string,
        revision: row.revision as string,
        ...((row.changeSummary as string | null)
          ? { changeSummary: row.changeSummary as string }
          : {}),
        ...((row.contentHash as string | null) ? { contentHash: row.contentHash as string } : {}),
        state: row.state as string,
        version: BigInt(row.version as bigint | number | string),
      };
      authorizeTargetView(input.actor, {
        id: target.id,
        state: target.state,
        ownerId,
        version: target.version,
        active: row.active as boolean,
      });
      return target;
    } catch (error) {
      throw error instanceof AppError ? error : translateDatabaseError(error);
    }
  }
}
