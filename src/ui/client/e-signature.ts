export function initESignatureForms(root: ParentNode = document) {
  root.querySelectorAll<HTMLFormElement>('[data-e-signature-form]').forEach((form) =>
    form.addEventListener('submit', () => {
      // Reauthentication secret travels with the form natively; no client-side
      // mutation is allowed here.
    }),
  );
}
if (typeof document !== 'undefined')
  document.addEventListener('DOMContentLoaded', () => initESignatureForms());
