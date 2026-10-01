import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexPage = readFileSync('src/pages/approvals/index.astro', 'utf8');
const detailPage = readFileSync('src/pages/approvals/[approvalId].astro', 'utf8');

describe('approval decision capability presentation', () => {
  it('keeps the unresolved policy visible even when the assigned queue is empty', () => {
    expect(indexPage).toContain("approvalReads.decisionPolicyStatus === 'UNRESOLVED'");
    expect(indexPage).toContain('Decision signing policy unresolved');
    expect(indexPage).toContain('Contact the QMS signature-policy owner');
    expect(indexPage).toContain('this empty list is not evidence that decisions are available');
    expect(indexPage).toContain("capability.state === 'POLICY_BLOCKED'");
  });

  it('renders only available wired decisions and no password field when policy is blocked', () => {
    expect(detailPage).toContain(
      "approval?.decisionCapabilities.filter((capability) => capability.state === 'AVAILABLE')",
    );
    expect(detailPage).toContain('{availableDecisions.map((capability) => <option');
    expect(detailPage).toContain('blocked before reauthentication');
    expect(detailPage).toContain('no password field or decision control is available');
    expect(detailPage).not.toContain('<option value="RETURN">');
    expect(detailPage).not.toContain('<option value="REJECT">');
  });
});
