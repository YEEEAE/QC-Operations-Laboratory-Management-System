import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  new URL('../../../src/pages/admin/permissions/index.astro', import.meta.url),
  'utf8',
);

describe('permissions register presentation contract', () => {
  it('preserves the read-only catalog and renders its safe permission projection', () => {
    for (const field of ['permission.code', 'permission.description', 'permission.domain', 'permission.action', 'permission.riskLevel'])
      expect(page).toContain(field);
    expect(page).toContain('listPermissions.execute({ actor })');
    expect(page).toContain("error.category === 'AUTHORIZATION'");
    expect(page).not.toMatch(/<form[^>]+(?:method="post"|action=)|data-export|export/i);
    expect(page).not.toMatch(/permission\.(?:id|active)\b/);
  });

  it('provides client-side READ/FILTER/count/pagination without changing server guards', () => {
    for (const contract of [
      'data-permission-filters', 'data-active-filters', 'data-result-count',
      'data-permission-row', 'data-pagination', 'data-page-previous', 'data-page-next',
      'data-search-text', 'role="status"', 'aria-label="Permission catalog table"',
      'tabindex="0"', 'Permission catalog pages',
    ]) expect(page).toContain(contract);
    expect(page).toContain('const pageSize = 25');
    expect(page).toContain("input?.addEventListener('input'");
    expect(page).toContain("form?.addEventListener('reset'");
    expect(page).toContain("data-remove-filter");
    expect(page).toContain('role="alert"');
    expect(page).toContain('permission.riskLevel');
    expect(page).toContain("permission.description ?? ''");
    expect(page).toContain('[permission.code, permission.domain, permission.action');
  });

  it('keeps long permission identifiers readable and interactive controls at the target floor', () => {
    expect(page).toContain('overflow-wrap: anywhere');
    expect(page).toContain('min-height: 44px');
    expect(page).toContain('min-width:44px');
    expect(page).toContain('prefers-reduced-motion: reduce');
    expect(page).toContain('forced-colors: active');
    expect(page).toContain('aria-label="Remove permission filter"');
  });
});
