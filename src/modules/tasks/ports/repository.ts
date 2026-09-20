import type { ActorContext } from '../../../shared/authorization/types.js';
import type { Page } from '../../../shared/pagination/page.js';
import type { Task } from '../domain/model.js';
import type { TaskAction } from '../domain/state.js';

export interface TaskListFilter {
  state?: Task['state'];
  assigneeId?: string;
  search?: string;
  /**
   * Due-date window, resolved against the current UTC server date in one place
   * (the repository) so the count a dashboard shows and the register the same
   * filter opens are always the same set.
   *
   * `overdue`: due before the current UTC date. `today`: due on the current UTC
   * date. Both exclude COMPLETED and CANCELLED work, because a closed task is
   * not outstanding work whatever its due date says.
   */
  due?: 'overdue' | 'today';
  /**
   * Outstanding work only. `true` excludes COMPLETED and CANCELLED, so a queue
   * can ask "everything assigned to me that is still open" with one filter
   * instead of one link per state.
   */
  open?: boolean;
}
export interface TaskListPage {
  items: readonly Task[];
  total: number;
}
export interface TaskRepository {
  create(input: { task: Task; actor: ActorContext; requestId: string }): Promise<Task>;
  get(id: string, actor: ActorContext): Promise<Task | undefined>;
  /**
   * Bounded register read. `page` is required: the register never returns an
   * unbounded row set. `total` is the full authorized match count for the same
   * filter, so a UI page control can navigate without a second count query.
   */
  list(input: { actor: ActorContext; filter?: TaskListFilter; page: Page }): Promise<TaskListPage>;
  updateDraft(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    title: string;
    description?: string;
    priority: string;
    dueAt?: Date;
    currentAssigneeId?: string;
    requestId: string;
  }): Promise<Task>;
  transition(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: TaskAction;
    reason?: string;
    requestId: string;
  }): Promise<Task>;
  deleteDraft?(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    reason: string;
  }): Promise<void>;
}
