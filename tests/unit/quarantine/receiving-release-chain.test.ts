/**
 * QC-DATA-001 — Release state chain over an in-memory repository (part 2).
 *
 * The operational chain: created → ready → under inspection → complete →
 * release request → explicit release, with the invariant that an accepted
 * inspection never releases anything by itself, and that HOLD can never
 * silently become RELEASED.
 */
import { describe, expect, it } from 'vitest';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { ReceivingRepository } from '../../../src/modules/quarantine/receiving/ports/repository.js';
import type { ReceivingItem } from '../../../src/modules/quarantine/receiving/domain/receiving-item.js';
import { CreateReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/create-receiving.js';
import { TransitionReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/transition-receiving.js';
import { ReleaseReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/release-receiving.js';
import { transitionReceiving } from '../../../src/modules/quarantine/receiving/domain/receiving-state.js';
import { AppError } from '../../../src/shared/errors/app-error.js';

const actor: ActorContext = {
  id: '01900000-0000-7000-8000-0000000000d1',
  loginIdentity: 'qcdata001',
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: [
    { code: 'PERM-QUAR-CREATE', scopes: ['GLOBAL'] },
    { code: 'PERM-QUAR-EDIT', scopes: ['GLOBAL'] },
    { code: 'PERM-QUAR-START-INSPECTION', scopes: ['GLOBAL'] },
    { code: 'PERM-QUAR-HOLD', scopes: ['GLOBAL'] },
    { code: 'PERM-QUAR-RELEASE', scopes: ['GLOBAL'] },
  ],
};

/** Minimal in-memory repository mirroring the approved repository contract. */
function memoryRepository(): { repository: ReceivingRepository; current: () => ReceivingItem | undefined } {
  let item: ReceivingItem | undefined;
  const repository = {
    async create(i: { item: ReceivingItem }) {
      item = i.item;
      return item;
    },
    async get() {
      return item;
    },
    async list() {
      return item ? [item] : [];
    },
    async updateDraft() {
      return item!;
    },
    async correct() {
      return item!;
    },
    async transition(i: {
      id: string;
      expectedVersion: bigint;
      action: Parameters<ReceivingRepository['transition']>[0]['action'];
    }) {
      const next = { ...item! };
      next.workflowState = transitionReceiving(next.workflowState, i.action);
      next.version = i.expectedVersion + 1n;
      // Mirror the real repository: the inspection outcome is recorded by the
      // inspection workflow, never by the receiving transition itself.
      if (i.action === 'COMPLETE_INSPECTION') next.inspectionResult = 'PASS';
      if (i.action === 'RELEASE') next.releaseSystem = true;
      item = next;
      return item;
    },
  } as unknown as ReceivingRepository;
  return { repository, current: () => item };
}

describe('receiving release chain', () => {
  it('reaches RELEASED only through the explicit release action', async () => {
    const { repository, current } = memoryRepository();
    const created = await new CreateReceivingUseCase(repository, () => new Date('2026-09-01')).execute({
      actor,
      receivingNo: 'RCV-DATA-1',
      supplier: 'Supplier',
      docNo: 'DOC-1',
      itemCode: 'RM-1',
      description: 'Raw material',
      lot: 'L-1',
      qty: '250',
      quantityUnit: 'PCS',
      receivingDate: new Date('2026-09-01'),
      requestId: 'req-1',
    });
    expect(created.releaseSystem).toBe(false);

    const transitions = new TransitionReceivingUseCase(repository);
    await transitions.execute({ actor, id: created.id, expectedVersion: 1n, action: 'MARK_READY', requestId: 'r2' });
    await transitions.execute({ actor, id: created.id, expectedVersion: 2n, action: 'START_INSPECTION', requestId: 'r3' });
    await transitions.execute({ actor, id: created.id, expectedVersion: 3n, action: 'COMPLETE_INSPECTION', requestId: 'r4' });
    await transitions.execute({
      actor,
      id: created.id,
      expectedVersion: 4n,
      action: 'MOVE_TO_RELEASE_PENDING',
      requestId: 'r5',
    });
    // A completed inspection is not a release: the record is only *pending* a
    // release decision.
    expect(current()?.inspectionResult).toBe('PASS');
    expect(current()?.releaseSystem).toBe(false);
    expect(current()?.workflowState).toBe('RELEASE_PENDING');

    await new ReleaseReceivingUseCase(repository).execute({
      actor,
      id: created.id,
      expectedVersion: 5n,
      requestId: 'r6',
    });
    expect(current()?.releaseSystem).toBe(true);
    expect(current()?.workflowState).toBe('RELEASED');
  });

  it('never releases a record on HOLD and never lets HOLD become RELEASED silently', async () => {
    const { repository, current } = memoryRepository();
    const created = await new CreateReceivingUseCase(repository).execute({
      actor,
      receivingNo: 'RCV-DATA-2',
      supplier: 'Supplier',
      docNo: 'DOC-2',
      itemCode: 'RM-2',
      description: 'Raw material',
      lot: 'L-2',
      qty: '10',
      quantityUnit: 'KG',
      receivingDate: new Date('2026-09-02'),
      requestId: 'req-2',
    });
    await new TransitionReceivingUseCase(repository).execute({
      actor,
      id: created.id,
      expectedVersion: 1n,
      action: 'HOLD',
      reason: 'Waiting for supplier documents',
      requestId: 'r2',
    });
    await expect(
      new TransitionReceivingUseCase(repository).execute({
        actor,
        id: created.id,
        expectedVersion: 2n,
        action: 'RELEASE' as never,
        requestId: 'r3',
      }),
    ).rejects.toThrow(AppError);
    expect(current()?.workflowState).toBe('HOLD');
    expect(current()?.releaseSystem).toBe(false);
  });

  it('rejects a stale version instead of overwriting newer state', async () => {
    const { repository, current } = memoryRepository();
    const created = await new CreateReceivingUseCase(repository).execute({
      actor,
      receivingNo: 'RCV-DATA-3',
      supplier: 'Supplier',
      docNo: 'DOC-3',
      itemCode: 'RM-3',
      description: 'Raw material',
      lot: 'L-3',
      qty: '7',
      quantityUnit: 'SET',
      receivingDate: new Date('2026-09-03'),
      requestId: 'req-3',
    });
    await new TransitionReceivingUseCase(repository).execute({
      actor,
      id: created.id,
      expectedVersion: 1n,
      action: 'MARK_READY',
      requestId: 'r2',
    });
    await expect(
      new TransitionReceivingUseCase(repository).execute({
        actor,
        id: created.id,
        expectedVersion: 1n,
        action: 'MARK_EXPIRED',
        reason: 'stale attempt',
        requestId: 'r3',
      }),
    ).rejects.toThrow(AppError);
    expect(current()?.workflowState).toBe('READY_FOR_INSPECTION');
  });
});

