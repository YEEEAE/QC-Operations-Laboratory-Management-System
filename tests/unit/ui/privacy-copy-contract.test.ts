import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const aiPage = readFileSync('src/pages/ai-advisory.astro', 'utf8');
const accountPage = readFileSync('src/pages/account.astro', 'utf8');
const reportPage = readFileSync('src/pages/reports/[reportCode].astro', 'utf8');

describe('privacy notice copy contracts', () => {
  it('explains actual AI processing, disabled state, and the limit of pasted-source checks', () => {
    expect(aiPage).toContain('no provider request can be sent');
    expect(aiPage).toContain('Your question and excerpt will not be sent.');
    expect(aiPage).toContain(
      'Source identity/citation is user supplied and not authenticated here.',
    );
    expect(aiPage).toContain('deletion terms');
  });

  it('explains account correction and retained history without claiming user deletion', () => {
    expect(accountPage).toContain('ask an administrator to correct it');
    expect(accountPage).toContain('does not delete account history');
  });

  it('explains that downloaded report copies leave the app controls', () => {
    expect(reportPage).toContain('download through your browser');
    expect(reportPage).toContain('not covered by its access or correction controls');
  });
});
