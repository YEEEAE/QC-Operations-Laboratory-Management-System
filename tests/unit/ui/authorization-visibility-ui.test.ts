import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { navigationGroups } from '../../../src/ui/navigation/navigation';
import { addUniversalOperationalReadPermissions } from '../../../src/shared/authorization/visibility';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('authorization visibility presentation contract', () => {
  it('adds only the approved global read grants and never mutation authority', () => {
    const permissions = addUniversalOperationalReadPermissions([]).map((permission) => permission.code);
    expect(permissions).toContain('PERM-DOC-VIEW');
    expect(permissions).toContain('PERM-ADM-AUDIT-VIEW');
    expect(permissions).not.toContain('PERM-DOC-APPROVE');
    expect(permissions).not.toContain('PERM-QUAR-RELEASE');
    expect(permissions).not.toContain('PERM-HLTH-VIEW');
  });
  it('keeps only owner/admin workspaces permission-gated in primary navigation', () => {
    const gated = navigationGroups
      .flatMap((group) => group.items)
      .filter((item) => item.capability)
      .map((item) => item.href);

    expect(gated).toEqual([
      '/quarantine/admin',
      '/admin',
      '/admin/users',
      '/admin/roles',
      '/admin/permissions',
      '/admin/scopes',
      '/system/health',
    ]);
  });

  it('does not expose inspection return, draft, or submit controls without matching capability cues', () => {
    const review = read('src/pages/quarantine/inspections/[inspectionId]/review.astro');
    const execute = read('src/pages/quarantine/inspections/[inspectionId]/execute.astro');

    expect(review).toContain("const canReturn =");
    expect(review).toContain('canReturn ? <form');
    expect(execute).toContain("const canEdit = stateEditable");
    expect(execute).toContain("const canSubmit = canEdit");
    expect(execute).toContain('canSubmit ? <button');
    expect(execute).toContain('Page visibility does not grant mutation authority.');
  });

  it('makes laboratory next-workspace and retest policy states truthful', () => {
    const detail = read('src/pages/laboratory/tests/[labTestId]/index.astro');
    const execute = read('src/pages/laboratory/tests/[labTestId]/execute.astro');

    expect(detail).toContain("const canExecute = test.state === 'DRAFT'");
    expect(detail).toContain("const canReview = ['SUBMITTED', 'UNDER_REVIEW']");
    expect(detail).not.toMatch(/href=\{`\/laboratory\/tests\/\$\{test\.id\}\/retests\/new`\}/);
    expect(detail).toContain('approved laboratory retest policy');
    expect(execute).toContain('explicit laboratory submission permission');
  });
});
