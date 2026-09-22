/**
 * QC-100-FINAL-037-B — unsaved-change navigation guard.
 *
 * Approved sources: Documents/UI-UX-SPECIFICATION §31 ("Unsaved Changes":
 * warn on leave with a Discard/Continue choice, and never prompt when there
 * are no changes) and Documents/ROUTE-MANIFEST-SPECIFICATION §136 ("Unsaved
 * Form Navigation Guard": routes with unsaved non-autosaved drafts warn
 * before navigation).
 *
 * Boundaries:
 *  - Approved editable states only: attach this guard to approved create/edit
 *    forms. Signature, approval, reauthentication, and locked/read-only
 *    record surfaces are never guard targets.
 *  - No autosave: there is no explicit supported draft contract (owning
 *    domain, authorization, version handling, retention policy), so this
 *    module never persists drafts. That decision stays POLICY-DEPENDENT
 *    through 013/026; until such a contract exists, the honest behavior is
 *    warn-before-leave, not silent client-side saving.
 *  - No sensitive data in browser storage by default: dirty tracking lives in
 *    memory only — this module touches no Web Storage, cookie, or IndexedDB
 *    API.
 *
 * The browser's native beforeunload dialog supplies the Discard/Continue
 * choice; custom text is ignored by modern browsers by design, so no copy is
 * invented here.
 */

/**
 * Event dispatched on a form right before an intentional post-commit
 * navigation, so the guard does not warn about a successful save.
 */
export const FORM_COMMITTED_EVENT = 'qc:form-committed';

/**
 * Guard one form against losing unsaved input. Idempotent via a dataset flag.
 * Returns a detach function for cleanup.
 *
 * Register this AFTER the submit enhancement: the enhancement's listener
 * preventDefaults synchronously, so the guard can tell an intercepted
 * enhanced submission (stays dirty — nothing committed yet) apart from a
 * native no-JS-path POST (intentional save attempt, navigates away).
 */
export function guardUnsavedChanges(form: HTMLFormElement): () => void {
  if (form.dataset.unsavedGuard === 'true') return () => {};
  form.dataset.unsavedGuard = 'true';

  let dirty = false;

  const markDirty = (event: Event) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      dirty = true;
    }
  };
  const markClean = () => {
    dirty = false;
  };
  const onSubmit = (event: Event) => {
    // Only a submission the enhancement did NOT intercept is a real POST.
    if (!event.defaultPrevented) dirty = false;
  };
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  };

  form.addEventListener('input', markDirty);
  form.addEventListener('change', markDirty);
  form.addEventListener('submit', onSubmit);
  form.addEventListener(FORM_COMMITTED_EVENT, markClean);
  window.addEventListener('beforeunload', onBeforeUnload);

  return () => {
    form.removeEventListener('input', markDirty);
    form.removeEventListener('change', markDirty);
    form.removeEventListener('submit', onSubmit);
    form.removeEventListener(FORM_COMMITTED_EVENT, markClean);
    window.removeEventListener('beforeunload', onBeforeUnload);
    delete form.dataset.unsavedGuard;
  };
}
