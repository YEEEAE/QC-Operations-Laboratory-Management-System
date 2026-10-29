import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type {
  InProcessDeviation,
  InProcessDeviationCategory,
} from '../domain/read-model.js';
import { assertRequiredText, optionalText } from '../domain/run.js';
import type { InProcessRepository } from '../ports/repository.js';
import { loadAuthorizedRun } from './authorization.js';

const CATEGORIES: readonly InProcessDeviationCategory[] = [
  'PROCESS_PARAMETER',
  'MATERIAL',
  'EQUIPMENT',
  'DOCUMENT',
  'OTHER',
];

export function assertDeviationCategory(value: string): InProcessDeviationCategory {
  if (!CATEGORIES.includes(value as InProcessDeviationCategory))
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { category: ['Choose one of the recorded deviation categories.'] },
    });
  return value as InProcessDeviationCategory;
}

export class FlagInProcessDeviationUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: {
    actor: ActorContext;
    requestId: string;
    runId: string;
    expectedVersion: bigint;
    category: string;
    description: string;
    containmentState: 'DEFINED' | 'NOT_YET_DEFINED';
    immediateContainment?: string;
    checkpointId?: string;
    readingId?: string;
  }): Promise<InProcessDeviation> {
    const workspace = await loadAuthorizedRun({
      repository: this.repository,
      actor: input.actor,
      runId: input.runId,
      permission: 'PERM-INP-DEVIATION',
      action: 'FLAG_DEVIATION',
    });
    if (input.containmentState === 'DEFINED' && !input.immediateContainment?.trim())
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { immediateContainment: ['Describe the immediate containment, or record it as not yet defined.'] },
      });
    if (input.readingId && !workspace.readings.some((reading) => reading.id === input.readingId))
      throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });

    return this.repository.flagDeviation({
      runId: workspace.run.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      category: assertDeviationCategory(input.category),
      description: assertRequiredText(input.description, 'description', 4000),
      containmentState: input.containmentState,
      immediateContainment:
        input.containmentState === 'DEFINED'
          ? assertRequiredText(input.immediateContainment, 'immediateContainment', 4000)
          : undefined,
      checkpointId: optionalText(input.checkpointId, 64) ?? undefined,
      readingId: optionalText(input.readingId, 64) ?? undefined,
    });
  }
}
