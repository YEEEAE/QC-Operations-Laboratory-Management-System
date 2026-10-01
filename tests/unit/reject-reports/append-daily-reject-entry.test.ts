import { describe, expect, it, vi } from 'vitest';
import { AppendDailyRejectEntryUseCase } from '../../../src/modules/reject-reports/application/append-daily-reject-entry.js';
import type { DailyReject } from '../../../src/modules/reject-reports/domain/daily-reject.js';
import type { RejectReportRepository } from '../../../src/modules/reject-reports/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: 'owner-1',
  accountState: 'ACTIVE',
  roles: [],
  permissions: [{ code: 'PERM-RREJ-EDIT', scopes: ['OWN'] }],
};

const draft: DailyReject = {
  id: '10000000-0000-4000-8000-000000000001',
  reportNo: 'DRR-20261001-0001',
  reportDate: new Date('2026-10-01T00:00:00.000Z'),
  department: 'Production A',
  status: 'DRAFT',
  entries: [],
  createdBy: actor.id,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  version: 4n,
};

const inputEntry = {
  itemDescription: 'RM batch',
  rmUnit: 'kg',
  rejectQty: '0.125',
  goodQty: '2.5',
  rejectReason: 'Surface defect',
};

function setup(record: DailyReject | undefined, actorContext = actor) {
  const appendDailyRejectEntry = vi.fn(async () => record!);
  const repository = {
    getDailyReject: vi.fn(async () => record),
    appendDailyRejectEntry,
  } as unknown as RejectReportRepository;
  const useCase = new AppendDailyRejectEntryUseCase(repository);
  const execute = () =>
    useCase.execute({
      actor: actorContext,
      reportId: draft.id,
      expectedVersion: draft.version,
      entry: inputEntry,
      requestId: 'req-append-unit',
    });
  return { appendDailyRejectEntry, execute };
}

describe('AppendDailyRejectEntryUseCase', () => {
  it('appends one validated entry to an owned current draft', async () => {
    const { appendDailyRejectEntry, execute } = setup(draft);
    await execute();
    expect(appendDailyRejectEntry).toHaveBeenCalledWith({
      id: draft.id,
      expectedVersion: draft.version,
      actor,
      requestId: 'req-append-unit',
      entry: inputEntry,
    });
  });

  it('denies an actor without the edit grant before any append write', async () => {
    const deniedActor = { ...actor, permissions: [] };
    const { appendDailyRejectEntry, execute } = setup(draft, deniedActor);
    await expect(execute()).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(appendDailyRejectEntry).not.toHaveBeenCalled();
  });

  it('denies another owner and stale versions before any append write', async () => {
    const otherOwner = { ...draft, createdBy: 'owner-2' };
    const denied = setup(otherOwner);
    await expect(denied.execute()).rejects.toMatchObject({ code: 'AUTHZ_SCOPE_DENIED' });
    expect(denied.appendDailyRejectEntry).not.toHaveBeenCalled();

    const stale = setup({ ...draft, version: draft.version + 1n });
    await expect(stale.execute()).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(stale.appendDailyRejectEntry).not.toHaveBeenCalled();
  });

  it('rejects a non-draft report before any append write', async () => {
    const finalized = setup({ ...draft, status: 'FINALIZED' });
    await expect(finalized.execute()).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(finalized.appendDailyRejectEntry).not.toHaveBeenCalled();
  });
});
