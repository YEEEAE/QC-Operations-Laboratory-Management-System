import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessReading } from '../domain/read-model.js';
import { assertRequiredText, optionalText } from '../domain/run.js';
import type { InProcessRepository } from '../ports/repository.js';
import { loadAuthorizedRun } from './authorization.js';

export class RecordInProcessReadingUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    checkpointId: string;
    entryState: 'DRAFT' | 'RECORDED';
    valueText: string;
    unit?: string;
    observedAt: Date;
    sampleReference?: string;
  }): Promise<InProcessReading> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-RECORD',
      action: 'RECORD_READING',
    });
    const checkpoint = workspace.checkpoints.find(
      (candidate) => candidate.id === input.checkpointId,
    );
    if (!checkpoint) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    // Reading a checkpoint whose criteria are not QC verified would create an
    // uncontrolled measurement, so it fails closed instead.
    if (checkpoint.verificationState !== 'QC_VERIFIED')
      throw new AppError('POLICY_SOURCE_REQUIRED', {
        userSafe: true,
        messageKey: 'in-process.checkpoint-source-verification-required',
      });
    if (Number.isNaN(input.observedAt.getTime()))
      throw new AppError('VALIDATION_INVALID_DATE', { userSafe: true });

    return this.repository.recordReading({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      checkpointId: checkpoint.id,
      entryState: input.entryState,
      valueText: assertRequiredText(input.valueText, 'valueText', 200),
      unit: optionalText(input.unit, 50) ?? undefined,
      observedAt: input.observedAt,
      sampleReference: optionalText(input.sampleReference, 100) ?? undefined,
    });
  }
}
