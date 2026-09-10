import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import { createTemplateVersion } from '../domain/template.js';
import { isTemplateAuthority } from '../domain/template-policy.js';
import type { TemplateRepository } from '../ports/repository.js';
import type { TemplateCeremony } from './template-ceremony.js';

export class CreateTemplateUseCase {
  constructor(
    private readonly repository: TemplateRepository,
    private readonly ceremony?: TemplateCeremony,
  ) {}

  async execute(input: {
    actor: ActorContext;
    templateCode: string;
    versionNo: string;
    name: string;
    description?: string;
    contentHash?: string;
    sourceDocument?: string;
    reauthenticationSecret?: string;
    requestId: string;
  }) {
    if (input.actor.accountState !== 'ACTIVE') {
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    }
    const hasTemplatePermission = input.actor.permissions.some(
      (p) => p.code === 'PERM-ADM-TEMPLATES',
    );
    if (!hasTemplatePermission) throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    const authority = isTemplateAuthority(input.actor);
    // P-06: Employee creation produces DRAFT without a signature ceremony.
    // Authority creation produces APPROVED immediately and always requires
    // reauthentication + E-Signature.
    let signatureId: string | undefined;
    let initialState: 'DRAFT' | 'APPROVED' = 'DRAFT';
    if (authority) {
      if (!this.ceremony) throw new AppError('DOMAIN_SIGNATURE_REQUIRED', { userSafe: true });
      const id = uuidv7();
      signatureId = await this.ceremony.verifySignature({
        actor: input.actor,
        subjectId: id,
        subjectVersion: 1n,
        action: 'CREATE',
        meaning: `Approve inspection template ${input.templateCode.trim()} ${input.versionNo.trim()} on creation`,
        snapshotHash: `template:${input.templateCode.trim()}:${input.versionNo.trim()}`,
        reauthenticationSecret: input.reauthenticationSecret ?? '',
        requestId: input.requestId,
      });
      initialState = 'APPROVED';
      authorize(
        {
          actor: input.actor,
          permission: 'PERM-ADM-TEMPLATES',
          action: 'CREATE',
          entity: { type: 'INSPECTION_TEMPLATE_VERSION', id, state: 'DRAFT' },
          scope: {},
          currentVersion: 1,
          expectedVersion: 1,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
      const template = createTemplateVersion({
        id,
        templateId: uuidv7(),
        templateCode: input.templateCode,
        versionNo: input.versionNo,
        name: input.name,
        description: input.description ?? null,
        contentHash: input.contentHash ?? null,
        sourceDocument: input.sourceDocument ?? null,
        createdBy: input.actor.id,
        initialState,
        now: new Date(),
      });
      return this.repository.create({
        template,
        templateCode: input.templateCode,
        actor: input.actor,
        requestId: input.requestId,
        signatureId,
      });
    }
    const id = uuidv7();
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'CREATE',
        entity: { type: 'INSPECTION_TEMPLATE_VERSION', id, state: 'DRAFT' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const template = createTemplateVersion({
      id,
      templateId: uuidv7(),
      templateCode: input.templateCode,
      versionNo: input.versionNo,
      name: input.name,
      description: input.description ?? null,
      contentHash: input.contentHash ?? null,
      sourceDocument: input.sourceDocument ?? null,
      createdBy: input.actor.id,
      initialState,
      now: new Date(),
    });
    return this.repository.create({
      template,
      templateCode: input.templateCode,
      actor: input.actor,
      requestId: input.requestId,
      signatureId,
    });
  }
}
