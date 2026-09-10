import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/shared/errors/app-error.js';
import {
  transitionTemplateVersion,
  transitionIdFor,
  requireTemplateReason,
  TEMPLATE_TRANSITION_IDS,
} from '../../../src/modules/quarantine/templates/domain/template-state.js';

describe('template version state machine (P-06)', () => {
  it('moves DRAFT through review to approval', () => {
    expect(transitionTemplateVersion('DRAFT', 'REVIEW')).toBe('UNDER_REVIEW');
    expect(transitionTemplateVersion('UNDER_REVIEW', 'APPROVE')).toBe('APPROVED');
  });

  it('allows direct DRAFT approval by an authority', () => {
    expect(transitionTemplateVersion('DRAFT', 'APPROVE')).toBe('APPROVED');
  });

  it('stops, voids, and supersedes only from eligible states', () => {
    expect(transitionTemplateVersion('APPROVED', 'STOP')).toBe('STOPPED');
    expect(transitionTemplateVersion('APPROVED', 'VOID')).toBe('VOID');
    expect(transitionTemplateVersion('STOPPED', 'VOID')).toBe('VOID');
    expect(transitionTemplateVersion('APPROVED', 'SUPERSEDE')).toBe('SUPERSEDED');
    expect(transitionTemplateVersion('STOPPED', 'SUPERSEDE')).toBe('SUPERSEDED');
  });

  it('keeps VOID and SUPERSEDED terminal', () => {
    for (const action of ['REVIEW', 'APPROVE', 'STOP', 'VOID', 'SUPERSEDE'] as const) {
      expect(() => transitionTemplateVersion('VOID', action)).toThrowError(AppError);
      expect(() => transitionTemplateVersion('SUPERSEDED', action)).toThrowError(AppError);
    }
  });

  it('denies unknown transitions such as approving a stopped version', () => {
    expect(() => transitionTemplateVersion('STOPPED', 'APPROVE')).toThrowError(AppError);
    expect(() => transitionTemplateVersion('DRAFT', 'STOP')).toThrowError(AppError);
    expect(() => transitionTemplateVersion('DRAFT', 'SUPERSEDE')).toThrowError(AppError);
  });

  it('binds every transition to a TR-TMPL identifier', () => {
    expect(transitionIdFor('DRAFT', 'REVIEW')).toBe('TR-TMPL-002');
    expect(transitionIdFor('UNDER_REVIEW', 'APPROVE')).toBe('TR-TMPL-003');
    expect(transitionIdFor('APPROVED', 'STOP')).toBe('TR-TMPL-004');
    expect(transitionIdFor('APPROVED', 'VOID')).toBe('TR-TMPL-005');
    expect(transitionIdFor('APPROVED', 'SUPERSEDE')).toBe('TR-TMPL-006');
    expect(Object.keys(TEMPLATE_TRANSITION_IDS).length).toBeGreaterThan(0);
  });

  it('requires a mandatory reason for stop, void, and supersede', () => {
    expect(() => requireTemplateReason('STOP', '')).toThrowError(AppError);
    expect(() => requireTemplateReason('VOID', '   ')).toThrowError(AppError);
    expect(() => requireTemplateReason('SUPERSEDE', undefined)).toThrowError(AppError);
    expect(() => requireTemplateReason('STOP', 'Contamination risk')).not.toThrow();
    expect(() => requireTemplateReason('APPROVE', undefined)).not.toThrow();
  });
});
