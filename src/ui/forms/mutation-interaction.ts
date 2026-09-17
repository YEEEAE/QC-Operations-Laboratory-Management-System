/**
 * Shared async mutation interaction contract (presentation only).
 * States: IDLE SUBMITTING SUCCESS VALIDATION_ERROR CONFLICT_STALE
 *   AUTHORIZATION_CHANGED DEPENDENCY_UNAVAILABLE UNKNOWN_SAFE_ERROR
 * During SUBMITTING: disable ONLY the triggering submit, set
 * aria-busy on the form, write progress text to [data-result],
 * guard duplicates. Never clears input. No-JS POST stays valid.
 */
export type MutationState =
  | 'IDLE'
  | 'SUBMITTING'
  | 'SUCCESS'
  | 'VALIDATION_ERROR'
  | 'CONFLICT_STALE'
  | 'DUPLICATE_COMMAND'
  | 'AUTHORIZATION_CHANGED'
  | 'DEPENDENCY_UNAVAILABLE'
  | 'UNKNOWN_SAFE_ERROR';

export interface MutationOutcome {
  state: MutationState;
  recordId?: string;
}

function messageOf(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const r = error as { message?: unknown; code?: unknown };
  const parts: string[] = [];
  if (typeof r.message === 'string') parts.push(r.message);
  if (typeof r.code === 'string') parts.push(r.code);
  return parts.join(' ').toLowerCase();
}

/**
 * Recover the exact application error code from an Action failure.
 *
 * Admin actions carry the canonical `ErrorCode` as the Action message (for
 * example `CONFLICT_STALE_VERSION`) and other surfaces carry the default
 * message key (`errors.conflict_stale_version`). Both are recognized so the
 * classification is deterministic instead of regex guesswork.
 */
export function appErrorCodeOf(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const message = (error as { message?: unknown }).message;
  if (typeof message !== 'string') return undefined;
  const direct = message.trim();
  if (/^[A-Z][A-Z0-9_]{2,}$/.test(direct)) return direct;
  const keyed = /^errors\.([a-z0-9_]+)$/.exec(direct.trim().toLowerCase());
  return keyed ? keyed[1]!.toUpperCase() : undefined;
}

const EXACT_CODE_STATE: Readonly<Record<string, MutationState>> = {
  AUTH_REQUIRED: 'AUTHORIZATION_CHANGED',
  AUTH_SESSION_EXPIRED: 'AUTHORIZATION_CHANGED',
  AUTH_INVALID_CREDENTIALS: 'AUTHORIZATION_CHANGED',
  AUTH_ACCOUNT_DISABLED: 'AUTHORIZATION_CHANGED',
  AUTH_SESSION_REVOKED: 'AUTHORIZATION_CHANGED',
  AUTH_REAUTH_REQUIRED: 'AUTHORIZATION_CHANGED',
  AUTHZ_DENIED: 'AUTHORIZATION_CHANGED',
  AUTHZ_SCOPE_DENIED: 'AUTHORIZATION_CHANGED',
  AUTHZ_PERMISSION_MISSING: 'AUTHORIZATION_CHANGED',
  AUTHZ_SOD_VIOLATION: 'AUTHORIZATION_CHANGED',
  VALIDATION_FAILED: 'VALIDATION_ERROR',
  VALIDATION_INVALID_UUID: 'VALIDATION_ERROR',
  VALIDATION_INVALID_DATE: 'VALIDATION_ERROR',
  VALIDATION_INVALID_QUERY: 'VALIDATION_ERROR',
  DOMAIN_INVALID_TRANSITION: 'VALIDATION_ERROR',
  DOMAIN_SIGNATURE_REQUIRED: 'VALIDATION_ERROR',
  CONFLICT_STALE_VERSION: 'CONFLICT_STALE',
  CONFLICT_DUPLICATE_COMMAND: 'DUPLICATE_COMMAND',
  RESOURCE_ALREADY_EXISTS: 'DUPLICATE_COMMAND',
  RESOURCE_NOT_FOUND: 'DEPENDENCY_UNAVAILABLE',
  SYSTEM_DATABASE_UNAVAILABLE: 'DEPENDENCY_UNAVAILABLE',
  SYSTEM_CONFIGURATION_INVALID: 'UNKNOWN_SAFE_ERROR',
  SYSTEM_INTERNAL: 'UNKNOWN_SAFE_ERROR',
};

export function classifyActionResult(
  result: { data?: unknown; error?: unknown } | null | undefined,
): MutationOutcome {
  const data = result?.data as { id?: unknown } | undefined;
  if (data && typeof data.id === 'string' && data.id.length > 0) {
    return { state: 'SUCCESS', recordId: data.id };
  }
  if (data && (typeof data !== 'object' || !('id' in (data as object)))) {
    return { state: 'SUCCESS' };
  }
  if (data && typeof data === 'object') return { state: 'SUCCESS' };
  const exact = appErrorCodeOf(result?.error);
  if (exact && EXACT_CODE_STATE[exact]) return { state: EXACT_CODE_STATE[exact]! };
  const message = messageOf(result?.error);
  if (/auth|permission|sod|denied|reauth|session|unauthorized|forbidden/i.test(message)) {
    return { state: 'AUTHORIZATION_CHANGED' };
  }
  if (/conflict|duplicate|already.exists|already_exists|stale|version/i.test(message)) {
    return { state: 'CONFLICT_STALE' };
  }
  if (/not.found|not_found|dependency|no such|does not exist|unavailable|missing/i.test(message)) {
    return { state: 'DEPENDENCY_UNAVAILABLE' };
  }
  if (/validation|invalid|required|uuid|input|format|too large|too_large|expected/i.test(message)) {
    return { state: 'VALIDATION_ERROR' };
  }
  return { state: 'UNKNOWN_SAFE_ERROR' };
}
export interface FailureCopy {
  VALIDATION_ERROR: string;
  CONFLICT_STALE: string;
  AUTHORIZATION_CHANGED: string;
  DEPENDENCY_UNAVAILABLE: string;
  UNKNOWN_SAFE_ERROR: string;
  /** Optional; falls back to the stale/conflict wording when omitted. */
  DUPLICATE_COMMAND?: string;
}

export type MutationCopy = FailureCopy;

export interface EnhanceOptions<TData> {
  form: HTMLFormElement;
  invoke: (formData: FormData) => Promise<{ data?: TData; error?: unknown }>;
  progressText: string;
  copy: MutationCopy;
  onSuccess?: (outcome: MutationOutcome, form: HTMLFormElement) => void;
}

/** Attach the contract to one form. Idempotent via dataset flag. */
export function enhanceMutationForm<TData>(options: EnhanceOptions<TData>): void {
  const { form, invoke, progressText, copy, onSuccess } = options;
  if (form.dataset.mutationEnhanced === 'true') return;
  form.dataset.mutationEnhanced = 'true';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.getAttribute('aria-busy') === 'true') return;
    const submit = form.querySelector<HTMLButtonElement>('[data-submit], button[type="submit"]');
    const output = form.querySelector<HTMLElement>('[data-result]');
    form.setAttribute('aria-busy', 'true');
    if (submit) submit.disabled = true;
    if (output) output.textContent = progressText;
    try {
      const result = await invoke(new FormData(form));
      const outcome = classifyActionResult(result);
      if (outcome.state === 'SUCCESS') {
        if (onSuccess) onSuccess(outcome, form);
        else window.location.reload();
        return;
      }
      if (output) {
        const failureState = outcome.state as keyof FailureCopy;
        output.textContent = copy[failureState] ?? copy.CONFLICT_STALE;
        if (outcome.state === 'VALIDATION_ERROR') {
          const firstInvalid = form.querySelector<HTMLElement>(
            'input:invalid, select:invalid, textarea:invalid, [aria-invalid="true"]',
          );
          (firstInvalid ?? output)?.focus?.();
        } else {
          output?.focus?.();
        }
      }
    } catch {
      if (output) {
        output.textContent = copy.UNKNOWN_SAFE_ERROR;
        output?.focus?.();
      }
    } finally {
      form.removeAttribute('aria-busy');
      if (submit) submit.disabled = false;
    }
  });
}
