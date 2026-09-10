import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { isTemplateAuthority } from '../domain/template-policy.js';
import type { TemplateRepository } from '../ports/repository.js';
import type { TemplateCeremony } from './template-ceremony.js';

export class ReviewTemplateUseCase {
  constructor(private readonly repository: TemplateRepository) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    requestId: string;
  }) {
    // Idempotent replay: a prior transition under this request id returns the
    // current record after a view check, without re-evaluating the
    // state-dependent business condition.
    const replay = await this.repository.findReplay(input.requestId, input.id);
    if (replay) {
      const visible = await this.repository.get(input.id, input.actor);
      if (!visible) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      return replay;
    }
    const current = await this.repository.get(input.id, input.actor);
    if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    // P-06: Employee must never review. Only the three authorities may review.
    if (!isTemplateAuthority(input.actor)) {
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    }
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'REVIEW',
        entity: {
          type: 'INSPECTION_TEMPLATE_VERSION',
          id: current.id,
          state: current.state,
          authorId: current.authorId,
          executorId: current.authorId,
        },
        scope: {},
        currentVersion: current.version,
        expectedVersion: input.expectedVersion,
        // Template-only SoD exception: reviewer may also be approver, and an
        // authority may review their own template. No self-review denial here.
        businessCondition: current.state === 'DRAFT',
      },
      { throwOnDeny: true },
    );
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'REVIEW',
      requestId: input.requestId,
    });
  }
}

export class ApproveTemplateUseCase {
  constructor(
    private readonly repository: TemplateRepository,
    private readonly ceremony: TemplateCeremony,
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reauthenticationSecret?: string;
    requestId: string;
  }) {
    const replay = await this.repository.findReplay(input.requestId, input.id);
    if (replay) {
      const visible = await this.repository.get(input.id, input.actor);
      if (!visible) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      return replay;
    }
    const current = await this.repository.get(input.id, input.actor);
    if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isTemplateAuthority(input.actor)) {
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    }
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'APPROVE',
        entity: {
          type: 'INSPECTION_TEMPLATE_VERSION',
          id: current.id,
          state: current.state,
          authorId: current.authorId,
          executorId: current.authorId,
        },
        scope: {},
        currentVersion: current.version,
        expectedVersion: input.expectedVersion,
        businessCondition: current.state === 'DRAFT' || current.state === 'UNDER_REVIEW',
      },
      { throwOnDeny: true },
    );
    const signatureId = await this.ceremony.verifySignature({
      actor: input.actor,
      subjectId: current.id,
      subjectVersion: input.expectedVersion,
      action: 'APPROVE',
      meaning: `Approve inspection template ${current.templateCode} ${current.versionNo}`,
      snapshotHash: `template:${current.id}:v${input.expectedVersion}`,
      reauthenticationSecret: input.reauthenticationSecret ?? '',
      requestId: input.requestId,
    });
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'APPROVE',
      requestId: input.requestId,
      signatureId,
    });
  }
}

export class StopTemplateUseCase {
  constructor(
    private readonly repository: TemplateRepository,
    private readonly ceremony: TemplateCeremony,
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reason: string;
    reauthenticationSecret?: string;
    requestId: string;
  }) {
    const replay = await this.repository.findReplay(input.requestId, input.id);
    if (replay) {
      const visible = await this.repository.get(input.id, input.actor);
      if (!visible) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      return replay;
    }
    const current = await this.repository.get(input.id, input.actor);
    if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isTemplateAuthority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!input.reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'STOP',
        entity: { type: 'INSPECTION_TEMPLATE_VERSION', id: current.id, state: current.state },
        scope: {},
        currentVersion: current.version,
        expectedVersion: input.expectedVersion,
        businessCondition: current.state === 'APPROVED',
      },
      { throwOnDeny: true },
    );
    const signatureId = await this.ceremony.verifySignature({
      actor: input.actor,
      subjectId: current.id,
      subjectVersion: input.expectedVersion,
      action: 'STOP',
      meaning: `Stop inspection template ${current.templateCode} ${current.versionNo}`,
      snapshotHash: `template:${current.id}:v${input.expectedVersion}`,
      reason: input.reason,
      reauthenticationSecret: input.reauthenticationSecret ?? '',
      requestId: input.requestId,
    });
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'STOP',
      reason: input.reason,
      requestId: input.requestId,
      signatureId,
    });
  }
}

export class VoidTemplateUseCase {
  constructor(
    private readonly repository: TemplateRepository,
    private readonly ceremony: TemplateCeremony,
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reason: string;
    reauthenticationSecret?: string;
    requestId: string;
  }) {
    const replay = await this.repository.findReplay(input.requestId, input.id);
    if (replay) {
      const visible = await this.repository.get(input.id, input.actor);
      if (!visible) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      return replay;
    }
    const current = await this.repository.get(input.id, input.actor);
    if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isTemplateAuthority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!input.reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'VOID',
        entity: { type: 'INSPECTION_TEMPLATE_VERSION', id: current.id, state: current.state },
        scope: {},
        currentVersion: current.version,
        expectedVersion: input.expectedVersion,
        businessCondition:
          current.state === 'DRAFT' ||
          current.state === 'UNDER_REVIEW' ||
          current.state === 'APPROVED' ||
          current.state === 'STOPPED',
      },
      { throwOnDeny: true },
    );
    const signatureId = await this.ceremony.verifySignature({
      actor: input.actor,
      subjectId: current.id,
      subjectVersion: input.expectedVersion,
      action: 'VOID',
      meaning: `Void inspection template ${current.templateCode} ${current.versionNo}`,
      snapshotHash: `template:${current.id}:v${input.expectedVersion}`,
      reason: input.reason,
      reauthenticationSecret: input.reauthenticationSecret ?? '',
      requestId: input.requestId,
    });
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'VOID',
      reason: input.reason,
      requestId: input.requestId,
      signatureId,
    });
  }
}

export class SupersedeTemplateUseCase {
  constructor(
    private readonly repository: TemplateRepository,
    private readonly ceremony: TemplateCeremony,
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reason: string;
    reauthenticationSecret?: string;
    requestId: string;
  }) {
    const replay = await this.repository.findReplay(input.requestId, input.id);
    if (replay) {
      const visible = await this.repository.get(input.id, input.actor);
      if (!visible) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      return replay;
    }
    const current = await this.repository.get(input.id, input.actor);
    if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isTemplateAuthority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!input.reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'SUPERSEDE',
        entity: { type: 'INSPECTION_TEMPLATE_VERSION', id: current.id, state: current.state },
        scope: {},
        currentVersion: current.version,
        expectedVersion: input.expectedVersion,
        businessCondition: current.state === 'APPROVED' || current.state === 'STOPPED',
      },
      { throwOnDeny: true },
    );
    const signatureId = await this.ceremony.verifySignature({
      actor: input.actor,
      subjectId: current.id,
      subjectVersion: input.expectedVersion,
      action: 'SUPERSEDE',
      meaning: `Supersede inspection template ${current.templateCode} ${current.versionNo}`,
      snapshotHash: `template:${current.id}:v${input.expectedVersion}`,
      reason: input.reason,
      reauthenticationSecret: input.reauthenticationSecret ?? '',
      requestId: input.requestId,
    });
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'SUPERSEDE',
      reason: input.reason,
      requestId: input.requestId,
      signatureId,
    });
  }
}
