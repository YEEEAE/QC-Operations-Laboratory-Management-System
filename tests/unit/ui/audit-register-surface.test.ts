import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

/**
 * Presentation contract for /audit (CA-P-AUDIT).
 *
 * This is a source contract, not browser acceptance: it locks the wide register
 * order, the canonical count/read states, the unchanged read semantics and the
 * accessible table/scroll/pager contract. Runtime evidence is stored under
 * audit/CA-P-AUDIT/.
 */
describe('audit register surface', () => {
  const page = read('src/pages/audit.astro');

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

  it('keeps one canonical count/read status region and no header duplicate count', () => {
    expect(page).toContain('<p class="result-count" role="status" aria-live="polite">');
    expect(page).toContain('authorized event');
    expect(page).toContain('Page ${currentPage} of ${totalPages}');
    expect(page).not.toContain('slot="actions"');
  });

  it('separates provider outage, denied read and empty results without a zero count', () => {
    expect(page).toContain('<ProviderUnavailableState');
    expect(page).toContain('This view is not empty and no count is shown.');
    expect(page).toContain('providerUnavailable = !authorizationDenied');
    expect(page).toContain('No audit events match these filters');
    expect(page).toContain('No audit events available');
    expect(page).toContain('No audit events on this page');
    expect(page).toContain('available · no events at this offset');
  });

  it('keeps the read contract and query semantics unchanged', () => {
    expect(page).toContain("import { AuditQueryService, normalizeAuditQueryFilter }");
    expect(page).toContain('normalizeAuditQueryFilter(filter)');
    expect(page).toContain("parseFactoryDateTime(params.get('from'))");
    expect(page).toContain("parseFactoryDateTime(params.get('to'))");
    expect(page).toContain("next.set('offset', String(Math.max(0, offset)))");
    expect(page).toContain("next.delete('offset')");
    expect(page).toContain('removeFilter(params, name)');
    expect(page).not.toContain('event.payload');
    expect(page).not.toContain('{event.subjectId}');
    expect(page).not.toContain('{event.actorId}');
  });

  it('renders the table as a labelled, keyboard-focusable scroll region', () => {
    expect(page).toContain('role="region"');
    expect(page).toContain('aria-label="Audit event table"');
    expect(page).toContain('tabindex="0"');
    expect(page).toContain('<caption>Audit events available to your account</caption>');
    expect(page).toContain('<th scope="col">When</th>');
    expect(page).toContain('<th scope="col">Request reference</th>');
    expect(page).toContain('<th scope="row" class="when">');
    expect(page).toContain('overflow-wrap: anywhere');
    expect(page).toContain('white-space: normal');
  });

  it('keeps only the existing filter/read capabilities', () => {
    expect(page).toContain('<FilterBar');
    expect(page).toContain('label="Audit history filters"');
    expect(page).not.toContain('method="post"');
    expect(page).not.toContain('type="file"');
    expect(page.toLowerCase()).not.toContain('export');
  });

  it('meets the presentation floor and preference contracts', () => {
    expect(page).toContain('min-block-size: 44px');
    expect(page).toContain('font-size: var(--font-size-xs)');
    expect(page).not.toMatch(/font-size:\s*(?:[0-9.]+px|[0-9.]+rem)/);
    expect(page).toContain(':focus-visible');
    expect(page).toContain('@media (prefers-reduced-motion: reduce)');
    expect(page).toContain('@media (forced-colors: active)');
    expect(page).not.toMatch(/(?:margin|padding|border)-(?:left|right)\s*:/);
    expect(page).not.toMatch(/text-overflow:\s*ellipsis/);
  });
});
