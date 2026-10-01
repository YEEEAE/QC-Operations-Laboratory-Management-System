import { describe, expect, it } from 'vitest';
import { adminFailureMessage } from '../../../src/ui/forms/admin-mutation-copy';
import { toFormFailure } from '../../../src/ui/forms/mutation-post';

describe('unconfirmed write recovery copy', () => {
  it('does not claim rollback after an unknown administration result', () => {
    const message = adminFailureMessage('UNKNOWN_SAFE_ERROR', { operation: 'Remove role', subject: 'Test member' });
    expect(message).toMatch(/unconfirmed/i);
    expect(message).toMatch(/record.*history.*before/i);
    expect(message).not.toMatch(/not applied|nothing was changed/i);
  });
  it('does not promise safe creation retry after an unclassified POST failure', () => {
    const failure = toFormFailure({}, { entity: 'Task', requiredFields: [], values: {}, listHref: '/tasks', listLabel: 'tasks' });
    expect(failure.kind).toBe('unknown');
    expect(failure.summary).toMatch(/unconfirmed/i);
    expect(failure.recovery).toMatch(/record.*history.*before/i);
    expect(failure.summary).not.toMatch(/could not be created/i);
  });
});
