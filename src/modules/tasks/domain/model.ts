import { AppError } from '../../../shared/errors/app-error.js';

export const TASK_STATES = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;
export type TaskState = (typeof TASK_STATES)[number];
export type TaskPriority = string;

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  label: string;
  required: boolean;
  position: number;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  version: bigint;
}

export interface Task {
  id: string;
  taskNo: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  state: TaskState;
  dueAt?: Date;
  currentAssigneeId?: string;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
  completedAt?: Date;
  version: bigint;
  checklist: readonly TaskChecklistItem[];
  unresolvedMandatoryBlocker: boolean;
  requiredEvidencePresent: boolean;
}

export interface NewTaskInput {
  id: string;
  taskNo: string;
  title: string;
  description?: string;
  priority: string;
  dueAt?: Date;
  currentAssigneeId?: string;
  createdBy: string;
  now: Date;
  checklist?: readonly { id: string; label: string; required: boolean; position: number }[];
}

const nonBlank = (value: string, field: string): string => {
  if (!value.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { [field]: ['required'] } });
  return value.trim();
};

export function createDraftTask(input: NewTaskInput): Task {
  const checklist = (input.checklist ?? []).map((item) => ({
    id: item.id, taskId: input.id, label: nonBlank(item.label, 'checklist'), required: item.required,
    position: item.position, completed: false, version: 1n,
  }));
  return {
    id: input.id, taskNo: nonBlank(input.taskNo, 'taskNo'), title: nonBlank(input.title, 'title'),
    description: input.description?.trim() || undefined, priority: nonBlank(input.priority, 'priority'),
    state: 'DRAFT', dueAt: input.dueAt, currentAssigneeId: input.currentAssigneeId,
    createdBy: input.createdBy, createdAt: input.now, updatedAt: input.now, version: 1n,
    checklist, unresolvedMandatoryBlocker: false, requiredEvidencePresent: true,
  };
}

export function assertDraftEditable(task: Task): void {
  if (task.state !== 'DRAFT') throw new AppError('AUTHZ_DENIED', { userSafe: true });
}

export function assertCompletable(task: Task): void {
  if (task.checklist.some((item) => item.required && !item.completed)) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!task.requiredEvidencePresent || task.unresolvedMandatoryBlocker) throw new AppError('VALIDATION_FAILED', { userSafe: true });
}
