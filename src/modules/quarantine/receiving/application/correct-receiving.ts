import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import {
  assertExpiryNotBeforeReceiving,
  assertReceivingQuantity,
  type ReceivingItem,
} from '../domain/receiving-item.js';
import { assertReceivingCorrectable } from '../domain/receiving-state.js';
import type { ReceivingRepository } from '../ports/repository.js';

/**
 * QC-DATA-001 — controlled correction of a received record.
 *
 * The correction is the same write contract as creation, plus a mandatory reason
 * and a version check. The state gate lives in the domain
 * (`assertReceivingCorrectable`): from UNDER_INSPECTION onward the inspection
 * snapshot has frozen the received facts, so a correction must go through the
 * inspection/HOLD disposition path instead of silently rewriting history.
 */
export class CorrectReceivingUseCase {
  constructor(private readonly repo: ReceivingRepository) {}
  async execute(i: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reason: string;
    supplier: string;
    docNo: string;
    itemCode: string;
    description: string;
    lot: string;
    qty: string;
    quantityUnit: string;
    purchaseOrderNo?: string;
    receivingDate: Date;
    expiryDate?: Date;
    requestId: string;
  }) {
    const item: ReceivingItem | undefined = await this.repo.get(i.id, i.actor);
    if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertReceivingCorrectable(item.workflowState);
    assertReceivingQuantity(i.qty);
    assertExpiryNotBeforeReceiving(i.receivingDate, i.expiryDate);
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-QUAR-EDIT',
        action: 'EDIT',
        entity: {
          type: 'RECEIVING_ITEM',
          id: item.id,
          state: item.workflowState,
          ownerId: item.createdBy,
        },
        scope: { ownerId: item.createdBy },
        currentVersion: item.version,
        expectedVersion: i.expectedVersion,
        // The reason is part of the correction contract, not an optional note.
        businessCondition: Boolean(i.reason?.trim()),
      },
      { throwOnDeny: true },
    );
    return this.repo.correct(i);
  }
}
