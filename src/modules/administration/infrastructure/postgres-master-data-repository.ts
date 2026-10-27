import { createHash } from 'node:crypto';
import { sql } from 'kysely';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { assertSafeAuditPayload, assertSafeAuditText } from '../../../shared/audit/audit-event.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { MasterDataRepository, MasterDataRevision } from '../ports/master-data-repository.js';

type RevisionRow = {
  id: string; dataset_key: string; content_sha256: string; source_owner: string;
  source_reference: string; effective_revision: string | null; source_approval_reference: string | null;
  adapter_key: string | null; source_last_updated: string | null; header_mapping: Record<string, string>;
  records: Record<string, unknown>[]; preview: Record<string, unknown>;
  approval_state: MasterDataRevision['approvalState']; import_state: MasterDataRevision['importState']; version: number;
};

const selectRevision = sql<RevisionRow>`
  select id, dataset_key, content_sha256, source_owner, source_reference,
    effective_revision, source_approval_reference, adapter_key,
    source_last_updated::text as source_last_updated, header_mapping, records, preview,
    approval_state, import_state, version
  from qc.master_data_import_revisions`;

function map(row: RevisionRow): MasterDataRevision {
  return {
    id: row.id, datasetKey: row.dataset_key, contentSha256: row.content_sha256,
    sourceOwner: row.source_owner, sourceReference: row.source_reference,
    effectiveRevision: row.effective_revision, sourceApprovalReference: row.source_approval_reference,
    adapterKey: row.adapter_key, sourceLastUpdated: row.source_last_updated,
    headerMapping: row.header_mapping, records: row.records, preview: row.preview,
    approvalState: row.approval_state, importState: row.import_state, version: Number(row.version),
  };
}

function requireOwner(actor: Parameters<typeof isNamedSystemOwner>[0]): void {
  if (!isNamedSystemOwner(actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
}

export class PostgresMasterDataRepository implements MasterDataRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async listRevisions(): Promise<readonly MasterDataRevision[]> {
    try {
      const result = await sql<RevisionRow>`
        select id, dataset_key, content_sha256, source_owner, source_reference,
          effective_revision, source_approval_reference, adapter_key,
          source_last_updated::text as source_last_updated, header_mapping, records, preview,
          approval_state, import_state, version
        from qc.master_data_import_revisions
        order by submitted_at desc, id desc limit 100
      `.execute(this.db);
      return result.rows.map(map);
    } catch (error) { throw translateDatabaseError(error); }
  }

  async submitRevision(input: Parameters<MasterDataRepository['submitRevision']>[0]): Promise<MasterDataRevision> {
    requireOwner(input.actor);
    const fingerprint = createHash('sha256').update(JSON.stringify({
      datasetKey: input.datasetKey, contentSha256: input.contentSha256,
      sourceOwner: input.sourceOwner, sourceReference: input.sourceReference,
      adapterKey: input.adapterKey, headerMapping: input.headerMapping, records: input.records,
    })).digest('hex');
    try {
      return await this.db.transaction().execute(async (tx) => {
        const prior = await sql<RevisionRow>`
          ${selectRevision} where dataset_key = ${input.datasetKey} and request_id = ${input.requestId} for update
        `.execute(tx);
        if (prior.rows[0]) {
          const stored = await sql<{ request_fingerprint: string }>`
            select request_fingerprint from qc.master_data_import_revisions where id = ${prior.rows[0].id}
          `.execute(tx);
          if (stored.rows[0]?.request_fingerprint !== fingerprint) throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
          return map(prior.rows[0]);
        }
        const inserted = await sql<RevisionRow>`
          insert into qc.master_data_import_revisions
            (dataset_key, content_sha256, source_owner, source_reference, adapter_key,
             header_mapping, records, preview, request_id, request_fingerprint, submitted_by)
          values (${input.datasetKey}, ${input.contentSha256}, ${input.sourceOwner}, ${input.sourceReference},
            ${input.adapterKey}, ${JSON.stringify(input.headerMapping)}::jsonb, ${JSON.stringify(input.records)}::jsonb,
            ${JSON.stringify(input.preview)}::jsonb, ${input.requestId}, ${fingerprint}, ${input.actor.id})
          returning id, dataset_key, content_sha256, source_owner, source_reference, effective_revision,
            source_approval_reference, adapter_key, source_last_updated::text as source_last_updated,
            header_mapping, records, preview, approval_state, import_state, version
        `.execute(tx);
        if (!inserted.rows[0]) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE');
        return map(inserted.rows[0]);
      });
    } catch (error) { throw translateDatabaseError(error); }
  }

  async decideRevision(input: Parameters<MasterDataRepository['decideRevision']>[0]): Promise<MasterDataRevision> {
    requireOwner(input.actor);
    try {
      return await this.db.transaction().execute(async (tx) => {
        const current = await sql<RevisionRow>`
          ${selectRevision} where id = ${input.revisionId} for update
        `.execute(tx);
        const row = current.rows[0];
        if (!row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        const priorDecision = await sql<{ actor_id: string; event_type: string; content_sha256: string; reason: string }>`
          select actor_id, event_type, content_sha256, reason from qc.master_data_approval_events
          where revision_id = ${input.revisionId} and request_id = ${input.requestId}
        `.execute(tx);
        if (priorDecision.rows[0]) {
          const event = priorDecision.rows[0];
          if (event.actor_id !== input.actor.id || event.event_type !== 'OWNER_APPROVE'
            || event.content_sha256 !== row.content_sha256 || event.reason !== input.reason
            || row.approval_state !== 'APPROVED' || row.effective_revision !== input.effectiveRevision
            || row.source_approval_reference !== input.sourceApprovalReference
            || row.source_last_updated !== input.sourceLastUpdated) {
            throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
          }
          return map(row);
        }
        if (Number(row.version) !== input.expectedVersion) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (row.approval_state !== 'PENDING_SOURCE_APPROVAL' || row.import_state !== 'NOT_IMPORTED') {
          throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
        }
        const changed = await sql<RevisionRow>`
          update qc.master_data_import_revisions set approval_state = 'APPROVED',
            effective_revision = ${input.effectiveRevision}, source_approval_reference = ${input.sourceApprovalReference},
            source_last_updated = ${input.sourceLastUpdated}::date, version = version + 1
          where id = ${input.revisionId} and version = ${input.expectedVersion}
          returning id, dataset_key, content_sha256, source_owner, source_reference, effective_revision,
            source_approval_reference, adapter_key, source_last_updated::text as source_last_updated,
            header_mapping, records, preview, approval_state, import_state, version
        `.execute(tx);
        if (!changed.rows[0]) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const auditEventId = uuidv7();
        const auditPayload = { datasetKey: row.dataset_key, contentSha256: row.content_sha256,
          effectiveRevision: input.effectiveRevision, sourceApprovalReference: input.sourceApprovalReference,
          authority: 'SYSTEM_OWNER', ownerLoginIdentity: 'yazeed', signatureDeferred: true };
        assertSafeAuditPayload(auditPayload);
        assertSafeAuditText(input.reason);
        await tx.insertInto('audit_events').values({
          id: auditEventId, actor_type: 'USER', actor_id: input.actor.id,
          subject_type: 'MASTER_DATA_REVISION', subject_id: input.revisionId,
          action: 'OWNER_APPROVE_MASTER_DATA', transition_id: null,
          old_state: 'PENDING_SOURCE_APPROVAL', new_state: 'APPROVED', reason: input.reason,
          request_id: input.requestId, signature_id: null, payload: stableJson(auditPayload),
        }).execute();
        await sql`
          insert into qc.master_data_approval_events
            (revision_id, event_type, actor_id, owner_authority, owner_login_identity,
             content_sha256, request_id, audit_event_id, reason, signature_deferred)
          values (${input.revisionId}, 'OWNER_APPROVE', ${input.actor.id}, 'SYSTEM_OWNER', 'yazeed',
            ${row.content_sha256}, ${input.requestId}, ${auditEventId}, ${input.reason}, TRUE)
        `.execute(tx);
        return map(changed.rows[0]);
      });
    } catch (error) { throw translateDatabaseError(error); }
  }
}
