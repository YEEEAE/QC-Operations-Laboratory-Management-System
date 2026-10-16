/** Accessible presentation of existing constraints, never a validation policy. */
type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
let sequence = 0;

export function createValidationFeedback(form: HTMLFormElement) {
  const owned = new Map<Field, { error: HTMLElement; invalid: string | null }>();
  let summary: HTMLElement | undefined;
  const clear = () => {
    summary?.remove();
    summary = undefined;
    for (const [field, previous] of owned) {
      const tokens = (field.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((token) => token && token !== previous.error.id);
      if (tokens.length) field.setAttribute('aria-describedby', tokens.join(' '));
      else field.removeAttribute('aria-describedby');
      if (field.getAttribute('aria-invalid') === 'true') {
        if (previous.invalid === null) field.removeAttribute('aria-invalid');
        else field.setAttribute('aria-invalid', previous.invalid);
      }
      previous.error.remove();
    }
    owned.clear();
  };
  const show = (serverError?: unknown) => {
    clear();
    // Astro ActionInputError exposes field errors as string arrays. Do not
    // infer field mappings from opaque domain messages or nested payloads.
    const fields =
      typeof serverError === 'object' && serverError !== null
        ? (serverError as { fields?: unknown }).fields
        : undefined;
    const errors: Array<{ field: Field; message: string }> = [];
    for (const element of Array.from(form.elements)) {
      if (
        !(
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
        ) ||
        !element.willValidate
      )
        continue;
      const messages =
        typeof fields === 'object' &&
        fields !== null &&
        Object.prototype.hasOwnProperty.call(fields, element.name)
          ? (fields as Record<string, unknown>)[element.name]
          : undefined;
      const message = !element.validity.valid
        ? element.validationMessage
        : Array.isArray(messages)
          ? messages
              .filter(
                (value): value is string => typeof value === 'string' && value.trim().length > 0,
              )
              .join(' ')
          : '';
      if (message) errors.push({ field: element, message });
    }
    if (!errors.length) return false;
    summary = document.createElement('div');
    summary.className = 'form-error-summary';
    summary.setAttribute('role', 'alert');
    summary.setAttribute('tabindex', '-1');
    const heading = document.createElement('p');
    heading.textContent = 'Check the following fields.';
    summary.append(heading);
    const list = document.createElement('ul');
    for (const { field, message } of errors) {
      const error = document.createElement('p');
      error.id = `form-validation-${++sequence}`;
      while (document.getElementById(error.id)) error.id = `form-validation-${++sequence}`;
      error.className = 'field-error';
      error.textContent = message;
      owned.set(field, { error, invalid: field.getAttribute('aria-invalid') });
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute(
        'aria-describedby',
        [field.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '),
      );
      field.insertAdjacentElement('afterend', error);
      // Point at the owned error rather than assigning/changing authored IDs.
      const link = document.createElement('a');
      link.href = `#${error.id}`;
      const label =
        field.labels?.[0]?.textContent?.trim() || field.getAttribute('aria-label') || field.name;
      link.textContent = label ? `${label}: ${message}` : message;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        field.focus();
      });
      const item = document.createElement('li');
      item.append(link);
      list.append(item);
    }
    summary.append(list);
    form.prepend(summary);
    errors[0]?.field.focus();
    return true;
  };
  return { clear, show };
}
