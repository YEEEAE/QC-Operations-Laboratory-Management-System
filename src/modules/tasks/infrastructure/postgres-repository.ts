import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { actorHasScope } from '../../../shared/authorization/scope-evaluator.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { Task } from '../domain/model.js';
import type { TaskAction } from '../domain/state.js';
import type { TaskListFilter, TaskRepository } from '../ports/repository.js';

function mapTask(row: DatabaseRow<'tasks'>, checklist: readonly DatabaseRow<'task_checklist_items'>[], evidence: boolean): Task {
  return { id: row.id, taskNo: row.task_no, title: row.title, description: row.description ?? undefined, priority: row.priority,
    state: row.state as Task['state'], dueAt: row.due_at ?? undefined, currentAssigneeId: row.current_assignee_id ?? undefined,
    createdBy: row.created_by, createdAt: row.created_at, updatedBy: row.updated_by ?? undefined, updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined, version: BigInt(row.version), checklist: checklist.map((item) => ({ id: item.id, taskId: item.task_id, label: item.label, required: item.required, position: item.position, completed: item.completed, completedBy: item.completed_by ?? undefined, completedAt: item.completed_at ?? undefined, version: BigInt(item.version) })),
    unresolvedMandatoryBlocker: false, requiredEvidencePresent: evidence };
}

export class PostgresTaskRepository implements TaskRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>, private readonly audit?: AuditRepository, private readonly outbox?: OutboxRepository) {}
  async create(input: { task: Task; actor: ActorContext; requestId: string }): Promise<Task> {
    try { return await this.database.transaction().execute(async (tx) => {
      const t = input.task;
      const row = await tx.insertInto('tasks').values({ id: t.id, task_no: t.taskNo, title: t.title, description: t.description ?? null, priority: t.priority, state: t.state, due_at: t.dueAt ?? null, current_assignee_id: t.currentAssigneeId ?? null, completed_at: null, created_by: t.createdBy, updated_by: t.createdBy, updated_at: t.updatedAt, version: 1n }).returningAll().executeTakeFirstOrThrow();
      if (t.currentAssigneeId) await tx.insertInto('task_assignments').values({ id: uuidv7(), task_id: t.id, assignee_id: t.currentAssigneeId, assigned_by: input.actor.id, reason: null }).execute();
      if (t.checklist.length) await tx.insertInto('task_checklist_items').values(t.checklist.map((item) => ({ id: item.id, task_id: t.id, label: item.label, required: item.required, position: item.position, completed: false, completed_by: null, completed_at: null, version: 1n }))).execute();
      await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'TASK', subjectId: t.id, action: 'CREATE_TASK', newState: 'DRAFT', requestId: input.requestId });
      await this.outboxFor(tx)?.enqueue({ eventType: 'TASK_CREATED', aggregateType: 'TASK', aggregateId: t.id, payload: { taskNo: t.taskNo, state: t.state }, dedupeKey: `task-created:${t.id}` });
      return mapTask(row, await tx.selectFrom('task_checklist_items').selectAll().where('task_id', '=', t.id).execute(), true);
    }); } catch (error) { throw translateDatabaseError(error); }
  }
  async get(id: string): Promise<Task | undefined> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const row = await this.database.selectFrom('tasks').selectAll().where('id', '=', id).executeTakeFirst();
    if (!row) return undefined;
    const checklist = await this.database.selectFrom('task_checklist_items').selectAll().where('task_id', '=', id).orderBy('position').execute();
    const evidence = await this.database.selectFrom('evidence_links').select('id').where('subject_type', '=', 'TASK').where('subject_id', '=', id).where('removed_at', 'is', null).executeTakeFirst();
    return mapTask(row, checklist, Boolean(evidence));
  }
  async list(input: { actor: ActorContext; filter?: TaskListFilter }): Promise<readonly Task[]> {
    let query = this.database.selectFrom('tasks').selectAll().orderBy('updated_at', 'desc');
    if (input.filter?.state) query = query.where('state', '=', input.filter.state) as typeof query;
    if (input.filter?.assigneeId) query = query.where('current_assignee_id', '=', input.filter.assigneeId) as typeof query;
    if (input.filter?.search) query = query.where((eb) => eb.or([eb('title', 'ilike', `%${input.filter!.search}%`), eb('task_no', 'ilike', `%${input.filter!.search}%`)])) as typeof query;
    const rows = await query.execute();
    const result: Task[] = [];
    for (const row of rows) { const task = await this.get(row.id); if (task && actorHasScope(input.actor, { type: 'TASK', id: task.id, state: task.state, ownerId: task.createdBy, assigneeId: task.currentAssigneeId }, { ownerId: task.createdBy, assigneeId: task.currentAssigneeId })) result.push(task); }
    return result;
  }
  async updateDraft(input: { id: string; expectedVersion: bigint; actor: ActorContext; title: string; description?: string; priority: string; dueAt?: Date; currentAssigneeId?: string; requestId: string }): Promise<Task> {
    return this.mutate(input, async (tx, old) => { const row = await tx.updateTable('tasks').set({ title: input.title.trim(), description: input.description?.trim() || null, priority: input.priority.trim(), due_at: input.dueAt ?? null, updated_by: input.actor.id, updated_at: new Date(), version: old.version + 1n }).where('id', '=', input.id).where('version', '=', input.expectedVersion).where('state', '=', 'DRAFT').returningAll().executeTakeFirst(); if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true }); return row; }, 'UPDATE_DRAFT');
  }
  async transition(input: { id: string; expectedVersion: bigint; actor: ActorContext; action: TaskAction; reason?: string; requestId: string }): Promise<Task> {
    return this.mutate(input, async (tx, old) => { const next: Record<string, string> = { ACTIVATE: 'OPEN', START: 'IN_PROGRESS', HOLD: 'ON_HOLD', RESUME: 'IN_PROGRESS', COMPLETE: 'COMPLETED', REOPEN: 'IN_PROGRESS' }; const row = await tx.updateTable('tasks').set({ state: next[input.action], completed_at: input.action === 'COMPLETE' ? new Date() : null, updated_by: input.actor.id, updated_at: new Date(), version: old.version + 1n }).where('id', '=', input.id).where('version', '=', input.expectedVersion).where('state', '=', old.state).returningAll().executeTakeFirst(); if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true }); return row; }, input.action, input.reason);
  }
  private async mutate(input: { id: string; expectedVersion: bigint; actor: ActorContext; requestId: string; reason?: string }, change: (tx: Transaction<DatabaseSchema>, old: Task) => Promise<DatabaseRow<'tasks'>>, action: string, reason?: string): Promise<Task> {
    try { return await this.database.transaction().execute(async (tx) => { const old = await this.get(input.id); if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true }); const row = await change(tx, old); await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'TASK', subjectId: input.id, action, oldState: old.state, newState: row.state, reason, requestId: input.requestId }); await this.outboxFor(tx)?.enqueue({ eventType: 'TASK_CHANGED', aggregateType: 'TASK', aggregateId: input.id, payload: { action, state: row.state }, dedupeKey: `task:${input.id}:v${row.version}` }); return mapTask(row, await tx.selectFrom('task_checklist_items').selectAll().where('task_id', '=', input.id).execute(), old.requiredEvidencePresent); }); } catch (error) { if (error instanceof AppError) throw error; throw translateDatabaseError(error); }
  }
  private auditFor(tx: Transaction<DatabaseSchema>): AuditRepository | undefined { return this.audit instanceof PostgresAuditRepository ? new PostgresAuditRepository(tx) : this.audit; }
  private outboxFor(tx: Transaction<DatabaseSchema>): OutboxRepository | undefined { return this.outbox instanceof PostgresOutboxRepository ? new PostgresOutboxRepository(tx) : this.outbox; }
}
