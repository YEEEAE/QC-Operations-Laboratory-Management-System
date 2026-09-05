/**
 * Get AI Advisory use case.
 *
 * Advisory-only boundary (DOMAIN-MAP.md section 27, RISK-030):
 * - Authorization is re-checked server-side per mode; a prompt can never
 *   grant authority (prompt injection is untrusted content, not authz).
 * - Data is minimized: only the bounded question and explicitly provided
 *   authorized context segments leave the process, and secret-like material
 *   is refused before any provider call (SECURITY-ARCHITECTURE.md 156-158).
 * - Provider failures degrade the advisory capability only; they never
 *   propagate to core workflows and never surface raw infrastructure errors
 *   (OBSERVABILITY-ARCHITECTURE.md section 47).
 * - No prompt, response, or controlled content is written to any log here.
 */
import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import {
  parseProviderAdvisory,
  ADVISORY_NOTICE,
  ADVISORY_REFUSAL_NOTICE,
  ADVISORY_UNAVAILABLE_NOTICE,
  isAdvisoryMode,
  type AdvisoryMode,
  type AdvisoryResponse,
} from '../domain/advisory-response.js';
import type { AiProvider, AdvisoryContextSegment } from '../ports/ai-provider.js';

export const MAX_ADVISORY_QUESTION_LENGTH = 4000;
export const MAX_ADVISORY_CONTEXT_SEGMENTS = 10;
export const MAX_ADVISORY_CONTEXT_CONTENT_LENGTH = 4000;
export const MAX_ADVISORY_CONTEXT_LABEL_LENGTH = 120;

const MODE_PERMISSION: Record<AdvisoryMode, PermissionCode> = {
  SUMMARIZE: 'PERM-AI-SUMMARIZE',
  SUGGEST: 'PERM-AI-SUGGEST',
  DRAFT: 'PERM-AI-DRAFT',
};

const SECRET_LIKE_PATTERN =
  /(-----BEGIN [A-Z ]*PRIVATE KEY-----|bearer\s+[A-Za-z0-9._~-]+|\bpassword\b\s*[:=]|\bpasswd\b\s*[:=]|\bapi[_-]?key\b\s*[:=]|\bsecret\b\s*[:=]|\b(access[_-]?)?token\b\s*[:=]|authorization\s*[:=]|database[_-]?url\s*[:=]|postgres(ql)?:\/\/[^\s@]+:[^\s@]+@|\bsk-[A-Za-z0-9]{16,})/i;

export type AdvisoryOutcome = 'AVAILABLE' | 'UNAVAILABLE' | 'REFUSED';

export interface GetAdvisoryResult {
  status: AdvisoryOutcome;
  message: string;
  advisoryNotice: string;
  advisory?: AdvisoryResponse;
}

export interface GetAdvisoryInput {
  actor: ActorContext;
  mode: AdvisoryMode;
  question: string;
  context: readonly AdvisoryContextSegment[];
  requestId: string;
}

function authorizeAdvisory(actor: ActorContext, mode: AdvisoryMode): void {
  authorize(
    {
      actor,
      permission: 'PERM-AI-USE',
      action: 'USE',
      entity: { type: 'AI_ADVISORY', id: 'advisory', state: 'ACTIVE', domain: 'AI_ADVISORY' },
      scope: { domain: 'AI_ADVISORY' },
      currentVersion: 1n,
      expectedVersion: 1n,
      businessCondition: true,
    },
    { throwOnDeny: true },
  );
  authorize(
    {
      actor,
      permission: MODE_PERMISSION[mode],
      action: mode,
      entity: { type: 'AI_ADVISORY', id: 'advisory', state: 'ACTIVE', domain: 'AI_ADVISORY' },
      scope: { domain: 'AI_ADVISORY' },
      currentVersion: 1n,
      expectedVersion: 1n,
      businessCondition: true,
    },
    { throwOnDeny: true },
  );
}

function validateInput(question: string, context: readonly AdvisoryContextSegment[]): void {
  if (typeof question !== 'string' || question.trim().length === 0 || question.length > MAX_ADVISORY_QUESTION_LENGTH) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (context.length > MAX_ADVISORY_CONTEXT_SEGMENTS) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  for (const segment of context) {
    if (
      typeof segment?.label !== 'string' ||
      segment.label.length === 0 ||
      segment.label.length > MAX_ADVISORY_CONTEXT_LABEL_LENGTH ||
      typeof segment?.content !== 'string' ||
      segment.content.length === 0 ||
      segment.content.length > MAX_ADVISORY_CONTEXT_CONTENT_LENGTH
    ) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    }
  }
}

function refuseSecretLikeMaterial(question: string, context: readonly AdvisoryContextSegment[]): void {
  if (SECRET_LIKE_PATTERN.test(question)) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  for (const segment of context) {
    if (SECRET_LIKE_PATTERN.test(segment.label) || SECRET_LIKE_PATTERN.test(segment.content)) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    }
  }
}

export class GetAdvisoryUseCase {
  constructor(private readonly provider: AiProvider) {}

  async execute(input: GetAdvisoryInput): Promise<GetAdvisoryResult> {
    if (!isAdvisoryMode(input.mode)) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    }
    authorizeAdvisory(input.actor, input.mode);
    validateInput(input.question, input.context);
    refuseSecretLikeMaterial(input.question, input.context);

    let availability;
    try {
      availability = await this.provider.availability();
    } catch {
      availability = { available: false as const, reason: 'UNAVAILABLE' as const };
    }
    if (!availability.available) {
      return { status: 'UNAVAILABLE', message: ADVISORY_UNAVAILABLE_NOTICE, advisoryNotice: ADVISORY_NOTICE };
    }

    let raw: unknown;
    try {
      raw = await this.provider.complete({
        mode: input.mode,
        question: input.question,
        context: input.context,
      });
    } catch {
      return { status: 'UNAVAILABLE', message: ADVISORY_UNAVAILABLE_NOTICE, advisoryNotice: ADVISORY_NOTICE };
    }

    let advisoryText: string;
    try {
      advisoryText = parseProviderAdvisory(raw).text;
    } catch {
      return { status: 'REFUSED', message: ADVISORY_REFUSAL_NOTICE, advisoryNotice: ADVISORY_NOTICE };
    }

    return {
      status: 'AVAILABLE',
      message: ADVISORY_NOTICE,
      advisoryNotice: ADVISORY_NOTICE,
      advisory: { mode: input.mode, text: advisoryText },
    };
  }
}
