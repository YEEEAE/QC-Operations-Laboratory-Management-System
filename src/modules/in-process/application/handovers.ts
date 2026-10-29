import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessHandover } from '../domain/read-model.js';
import { assertRequiredText } from '../domain/run.js';
import type { InProcessRepository } from '../ports/repository.js';
import { loadAuthorizedRun } from './authorization.js';

/**
 * Cross-shift continuation. The outgoing shift records the state it hands
 * over; the incoming operator accepts with their own authenticated session, so
 * no recipient identity is invented by the person recording the handover.
 */
export class RecordInProcessHandoverUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    toShiftCode: string;
    handoverNote: string;
  }): Promise<InProcessHandover> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-HANDOVER',
      action: 'RECORD_HANDOVER',
    });
    return this.repository.recordHandover({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      toShiftCode: assertRequiredText(input.toShiftCode, 'toShiftCode', 50),
      handoverNote: assertRequiredText(input.handoverNote, 'handoverNote', 2000),
    });
  }
}

export class AcceptInProcessHandoverUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    handoverId: string;
  }): Promise<InProcessHandover> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-HANDOVER',
      action: 'ACCEPT_HANDOVER',
    });
    if (!workspace.handovers.some((handover) => handover.id === input.handoverId))
      throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return this.repository.acceptHandover({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      handoverId: input.handoverId,
    });
  }
}
