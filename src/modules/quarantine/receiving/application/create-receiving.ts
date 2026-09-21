import { authorize } from '../../../../shared/authorization/authorize.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { createReceivingItem } from '../domain/receiving-item.js';
import { assertExpiryNotBeforeReceiving } from '../domain/receiving-item.js';
import type { ReceivingRepository } from '../ports/repository.js';
export class CreateReceivingUseCase {
  constructor(
    private repo: ReceivingRepository,
    private now = () => new Date(),
  ) {}
  execute(i: {
    actor: ActorContext;
    receivingNo: string;
    supplier: string;
    docNo: string;
    itemCode: string;
    description: string;
    lot: string;
    qty: string | number;
    quantityUnit: string;
    purchaseOrderNo?: string;
    receivingDate: Date;
    expiryDate?: Date;
    requestId: string;
  }) {
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-QUAR-CREATE',
        action: 'CREATE',
        entity: { type: 'RECEIVING_ITEM', id: 'new', state: 'PENDING', ownerId: i.actor.id },
        scope: { ownerId: i.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    // Date rules are enforced before persistence so the operator sees the field
    // that must change (PostgreSQL enforces the same rule for every new row).
    assertExpiryNotBeforeReceiving(i.receivingDate, i.expiryDate);
    return this.repo.create({
      item: createReceivingItem({ id: uuidv7(), ...i, createdBy: i.actor.id, now: this.now() }),
      actor: i.actor,
      requestId: i.requestId,
    });
  }
}

