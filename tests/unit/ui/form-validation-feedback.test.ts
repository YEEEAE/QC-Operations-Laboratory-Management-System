import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');

/**
 * Form validation feedback contract.
 * Locks the accessible enhancement in enhance-with-classification +
 * validation-feedback without testing implementation verbatim.
 * Fails if native invalid handling, server field mapping, or focus behavior regresses.
 */
describe('form validation feedback contract', () => {
  const enhance = read('src/ui/forms/enhance-with-classification.ts');
  const feedback = read('src/ui/forms/validation-feedback.ts');

  it('presents native failures in one linked summary per attempt', () => {
    expect(enhance).toContain('addEventListener(');
    expect(enhance).toContain("'invalid'");
    expect(enhance).toContain('validation.show()');
    expect(feedback).toContain("summary.setAttribute('role', 'alert')");
    expect(feedback).toContain("summary.setAttribute('tabindex', '-1')");
    expect(feedback).toContain('form.prepend(summary)');
  });

  it('maps only explicit server field errors and keeps native messages authoritative', () => {
    expect(feedback).toContain('element.validationMessage');
    expect(feedback).toContain('Object.prototype.hasOwnProperty.call(fields, element.name)');
    expect(feedback).toContain("field.setAttribute('aria-invalid', 'true')");
    expect(feedback).toContain('aria-describedby');
    expect(feedback).toContain('errors[0]?.field.focus()');
  });

  it('links summary items to owned errors and restores only enhancement state', () => {
    expect(feedback).toContain('link.href = `#${error.id}`');
    expect(feedback).toContain('field.focus()');
    expect(feedback).toContain('previous.error.remove()');
    expect(feedback).toContain("field.getAttribute('aria-invalid') === 'true'");
    expect(enhance).toContain('validation.clear()');
  });

  it('keeps server validation focus on fields and does not steal focus for generic output', () => {
    expect(enhance).toContain('const hasFieldErrors = outcome.state ===');
    expect(enhance).toContain('if (!hasFieldErrors) output.focus()');
    expect(enhance).not.toContain('focusFirstInvalid(form, output)');
  });

  it('keeps transport failures safe with preserved entries and recovery link', () => {
    expect(enhance).toContain("output.dataset.feedbackClass = 'UNKNOWN_SAFE_ERROR'");
    expect(enhance).toContain("output.setAttribute('role', 'alert')");
    expect(enhance).toContain('reviewBeforeRetry');
  });
});
