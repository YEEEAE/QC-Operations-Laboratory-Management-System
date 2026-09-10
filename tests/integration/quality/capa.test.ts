import { describe, it, expect } from 'vitest';
import { transitionCapa, type Capa } from '../../../src/modules/quality/capa/domain/capa.js';
describe('CAPA', () => {
  it('allows approved P-04 closure without completed actions or effectiveness acceptance', () => {
    const c: Capa = {
      id: 'capa-1',
      capaNo: 'CAPA-1',
      state: 'READY_FOR_CLOSURE',
      title: 'Closure probe',
    description: 'Direct closure is allowed by P-04 when the ceremony is satisfied.',
      verificationRequired: true,
      effectivenessRequired: false,
      createdBy: 'u1',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      version: 1n,
      actions: [],
    };
    const closed = transitionCapa(c, 'CLOSE', new Date(), 'P-04 closure');
    expect(closed.state).toBe('CLOSED');
    expect(closed.version).toBe(2n);
  });

  it('preserves prerequisites for action completion and effectiveness review', () => {
    const c: Capa = {
      id: 'capa-2', capaNo: 'CAPA-2', state: 'IN_PROGRESS', title: 't', description: 'd',
      verificationRequired: true, effectivenessRequired: true, createdBy: 'u1',
      createdAt: new Date(), updatedAt: new Date(), version: 1n,
      actions: [{ id: 'a1', capaId: 'capa-2', sequenceNo: 1, description: 'a', ownerId: 'u1', state: 'OPEN', version: 1n }],
    };
    expect(() => transitionCapa(c, 'ACTIONS_COMPLETE', new Date())).toThrow();
    expect(() => transitionCapa({ ...c, state: 'EFFECTIVENESS_REVIEW' }, 'READY_FOR_CLOSURE', new Date(), undefined, {
      verified: true, effectivenessAccepted: false,
    })).toThrow();
  });

  it('rejects terminal states and missing close reasons', () => {
    const c: Capa = {
      id: 'capa-3', capaNo: 'CAPA-3', state: 'CLOSED', title: 't', description: 'd',
      verificationRequired: false, effectivenessRequired: false, createdBy: 'u1',
      createdAt: new Date(), updatedAt: new Date(), version: 1n, actions: [],
    };
    expect(() => transitionCapa(c, 'CLOSE', new Date(), 'reason')).toThrow();
    expect(() => transitionCapa({ ...c, state: 'OPEN' }, 'CLOSE', new Date())).toThrow();
  });
});
