/**
 * QC-100-FINAL-037-A — server-derived failure states on every enhanced form.
 *
 * This shared client module attaches one submit listener to a create/mutation
 * form that:
 *
 *  1. guards duplicates and shows progress through `aria-busy` + `[data-result]`
 *     (identical to the existing per-page handlers, no behavior regression);
 *  2. invokes the Astro Action the page passes in (`invoke`);
 *  3. classifies the actual server result with the canonical
 *     `classifyActionResult` contract (`mutation-interaction.ts`);
 *  4. writes the approved vocabulary copy for that exact class
 *     (`ux-vocabulary.ts errorClasses`), so a permission denial, a stale
 *     record, a dependency outage, and a validation failure each render their
 *     own message — never one generic failure text.
 *
 * Presentation only: no business rules, no policy values, no authorization
 * logic, and no optimistic regulated outcome. The form keeps its no-JS POST
 * baseline; without JavaScript the server POST still applies and the failed
 * POST re-render carries the FormErrorSummary.
 */
import {
  classifyActionResult,
  type MutationOutcome,
  type MutationState,
} from './mutation-interaction';
import { FORM_COMMITTED_EVENT } from './unsaved-changes';
import { copy } from '../../shared/copy/ux-vocabulary';

export interface FormEnhanceConfig<TData> {
  /** The page's Astro Action call, e.g. `(payload) => actions.assets.createEquipment(payload)`. */
  invoke: (
    payload: Record<string, unknown>,
  ) => Promise<{ data?: TData; error?: unknown } | undefined>;
  /** Builds the Action input from form data (transport only). */
  payload: (data: FormData) => Record<string, unknown>;
  /** Progress copy written to [data-result] while the action is in flight. */
  progressText: string;
  /** Detail route prefix for the created record, e.g. `/assets/equipment`. */
  detailBaseHref: string;
  /**
   * On SUCCESS the default navigates to `${detailBaseHref}/${recordId}`.
   * Provide to override only when the page needs a different behavior.
   */
  onSuccess?: (outcome: MutationOutcome, form: HTMLFormElement) => void;
}

/**
 * Focus the first invalid field the browser natively flags; otherwise focus
 * the status region so keyboard and screen-reader users land on the message.
 */
function focusFirstInvalid(form: HTMLFormElement, output: HTMLElement | null): void {
  const firstInvalid = form.querySelector<HTMLElement>(
    'select:invalid,input:invalid,textarea:invalid',
  );
  (firstInvalid ?? output)?.focus?.();
}

/**
 * Attach the classified-failure contract to one form. Idempotent via a
 * dataset flag; safe to call once per page. The status region must exist in
 * markup (`[data-result]`) so screen readers always have the live target.
 */
export function enhanceClassifiedForm<TData>(
  form: HTMLFormElement,
  config: FormEnhanceConfig<TData>,
): void {
  if (form.dataset.enhance === 'classified') return;
  form.dataset.enhance = 'classified';

  form.addEventListener('submit', async (event: Event) => {
    event.preventDefault();
    if (form.getAttribute('aria-busy') === 'true') return;

    const submit = form.querySelector<HTMLButtonElement>('[data-submit], button[type="submit"]');
    const output = form.querySelector<HTMLElement>('[data-result]');

    form.setAttribute('aria-busy', 'true');
    if (submit) submit.disabled = true;
    if (output) output.textContent = config.progressText;

    try {
      const payload = config.payload(new FormData(form));
      const result = await config.invoke(payload);
      const outcome = classifyActionResult(result);

      if (outcome.state === 'SUCCESS') {
        // The record was committed: notify unsaved-change guards before the
        // intentional navigation so they do not warn about a successful save.
        form.dispatchEvent(new CustomEvent(FORM_COMMITTED_EVENT));
        if (config.onSuccess) {
          config.onSuccess(outcome, form);
          return;
        }
        if (outcome.recordId) {
          window.location.href = `${config.detailBaseHref}/${outcome.recordId}`;
          return;
        }
        window.location.reload();
        return;
      }

      if (output) {
        const classKey = outcome.state as Exclude<MutationState, 'IDLE' | 'SUBMITTING' | 'SUCCESS'>;
        output.textContent = copy.errorClasses[classKey] ?? copy.errorClasses.UNKNOWN_SAFE_ERROR;
        if (outcome.state === 'VALIDATION_ERROR') focusFirstInvalid(form, output);
        else output?.focus?.();
      }
    } catch {
      // Transport failure: no result was received, so nothing was applied.
      // Safe-unknown vocabulary names exactly that and keeps the entries.
      if (output) {
        output.textContent = copy.errorClasses.UNKNOWN_SAFE_ERROR;
        output?.focus?.();
      }
    } finally {
      form.removeAttribute('aria-busy');
      if (submit) submit.disabled = false;
    }
  });
}
