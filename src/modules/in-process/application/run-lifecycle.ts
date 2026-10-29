import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessDisposition, InProcessRun } from '../domain/read-model.js';
import { assertRequiredText, IN_PROCESS_DISPOSITIONS } from '../domain/run.js';
import type { InProcessRepository } from '../ports/repository.js';
import { loadAuthorizedRun } from './authorization.js';
import { buildWorkspaceView } from './workspace-view.js';

/**
 * Submission hands the run to QC review. It never evaluates the readings and
 * never records a scientific result; unmet requirements reject the submission.
 */
export class SubmitInProcessRunUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
  }): Promise<InProcessRun> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-SUBMIT',
      action: 'SUBMIT',
    });
    const view = buildWorkspaceView({ ...workspace, actor: input.actor });
    return this.repository.submitRun({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      blockers: view.submissionBlockers,
    });
  }
}

export class ReviewInProcessRunUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    action: 'RETURN' | 'QC_REVIEW';
    reason?: string;
  }): Promise<InProcessRun> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-REVIEW',
      action: input.action === 'RETURN' ? 'RETURN' : 'QC_REVIEW',
    });
    const reason =
      input.action === 'RETURN'
        ? assertRequiredText(input.reason, 'reason', 2000)
        : (input.reason?.trim().slice(0, 2000) ?? '');
    return this.repository.reviewRun({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      action: input.action,
      reason,
    });
  }
}

export class CloseInProcessRunUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    disposition: string;
    dispositionNote: string;
  }): Promise<InProcessRun> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-CLOSE',
      action: 'CLOSE',
    });
    if (!IN_PROCESS_DISPOSITIONS.includes(input.disposition as InProcessDisposition))
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { disposition: ['Choose one of the recorded human dispositions.'] },
      });
    const view = buildWorkspaceView({ ...workspace, actor: input.actor });
    if (view.closeBlockers.length)
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { disposition: [...view.closeBlockers] },
      });
    return this.repository.closeRun({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      disposition: input.disposition as InProcessDisposition,
      dispositionNote: assertRequiredText(input.dispositionNote, 'dispositionNote', 4000),
    });
  }
}
