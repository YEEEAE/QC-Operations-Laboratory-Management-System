import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/ai-advisory.astro', 'utf8');

describe('AI advisory transport and recovery contract', () => {
  it('keeps no-script submission disabled and prevents question data from entering a GET URL', () => {
    expect(page).toMatch(/<form[^>]*method="post"[^>]*data-advisory-request/);
    expect(page).toContain("data-can-send-externally={canSendExternally ? 'true' : 'false'}");
    expect(page).toContain('data-request-button disabled');
    expect(page).toContain('requestButton.disabled = !externalRequestAllowed');
    expect(page).toContain(
      'if (!form || !resultEl || !requestButton || !externalRequestAllowed || requestButton.disabled) return;',
    );
  });

  it('announces pending and unavailable states and releases the busy guard after errors', () => {
    expect(page).toContain("form.setAttribute('aria-busy', 'true')");
    expect(page).toContain("resultEl.textContent = 'Requesting advisory…'");
    expect(page).toContain('catch {');
    expect(page).toContain('finally {');
    expect(page).toContain("form.removeAttribute('aria-busy')");
    expect(page).toContain('The provider timed out or was unavailable. No advisory was produced.');
    expect(page).toContain('requestOutcomeUnknown = true');
  });

  it('invalidates consent on request edits and provides copy and local-edit feedback', () => {
    expect(page).toContain("field.addEventListener('input', invalidateConsent)");
    expect(page).toContain("field.addEventListener('change', invalidateConsent)");
    expect(page).toContain('await navigator.clipboard.writeText(advisoryText)');
    expect(page).toContain("document.execCommand('copy')");
    expect(page).toContain(
      'Copy was not available. Select the advisory text below and copy it manually.',
    );
    expect(page).toContain('data-edit-locally');
    expect(page).not.toContain('data-use-draft');
    expect(page).toContain('Advisory text placed in Question for local editing only.');
  });
});
