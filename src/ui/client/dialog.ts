export function initDialogs(root: ParentNode = document) {
  const dialogs = root.querySelectorAll<HTMLDialogElement>('[data-dialog]');
  dialogs.forEach((dialog) => {
    if (dialog.dataset.dialogEnhanced === 'true') return;
    dialog.dataset.dialogEnhanced = 'true';
    let opener: HTMLElement | null = null;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';
    const focusDialog = () => {
      const initialFocus =
        dialog.querySelector<HTMLElement>('[autofocus]:not([disabled])') ??
        dialog.querySelector<HTMLElement>(focusableSelector) ??
        dialog.querySelector<HTMLElement>('[data-dialog-title]') ??
        dialog;
      initialFocus.focus();
    };
    const open = (button: HTMLElement) => {
      if (dialog.open) return;
      opener = button;
      dialog.showModal();
      focusDialog();
    };
    root.querySelectorAll<HTMLElement>(`[data-dialog-open="${dialog.id}"]`).forEach((button) =>
      button.addEventListener('click', () => open(button)),
    );
    dialog.querySelectorAll<HTMLElement>('[data-dialog-close]').forEach((button) =>
      button.addEventListener('click', () => dialog.close('cancel')),
    );
    dialog.addEventListener('cancel', () => {
      // Native <dialog> already provides Escape handling and focus trapping.
      // Keep this listener for a stable cancellation contract and focus return.
      dialog.returnValue = 'cancel';
    });
    dialog.addEventListener('close', () => {
      const previousOpener = opener;
      opener = null;
      if (previousOpener?.isConnected) previousOpener.focus();
    });
  });
}
if (typeof document !== 'undefined')
  document.addEventListener('DOMContentLoaded', () => initDialogs());
