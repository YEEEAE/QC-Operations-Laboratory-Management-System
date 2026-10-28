import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import { assertRetestLink } from '../domain/retest.js';
import { assertContext } from '../domain/lab-test.js';
import type { ControlledLabSources, RetestPolicy } from '../ports/controlled-sources.js';
import type { LabRepository } from '../ports/repository.js';
export class CreateRetestUseCase {
  constructor(
    private readonly repository: LabRepository,
    private readonly sources: ControlledLabSources,
    private readonly policy: RetestPolicy,
    private readonly now = () => new Date(),
  ) {}
  async execute(input: {
    actor: ActorContext;
    originalId: string;
    expectedVersion: bigint;
    reason: string;
    requestId: string;
  }) {
    const original = await this.repository.get(input.originalId, input.actor);
    if (!original) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (original.version !== input.expectedVersion) throw new AppError('STALE_VERSION', { userSafe: true });
    if (original.originalTestId) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!input.reason.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (input.actor.accountState !== 'ACTIVE' ||
      !(input.actor.roles.includes('SUPERVISOR') || isNamedSystemOwner(input.actor)))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    for (const permission of ['PERM-LAB-RETEST', 'PERM-LAB-AUTHORIZE-RETEST'] as const) {
      authorize(
        {
          actor: input.actor,
          permission,
          action: 'AUTHORIZE_RETEST',
          entity: {
            type: 'LAB_TEST',
            id: original.id,
            state: original.state,
            authorId: original.authorId,
            executorId: original.authorId,
          },
          scope: { ownerId: original.authorId },
          currentVersion: original.version,
          expectedVersion: original.version,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
    }
    const eligibilityContext = await this.sources.resolve(original.context.templateVersionId, input.actor, original.context.productCode);
    assertContext(eligibilityContext);
    const sourceRules = eligibilityContext.qualificationPolicy.retestEligibility;
    if (eligibilityContext.contentHash !== original.context.contentHash ||
      eligibilityContext.methodReference !== original.context.methodReference ||
      !sourceRules || typeof sourceRules !== 'object' || Array.isArray(sourceRules))
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    const eligibility = sourceRules as { eligibleStates?: unknown; eligibleResults?: unknown };
    if (!Array.isArray(eligibility.eligibleStates) || !eligibility.eligibleStates.includes(original.state) ||
      !Array.isArray(eligibility.eligibleResults) || !eligibility.eligibleResults.includes(original.scientificResult))
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    const authorization = await this.policy.authorize({
      original,
      actor: input.actor,
      reason: input.reason.trim(),
    });
    // Validate the provider contract without choosing any policy values.
    if (
      !Number.isSafeInteger(authorization.sequence) ||
      authorization.sequence !== 1 ||
      !authorization.labTestNo.trim() ||
      !authorization.templateVersionId.trim()
    )
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const context = await this.sources.resolve(authorization.templateVersionId, input.actor, original.context.productCode);
    assertContext(context);
    if (context.templateVersionId !== authorization.templateVersionId)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const retestEligibility = context.qualificationPolicy.retestEligibility;
    if (!retestEligibility || typeof retestEligibility !== 'object' || Array.isArray(retestEligibility))
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    const rules = retestEligibility as { eligibleStates?: unknown; eligibleResults?: unknown };
    if (!Array.isArray(rules.eligibleStates) || !rules.eligibleStates.includes(original.state) ||
      !Array.isArray(rules.eligibleResults) || !rules.eligibleResults.includes(original.scientificResult))
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    const at = this.now().toISOString();
    const next = {
      ...original,
      id: uuidv7(),
      labTestNo: authorization.labTestNo,
      state: 'DRAFT' as const,
      scientificResult: null,
      authorId: input.actor.id,
      createdBy: input.actor.id,
      version: 1n,
      context,
      samples: [],
      measurements: [],
      // A new DRAFT has no execution evidence. Spreading the original used to
      // carry runs/readings/results (including derived FAIL/PASS) into it.
      batches: [],
      readings: [],
      sampleResults: [],
      derivedResult: null,
      originalTestId: original.id,
      retestSequence: authorization.sequence,
      retestReason: input.reason.trim(),
      createdAt: at,
      updatedAt: at,
      submittedAt: null,
      reviewStartedAt: null,
      approvedAt: null,
      rejectedAt: null,
    };
    assertRetestLink(original, next);
    return this.repository.create(next, {
      actor: input.actor,
      requestId: input.requestId,
      action: 'CREATE_RETEST',
      reason: input.reason.trim(),
    });
  }
}
