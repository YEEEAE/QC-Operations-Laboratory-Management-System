export function initDialogs(root: ParentNode = document) {
  const dialogs = root.querySelectorAll<HTMLDialogElement>('[data-dialog]');
  dialogs.forEach((dialog) => {
    let opener: HTMLElement | null = null;
    root.querySelectorAll<HTMLElement>(`[data-dialog-open="${dialog.id}"]`).forEach((button) =>
      button.addEventListener('click', () => {
        opener = button;
        dialog.showModal();
        const initialFocus =
          dialog.querySelector<HTMLElement>('[autofocus]:not([disabled])') ??
          dialog.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
          );
        initialFocus?.focus();
      }),
    );
    dialog.addEventListener('close', () => opener?.focus());
  });
}
if (typeof document !== 'undefined')
  document.addEventListener('DOMContentLoaded', () => initDialogs());
