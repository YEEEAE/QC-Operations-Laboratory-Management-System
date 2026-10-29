import type { Kysely } from 'kysely';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { GetReceivingUseCase } from '../receiving/application/get-receiving.js';
import { PostgresReceivingRepository } from '../receiving/infrastructure/postgres-repository.js';
import { GetInspectionUseCase } from '../inspection/application/get-inspection.js';
import { PostgresInspectionRepository } from '../inspection/infrastructure/postgres-repository.js';
import { GetLabTestUseCase } from '../../laboratory/application/get-lab-test.js';
import { PostgresLabRepository } from '../../laboratory/infrastructure/postgres-repository.js';
import type { LotTraceabilityReader, TraceabilityEvent } from '../application/lot-traceability.js';

/** Read-only projection. Each aggregate is authorized by its owning read use case before events are selected. */
export class PostgresLotTraceabilityReader implements LotTraceabilityReader {
  private readonly getReceiving: GetReceivingUseCase;
  private readonly getInspection: GetInspectionUseCase;
  private readonly getLabTest: GetLabTestUseCase;

  constructor(private readonly database: Kysely<DatabaseSchema>) {
    this.getReceiving = new GetReceivingUseCase(new PostgresReceivingRepository(database));
    this.getInspection = new GetInspectionUseCase(new PostgresInspectionRepository(database));
    this.getLabTest = new GetLabTestUseCase(new PostgresLabRepository(database));
  }

  async read(input: { actor: ActorContext; receivingId: string }) {
    const receiving = await this.getReceiving.execute({ actor: input.actor, id: input.receivingId });
    const inspectionIds = await this.database.selectFrom('inspection_reports')
      .select('id').where('receiving_item_id', '=', receiving.id).execute();
    const inspections = [];
    for (const row of inspectionIds) {
      try { inspections.push(await this.getInspection.execute({ actor: input.actor, id: row.id })); }
      catch (error) {
        if (!isAuthorizationOrNotFound(error)) throw error;
      }
    }

    const labIds = new Set<string>();
    let frontier = await this.database.selectFrom('lab_tests')
      .select('id').where('source_receiving_item_id', '=', receiving.id).execute();
    for (const row of frontier) labIds.add(row.id);
    // Retests are linked only by original_test_id; walk that persisted FK chain.
    for (let depth = 0; frontier.length && depth < 32; depth += 1) {
      const parents = frontier.map((row) => row.id);
      frontier = await this.database.selectFrom('lab_tests').select('id')
        .where('original_test_id', 'in', parents).execute();
      frontier = frontier.filter((row) => !labIds.has(row.id));
      for (const row of frontier) labIds.add(row.id);
    }
    const tests = [];
    for (const id of labIds) {
      try { tests.push(await this.getLabTest.execute({ actor: input.actor, id })); }
      catch (error) {
        if (!isAuthorizationOrNotFound(error)) throw error;
      }
    }

    const sourceLinks = [
      { id: receiving.id, type: 'RECEIVING_ITEM', href: `/quarantine/receiving/${encodeURIComponent(receiving.id)}` },
      ...inspections.map((item) => ({ id: item.id, type: 'INSPECTION_REPORT', href: `/quarantine/inspections/${encodeURIComponent(item.id)}` })),
      ...tests.map((item) => ({ id: item.id, type: 'LAB_TEST', href: `/laboratory/tests/${encodeURIComponent(item.id)}` })),
    ];
    const canReadAudit = input.actor.permissions.some((permission) =>
      permission.code === 'PERM-ADM-AUDIT-VIEW' && permission.active !== false && permission.scopes.includes('GLOBAL'));
    const events: TraceabilityEvent[] = [];

    if (canReadAudit && sourceLinks.length) {
      const rows = await this.database.selectFrom('audit_events')
        .select(['id', 'event_no', 'occurred_at', 'actor_id', 'subject_type', 'subject_id', 'action', 'new_state'])
        .where((eb) => eb.or(sourceLinks.map((source) => eb.and([
          eb('subject_id', '=', source.id), eb('subject_type', '=', source.type),
        ]))))
        .orderBy('occurred_at', 'asc').orderBy('event_no', 'asc').execute();
      const sourceByKey = new Map(sourceLinks.map((source) => [`${source.type}:${source.id}`, source]));
      for (const row of rows) {
        const source = sourceByKey.get(`${row.subject_type}:${row.subject_id}`);
        if (!source) continue;
        const type = source.type === 'RECEIVING_ITEM' ? 'RECEIVING' : source.type === 'INSPECTION_REPORT' ? 'INSPECTION' : 'LABORATORY';
        events.push({
          id: row.id,
          type,
          sourceId: source.id,
          occurredAt: asDate(row.occurred_at),
          actorId: row.actor_id ?? undefined,
          state: row.new_state ?? undefined,
          action: row.action,
          sourceRevision: String(row.event_no),
          href: source.href,
        });
      }
    }

    const canReadDocumentRevisions = input.actor.permissions.some((permission) =>
      permission.code === 'PERM-DOC-VIEW' && permission.active !== false && permission.scopes.includes('GLOBAL'));
    if (canReadDocumentRevisions) {
      const contextIds = [
        ...inspections.map((item) => ({ id: item.id, type: 'INSPECTION_REPORT' as const, href: `/quarantine/inspections/${encodeURIComponent(item.id)}` })),
        ...tests.map((item) => ({ id: item.id, type: 'LAB_TEST' as const, href: `/laboratory/tests/${encodeURIComponent(item.id)}` })),
      ];
      if (contextIds.length) {
        const contexts = await this.database.selectFrom('document_execution_contexts')
          .select(['id', 'execution_type', 'execution_id', 'checkpoint', 'revision', 'execution_at', 'captured_by'])
          .where((eb) => eb.or(contextIds.map((source) => eb.and([
            eb('execution_id', '=', source.id), eb('execution_type', '=', source.type),
          ]))))
          .orderBy('execution_at', 'asc').execute();
        const contextSource = new Map(contextIds.map((source) => [`${source.type}:${source.id}`, source]));
        for (const context of contexts) {
          const source = contextSource.get(`${context.execution_type}:${context.execution_id}`);
          if (!source) continue;
          events.push({
            id: context.id,
            type: 'DOCUMENT',
            sourceId: context.id,
            occurredAt: asDate(context.execution_at),
            actorId: context.captured_by,
            state: 'SOURCE CAPTURED',
            action: `${context.checkpoint} · controlled document revision ${context.revision}`,
            sourceRevision: context.revision,
            href: source.href,
          });
        }
      }
    }

    return {
      record: {
        id: receiving.id,
        receivingNo: receiving.receivingNo,
        itemCode: receiving.itemCode,
        lot: receiving.lot,
        workflowState: receiving.workflowState,
        inspectionResult: receiving.inspectionResult,
        releaseState: receiving.releaseSystem ? 'RELEASED' as const : 'NOT_RELEASED' as const,
      },
      events,
      auditEventsAvailable: canReadAudit,
      documentRevisionsAvailable: canReadDocumentRevisions,
    };
  }
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function isAuthorizationOrNotFound(error: unknown): boolean {
  const candidate = error as { category?: string; code?: string } | null;
  return candidate?.category === 'AUTHORIZATION' || candidate?.code === 'RESOURCE_NOT_FOUND';
}
