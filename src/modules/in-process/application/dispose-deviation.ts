import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessDeviation } from '../domain/read-model.js';
import { assertRequiredText } from '../domain/run.js';
import type { InProcessRepository } from '../ports/repository.js';
import { loadAuthorizedRun } from './authorization.js';

const SEVERITIES = ['MINOR', 'MAJOR', 'CRITICAL'] as const;
const STATUSES = ['ACCEPTED_FOR_CONTINUATION', 'ESCALATED', 'CLOSED'] as const;

/**
 * Records the QC classification and human disposition of one deviation.
 * The disposition is about the record and the process; it is not a product
 * release, scrap decision, or CAPA closure.
 */
export class DisposeInProcessDeviationUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    deviationId: string;
    severity: string;
    status: string;
    dispositionNote: string;
  }): Promise<InProcessDeviation> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-REVIEW',
      action: 'DISPOSE_DEVIATION',
    });
    if (!workspace.deviations.some((deviation) => deviation.id === input.deviationId))
      throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!SEVERITIES.includes(input.severity as (typeof SEVERITIES)[number]))
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { severity: ['Choose a QC classification.'] },
      });
    if (!STATUSES.includes(input.status as (typeof STATUSES)[number]))
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { status: ['Choose a recorded disposition.'] },
      });

    return this.repository.disposeDeviation({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      deviationId: input.deviationId,
      severity: input.severity as (typeof SEVERITIES)[number],
      status: input.status as (typeof STATUSES)[number],
      dispositionNote: assertRequiredText(input.dispositionNote, 'dispositionNote', 4000),
    });
  }
}
