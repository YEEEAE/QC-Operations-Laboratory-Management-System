import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(file, 'utf8');
const inventory = JSON.parse(read('audit/CA-04/import-inventory.json'));

describe('CA-04 shared presentation contracts', () => {
  it('inventories every screen separately from the two redirects', () => {
    const registered = JSON.parse(read('audit/CA-01/route-register.json')).routes;
    expect(inventory.routes.map((row: { file: string }) => row.file).sort()).toEqual(
      registered.filter((row: { kind: string }) => row.kind === 'screen').map((row: { file: string }) => row.file).sort(),
    );
    expect(inventory.screenCount).toBe(86);
    expect(inventory.excludedRedirects).toEqual(['/', '/laboratory']);
  });

  it('binds each route inventory to its current source, not runtime acceptance', () => {
    for (const row of inventory.routes) {
      expect(createHash('sha256').update(read(row.file)).digest('hex')).toBe(row.sha256);
      expect(row.runtime).toBe('NOT RUN');
    }
  });

  it.each(['AppliedFilters', 'Pagination', 'ProviderUnavailableState'])('%s has at least two inventoried production consumers', (name) => {
    expect(inventory.primitives[name].directConsumers.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps validated server chips canonical instead of repeating raw URL chips', () => {
    expect(read('src/ui/components/data/AppliedFilters.astro')).toContain('data-applied-filters');
    const helper = read('src/ui/client/register-preferences.ts');
    expect(helper).toContain("querySelector('[data-applied-filters]')");
    expect(helper).toContain('chips.childElementCount && !serverFilters');
    expect(helper).toContain("next.delete('page')");
  });

  it('allows long filter values to wrap without collapsing the field label or remove mark', () => {
    const component = read('src/ui/components/data/AppliedFilters.astro');
    expect(component).toMatch(/\.chip-label\s*\{\s*flex: none/);
    expect(component).toMatch(/\.chip-value\s*\{[^}]*min-inline-size: 0;[^}]*overflow-wrap: anywhere;/);
    expect(component).toMatch(/\.chip-remove\s*\{\s*flex: none/);
    expect(component).toContain('min-block-size: 44px');
  });

  it('keeps pagination native, filter-preserving and wrapping at small widths', () => {
    const component = read('src/ui/components/data/Pagination.astro');
    expect(component).toContain('Object.fromEntries(Astro.url.searchParams)');
    expect(component).toContain('rel="prev"');
    expect(component).toContain('rel="next"');
    expect(component).toContain('aria-disabled="true"');
    expect(component.match(/flex-wrap: wrap/g)).toHaveLength(2);
    expect(component).toContain('min-block-size: max(44px, var(--control-height))');
  });

  it('keeps unavailable an alert with a 44px native retry, never a zero total', () => {
    const component = read('src/ui/components/feedback/ProviderUnavailableState.astro');
    expect(component).toContain('role="alert"');
    expect(component).toContain('href={retryHref}');
    expect(component).toContain('min-block-size:44px');
    expect(component).not.toMatch(/total|0 records|No records found/);
  });
});
