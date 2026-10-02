import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { navigationGroups } from '../../../src/ui/navigation/navigation';
import { addUniversalOperationalReadPermissions } from '../../../src/shared/authorization/visibility';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('authorization visibility presentation contract', () => {
  it('adds only the approved global read grants and never mutation authority', () => {
    const permissions = addUniversalOperationalReadPermissions([]).map(
      (permission) => permission.code,
    );
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

    expect(review).toContain('const canReturn =');
    expect(review).toContain('canReturn ? <form');
    expect(execute).toContain('const canEdit = stateEditable');
    expect(execute).toContain('const canSubmit = canEdit');
    expect(execute).toContain('canSubmit ? <button');
    expect(execute).toContain('The current state allows draft work, but your account needs draft-edit permission');
  });

  it('makes laboratory next-workspace and retest policy states truthful', () => {
    const detail = read('src/pages/laboratory/tests/[labTestId]/index.astro');
    const execute = read('src/pages/laboratory/tests/[labTestId]/execute.astro');

    expect(detail).toContain("const canExecute = test.state === 'DRAFT'");
    expect(detail).toContain("const atQcmStage = test.state === 'PENDING_QCM_APPROVAL'");
    expect(detail).toContain('atQcmStage && ((hasPermission');
    expect(detail).not.toMatch(/href=\{`\/laboratory\/tests\/\$\{test\.id\}\/retests\/new`\}/);
    expect(detail).toContain('Retest authorization follows the approved P-05 policy');
    expect(execute).toContain('submission permission.');
  });
  it('routes the approved QCM inspection stage through the review workspace and state filter', () => {
    const inspection = read('src/pages/quarantine/inspections/index.astro');
    const review = read('src/pages/quarantine/inspections/[inspectionId]/review.astro');
    expect(inspection).toContain("'PENDING_QCM_APPROVAL'");
    expect(inspection).toContain('chipHref(stateParam)');
    expect(review).toContain("inspection.state === 'PENDING_QCM_APPROVAL'");
    expect(review).toContain('canFinalApprove || canReturn || canReject');
  });
  it('offers only existing permitted asset transitions and keeps unresolved transitions absent', () => {
    const rail = read('src/ui/components/workflow/AssetActionRail.astro');
    expect(rail).toContain("action: 'SUBMIT'");
    expect(rail).toContain("action: 'APPROVE'");
    expect(rail).toContain("action: 'START'");
    expect(rail).toContain("action: 'COMPLETE'");
    expect(rail).not.toContain("action: 'MAKE_CURRENT'");
    expect(rail).not.toContain("action: 'VOID'");
    expect(rail).toContain('name="expectedVersion" value={record.version.toString()}');
  });
});
