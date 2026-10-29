import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessCheckpoint } from '../domain/read-model.js';
import {
  assertDecimalText,
  assertRequiredText,
  optionalText,
  WI_SOURCE_REQUIRED,
} from '../domain/run.js';
import type { InProcessRepository } from '../ports/repository.js';
import { loadAuthorizedRun } from './authorization.js';

export class TranscribeInProcessCheckpointUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    stepReference: string;
    parameterName: string;
    unit?: string;
    frequencyText: string;
    samplingText?: string;
    acceptanceCriteriaText: string;
    lowerLimitText?: string;
    upperLimitText?: string;
  }): Promise<InProcessCheckpoint> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-RECORD',
      action: 'TRANSCRIBE_CHECKPOINT',
    });
    if (!workspace.run.wi.documentVersionId)
      throw new AppError('POLICY_SOURCE_REQUIRED', {
        userSafe: true,
        messageKey: 'in-process.wi-source-required',
        safeMetadata: { state: WI_SOURCE_REQUIRED },
      });

    const hasLower = Boolean(input.lowerLimitText?.trim());
    const hasUpper = Boolean(input.upperLimitText?.trim());
    if (hasLower !== hasUpper)
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: {
          lowerLimitText: [
            'Enter both numeric bounds transcribed from the work instruction, or neither for a qualitative criterion.',
          ],
        },
      });

    return this.repository.transcribeCheckpoint({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      stepReference: assertRequiredText(input.stepReference, 'stepReference', 200),
      parameterName: assertRequiredText(input.parameterName, 'parameterName', 200),
      unit: optionalText(input.unit, 50) ?? undefined,
      frequencyText: assertRequiredText(input.frequencyText, 'frequencyText', 500),
      samplingText: optionalText(input.samplingText, 500) ?? undefined,
      acceptanceCriteriaText: assertRequiredText(input.acceptanceCriteriaText, 'acceptanceCriteriaText', 2000),
      lowerLimitText: hasLower ? assertDecimalText(input.lowerLimitText, 'lowerLimitText') : undefined,
      upperLimitText: hasUpper ? assertDecimalText(input.upperLimitText, 'upperLimitText') : undefined,
    });
  }
}
