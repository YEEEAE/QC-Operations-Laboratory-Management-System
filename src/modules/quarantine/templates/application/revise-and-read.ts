import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { TemplateRepository } from '../ports/repository.js';

export class ReviseTemplateUseCase {
  constructor(private readonly repository: TemplateRepository) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    versionNo: string;
    name: string;
    description?: string;
    contentHash?: string;
    sourceDocument?: string;
    requestId: string;
  }) {
    const current = await this.repository.get(input.id, input.actor);
    if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    // P-06: replacement is a new revision followed by Supersede. Approved
    // content is never edited in place; this creates a new DRAFT revision.
    // Every active user with the template permission may draft the revision.
    const hasPermission = input.actor.permissions.some((p) => p.code === 'PERM-ADM-TEMPLATES');
    if (!hasPermission) throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'REVISE',
        entity: { type: 'INSPECTION_TEMPLATE_VERSION', id: current.id, state: current.state },
        scope: {},
        currentVersion: current.version,
        expectedVersion: input.expectedVersion,
        businessCondition: current.state === 'APPROVED' || current.state === 'STOPPED',
      },
      { throwOnDeny: true },
    );
    return this.repository.createRevision({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      versionNo: input.versionNo,
      name: input.name,
      description: input.description ?? null,
      contentHash: input.contentHash ?? null,
      sourceDocument: input.sourceDocument ?? null,
      requestId: input.requestId,
    });
  }
}

export class GetTemplateUseCase {
  constructor(private readonly repository: TemplateRepository) {}
  execute(input: { actor: ActorContext; id: string }) {
    return this.repository.get(input.id, input.actor);
  }
}

export class ListTemplatesUseCase {
  constructor(private readonly repository: TemplateRepository) {}
  execute(input: {
    actor: ActorContext;
    state?: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'STOPPED' | 'VOID' | 'SUPERSEDED';
  }) {
    if (input.actor.accountState !== 'ACTIVE') {
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    }
    return this.repository.list({
      actor: input.actor,
      ...(input.state ? { state: input.state } : {}),
    });
  }
}
