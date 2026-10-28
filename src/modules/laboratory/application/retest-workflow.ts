import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { isNamedSystemOwner, isStageOneApprovalAuthority } from '../../../shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { LabRepository } from '../ports/repository.js';
import type { RetestWorkflowRepository } from '../ports/retest-workflow-repository.js';
import type { ControlledLabSources } from '../ports/controlled-sources.js';

const can = (actor: ActorContext, permission: string) => actor.permissions.some((grant) => grant.code === permission && grant.active !== false);

export class RetestWorkflowUseCase {
  constructor(private readonly tests: LabRepository, private readonly requests: RetestWorkflowRepository, private readonly sources: ControlledLabSources, private readonly now = () => new Date()) {}

  async request(input: { actor: ActorContext; originalId: string; expectedVersion: bigint; reason: string; investigation: string; requestKey: string }) {
    const original = await this.tests.get(input.originalId, input.actor);
    if (!original) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (original.originalTestId) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (original.scientificResult == null) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (original.version !== input.expectedVersion) throw new AppError('STALE_VERSION', { userSafe: true });
    if (!can(input.actor, 'PERM-LAB-CREATE')) throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    authorize({ actor: input.actor, permission: 'PERM-LAB-CREATE', action: 'CREATE',
      entity: { type: 'LAB_TEST', id: 'new-retest-request', state: 'DRAFT', authorId: input.actor.id },
      scope: { ownerId: input.actor.id }, currentVersion: 1n, expectedVersion: 1n,
      businessCondition: Boolean(input.reason.trim() && input.investigation.trim() && input.requestKey.trim()) }, { throwOnDeny: true });
    if (!original.context.methodReference.trim() || !/^[0-9a-f]{64}$/.test(original.context.contentHash))
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    return this.requests.createRequest({ id: uuidv7(), original, actor: input.actor, reason: input.reason.trim(),
      investigation: input.investigation.trim(), requestKey: input.requestKey, at: this.now() });
  }

  private async loadRequest(input: { actor: ActorContext; id: string }) {
    const request = await this.requests.getRequest(input.id);
    if (!request) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const original = await this.tests.get(request.originalTestId, input.actor);
    if (!original) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return { request, original };
  }

  async investigate(input: { actor: ActorContext; id: string; expectedVersion: bigint; investigation: string; requestKey: string }) {
    const { request } = await this.loadRequest(input);
    const requestOwner = input.actor.accountState === 'ACTIVE' && request.requesterId === input.actor.id && can(input.actor, 'PERM-LAB-CREATE');
    if (!requestOwner && !this.hasReviewGrants(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!input.investigation.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.requests.recordInvestigation({ request, actor: input.actor, expectedVersion: input.expectedVersion,
      investigation: input.investigation.trim(), requestKey: input.requestKey, at: this.now() });
  }

  async decide(input: { actor: ActorContext; id: string; expectedVersion: bigint; decision: 'APPROVED' | 'REJECTED'; reason: string; requestKey: string }) {
    const { request, original } = await this.loadRequest(input);
    if (!this.hasReviewAuthority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (original.version !== request.originalTestVersion) throw new AppError('STALE_VERSION', { userSafe: true });
    for (const permission of ['PERM-LAB-RETEST', 'PERM-LAB-AUTHORIZE-RETEST']) {
      authorize({ actor: input.actor, permission, action: 'AUTHORIZE_RETEST',
        entity: { type: 'LAB_TEST', id: original.id, state: original.state, authorId: original.authorId, executorId: original.authorId },
        scope: { ownerId: original.authorId }, currentVersion: original.version, expectedVersion: original.version,
        businessCondition: request.status === 'REQUESTED' || request.status === 'INVESTIGATING' }, { throwOnDeny: true });
    }
    if (input.decision === 'APPROVED') {
      const active = await this.sources.resolve(original.context.templateVersionId, input.actor, original.context.productCode);
      if (active.templateVersionId !== request.sourceTemplateVersionId || active.contentHash !== request.sourceContentHash ||
        active.methodReference !== request.sourceMethodReference)
        throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
      const sourceRules = active.qualificationPolicy.retestEligibility;
      if (!sourceRules || typeof sourceRules !== 'object' || Array.isArray(sourceRules))
        throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
      const rules = sourceRules as { eligibleStates?: unknown; eligibleResults?: unknown };
      if (!Array.isArray(rules.eligibleStates) || !rules.eligibleStates.includes(original.state) ||
        !Array.isArray(rules.eligibleResults) || !rules.eligibleResults.includes(original.scientificResult))
        throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    }
    if (!input.reason.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.requests.decide({ request, actor: input.actor, expectedVersion: input.expectedVersion,
      decision: input.decision, reason: input.reason.trim(), requestKey: input.requestKey, at: this.now() });
  }

  private hasReviewAuthority(actor: ActorContext) {
    return isStageOneApprovalAuthority(actor) && (isNamedSystemOwner(actor) || actor.roles.includes('SUPERVISOR'));
  }

  private hasReviewGrants(actor: ActorContext) {
    return this.hasReviewAuthority(actor) && can(actor, 'PERM-LAB-RETEST') && can(actor, 'PERM-LAB-AUTHORIZE-RETEST');
  }
}

export class GetRetestRequestUseCase {
  constructor(private readonly tests: LabRepository, private readonly requests: RetestWorkflowRepository) {}
  async execute(input: { actor: ActorContext; id: string }) {
    const request = await this.requests.getRequest(input.id);
    if (!request) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const original = await this.tests.get(request.originalTestId, input.actor);
    if (!original) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return { request, original };
  }
}
