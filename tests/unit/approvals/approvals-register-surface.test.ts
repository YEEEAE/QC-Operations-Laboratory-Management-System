import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../../../src/pages/approvals/index.astro', import.meta.url),
  'utf8',
);

describe('approvals register presentation contract', () => {
  it('keeps the existing read path, authorization context, and owner policy source', () => {
    expect(source).toContain('approvalReads.list.execute({ actor })');
    expect(source).toContain('isOwnerApprovalPath(actor)');
    expect(source).toContain('decisionCapabilities');
    expect(source).toContain('workItem.state');
    expect(source).toContain('approvalCase.subjectType');
    expect(source).toContain('approvalCase.requestedBy');
    expect(source).toContain('subject.version');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('method="post"');
    expect(source).not.toContain('expectedVersion');
    expect(source).not.toContain('requestId');
  });

  it('renders the same workload fields in the desktop table and mobile cards', () => {
    for (const field of [
      'workflowTypeLabel(item.approvalCase.workflowType)',
      'requesterLabel(item.approvalCase.requestedBy)',
      'item.subject.version.toString()',
      'stateLabel(item.workItem.state)',
      'decisionStatus(item.decisionCapabilities)',
      'decision.reason',
    ]) {
      expect(source.split(field).length - 1).toBeGreaterThanOrEqual(2);
    }
    expect(source).toContain('class="table-wrap" role="region" aria-label="Assigned approval work" tabindex="0"');
    expect(source).toContain('class="approval-cards"');
    expect(source).toContain('@media (max-width: 900px)');
    expect(source).toContain('.table-wrap { display: none; }');
    expect(source).toContain('.approval-cards { display: block; }');
  });

  it('separates the recorded work-item state from current decision availability', () => {
    expect(source).toContain('<th scope="col">Work item state</th>');
    expect(source).toContain('<th scope="col">Decision availability</th>');
    expect(source).toContain('Work item state is recorded; decision availability is recalculated');
    expect(source).toContain('<dt>Work item state</dt>');
    expect(source).toContain('<p class="decision-label">Decision availability</p>');
  });

  it('keeps long identifiers readable and controls reachable without inventing new operations', () => {
    expect(source).toContain('overflow-wrap: anywhere');
    expect(source).toContain('min-block-size: 44px');
    expect(source).toContain(':focus-visible');
    expect(source).not.toContain('text-overflow');
    expect(source).not.toContain('line-clamp');
    expect(source).not.toContain('<form');
    expect(source).not.toContain('Export');
    expect(source).not.toContain('pagination');
    expect(source).not.toContain('Clear filters');
  });

  it('preserves empty, provider, owner, and signature-policy outcomes', () => {
    expect(source).toContain('ProviderUnavailableState');
    expect(source).toContain('Approval queue is unavailable');
    expect(source).toContain('this does not mean no approvals are waiting.');
    expect(source).toContain('No assigned approval work');
    expect(source).toContain('Decision signing policy remains unresolved');
    expect(source).toContain('Some decision types still have no approved signature policy');
    expect(source).toContain('Owner-Controlled Internal Approval');
    expect(source).toContain('it is not labelled as an electronic signature');
    expect(source).toContain('Some decisions now require a signature');
  });
});
