import { describe, expect, it, vi } from 'vitest';
import { CreateNcrUseCase } from '../../../src/modules/quality/ncr/application/create-ncr.js';
import { CreateCapaUseCase } from '../../../src/modules/quality/capa/application/create-capa.js';
import { PostgresNcrRepository } from '../../../src/modules/quality/ncr/infrastructure/postgres-repository.js';
import { PostgresCapaRepository } from '../../../src/modules/quality/capa/infrastructure/postgres-repository.js';
import { createNcr } from '../../../src/modules/quality/ncr/domain/ncr.js';
import { createCapa } from '../../../src/modules/quality/capa/domain/capa.js';
import type { NcrRepository } from '../../../src/modules/quality/ncr/ports/repository.js';
import type { CapaRepository } from '../../../src/modules/quality/capa/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: '01900000-0000-7000-8000-000000000001',
  accountState: 'ACTIVE',
  roles: ['SYSTEM_OWNER'],
  loginIdentity: 'yazeed',
  permissions: [
    { code: 'PERM-NCR-CREATE', scopes: ['GLOBAL'] },
    { code: 'PERM-CAPA-CREATE', scopes: ['GLOBAL'] },
  ],
};
const now = new Date('2026-10-17T00:00:00Z');
const ncr = {
  actor,
  ncrNo: 'FIXTURE-NCR',
  title: 'Recorded deviation',
  description: 'Fixture observation',
  findingId: '01900000-0000-7000-8000-000000000002',
  requestId: 'fixture-command',
};
const capa = {
  actor,
  capaNo: 'FIXTURE-CAPA',
  title: 'Recorded plan',
  description: 'Fixture plan',
  ncrId: '01900000-0000-7000-8000-000000000003',
  requestId: 'fixture-command',
  verificationRequired: true,
  effectivenessRequired: true,
  actions: [
    {
      id: 'action',
      capaId: 'capa',
      sequenceNo: 1,
      description: 'Fixture action',
      ownerId: actor.id,
      state: 'FIXTURE',
      version: 1n,
    },
  ],
};

describe('CA-F-00 creation source boundaries', () => {
  it.each(['NCR', 'CAPA'] as const)(
    '%s refuses a valid-shaped command even for the named owner',
    (kind) => {
      const create = vi.fn();
      const work =
        kind === 'NCR'
          ? () => new CreateNcrUseCase({ create } as unknown as NcrRepository).execute(ncr)
          : () => new CreateCapaUseCase({ create } as unknown as CapaRepository).execute(capa);
      expect(work).toThrowError(expect.objectContaining({ code: 'POLICY_SOURCE_REQUIRED' }));
      expect(create).not.toHaveBeenCalled();
    },
  );
  it.each([false, true])('CAPA flags=%s are not authority', (flag) => {
    const create = vi.fn();
    expect(() =>
      new CreateCapaUseCase({ create } as unknown as CapaRepository).execute({
        ...capa,
        verificationRequired: flag,
        effectivenessRequired: flag,
      }),
    ).toThrowError(expect.objectContaining({ code: 'POLICY_SOURCE_REQUIRED' }));
    expect(create).not.toHaveBeenCalled();
  });
  it('permission rejection remains distinct from source rejection', () => {
    const create = vi.fn();
    expect(() =>
      new CreateNcrUseCase({ create } as unknown as NcrRepository).execute({
        ...ncr,
        actor: { ...actor, permissions: [] },
      }),
    ).toThrowError(expect.objectContaining({ code: 'AUTHZ_PERMISSION_MISSING' }));
    expect(create).not.toHaveBeenCalled();
  });
  it('both PostgreSQL adapters deny before any database operation', async () => {
    const database = new Proxy(
      {},
      {
        get: () => {
          throw new Error('Unexpected database access');
        },
      },
    );
    await expect(
      new PostgresNcrRepository(database as never).create({
        ncr: createNcr({ ...ncr, id: 'ncr', createdBy: actor.id, now }),
        actor,
        requestId: ncr.requestId,
      }),
    ).rejects.toMatchObject({ code: 'POLICY_SOURCE_REQUIRED' });
    await expect(
      new PostgresCapaRepository(database as never).create({
        capa: createCapa({ ...capa, id: 'capa', createdBy: actor.id, now }),
        actor,
        requestId: capa.requestId,
      }),
    ).rejects.toMatchObject({ code: 'POLICY_SOURCE_REQUIRED' });
  });
});

describe('independent existing storage validation (not eligibility evidence)', () => {
  it.each(['title', 'description'] as const)('rejects blank NCR %s', (field) => {
    expect(() =>
      createNcr({ ...ncr, id: 'ncr', createdBy: actor.id, now, [field]: '  ' }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_FAILED' }));
  });
  it('preserves a valid draft shape without granting persistence authority', () => {
    expect(createNcr({ ...ncr, id: 'ncr', createdBy: actor.id, now }).state).toBe('DRAFT');
    expect(createCapa({ ...capa, id: 'capa', createdBy: actor.id, now }).actions).toEqual(
      capa.actions,
    );
  });
  it.each(['blank', 'duplicate', 'fraction', 'flags'] as const)(
    'rejects CAPA storage violation: %s',
    (problem) => {
      const draft = { ...capa, id: 'capa', createdBy: actor.id, now };
      if (problem === 'blank') draft.actions = [{ ...capa.actions[0]!, description: ' ' }];
      if (problem === 'duplicate')
        draft.actions = [...capa.actions, { ...capa.actions[0]!, id: 'other' }];
      if (problem === 'fraction') draft.actions = [{ ...capa.actions[0]!, sequenceNo: 1.5 }];
      if (problem === 'flags') draft.verificationRequired = 'false' as unknown as boolean;
      expect(() => createCapa(draft)).toThrowError(
        expect.objectContaining({ code: 'VALIDATION_FAILED' }),
      );
    },
  );
});
