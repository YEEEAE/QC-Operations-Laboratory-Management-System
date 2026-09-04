import { AppError } from '../../../shared/errors/app-error.js';
import type { Task, TaskState } from './model.js';
import { assertCompletable } from './model.js';

export type TaskAction = 'ACTIVATE' | 'START' | 'HOLD' | 'RESUME' | 'COMPLETE' | 'CANCEL' | 'REOPEN';

const transitions: Record<TaskAction, readonly [TaskState, TaskState][]> = {
  ACTIVATE: [['DRAFT', 'OPEN']], START: [['OPEN', 'IN_PROGRESS']], HOLD: [['OPEN', 'ON_HOLD'], ['IN_PROGRESS', 'ON_HOLD']],
  RESUME: [['ON_HOLD', 'IN_PROGRESS']], COMPLETE: [['IN_PROGRESS', 'COMPLETED']],
  CANCEL: [['DRAFT', 'CANCELLED'], ['OPEN', 'CANCELLED'], ['IN_PROGRESS', 'CANCELLED'], ['ON_HOLD', 'CANCELLED']],
  REOPEN: [['COMPLETED', 'IN_PROGRESS']],
};

export function transitionTask(task: Task, action: TaskAction, now: Date, reason?: string): Task {
  const match = transitions[action].find(([from]) => from === task.state);
  if (!match || (['HOLD', 'CANCEL', 'REOPEN'].includes(action) && !reason?.trim()))
    throw new AppError('AUTHZ_DENIED', { userSafe: true });
  if (action === 'COMPLETE') assertCompletable(task);
  return { ...task, state: match[1], completedAt: match[1] === 'COMPLETED' ? now : undefined, updatedAt: now, version: task.version + 1n };
}

export function allowedTaskTransition(state: TaskState, action: TaskAction): TaskState | undefined {
  return transitions[action].find(([from]) => from === state)?.[1];
}
