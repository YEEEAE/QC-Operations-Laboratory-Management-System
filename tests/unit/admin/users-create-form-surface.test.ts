import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../../../src/pages/admin/users/new.astro', import.meta.url),
  'utf8',
);

describe('admin create-user form presentation contract', () => {
  it('retains every existing form field and the server-owned action payload', () => {
    expect(source).toContain(
      'purpose="Create a member account and set its initial access where authorized."',
    );
    for (const name of [
      'loginIdentity',
      'displayName',
      'email',
      'temporaryPassword',
      'roleCode',
      'scopeKind',
    ]) {
      expect(source, `field ${name}`).toContain(`name="${name}"`);
    }
    expect(source).toContain('name={`scopeValue-${kind}`}');
    expect(source).toContain('actions.admin.createUser({');
    expect(source).toContain("hasAdminCapability(actor, 'createUser')");
    expect(source).toContain("hasAdminCapability(actor, 'assignUserRole')");
    expect(source).toContain("hasAdminCapability(actor, 'assignUserScope')");
    expect(source).toContain('scopeRequiresValue(kind)');
    expect(source).toContain('SCOPE_KINDS.map');
    expect(source).toContain('window.location.href = `/admin/users/${outcome.recordId}`');
  });

  it('uses a single-column mobile form and only a two-column account-fields group at wide sizes', () => {
    expect(source).toContain(
      '.account-fields { display: grid; grid-template-columns: minmax(0, 1fr);',
    );
    expect(source).toContain('@media (min-width: 760px)');
    expect(source).toContain(
      '.account-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }',
    );
    expect(source).not.toContain('grid-template-columns: repeat(3');
    expect(source).toContain('class="form-section grant-section"');
  });

  it('keeps a single canonical mutation result region and the denied state', () => {
    expect(source.match(/data-result/g)).toHaveLength(1); // one canonical result region
    expect(source).toContain('class="form-result" role="status" data-result');
    expect(source).toContain('enhanceMutationForm({');
    expect(source).toContain('role="alert"');
    expect(source).not.toMatch(/data-(?:filter|export)/i);
  });
});
