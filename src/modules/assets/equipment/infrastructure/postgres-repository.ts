import type { Kysely, Transaction } from 'kysely';
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
import { transitionEquipment, type Equipment, type EquipmentAction } from '../domain/equipment.js';
import type {
  EquipmentListFilter,
  EquipmentRepository,
  EquipmentStatusHistory,
} from '../ports/repository.js';

const map = (row: DatabaseRow<'equipment'>): Equipment => ({
  id: row.id,
  equipmentNo: row.equipment_no,
  name: row.name,
  manufacturer: row.manufacturer ?? undefined,
  model: row.model ?? undefined,
  serialNo: row.serial_no ?? undefined,
  location: row.location ?? undefined,
  state: row.state as Equipment['state'],
  currentCalibrationId: row.current_calibration_id ?? undefined,
  commissionedAt: row.commissioned_at ?? undefined,
  decommissionedAt: row.decommissioned_at ?? undefined,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedBy: row.updated_by ?? undefined,
  updatedAt: row.updated_at,
  version: BigInt(row.version),
  calibrationRequired: row.calibration_required ?? undefined,
  maintenanceRequired: row.maintenance_required ?? undefined,
});
const entity = (x: Equipment) => ({
  type: 'EQUIPMENT',
  id: x.id,
  state: x.state,
  ownerId: x.createdBy,
});

export class PostgresEquipmentRepository implements EquipmentRepository {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
  ) {}
  async create(input: {
    equipment: Equipment;
    actor: ActorContext;
    requestId: string;
  }): Promise<Equipment> {
    try {
      return await this.db.transaction().execute(async (tx) => {
        const x = input.equipment;
        const row = await tx
          .insertInto('equipment')
          .values({
            id: x.id,
            equipment_no: x.equipmentNo,
            name: x.name,
            manufacturer: x.manufacturer ?? null,
            model: x.model ?? null,
            serial_no: x.serialNo ?? null,
            location: x.location ?? null,
            state: 'DRAFT',
            current_calibration_id: null,
            commissioned_at: null,
            decommissioned_at: null,
            created_by: input.actor.id,
            updated_by: input.actor.id,
            updated_at: x.updatedAt,
            version: 1n,
            calibration_required: x.calibrationRequired ?? null,
            maintenance_required: x.maintenanceRequired ?? null,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'EQUIPMENT',
          subjectId: x.id,
          action: 'CREATE_EQUIPMENT',
          newState: 'DRAFT',
          requestId: input.requestId,
        });
        await tx
          .insertInto('equipment_status_history')
          .values({
            equipment_id: x.id,
            from_state: null,
            to_state: 'DRAFT',
            action: 'CREATE',
            reason: null,
            changed_by: input.actor.id,
            changed_at: x.updatedAt,
            equipment_version: 1n,
            request_id: input.requestId,
          })
          .execute();
        await this.outboxFor(tx)?.enqueue({
          eventType: 'EQUIPMENT_CREATED',
          aggregateType: 'EQUIPMENT',
          aggregateId: x.id,
          payload: { equipmentNo: x.equipmentNo, state: 'DRAFT' },
          dedupeKey: `equipment-created:${x.id}`,
        });
        return map(row);
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
  async get(id: string, actor: ActorContext): Promise<Equipment | undefined> {
    if (!isUuid(id)) return undefined;
    const row = await this.db
      .selectFrom('equipment')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!row) return undefined;
    const x = map(row);
    const grant = actor.permissions.find((p) => p.code === 'PERM-EQP-VIEW');
    return actorHasScope(actor, entity(x), { ownerId: x.createdBy }, grant) ? x : undefined;
  }
  async list(input: {
    actor: ActorContext;
    filter?: EquipmentListFilter;
  }): Promise<readonly Equipment[]> {
    let query = this.db
      .selectFrom('equipment')
      .selectAll()
      .orderBy('updated_at', 'desc')
      .orderBy('id', 'desc');
    if (input.filter?.state) query = query.where('state', '=', input.filter.state) as typeof query;
    if (input.filter?.search) {
      const q = input.filter.search;
      query = query.where((eb) =>
        eb.or([
          eb('equipment_no', 'ilike', `%${q}%`),
          eb('name', 'ilike', `%${q}%`),
          eb('serial_no', 'ilike', `%${q}%`),
        ]),
      ) as typeof query;
    }
    const grant = input.actor.permissions.find((p) => p.code === 'PERM-EQP-VIEW');
    return (await query.execute())
      .map(map)
      .filter((x) => actorHasScope(input.actor, entity(x), { ownerId: x.createdBy }, grant));
  }
  async history(id: string, actor: ActorContext): Promise<readonly EquipmentStatusHistory[]> {
    const current = await this.get(id, actor);
    if (!current) return [];
    const rows = await this.db
      .selectFrom('equipment_status_history')
      .selectAll()
      .where('equipment_id', '=', id)
      .orderBy('changed_at', 'asc')
      .orderBy('id', 'asc')
      .execute();
    return rows.map((row) => ({
      id: row.id,
      equipmentId: row.equipment_id,
      fromState: (row.from_state ?? undefined) as EquipmentStatusHistory['fromState'],
      toState: row.to_state as EquipmentStatusHistory['toState'],
      action: row.action,
      reason: row.reason ?? undefined,
      changedBy: row.changed_by,
      changedAt: row.changed_at,
      equipmentVersion: BigInt(row.equipment_version),
      requestId: row.request_id,
    }));
  }
  async updateDraft(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    equipmentNo: string;
    name: string;
    manufacturer?: string;
    model?: string;
    serialNo?: string;
    location?: string;
    calibrationRequired?: boolean;
    maintenanceRequired?: boolean;
    requestId: string;
  }): Promise<Equipment> {
    try {
      return await this.db.transaction().execute(async (tx) => {
        const old = await this.get(input.id, input.actor);
        if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        const changed = {
          equipmentNo: input.equipmentNo.trim(),
          name: input.name.trim(),
          manufacturer: input.manufacturer?.trim() || null,
          model: input.model?.trim() || null,
          serialNo: input.serialNo?.trim() || null,
          location: input.location?.trim() || null,
          calibrationRequired: input.calibrationRequired ?? null,
          maintenanceRequired: input.maintenanceRequired ?? null,
        };
        if (!changed.equipmentNo || !changed.name)
          throw new AppError('VALIDATION_FAILED', { userSafe: true });
        const row = await tx
          .updateTable('equipment')
          .set({
            equipment_no: changed.equipmentNo,
            name: changed.name,
            manufacturer: changed.manufacturer,
            model: changed.model,
            serial_no: changed.serialNo,
            location: changed.location,
            calibration_required: changed.calibrationRequired,
            maintenance_required: changed.maintenanceRequired,
            updated_by: input.actor.id,
            updated_at: new Date(),
            version: input.expectedVersion + 1n,
          })
          .where('id', '=', input.id)
          .where('state', '=', 'DRAFT')
          .where('version', '=', input.expectedVersion)
          .returningAll()
          .executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'EQUIPMENT',
          subjectId: input.id,
          action: 'EDIT_EQUIPMENT_DRAFT',
          oldState: old.state,
          newState: 'DRAFT',
          requestId: input.requestId,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'EQUIPMENT_CHANGED',
          aggregateType: 'EQUIPMENT',
          aggregateId: input.id,
          payload: { action: 'EDIT_DRAFT', state: 'DRAFT' },
          dedupeKey: `equipment:${input.id}:v${row.version}`,
        });
        return map(row);
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw translateDatabaseError(error);
    }
  }
  async transition(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: EquipmentAction;
    reason?: string;
    requestId: string;
  }): Promise<Equipment> {
    try {
      return await this.db.transaction().execute(async (tx) => {
        const old = await this.get(input.id, input.actor);
        if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        const changed = transitionEquipment(old, input.action, new Date(), input.reason, false);
        const row = await tx
          .updateTable('equipment')
          .set({
            state: changed.state,
            commissioned_at: changed.commissionedAt ?? null,
            decommissioned_at: changed.decommissionedAt ?? null,
            updated_by: input.actor.id,
            updated_at: changed.updatedAt,
            version: input.expectedVersion + 1n,
          })
          .where('id', '=', input.id)
          .where('state', '=', old.state)
          .where('version', '=', input.expectedVersion)
          .returningAll()
          .executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'EQUIPMENT',
          subjectId: input.id,
          action: input.action,
          oldState: old.state,
          newState: changed.state,
          reason: input.reason,
          requestId: input.requestId,
        });
        await tx
          .insertInto('equipment_status_history')
          .values({
            equipment_id: input.id,
            from_state: old.state,
            to_state: changed.state,
            action: input.action,
            reason: input.reason ?? null,
            changed_by: input.actor.id,
            changed_at: changed.updatedAt,
            equipment_version: changed.version,
            request_id: input.requestId,
          })
          .execute();
        await this.outboxFor(tx)?.enqueue({
          eventType: 'EQUIPMENT_CHANGED',
          aggregateType: 'EQUIPMENT',
          aggregateId: input.id,
          payload: { action: input.action, state: changed.state },
          dedupeKey: `equipment:${input.id}:v${changed.version}`,
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
