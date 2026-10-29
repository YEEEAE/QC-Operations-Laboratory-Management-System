import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessHoldRequest } from '../domain/read-model.js';
import { assertRequiredText } from '../domain/run.js';
import type { InProcessRepository } from '../ports/repository.js';
import { loadAuthorizedRun } from './authorization.js';

/**
 * A QC hold REQUEST only. No inventory, stock or quarantine record changes
 * here: no approved mapping from an in-process run to a held stock identity
 * exists, and a request is never presented as an applied hold.
 */
export class RequestInProcessHoldUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    reason: string;
    deviationId?: string;
  }): Promise<InProcessHoldRequest> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-HOLD',
      action: 'REQUEST_HOLD',
    });
    if (input.deviationId && !workspace.deviations.some((item) => item.id === input.deviationId))
      throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });

    return this.repository.requestHold({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      reason: assertRequiredText(input.reason, 'reason', 2000),
      deviationId: input.deviationId || undefined,
    });
  }
}

export class DecideInProcessHoldUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    holdRequestId: string;
    decision: 'ACKNOWLEDGED' | 'DECLINED';
    decisionNote: string;
  }): Promise<InProcessHoldRequest> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-REVIEW',
      action: 'DECIDE_HOLD',
    });
    if (!workspace.holdRequests.some((request) => request.id === input.holdRequestId))
      throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });

    return this.repository.decideHold({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      holdRequestId: input.holdRequestId,
      decision: input.decision,
      decisionNote: assertRequiredText(input.decisionNote, 'decisionNote', 2000),
    });
  }
}
