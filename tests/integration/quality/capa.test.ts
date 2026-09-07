import { describe, it, expect } from 'vitest';
import { transitionCapa, type Capa } from '../../../src/modules/quality/capa/domain/capa.js';
describe('CAPA', () => {
  it('never closes directly and requires completed actions', () => {
    const c: Capa = {
      id: 'capa-1',
      capaNo: 'CAPA-1',
      state: 'READY_FOR_CLOSURE',
      title: 'Closure probe',
      description: 'Direct closure must be denied.',
      verificationRequired: true,
      effectivenessRequired: false,
      createdBy: 'u1',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      version: 1n,
      actions: [],
    };
    expect(() => transitionCapa(c, 'CLOSE', new Date())).toThrow();
  });
});
