import { describe, expect, it } from 'vitest';
import {
  dashboardActivityActionLabel,
  dashboardActivitySubjectLabel,
  dedupeDashboardActivity,
} from '../../../src/modules/dashboard/application/dashboard-presentation.js';
import type { DashboardActivity } from '../../../src/modules/dashboard/ports/dashboard-query.js';

const event = (id: string, action = 'CREATE_TASK'): DashboardActivity => ({
  id,
  action,
  subjectType: 'QC_TASK',
  subjectId: 'internal-id',
  summary: '',
  occurredAt: new Date('2026-10-01T00:00:00.000Z'),
});

describe('dashboard activity presentation', () => {
  it('deduplicates only repeated audit event identities', () => {
    const first = event('event-1');
    const anotherWithSameCopy = event('event-2');
    expect(dedupeDashboardActivity([first, anotherWithSameCopy, first])).toEqual([
      first,
      anotherWithSameCopy,
    ]);
  });

  it('uses human labels without exposing record identifiers', () => {
    expect(dashboardActivityActionLabel('CREATE_TASK')).toBe('Task created');
    expect(dashboardActivityActionLabel('NEW_AUDIT_EVENT')).toBe('New audit event');
    expect(dashboardActivitySubjectLabel('QC_TASK')).toBe('QC task');
  });
});
