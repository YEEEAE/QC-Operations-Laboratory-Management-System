import { createHash } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';
import type { Task, TaskOccurrence, TaskRecordReference } from '../domain/model.js';

export function taskOccurrence(input: {
  ruleId?: string;
  occurrenceKey?: string;
  ownerId: string;
  taskNo: string;
  title: string;
  description?: string;
  priority: string;
  dueAt?: Date;
  currentAssigneeId?: string;
  specializedRecord?: TaskRecordReference;
}): TaskOccurrence | undefined {
  if (!input.ruleId && !input.occurrenceKey) return undefined;
  if (
    !input.ruleId ||
    !input.occurrenceKey ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(input.ruleId) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.occurrenceKey) ||
    !Number.isFinite(Date.parse(input.occurrenceKey)) ||
    new Date(input.occurrenceKey).toISOString() !== input.occurrenceKey
  ) {
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: {
        occurrenceKey: ['A rule identity and a canonical UTC occurrence are required.'],
      },
    });
  }
  const canonical = JSON.stringify([
    'QC360-TASK-POLICY-2026-10-08/v1',
    input.ruleId,
    input.occurrenceKey,
    input.ownerId,
    input.taskNo.trim(),
    input.title.trim(),
    input.description?.trim() || null,
    input.priority.trim(),
    input.dueAt?.toISOString() ?? null,
    input.currentAssigneeId ?? null,
    input.specializedRecord?.type ?? null,
    input.specializedRecord?.id ?? null,
  ]);
  return {
    ruleId: input.ruleId,
    occurrenceKey: input.occurrenceKey,
    fingerprint: createHash('sha256').update(canonical).digest('hex'),
  };
}

export function assertOccurrenceReplay(
  task: Task,
  occurrence: TaskOccurrence,
  actorId: string,
): void {
  if (task.createdBy !== actorId || task.recurrence?.fingerprint !== occurrence.fingerprint) {
    throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
  }
}
