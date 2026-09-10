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
        output.textContent = copy[failureState];
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
