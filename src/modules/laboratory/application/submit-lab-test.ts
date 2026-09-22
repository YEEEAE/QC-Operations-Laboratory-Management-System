import { createHash } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import { assertComplete, type DerivedResult, type LabTest } from '../domain/lab-test.js';
import { transitionLab } from '../domain/lab-state.js';
import { deriveTestResult } from '../domain/sample-result.js';
import type { AssetsEligibility, ControlledLabSources } from '../ports/controlled-sources.js';
import type { LabRepository } from '../ports/repository.js';
import { authorizeLab } from './lab-authorization.js';
/**
 * Aggregate the run-level sample results into the derived overall result.
 * Returns `null` when no sample carries a derived result, so the record states
 * "not derived" instead of claiming an outcome the evidence does not support.
 */
function deriveOverallResult(test: LabTest, at: string): DerivedResult | null {
  const sampleResults = test.sampleResults ?? [];
  const result = deriveTestResult(sampleResults.map((sample) => sample.result));
  if (!result) return null;
  return {
    result,
    source: 'SYSTEM_EVALUATION',
    inputsHash: createHash('sha256')
      .update(
        stableJson(
          [...sampleResults]
            .sort((left, right) => left.id.localeCompare(right.id))
            .map((sample) => ({
              id: sample.id,
              batchId: sample.batchId,
              sampleId: sample.sampleId,
              result: sample.result,
              contentHash: sample.contentHash,
            })),
        ),
      )
      .digest('hex'),
    computedAt: at,
  };
}

export class SubmitLabTestUseCase {
  constructor(
    private readonly repository: LabRepository,
    private readonly sources: ControlledLabSources,
    private readonly assets: AssetsEligibility,
    private readonly now = () => new Date(),
  ) {}
  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    requestId: string;
  }) {
    const test = await this.repository.get(input.id, input.actor);
    if (!test) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorizeLab(input.actor, test, 'PERM-LAB-SUBMIT', 'SUBMIT', input.expectedVersion);
    assertComplete(test);
    await this.assets.verify({
      actor: input.actor,
      equipment: test.context.equipment,
      context: test.context,
    });
    await this.sources.validateExecution(test, input.actor);
    const at = this.now().toISOString();
    return this.repository.save(
      test,
      {
        ...test,
        state: transitionLab(test.state, 'SUBMIT'),
        // QC-DATA-003: the reviewer's aggregate of the run-level sample results
        // is frozen at submission. It is evidence, not the official outcome.
        derivedResult: deriveOverallResult(test, at),
        version: test.version + 1n,
        updatedAt: at,
        submittedAt: at,
      },
      { actor: input.actor, requestId: input.requestId, action: 'SUBMIT' },
    );
  }
}
