import type { AuthorizationDecision, DenialCode } from './types';
export const allow = (): AuthorizationDecision => ({ allowed: true });
export const deny = (code: DenialCode, reason: string): AuthorizationDecision => ({
  allowed: false,
  code,
  reason,
});
