import { AppError } from '../../../../shared/errors/app-error.js';

export const TEMPLATE_VERSION_STATES = [
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'STOPPED',
  'VOID',
  'SUPERSEDED',
] as const;
export type TemplateVersionState = (typeof TEMPLATE_VERSION_STATES)[number];

export type TemplateVersionAction = 'REVIEW' | 'APPROVE' | 'STOP' | 'VOID' | 'SUPERSEDE';

const transitions: Record<
  TemplateVersionState,
  Partial<Record<TemplateVersionAction, TemplateVersionState>>
> = {
  DRAFT: { REVIEW: 'UNDER_REVIEW', APPROVE: 'APPROVED', VOID: 'VOID' },
  UNDER_REVIEW: { APPROVE: 'APPROVED', VOID: 'VOID' },
  APPROVED: { STOP: 'STOPPED', VOID: 'VOID', SUPERSEDE: 'SUPERSEDED' },
  STOPPED: { VOID: 'VOID', SUPERSEDE: 'SUPERSEDED' },
  VOID: {},
  SUPERSEDED: {},
};

export const TEMPLATE_TRANSITION_IDS: Record<string, string> = {
  'DRAFT:REVIEW:UNDER_REVIEW': 'TR-TMPL-002',
  'DRAFT:APPROVE:APPROVED': 'TR-TMPL-003',
  'UNDER_REVIEW:APPROVE:APPROVED': 'TR-TMPL-003',
  'APPROVED:STOP:STOPPED': 'TR-TMPL-004',
  'DRAFT:VOID:VOID': 'TR-TMPL-005',
  'UNDER_REVIEW:VOID:VOID': 'TR-TMPL-005',
  'APPROVED:VOID:VOID': 'TR-TMPL-005',
  'STOPPED:VOID:VOID': 'TR-TMPL-005',
  'APPROVED:SUPERSEDE:SUPERSEDED': 'TR-TMPL-006',
  'STOPPED:SUPERSEDE:SUPERSEDED': 'TR-TMPL-006',
};

export function transitionTemplateVersion(
  state: TemplateVersionState,
  action: TemplateVersionAction,
): TemplateVersionState {
  const next = transitions[state]?.[action];
  if (!next) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  return next;
}

export function transitionIdFor(from: TemplateVersionState, action: TemplateVersionAction): string {
  const to = transitionTemplateVersion(from, action);
  return TEMPLATE_TRANSITION_IDS[`${from}:${action}:${to}`] ?? 'TR-TMPL-000';
}

export function requireTemplateReason(action: TemplateVersionAction, reason?: string): void {
  if ((action === 'STOP' || action === 'VOID' || action === 'SUPERSEDE') && !reason?.trim()) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
}
