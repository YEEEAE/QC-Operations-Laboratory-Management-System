import type { Kysely, Transaction } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../../shared/database/database.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { isUuid } from '../../../../shared/id/uuid.js';
import { actorHasScope } from '../../../../shared/authorization/scope-evaluator.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { AuditRepository } from '../../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../../shared/outbox/postgres-outbox-repository.js';
import {
  transitionMaintenance,
  type MaintenanceAction,
  type MaintenanceRecord,
} from '../domain/maintenance.js';
import type {
  MaintenanceHistory,
  MaintenanceListFilter,
  MaintenanceRepository,
} from '../ports/repository.js';
const map = (row: DatabaseRow<'maintenance_records'>): MaintenanceRecord => ({
  id: row.id,
  maintenanceNo: row.maintenance_no,
  equipmentId: row.equipment_id,
  state: row.state as MaintenanceRecord['state'],
  maintenanceType: row.maintenance_type ?? undefined,
  description: row.description,
  plannedAt: row.planned_at ?? undefined,
  startedAt: row.started_at ?? undefined,
  completedAt: row.completed_at ?? undefined,
  performedBy: row.performed_by ?? undefined,
  provider: row.provider ?? undefined,
  result: row.result ?? undefined,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  version: BigInt(row.version),
  downtimeStartedAt: row.downtime_started_at ?? undefined,
  downtimeEndedAt: row.downtime_ended_at ?? undefined,
  downtimeMinutes: row.downtime_minutes ?? undefined,
});
const entity = (x: MaintenanceRecord) => ({
  type: 'MAINTENANCE_RECORD',
  id: x.id,
  state: x.state,
  ownerId: x.createdBy,
});
const snapshot = (x: MaintenanceRecord): Readonly<Record<string, unknown>> => ({
  id: x.id,
  maintenanceNo: x.maintenanceNo,
  equipmentId: x.equipmentId,
  state: x.state,
  maintenanceType: x.maintenanceType ?? null,
  description: x.description,
  plannedAt: x.plannedAt?.toISOString() ?? null,
  startedAt: x.startedAt?.toISOString() ?? null,
  completedAt: x.completedAt?.toISOString() ?? null,
  performedBy: x.performedBy ?? null,
  provider: x.provider ?? null,
  result: x.result ?? null,
  downtimeStartedAt: x.downtimeStartedAt?.toISOString() ?? null,
  downtimeEndedAt: x.downtimeEndedAt?.toISOString() ?? null,
  downtimeMinutes: x.downtimeMinutes ?? null,
  version: x.version.toString(),
});
export class PostgresMaintenanceRepository implements MaintenanceRepository {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
  ) {}
  async create(input: {
    maintenance: MaintenanceRecord;
    actor: ActorContext;
    requestId: string;
  }): Promise<MaintenanceRecord> {
    try {
      const x = input.maintenance;
      return await this.db.transaction().execute(async (tx) => {
        const row = await tx
          .insertInto('maintenance_records')
          .values({
            id: x.id,
            maintenance_no: x.maintenanceNo,
            equipment_id: x.equipmentId,
            state: 'DRAFT',
            maintenance_type: x.maintenanceType ?? null,
            description: x.description,
            planned_at: x.plannedAt ?? null,
            started_at: null,
            completed_at: null,
            performed_by: x.performedBy ?? null,
            provider: x.provider ?? null,
            result: null,
            created_by: input.actor.id,
            updated_at: x.updatedAt,
            version: 1n,
            downtime_started_at: x.downtimeStartedAt ?? null,
            downtime_ended_at: null,
            downtime_minutes: null,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'MAINTENANCE_RECORD',
          subjectId: x.id,
          action: 'CREATE_MAINTENANCE',
          newState: 'DRAFT',
          requestId: input.requestId,
        });
        await tx
          .insertInto('maintenance_history')
          .values({
            maintenance_id: x.id,
            state: 'DRAFT',
            action: 'CREATE',
            snapshot: snapshot(x),
            changed_by: input.actor.id,
            changed_at: x.updatedAt,
            record_version: 1n,
            request_id: input.requestId,
          })
          .execute();
        await this.outboxFor(tx)?.enqueue({
          eventType: 'MAINTENANCE_CREATED',
          aggregateType: 'MAINTENANCE_RECORD',
          aggregateId: x.id,
          payload: { maintenanceNo: x.maintenanceNo, equipmentId: x.equipmentId, state: 'DRAFT' },
          dedupeKey: `maintenance-created:${x.id}`,
        });
        return map(row);
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
  async get(id: string, actor: ActorContext): Promise<MaintenanceRecord | undefined> {
    if (!isUuid(id)) return undefined;
    const row = await this.db
      .selectFrom('maintenance_records')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!row) return undefined;
    const x = map(row);
    const grant = actor.permissions.find((p) => p.code === 'PERM-MNT-VIEW');
    return actorHasScope(actor, entity(x), { ownerId: x.createdBy }, grant) ? x : undefined;
  }
  async list(input: {
    actor: ActorContext;
    filter?: MaintenanceListFilter;
  }): Promise<readonly MaintenanceRecord[]> {
    let query = this.db
      .selectFrom('maintenance_records')
      .selectAll()
      .orderBy('updated_at', 'desc')
      .orderBy('id', 'desc');
    if (input.filter?.state) query = query.where('state', '=', input.filter.state) as typeof query;
    if (input.filter?.equipmentId)
      query = query.where('equipment_id', '=', input.filter.equipmentId) as typeof query;
    if (input.filter?.search)
      query = query.where('maintenance_no', 'ilike', `%${input.filter.search}%`) as typeof query;
    const rows = await query.execute();
    const grant = input.actor.permissions.find((p) => p.code === 'PERM-MNT-VIEW');
    return rows
      .map(map)
      .filter((x) => actorHasScope(input.actor, entity(x), { ownerId: x.createdBy }, grant));
  }
  async history(id: string, actor: ActorContext): Promise<readonly MaintenanceHistory[]> {
    const current = await this.get(id, actor);
    if (!current) return [];
    const rows = await this.db
      .selectFrom('maintenance_history')
      .selectAll()
      .where('maintenance_id', '=', id)
      .orderBy('changed_at', 'asc')
      .orderBy('id', 'asc')
      .execute();
    return rows.map((row) => ({
      id: row.id,
      maintenanceId: row.maintenance_id,
      state: row.state as MaintenanceHistory['state'],
      action: row.action,
      snapshot: row.snapshot as Readonly<Record<string, unknown>>,
      changedBy: row.changed_by,
      changedAt: row.changed_at,
      recordVersion: BigInt(row.record_version),
      requestId: row.request_id,
    }));
  }
  async transition(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: MaintenanceAction;
    reason?: string;
    requestId: string;
  }): Promise<MaintenanceRecord> {
    try {
      const old = await this.get(input.id, input.actor);
      if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      const changed = transitionMaintenance(old, input.action, new Date(), input.reason);
      return await this.db.transaction().execute(async (tx) => {
        const row = await tx
          .updateTable('maintenance_records')
          .set({
            state: changed.state,
            started_at: changed.startedAt ?? null,
            completed_at: changed.completedAt ?? null,
            downtime_started_at: changed.downtimeStartedAt ?? null,
            downtime_ended_at: changed.downtimeEndedAt ?? null,
            downtime_minutes: changed.downtimeMinutes ?? null,
            updated_at: changed.updatedAt,
            version: input.expectedVersion + 1n,
          })
          .where('id', '=', input.id)
          .where('state', '=', old.state)
          .where('version', '=', input.expectedVersion)
          .returningAll()
          .executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (input.action === 'START') {
          const equipment = await tx
            .selectFrom('equipment')
            .select(['id', 'state', 'version'])
            .where('id', '=', old.equipmentId)
            .executeTakeFirst();
          if (!equipment) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
          if (equipment.state === 'ACTIVE' || equipment.state === 'OUT_OF_SERVICE') {
            const updated = await tx
              .updateTable('equipment')
              .set({
                state: 'UNDER_MAINTENANCE',
                updated_by: input.actor.id,
                updated_at: changed.updatedAt,
                version: sql<bigint>`version + 1`,
              })
              .where('id', '=', equipment.id)
              .where('version', '=', equipment.version)
              .returning(['id', 'version'])
              .executeTakeFirst();
            if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
            await this.auditFor(tx)?.append({
              actorType: 'USER',
              actorId: input.actor.id,
              subjectType: 'EQUIPMENT',
              subjectId: equipment.id,
              action: 'START_MAINTENANCE',
              oldState: equipment.state,
              newState: 'UNDER_MAINTENANCE',
              requestId: input.requestId,
            });
            await tx
              .insertInto('equipment_status_history')
              .values({
                equipment_id: equipment.id,
                from_state: equipment.state,
                to_state: 'UNDER_MAINTENANCE',
                action: 'START_MAINTENANCE',
                reason: input.reason ?? null,
                changed_by: input.actor.id,
                changed_at: changed.updatedAt,
                equipment_version: BigInt(updated.version),
                request_id: input.requestId,
              })
              .execute();
          } else {
            throw new AppError('AUTHZ_DENIED', { userSafe: true });
          }
        }
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'MAINTENANCE_RECORD',
          subjectId: input.id,
          action: input.action,
          oldState: old.state,
          newState: changed.state,
          reason: input.reason,
          requestId: input.requestId,
        });
        await tx
          .insertInto('maintenance_history')
          .values({
            maintenance_id: input.id,
            state: changed.state,
            action: input.action,
            snapshot: snapshot(changed),
            changed_by: input.actor.id,
            changed_at: changed.updatedAt,
            record_version: changed.version,
            request_id: input.requestId,
          })
          .execute();
        await this.outboxFor(tx)?.enqueue({
          eventType: 'MAINTENANCE_CHANGED',
          aggregateType: 'MAINTENANCE_RECORD',
          aggregateId: input.id,
          payload: { action: input.action, state: changed.state, equipmentId: old.equipmentId },
          dedupeKey: `maintenance:${input.id}:v${changed.version}`,
        });
        return map(row);
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw translateDatabaseError(error);
    }
  }
  private auditFor(tx: Transaction<DatabaseSchema>): AuditRepository | undefined {
    return this.audit instanceof PostgresAuditRepository
      ? new PostgresAuditRepository(tx)
      : this.audit;
  }
  private outboxFor(tx: Transaction<DatabaseSchema>): OutboxRepository | undefined {
    return this.outbox instanceof PostgresOutboxRepository
      ? new PostgresOutboxRepository(tx)
      : this.outbox;
  }
}
