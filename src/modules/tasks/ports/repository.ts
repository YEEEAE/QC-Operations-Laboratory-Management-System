import type { ActorContext } from '../../../shared/authorization/types.js';
import type { Task } from '../domain/model.js';
import type { TaskAction } from '../domain/state.js';

export interface TaskListFilter { state?: Task['state']; assigneeId?: string; search?: string; }
export interface TaskRepository {
  create(input: { task: Task; actor: ActorContext; requestId: string }): Promise<Task>;
  get(id: string, actor: ActorContext): Promise<Task | undefined>;
  list(input: { actor: ActorContext; filter?: TaskListFilter }): Promise<readonly Task[]>;
  updateDraft(input: { id: string; expectedVersion: bigint; actor: ActorContext; title: string; description?: string; priority: string; dueAt?: Date; currentAssigneeId?: string; requestId: string }): Promise<Task>;
  transition(input: { id: string; expectedVersion: bigint; actor: ActorContext; action: TaskAction; reason?: string; requestId: string }): Promise<Task>;
}
