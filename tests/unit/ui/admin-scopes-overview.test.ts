import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  new URL('../../../src/pages/admin/scopes/index.astro', import.meta.url),
  'utf8',
);

describe('admin scopes overview presentation contract', () => {
  it('preserves the full scope vocabulary and safety explanation', () => {
    for (const kind of ['OWN', 'ASSIGNED', 'TEAM', 'DEPARTMENT', 'SITE', 'DOMAIN', 'GLOBAL']) {
      expect(page).toContain(`scopeKindLabels.${kind}`);
    }
    expect(page).toContain('Scope alone never authorizes an action.');
    expect(page).toContain('entity, state, SoD, version, and business rule.');
    for (const description of [
      'Records owned by the member',
      'Records formally assigned to the member',
      "Records of the member's team",
      "Records of the member's department",
      'Records of an operational site',
      'Wide visibility inside one domain only',
      'System-wide visibility for this grant',
    ]) {
      expect(page).toContain(description);
    }
    expect(page).toContain('Manage access scopes. Self-grants are blocked.');
    expect(page).toContain('Back to administration');
  });

  it('makes the existing member register the single next step without adding destinations', () => {
    expect(page).toContain('Next step');
    expect(page).toContain('Review a member’s current scopes');
    expect(page).toContain('href="/admin/users"');
    expect(page).toContain('href="/admin"');
    expect(page.match(/href=/g)).toHaveLength(2);
    expect(page).not.toMatch(/<form|data-(?:filter|export)|PERM-|expectedVersion|requestId/i);
  });

  it('keeps the responsive scope vocabulary fluid and secondary text readable', () => {
    expect(page).toContain('minmax(min(100%');
    expect(page).toContain('min-height: max(var(--control-height), 44px)');
    expect(page).toContain('font-size: 0.75rem');
    expect(page).toContain('overflow-wrap: anywhere');
  });
});
