import { describe, expect, it, vi } from 'vitest';
import { TransitionNcrUseCase } from '../../../src/modules/quality/ncr/application/transition-ncr.js';
import { TransitionCapaUseCase } from '../../../src/modules/quality/capa/application/transition-capa.js';
import type { NcrRepository } from '../../../src/modules/quality/ncr/ports/repository.js';
import type { CapaRepository } from '../../../src/modules/quality/capa/ports/repository.js';
import type { Ncr } from '../../../src/modules/quality/ncr/domain/ncr.js';
import type { Capa } from '../../../src/modules/quality/capa/domain/capa.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { PostgresNcrRepository } from '../../../src/modules/quality/ncr/infrastructure/postgres-repository.js';
import { PostgresCapaRepository } from '../../../src/modules/quality/capa/infrastructure/postgres-repository.js';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';

const actor: ActorContext = {
  id: 'reviewer',
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: ['PERM-NCR-EDIT', 'PERM-NCR-CLOSE', 'PERM-CAPA-EDIT', 'PERM-CAPA-CLOSE'].map(
    (code) => ({
      code: code as ActorContext['permissions'][number]['code'],
      scopes: ['GLOBAL'],
    }),
  ),
};
const now = new Date('2026-10-02T10:00:00Z');
const ncr: Ncr = {
  id: 'ncr',
  ncrNo: 'NCR-1',
  title: 'Nonconformance',
  description: 'Observed deviation',
  findingId: 'finding',
  state: 'READY_FOR_CLOSURE',
  createdBy: 'author',
  createdAt: now,
  updatedAt: now,
  version: 4n,
};
const capa: Capa = {
  id: 'capa',
  capaNo: 'CAPA-1',
  title: 'Corrective action',
  description: 'Plan',
  ncrId: ncr.id,
  state: 'OPEN',
  createdBy: 'author',
  createdAt: now,
  updatedAt: now,
  version: 2n,
  verificationRequired: true,
  effectivenessRequired: true,
  actions: [],
};
const ncrRepo = (record = ncr): NcrRepository => ({
  create: vi.fn(),
  get: vi.fn(async () => record),
  list: vi.fn(),
  transition: vi.fn(async () => ({ ...record, version: record.version + 1n })),
});
const capaRepo = (): CapaRepository => ({
  create: vi.fn(),
  get: vi.fn(async () => capa),
  list: vi.fn(),
  close: vi.fn(),
  transition: vi.fn(async () => ({ ...capa, state: 'IN_PROGRESS' as const, version: 3n })),
});

describe('controlled prerequisites are not caller assertions', () => {
  it('rejects forged complete/verified flags before NCR persistence', async () => {
    const repo = ncrRepo();
    const input = {
      actor,
      id: ncr.id,
      action: 'CLOSE' as const,
      expectedVersion: 4n,
      requestId: 'forged',
      conditions: { rcaComplete: true, capaComplete: true, verificationComplete: true },
    };
    await expect(new TransitionNcrUseCase(repo).execute(input)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(repo.transition).not.toHaveBeenCalled();
  });

  it('keeps NCR closure denied without persisted verification evidence', async () => {
    const repo = ncrRepo();
    await expect(
      new TransitionNcrUseCase(repo).execute({
        actor,
        id: ncr.id,
        action: 'CLOSE',
        expectedVersion: 4n,
        requestId: 'no-evidence',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repo.transition).not.toHaveBeenCalled();
  });

  it('preserves the authorized investigation transition', async () => {
    const repo = ncrRepo({ ...ncr, state: 'OPEN' });
    await new TransitionNcrUseCase(repo).execute({
      actor,
      id: ncr.id,
      action: 'START_INVESTIGATION',
      expectedVersion: 4n,
      requestId: 'investigate',
    });
    expect(repo.transition).toHaveBeenCalledOnce();
  });

  it('rejects caller effectiveness flags without a CAPA write', async () => {
    const repo = capaRepo();
    const input = {
      actor,
      id: capa.id,
      action: 'READY_FOR_CLOSURE' as const,
      expectedVersion: 2n,
      requestId: 'forged',
      conditions: { verified: true, effectivenessAccepted: true },
    };
    await expect(new TransitionCapaUseCase(repo).execute(input)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(repo.transition).not.toHaveBeenCalled();
    expect(repo.close).not.toHaveBeenCalled();
  });

  it('preserves authorized CAPA start', async () => {
    const repo = capaRepo();
    await new TransitionCapaUseCase(repo).execute({
      actor,
      id: capa.id,
      action: 'START',
      expectedVersion: 2n,
      requestId: 'start',
    });
    expect(repo.transition).toHaveBeenCalledOnce();
  });

  it('prevents the generic CAPA path from bypassing P-04 signing', async () => {
    const repo = capaRepo();
    await expect(
      new TransitionCapaUseCase(repo).execute({
        actor,
        id: capa.id,
        action: 'CLOSE',
        expectedVersion: 2n,
        requestId: 'bypass',
        reason: 'close',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repo.transition).not.toHaveBeenCalled();
    expect(repo.close).not.toHaveBeenCalled();
  });

  it.each(['MOVE_TO_CAPA', 'READY_FOR_CLOSURE', 'CLOSE'] as const)(
    'direct NCR %s cannot bypass the missing persisted-evidence contract',
    async (action) => {
      const updateTable = vi.fn();
      const database = { updateTable } as unknown as Kysely<DatabaseSchema>;
      await expect(
        new PostgresNcrRepository(database).transition({
          actor,
          id: ncr.id,
          expectedVersion: 4n,
          action,
          requestId: 'direct',
        }),
      ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
      expect(updateTable).not.toHaveBeenCalled();
    },
  );

  it.each(['ACTIONS_COMPLETE', 'READY_FOR_CLOSURE', 'CLOSE'] as const)(
    'direct CAPA %s cannot bypass controlled evidence or P-04',
    async (action) => {
      const updateTable = vi.fn();
      const database = { updateTable } as unknown as Kysely<DatabaseSchema>;
      await expect(
        new PostgresCapaRepository(database).transition({
          actor,
          id: capa.id,
          expectedVersion: 2n,
          action,
          requestId: 'direct',
        }),
      ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
      expect(updateTable).not.toHaveBeenCalled();
    },
  );
});
