import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

/**
 * Presentation contract for /change-requests (CA-P-CHANGE-REQUESTS).
 *
 * This is a source contract, not browser acceptance: it locks the wide register
 * order, the canonical count/read states, the unchanged read semantics and the
 * accessible table/scroll/pager contract. Runtime evidence is stored under
 * audit/CA-P-CHANGE-REQUESTS/.
 */
describe('change-request register surface', () => {
  const page = read('src/pages/change-requests/index.astro');

  it('orders the page as header, filters, applied filters, then the register', () => {
    const header = page.indexOf('<PageHeader');
    const filters = page.indexOf('<FilterBar');
    const applied = page.indexOf('<AppliedFilters');
    const register = page.indexOf('<section class="register"');
    expect(header).toBeGreaterThan(-1);
    expect(header).toBeLessThan(filters);
    expect(filters).toBeLessThan(applied);
    expect(applied).toBeLessThan(register);
  });

  it('keeps one result-status region and no duplicate count in the header', () => {
    expect(page).toContain('<p class="result-count" role="status" aria-live="polite">');
    expect(page).toContain('change request${total === 1');
    expect(page).toContain('Page ${page} of ${totalPages}');
    expect(page).not.toContain('slot="actions"> {canCreate');
    expect(page).not.toContain('registerNote');
  });

  it('separates provider outage, filtered-empty and truly-empty results', () => {
    expect(page).toContain('<ProviderUnavailableState');
    expect(page).toContain('this register is not treated as empty');
    expect(page).toContain('providerUnavailable = true');
    expect(page).toContain('No change requests match these filters');
    expect(page).toContain('No change requests found');
    expect(page).toContain('Requests outside your authorized scope are intentionally excluded.');
  });

  it('keeps the read contract and query semantics unchanged', () => {
    expect(page).toContain('changeRequestsReadDependencies().list.executePage');
    expect(page).toContain("params.get('state')");
    expect(page).toContain("params.get('targetType')");
    expect(page).toContain("params.get('page') ?? 1");
    expect(page).toContain('validStates.find((value) => value === requestedState)');
    expect(page).toContain(
      "targetType = params.get('targetType')?.trim().slice(0, 100) || undefined",
    );
    // The canonical operator labels stay in place; no raw state enum is rendered.
    expect(page).toContain('stateLabel(changeRequest.state)');
    expect(page).toContain('targetTypeLabel(changeRequest.targetType)');
    expect(page).not.toMatch(/label=\{changeRequest\.state\}/);
    // No raw target snapshot or payload is projected into the register.
    expect(page).not.toContain('targetSnapshot');
    expect(page).not.toContain('requestedBy');
  });

  it('renders the table as a labelled, keyboard-focusable scroll region', () => {
    expect(page).toContain('role="region"');
    expect(page).toContain('aria-label="Change request register table"');
    expect(page).toContain('tabindex="0"');
    expect(page).toContain('<caption>Change requests in your authorized scope</caption>');
    expect(page).toContain('<th scope="row" class="change-number">');
    expect(page).toContain('<th scope="col">Change no.</th>');
    expect(page).toContain('<th scope="col">Target version</th>');
    expect(page).toContain('overflow-wrap: anywhere');
    expect(page).toContain('white-space: normal');
    expect(page).not.toMatch(/text-overflow:\s*ellipsis/);
  });

  it('keeps only the existing filter/read capabilities', () => {
    expect(page).toContain('<FilterBar');
    expect(page).toContain('label="Change request filters"');
    expect(page).toContain('<AppliedFilters');
    expect(page).not.toContain('method="post"');
    expect(page).not.toContain('type="file"');
    expect(page.toLowerCase()).not.toContain('export');
  });

  it('keeps pagination tied to a populated, available result set', () => {
    expect(page).toContain('{!providerUnavailable && total > 0 && (');
    expect(page).toContain('itemLabel="change requests"');
  });

  it('meets the presentation floor and preference contracts', () => {
    expect(page).toContain('min-block-size: 44px');
    expect(page).toContain('font-size: var(--font-size-xs)');
    expect(page).not.toMatch(/font-size:\s*(?:[0-9.]+px|[0-9.]+rem)/);
    expect(page).toContain(':focus-visible');
    expect(page).toContain('@media (prefers-reduced-motion: reduce)');
    expect(page).toContain('@media (forced-colors: active)');
    expect(page).not.toMatch(/(?:margin|padding|border)-(?:left|right)\s*:/);
  });
});
