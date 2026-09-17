/**
 * Shared dialog client for the declarative ConfirmDialog component.
 *
 * Native <dialog> + showModal() supplies the modal focus trap, the
 * accessibility tree exposure (role=dialog, aria-modal, aria-labelledby /
 * aria-describedby come from the component), and Escape handling. This module
 * adds the project contract on top:
 *
 *  - focus moves into the dialog on open,
 *  - focus returns to the exact triggering control on close,
 *  - Escape never closes mid-submission,
 *  - a confirm action can run with a pending state, a safe error region, and a
 *    stale-record refresh control.
 */
export type DialogRunResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      /** True when the failure was a stale record: reveal the refresh control. */
      stale?: boolean;
    };

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

/** Triggering control per dialog, so focus returns exactly where it left. */
const openers = new WeakMap<HTMLDialogElement, HTMLElement>();

function focusable(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** Focus the first sensible control inside the dialog (title as last resort). */
export function focusDialog(dialog: HTMLDialogElement): void {
  const explicit = dialog.querySelector<HTMLElement>('[data-dialog-autofocus]');
  const initialFocus =
    explicit ??
    dialog.querySelector<HTMLElement>('[autofocus]:not([disabled])') ??
    dialog.querySelector<HTMLElement>('[data-dialog-confirm]:not([disabled])') ??
    focusable(dialog)[0] ??
    dialog.querySelector<HTMLElement>('[data-dialog-title]') ??
    dialog;
  initialFocus?.focus();
}

export function setDialogPending(dialog: HTMLDialogElement, pending: boolean): void {
  if (pending) dialog.dataset.dialogPending = 'true';
  else delete dialog.dataset.dialogPending;
  dialog.setAttribute('aria-busy', pending ? 'true' : 'false');
  for (const control of dialog.querySelectorAll<HTMLButtonElement>('button'))
    control.disabled = pending;
  const status = dialog.querySelector<HTMLElement>('[data-dialog-status]');
  if (status) status.textContent = pending ? (dialog.dataset.dialogPendingLabel ?? 'Working…') : '';
}

export function openDialog(dialog: HTMLDialogElement, opener?: HTMLElement | null): void {
  if (dialog.open) return;
  const trigger =
    opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  if (trigger) openers.set(dialog, trigger);
  dialog.returnValue = '';
  dialog.showModal();
  focusDialog(dialog);
}

export function closeDialog(dialog: HTMLDialogElement, returnValue = 'cancel'): void {
  if (!dialog.open) return;
  dialog.close(returnValue);
}

/**
 * Bind one dialog's confirm control to an async mutation. The dialog stays open
 * while the request is in flight, reports a safe error inline on failure, and
 * only closes on success. `run` receives the dialog so it can read its own
 * inputs (for example a reason field).
 */
export function bindDialogMutation(
  dialog: HTMLDialogElement,
  run: (dialog: HTMLDialogElement) => Promise<DialogRunResult>,
): void {
  if (dialog.dataset.dialogMutationBound === 'true') return;
  dialog.dataset.dialogMutationBound = 'true';
  const confirm = dialog.querySelector<HTMLButtonElement>('[data-dialog-confirm]');
  const error = dialog.querySelector<HTMLElement>('[data-dialog-error]');
  const stale = dialog.querySelector<HTMLElement>('[data-dialog-stale]');
  stale
    ?.querySelector<HTMLButtonElement>('[data-refresh-record]')
    ?.addEventListener('click', () => window.location.reload());
  confirm?.addEventListener('click', async (event) => {
    event.preventDefault();
    if (dialog.dataset.dialogPending === 'true') return;
    if (error) error.textContent = '';
    if (stale) stale.hidden = true;
    setDialogPending(dialog, true);
    try {
      const result = await run(dialog);
      if (result.ok) {
        setDialogPending(dialog, false);
        dialog.close('confirm');
        return;
      }
      setDialogPending(dialog, false);
      if (stale) stale.hidden = !result.stale;
      if (error) {
        error.textContent = result.message;
        error.focus();
      }
    } catch {
      setDialogPending(dialog, false);
      if (error) {
        error.textContent =
          'The service is temporarily unavailable. Nothing was changed — try again.';
        error.focus();
      }
    }
  });
}

export function initDialogs(root: ParentNode = document): void {
  const dialogs = root.querySelectorAll<HTMLDialogElement>('[data-dialog]');
  dialogs.forEach((dialog) => {
    if (dialog.dataset.dialogEnhanced === 'true') return;
    dialog.dataset.dialogEnhanced = 'true';
    root
      .querySelectorAll<HTMLElement>(`[data-dialog-open="${dialog.id}"]`)
      .forEach((button) => button.addEventListener('click', () => openDialog(dialog, button)));
    dialog
      .querySelectorAll<HTMLElement>('[data-dialog-close]')
      .forEach((button) => button.addEventListener('click', () => dialog.close('cancel')));
    dialog.addEventListener('cancel', (event) => {
      // Escape must never abandon an in-flight controlled mutation.
      if (dialog.dataset.dialogPending === 'true') event.preventDefault();
      else dialog.returnValue = 'cancel';
    });
    dialog.addEventListener('close', () => {
      const previousOpener = openers.get(dialog);
      openers.delete(dialog);
      dialog.setAttribute('aria-busy', 'false');
      delete dialog.dataset.dialogPending;
      if (previousOpener?.isConnected) previousOpener.focus();
    });
  });
}
if (typeof document !== 'undefined')
  document.addEventListener('DOMContentLoaded', () => initDialogs());
