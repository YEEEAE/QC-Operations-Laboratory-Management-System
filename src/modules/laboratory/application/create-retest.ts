import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isP05Authority } from '../../../shared/authorization/p05-authority.js';
import { assertRetestLink } from '../domain/retest.js';
import type { ControlledLabSources, RetestPolicy } from '../ports/controlled-sources.js';
import type { LabRepository } from '../ports/repository.js';
const p05RetestPolicy: RetestPolicy = {
  authorize: async ({ original }) => ({
    sequence: original.retestSequence + 1,
    labTestNo: `${original.labTestNo}-R${original.retestSequence + 1}`,
    templateVersionId: original.context.templateVersionId,
  }),
};
export class CreateRetestUseCase {
  constructor(
    private readonly repository: LabRepository,
    private readonly sources: ControlledLabSources,
    private readonly policy: RetestPolicy = p05RetestPolicy,
    private readonly now = () => new Date(),
  ) {}
  async execute(input: {
    actor: ActorContext;
    originalId: string;
    reason: string;
    requestId: string;
  }) {
    const original = await this.repository.get(input.originalId, input.actor);
    if (!original) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!input.reason.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!isP05Authority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
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
    const authorization = await this.policy.authorize({
      original,
      actor: input.actor,
      reason: input.reason.trim(),
    });
    const context = await this.sources.resolve(authorization.templateVersionId, input.actor);
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
      originalTestId: original.id,
      retestSequence: authorization.sequence,
      retestReason: input.reason.trim(),
      createdAt: at,
      updatedAt: at,
      submittedAt: null,
      reviewStartedAt: null,
      approvedAt: null,
    };
    assertRetestLink(original, next);
    return this.repository.create(next, {
      actor: input.actor,
      requestId: input.requestId,
      action: 'CREATE_RETEST',
    });
  }
}
