import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('regulated form UX contracts', () => {
  it('does not ask operators to type technical member UUIDs', () => {
    const scopes = read('src/pages/admin/scopes/index.astro');
    expect(scopes).not.toMatch(/Member ID \(UUID\)|valid member UUID|name="userId"/i);
    expect(scopes).toMatch(/Browse members/);
  });

  it('keeps approval context human-readable while retaining hidden server references', () => {
    const page = read('src/pages/approvals/[approvalId].astro');
    expect(page).toMatch(/humanSubjectType/);
    expect(page).toMatch(/humanize\(approval\.approvalCase\.workflowType\)/);
    expect(page).toMatch(/Recorded in the controlled audit trail/);
    expect(page).toMatch(/contextLabel\(key\)/);
    expect(page).toMatch(/data-submit/);
  });

  it('links inspection notes and return reasons to their labels', () => {
    const execute = read('src/pages/quarantine/inspections/[inspectionId]/execute.astro');
    const review = read('src/pages/quarantine/inspections/[inspectionId]/review.astro');
    expect(execute).toMatch(/for="inspection-notes"/);
    expect(execute).toMatch(/id="inspection-notes"/);
    expect(execute).toMatch(/data-submit>Save draft/);
    expect(review).toMatch(/for="inspection-return-reason"/);
    expect(review).toMatch(/id="inspection-return-reason"/);
  });

  it('makes approval reason dependency explicit without changing server truth', () => {
    const page = read('src/pages/approvals/[approvalId].astro');
    expect(page).toMatch(/Required when returning or rejecting/);
    expect(page).toMatch(/reason\.required = decision\.value === 'RETURN' \|\| decision\.value === 'REJECT'/);
    expect(page).toMatch(/Decision meaning, reauthentication, permission, scope, state, version, and SoD/);
  });

  it('keeps the accessible zoom-friendly viewport contract', () => {
    expect(read('src/ui/layouts/BaseLayout.astro')).toContain(
      'width=device-width, initial-scale=1',
    );
  });
});
