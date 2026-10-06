import { describe, expect, it, vi } from 'vitest';
import { CorrectReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/correct-receiving.js';
import type { ReceivingItem } from '../../../src/modules/quarantine/receiving/domain/receiving-item.js';
import type { ReceivingRepository } from '../../../src/modules/quarantine/receiving/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: '01900000-0000-7000-8000-000000000001',
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: [{ code: 'PERM-QUAR-EDIT', scopes: ['OWN'] }],
};

const current: ReceivingItem = {
  id: '01900000-0000-7000-8000-000000000002',
  receivingNo: 'RCV-1',
  supplier: 'Supplier old',
  docNo: 'DOC-1',
  itemCode: 'ITEM-1',
  description: 'Material',
  lot: 'LOT-1',
  qty: '2',
  quantityUnit: 'PCS',
  purchaseOrderNo: 'PO-1',
  receivingDate: new Date('2026-09-01T00:00:00Z'),
  workflowState: 'PENDING',
  inspectionResult: 'NOT_STARTED',
  releaseSystem: false,
  createdBy: actor.id,
  createdAt: new Date('2026-09-01T00:00:00Z'),
  updatedAt: new Date('2026-09-01T00:00:00Z'),
  version: 4n,
};

function correction(overrides: Partial<Parameters<ReceivingRepository['correct']>[0]> = {}) {
  return {
    actor,
    id: current.id,
    expectedVersion: current.version,
    reason: 'Corrected against receiving document',
    supplier: 'Supplier new',
    docNo: current.docNo,
    itemCode: 'ITEM-2',
    description: current.description,
    lot: 'LOT-2',
    qty: '3',
    quantityUnit: 'PCS',
    purchaseOrderNo: 'PO-2',
    receivingDate: new Date('2026-09-02T00:00:00Z'),
    requestId: 'request-1',
    ...overrides,
  };
}

describe('correct receiving use case', () => {
  it.each(['PENDING', 'READY_FOR_INSPECTION', 'HOLD'] as const)(
    'passes the approved %s correction and expected version to persistence',
    async (workflowState) => {
      const record = { ...current, workflowState };
      const correct = vi.fn(async (input: Parameters<ReceivingRepository['correct']>[0]) => ({
        ...record,
        supplier: input.supplier,
        itemCode: input.itemCode,
        lot: input.lot,
        qty: input.qty,
        purchaseOrderNo: input.purchaseOrderNo,
        receivingDate: input.receivingDate,
        version: input.expectedVersion + 1n,
      }));
      const repo = {
        get: vi.fn().mockResolvedValue(record),
        correct,
      } as unknown as ReceivingRepository;

      const saved = await new CorrectReceivingUseCase(repo).execute(correction());

      expect(correct).toHaveBeenCalledWith(correction());
      expect(saved).toMatchObject({
        supplier: 'Supplier new',
        itemCode: 'ITEM-2',
        lot: 'LOT-2',
        qty: '3',
        purchaseOrderNo: 'PO-2',
        version: 5n,
      });
    },
  );

  it.each([
    'UNDER_INSPECTION',
    'INSPECTION_COMPLETE',
    'RELEASE_PENDING',
    'RELEASED',
    'EXPIRED',
    'CANCELLED',
  ] as const)('does not persist corrections once workflow state is %s', async (workflowState) => {
    const correct = vi.fn();
    const repo = {
      get: vi.fn().mockResolvedValue({ ...current, workflowState }),
      correct,
    } as unknown as ReceivingRepository;

    await expect(new CorrectReceivingUseCase(repo).execute(correction())).rejects.toThrow();
    expect(correct).not.toHaveBeenCalled();
  });

  it('requires the audit reason before persistence', async () => {
    const correct = vi.fn();
    const repo = {
      get: vi.fn().mockResolvedValue(current),
      correct,
    } as unknown as ReceivingRepository;

    await expect(
      new CorrectReceivingUseCase(repo).execute(correction({ reason: '   ' })),
    ).rejects.toThrow();
    expect(correct).not.toHaveBeenCalled();
  });
});
