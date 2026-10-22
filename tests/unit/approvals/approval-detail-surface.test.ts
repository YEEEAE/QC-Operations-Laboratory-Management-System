import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../../../src/pages/approvals/[approvalId].astro', import.meta.url),
  'utf8',
);

describe('approval detail presentation contract', () => {
  it('keeps the existing server read, capability projection, and owner pathway', () => {
    expect(source).toContain("approvalsReadDependencies().get.execute({ actor, approvalId");
    expect(source).toContain(
      "approval?.decisionCapabilities.filter((capability) => capability.state === 'AVAILABLE')",
    );
    expect(source).toContain(
      "approval?.decisionCapabilities.filter((capability) => capability.state === 'POLICY_BLOCKED')",
    );
    expect(source).toContain('isOwnerApprovalPath(actor)');
    expect(source).toContain('OWNER_APPROVAL_DEFERRAL');
    expect(source).not.toContain('fetch(');
  });

  it('keeps the canonical decision fields and server-derived request identity', () => {
    for (const field of ['approvalId', 'workItemId', 'subjectVersion']) {
      expect(source).toContain(`<input type="hidden" name="${field}"`);
    }
    expect(source).toContain('<form method="post" data-approval-decision>');
    expect(source).toContain('actions.approvals.decide({');
    // requestId is derived from the request context by the action, never
    // accepted as a browser-supplied form field.
    expect(source).not.toContain('name="requestId"');
    expect(source).not.toContain('name="ownerId"');
    expect(source).not.toContain('name="ownerAuthority"');
  });

  it('separates read-only facts, evidence, history, relations, and the current action', () => {
    for (const anchor of [
      '<h2 id="facts-title">Recorded facts</h2>',
      '<h2 id="context-title">Review context</h2>',
      '<h2 id="evidence-title">Evidence</h2>',
      '<h2 id="action-title">Current action</h2>',
      '<HandoffTimeline events={approvalEvents} />',
      '<JourneyContextPanel',
    ]) {
      expect(source).toContain(anchor);
    }
    expect(source).toContain('Read-only values recorded by the owning domain');
    expect(source).toContain('Recorded facts are read-only.');
    expect(source).toContain('A decision is offered only when the server resolves it');
    expect(source.indexOf('<h2 id="facts-title">')).toBeLessThan(
      source.indexOf('<h2 id="action-title">'),
    );
  });

  it('records the work item outcome separately from current availability', () => {
    expect(source).toContain('<dt>Work item</dt>');
    expect(source).toContain('<dt>Work item completed</dt>');
    expect(source).toContain('<dt>Approval case</dt>');
    expect(source).toContain('No current action');
    expect(source).toContain('No decision is available now');
    expect(source).toContain('stateLabel(approval?.workItem.state)');
    expect(source).toContain('stateLabel(approval?.approvalCase.state)');
  });

  it('describes the owner decision as an internal approval, not an electronic signature', () => {
    expect(source).toContain('Owner-Controlled Internal Approval');
    expect(source).toContain('this record is not an electronic signature');
    expect(source).toContain('no intermediate Supervisor or QCM approval is created');
    expect(source).toContain('an internal release decision never authorizes physical product release');
    expect(source).toContain('Signature ceremony deferred');
    expect(source).not.toContain('signed electronically');
    expect(source).not.toContain('electronic signature completed');
  });

  it('keeps reason, signature, pending, stale, and result feedback contracts', () => {
    expect(source).toContain('Required for Return or Reject when offered.');
    expect(source).toContain('id="reason-error" role="alert" hidden');
    expect(source).toContain("reason.required = decision.value === 'RETURN' || decision.value === 'REJECT'");
    expect(source).toContain('Re-enter your password to sign this decision');
    expect(source).toContain('data-loading-state');
    expect(source).toContain('data-stale-state');
    expect(source).toContain('data-result aria-live="polite"');
    expect(source).toContain('data-recovery');
    expect(source).toContain('StaleVersionState');
  });

  it('preserves denied, missing, and provider-unavailable outcomes', () => {
    expect(source).toContain("readState === 'denied'");
    expect(source).toContain("readState === 'missing'");
    expect(source).toContain('Astro.response.status = 403');
    expect(source).toContain('Astro.response.status = 404');
    expect(source).toContain("Cache-Control', 'no-store'");
    expect(source).toContain('providerUnavailableResponse');
    expect(source).toContain('Approval is not available to this account');
    expect(source).toContain('Approval case not found');
  });

  it('keeps the presentation floor and does not invent a second operation', () => {
    const sizes = [...source.matchAll(/font-size:\s*([^;}\n]+)/g)]
      .map((match) => match[1].trim())
      .map((value) => {
        const rem = /^(-?[0-9.]+)rem$/.exec(value);
        const px = /^(-?[0-9.]+)px$/.exec(value);
        if (rem) return Number(rem[1]) * 16;
        if (px) return Number(px[1]);
        return 12;
      });
    expect(sizes.filter((size) => size < 12)).toEqual([]);
    expect(source).toContain('min-block-size: 44px');
    expect(source).toContain(':focus-visible');
    expect(source).toContain('@media (forced-colors: active)');
    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toContain('@media print');
    expect(source).not.toMatch(/(?:margin|padding|border)-(?:left|right):/);
    expect(source).not.toMatch(/color:\s*(?:#fff\b|white\b)/i);
    expect(source).not.toContain('Export');
    expect(source).not.toContain('pagination');
  });
});
