import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessCheckpoint } from '../domain/read-model.js';
import type { InProcessRepository } from '../ports/repository.js';
import { loadAuthorizedRun } from './authorization.js';

/**
 * QC verification of the transcribed criteria against the pinned work
 * instruction revision. It is a second-person control and enables recording
 * readings for that checkpoint; it approves no limit and releases no product.
 */
export class VerifyInProcessCheckpointUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    checkpointId: string;
    checkpointVersion: bigint;
  }): Promise<InProcessCheckpoint> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-VERIFY',
      action: 'VERIFY_CHECKPOINT',
    });
    const checkpoint = workspace.checkpoints.find(
      (candidate) => candidate.id === input.checkpointId,
    );
    if (!checkpoint) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (checkpoint.wiRevision !== workspace.run.wi.revision)
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });

    return this.repository.verifyCheckpoint({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      checkpointId: input.checkpointId,
      checkpointVersion: input.checkpointVersion,
    });
  }
}
