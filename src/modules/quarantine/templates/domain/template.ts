import { AppError } from '../../../../shared/errors/app-error.js';
import type { TemplateVersionAction, TemplateVersionState } from './template-state.js';
import { requireTemplateReason, transitionTemplateVersion } from './template-state.js';

export interface TemplateVersion {
  id: string;
  templateId: string;
  templateCode: string;
  versionNo: string;
  state: TemplateVersionState;
  name: string;
  description: string | null;
  contentHash: string | null;
  sourceDocument: string | null;
  createdBy: string;
  authorId: string;
  reviewerId: string | null;
  approverId: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  version: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export function validateTemplateContent(input: {
  templateCode: string;
  name: string;
  versionNo: string;
}): void {
  if (!input.templateCode.trim() || !input.name.trim() || !input.versionNo.trim()) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(input.versionNo.trim())) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
}

export function createTemplateVersion(input: {
  id: string;
  templateId: string;
  templateCode: string;
  versionNo: string;
  name: string;
  description?: string | null;
  contentHash?: string | null;
  sourceDocument?: string | null;
  createdBy: string;
  initialState: TemplateVersionState;
  now: Date;
}): TemplateVersion {
  validateTemplateContent({
    templateCode: input.templateCode,
    name: input.name,
    versionNo: input.versionNo,
  });
  if (input.initialState !== 'DRAFT' && input.initialState !== 'APPROVED') {
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  }
  return {
    id: input.id,
    templateId: input.templateId,
    templateCode: input.templateCode.trim(),
    versionNo: input.versionNo.trim(),
    state: input.initialState,
    name: input.name.trim(),
    description: input.description?.trim() ? input.description.trim() : null,
    contentHash: input.contentHash?.trim() ? input.contentHash.trim() : null,
    sourceDocument: input.sourceDocument?.trim() ? input.sourceDocument.trim() : null,
    createdBy: input.createdBy,
    authorId: input.createdBy,
    reviewerId: null,
    approverId: null,
    approvedAt: input.initialState === 'APPROVED' ? input.now : null,
    approvedBy: input.initialState === 'APPROVED' ? input.createdBy : null,
    version: 1n,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function applyTemplateVersionAction(
  current: TemplateVersion,
  action: TemplateVersionAction,
  actorId: string,
  reason?: string,
  now: Date = new Date(),
): TemplateVersion {
  requireTemplateReason(action, reason);
  const next = transitionTemplateVersion(current.state, action);
  // Approved content is never edited in place: this helper only moves state.
  return {
    ...current,
    state: next,
    ...(action === 'REVIEW' ? { reviewerId: actorId } : {}),
    ...(action === 'APPROVE' ? { approverId: actorId, approvedBy: actorId, approvedAt: now } : {}),
    updatedAt: now,
  };
}
