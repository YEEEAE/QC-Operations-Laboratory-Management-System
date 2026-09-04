import { describe, expect, it } from 'vitest';
import { evaluateSeparationOfDuties } from '../../../src/shared/authorization/sod';

describe('separation of duties', () => {
  it('denies inspection review and approval by the author/executor by default', () => {
    expect(
      evaluateSeparationOfDuties({
        actorId: 'u1',
        authorId: 'u1',
        action: 'REVIEW',
        entityType: 'INSPECTION_REPORT',
      }).allowed,
    ).toBe(false);
    expect(
      evaluateSeparationOfDuties({
        actorId: 'u1',
        executorId: 'u1',
        action: 'APPROVE',
        entityType: 'LAB_TEST',
      }).allowed,
    ).toBe(false);
  });

  it('does not infer a role hierarchy and permits unrelated actors when policy allows', () => {
    expect(
      evaluateSeparationOfDuties({
        actorId: 'u2',
        authorId: 'u1',
        action: 'REVIEW',
        entityType: 'INSPECTION_REPORT',
      }).allowed,
    ).toBe(true);
  });
});
