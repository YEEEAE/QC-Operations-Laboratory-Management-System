import type { DashboardActivity } from '../ports/dashboard-query.js';

/** Remove repeated delivery of the same audit identity without merging events by copy. */
export function dedupeDashboardActivity(events: readonly DashboardActivity[]): DashboardActivity[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

const ACTION_LABELS: Readonly<Record<string, string>> = {
  CREATE_TASK: 'Task created',
  UPDATE_DRAFT: 'Draft updated',
  ACTIVATE: 'Task activated',
  START: 'Task started',
  HOLD: 'Task placed on hold',
  RESUME: 'Task resumed',
  COMPLETE: 'Task completed',
  REOPEN: 'Task reopened',
};

/** Humanize action codes while retaining a readable fallback for newer events. */
export function dashboardActivityActionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

/** A record kind is useful context; internal record identifiers are never labels. */
export function dashboardActivitySubjectLabel(subjectType: string): string {
  if (subjectType === 'QC_TASK') return 'QC task';
  return subjectType
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}
