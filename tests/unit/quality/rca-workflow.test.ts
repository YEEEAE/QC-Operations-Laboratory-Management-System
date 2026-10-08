import { describe, expect, it, vi } from 'vitest';
import { CreateRcaUseCase } from '../../../src/modules/quality/rca/application/create-rca.js';
import { UpdateRcaUseCase } from '../../../src/modules/quality/rca/application/update-rca.js';
import { TransitionRcaUseCase } from '../../../src/modules/quality/rca/application/transition-rca.js';
import { updateRca, transitionRca, type Rca } from '../../../src/modules/quality/rca/domain/rca.js';
vi.mock('../../../src/shared/authorization/authorize.js', () => ({
  authorize: vi.fn((input) => {
    if (input.currentVersion !== undefined && input.currentVersion !== input.expectedVersion)
      throw new Error('stale');
    if (input.actor.id === 'denied') throw new Error('denied');
  }),
}));
const actor = { id: 'actor' } as never;
const record: Rca = {
  id: 'r',
  ncrId: 'n',
  state: 'DRAFT',
  createdBy: 'actor',
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 2n,
};
const repository = () => ({
  get: vi.fn(async () => record),
  create: vi.fn(async (input) => input.rca),
  update: vi.fn(async (input) => input.rca),
  transition: vi.fn(),
});
describe('separate RCA technical workflow', () => {
  it('creates a separate draft from authorized version-bound NCR without foreign mutation', async () => {
    const repo = repository();
    const source = { get: vi.fn(async () => ({ id: 'n', state: 'OPEN', version: 3n })) };
    const result = await new CreateRcaUseCase(repo as never, source).execute({
      actor,
      ncrId: 'n',
      expectedNcrVersion: 3n,
      requestId: 'q',
    });
    expect(result).toMatchObject({ ncrId: 'n', state: 'DRAFT', version: 1n });
    expect(repo.create).toHaveBeenCalledOnce();
  });
  it('denies invisible, stale and closed/void source before write', async () => {
    for (const source of [
      undefined,
      { id: 'n', state: 'OPEN', version: 2n },
      { id: 'n', state: 'CLOSED', version: 3n },
      { id: 'n', state: 'VOID', version: 3n },
    ]) {
      const repo = repository();
      await expect(
        new CreateRcaUseCase(repo as never, { get: async () => source }).execute({
          actor,
          ncrId: 'n',
          expectedNcrVersion: 3n,
          requestId: 'q',
        }),
      ).rejects.toThrow();
      expect(repo.create).not.toHaveBeenCalled();
    }
  });
  it('denies source-view authority before creation', async () => {
    const repo = repository();
    await expect(
      new CreateRcaUseCase(repo as never, {
        get: async () => ({ id: 'n', state: 'OPEN', version: 3n }),
      }).execute({
        actor: { id: 'denied' } as never,
        ncrId: 'n',
        expectedNcrVersion: 3n,
        requestId: 'q',
      }),
    ).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });
  it('retains exact analysis and submitted CAS version', async () => {
    const repo = repository();
    await new UpdateRcaUseCase(repo as never).execute({
      actor,
      rcaId: 'r',
      expectedVersion: 2n,
      analysis: '  original\ntext  ',
      requestId: 'q',
    });
    expect(repo.update.mock.calls[0]![0]).toMatchObject({
      expectedVersion: 2n,
      rca: { analysis: '  original\ntext  ', version: 3n },
    });
  });
  it('denies stale and unauthorized edits before write', async () => {
    for (const input of [
      { actor, expectedVersion: 1n },
      { actor: { id: 'denied' }, expectedVersion: 2n },
    ]) {
      const repo = repository();
      await expect(
        new UpdateRcaUseCase(repo as never).execute({
          ...input,
          actor: input.actor as never,
          rcaId: 'r',
          analysis: 'a',
          requestId: 'q',
        }),
      ).rejects.toThrow();
      expect(repo.update).not.toHaveBeenCalled();
    }
  });
  it('allows START and requires complete analysis before SUBMIT', async () => {
    expect(transitionRca(record, 'START', new Date()).state).toBe('IN_PROGRESS');
    expect(() =>
      transitionRca({ ...record, state: 'IN_PROGRESS' }, 'SUBMIT', new Date()),
    ).toThrow();
    expect(
      transitionRca(
        { ...record, state: 'IN_PROGRESS', analysis: 'evidence', rootCause: 'cause' },
        'SUBMIT',
        new Date(),
      ).state,
    ).toBe('SUBMITTED');
  });
  it('denies APPROVE RETURN VOID before repository and denies submitted edits', async () => {
    for (const action of ['APPROVE', 'RETURN', 'VOID'] as const) {
      const repo = repository();
      await expect(
        new TransitionRcaUseCase(repo as never).execute({
          actor,
          id: 'r',
          expectedVersion: 2n,
          action,
          requestId: 'q',
        }),
      ).rejects.toThrow();
      expect(repo.transition).not.toHaveBeenCalled();
    }
    expect(() =>
      updateRca({ ...record, state: 'SUBMITTED' }, { analysis: 'changed', now: new Date() }),
    ).toThrow();
  });
});
