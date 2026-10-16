import { createHash } from 'node:crypto';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { stableJson } from '../../../../shared/json/stable-stringify.js';
import { controlledFormSchema } from '../../catalog/domain/controlled-form.js';
import type { TemplateAuthoringOrigin } from '../domain/template.js';
import type { TemplateRepository } from '../ports/repository.js';
import type { CreateTemplateUseCase } from './create-template.js';

/**
 * Create a template identity and its first DRAFT version from in-system
 * authoring rather than from a controlled catalogue transcription.
 *
 * This use case never approves: `CreateTemplateUseCase` is called with the
 * authored origin, which forces the DRAFT path regardless of the actor's P-06
 * authority. An empty authored template must not be able to become effective.
 */
export class CreateAuthoredTemplateUseCase {
  constructor(private readonly create: CreateTemplateUseCase) {}

  async execute(input: {
    actor: ActorContext;
    templateCode: string;
    versionNo: string;
    name: string;
    description?: string;
    requestId: string;
  }) {
    const templateCode = input.templateCode.trim();
    // A controlled document code is an operator-supplied identifier. No
    // numbering rule is defined in the project, so none is generated here.
    if (!templateCode || templateCode.length > 64)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.create.execute({
      actor: input.actor,
      templateCode,
      versionNo: input.versionNo,
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
      draftOnly: true,
      authoringOrigin: 'USER_AUTHORED_SPECIFICATION',
      requestId: input.requestId,
    });
  }
}

/**
 * Starting point for a new authored design. It is intentionally minimal and
 * contains no invented inspection requirements: the author supplies every
 * requirement, and the server rejects an empty or incomplete design.
 */
export function starterAuthoredDesign(input: {
  templateCode: string;
  versionNo: string;
  name: string;
}): Record<string, unknown> {
  return {
    schemaVersion: 2,
    docCode: input.templateCode,
    reportRevision: input.versionNo,
    sourceTitle: input.name,
    sourceDate: null,
    headerFields: [],
    sections: [],
    aqlFields: [],
    resultVocabulary: 'PASS_FAIL_REMARK_NA',
    finalDisposition: [],
    reviewResponsibilities: [],
  };
}

/**
 * Save the controlled design of a DRAFT template version.
 *
 * Authoring is a DRAFT-only operation. Every accepted save produces a new
 * server-computed content hash over the canonical JSON of the design, so the
 * approved revision can never be silently re-interpreted afterwards.
 */
export class SaveTemplateDraftDesignUseCase {
  constructor(private readonly repository: TemplateRepository) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    design: unknown;
    requestId: string;
  }) {
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!input.actor.permissions.some((p) => p.code === 'PERM-ADM-TEMPLATES'))
      throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });

    const current = await this.repository.get(input.id, input.actor);
    if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (current.state !== 'DRAFT')
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });

    const parsed = controlledFormSchema.safeParse(input.design);
    if (!parsed.success) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const design = parsed.data;

    // The design is the controlled content of this exact version: its document
    // code and report revision may not drift from the record that carries them.
    if (design.docCode.trim() !== current.templateCode)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (design.reportRevision.trim() !== current.versionNo)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    // A transcription is a digital copy of the paper form and keeps the narrow
    // v1 vocabulary. Authoring-only field semantics belong to authored specs.
    if (current.authoringOrigin === 'SOURCE_TRANSCRIPTION' && design.schemaVersion !== 1)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });

    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-TEMPLATES',
        action: 'EDIT',
        entity: { type: 'INSPECTION_TEMPLATE_VERSION', id: current.id, state: current.state },
        scope: {},
        currentVersion: current.version,
        expectedVersion: input.expectedVersion,
        businessCondition: current.state === 'DRAFT',
      },
      { throwOnDeny: true },
    );

    const contentHash = createHash('sha256').update(stableJson(design)).digest('hex');
    const authoringOrigin: TemplateAuthoringOrigin = current.authoringOrigin;
    return this.repository.saveDesign({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      design,
      contentHash,
      reportRevision: design.reportRevision.trim(),
      authoringOrigin,
      requestId: input.requestId,
    });
  }
}
