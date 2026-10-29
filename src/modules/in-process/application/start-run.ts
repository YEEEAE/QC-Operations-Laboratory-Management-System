import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessRun } from '../domain/read-model.js';
import { assertRequiredText, optionalText } from '../domain/run.js';
import type { InProcessRepository } from '../ports/repository.js';

export interface StartInProcessRunCommand {
  actor: ActorContext;
  requestId: string;
  itemCode: string;
  itemName: string;
  lotNo: string;
  workOrderNo?: string;
  batchNo?: string;
  productionLine: string;
  station?: string;
  machine?: string;
  shiftCode: string;
  wiDocumentVersionId: string;
  formDocumentVersionId?: string;
}

export class StartInProcessRunUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: StartInProcessRunCommand): Promise<InProcessRun> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-INP-CREATE',
        action: 'CREATE',
        entity: {
          type: 'IN_PROCESS_RUN',
          id: 'new',
          state: 'IN_PROGRESS',
          ownerId: input.actor.id,
        },
        scope: { ownerId: input.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );

    // A work instruction is mandatory: without a product-specific effective WI
    // there is no lawful basis for an in-process check.
    if (!input.wiDocumentVersionId)
      throw new AppError('POLICY_SOURCE_REQUIRED', {
        userSafe: true,
        messageKey: 'in-process.wi-source-required',
      });

    return this.repository.startRun({
      itemCode: assertRequiredText(input.itemCode, 'itemCode', 100),
      itemName: assertRequiredText(input.itemName, 'itemName', 500),
      lotNo: assertRequiredText(input.lotNo, 'lotNo', 100),
      workOrderNo: optionalText(input.workOrderNo, 100) ?? undefined,
      batchNo: optionalText(input.batchNo, 100) ?? undefined,
      productionLine: assertRequiredText(input.productionLine, 'productionLine', 200),
      station: optionalText(input.station, 200) ?? undefined,
      machine: optionalText(input.machine, 200) ?? undefined,
      shiftCode: assertRequiredText(input.shiftCode, 'shiftCode', 50),
      wiDocumentVersionId: input.wiDocumentVersionId,
      formDocumentVersionId: input.formDocumentVersionId || undefined,
      actor: input.actor,
      requestId: input.requestId,
    });
  }
}
