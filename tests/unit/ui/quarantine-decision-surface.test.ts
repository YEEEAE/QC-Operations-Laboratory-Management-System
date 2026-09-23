import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Quarantine decision-surface contract.
 *
 * Static guardrails for the defect class the live audit reported: counters that
 * count something other than what they claim, and links that cannot reproduce
 * the counter they sit under.
 */
const root = fileURLToPath(new URL('../../..', import.meta.url));
const read = (file: string) => readFileSync(join(root, file), 'utf8');

describe('quarantine decision surface', () => {
  const page = read('src/pages/quarantine/index.astro');
  const register = read('src/pages/quarantine/receiving/index.astro');
  const overview = read('src/modules/quarantine/application/get-quarantine-overview.ts');
  const repository = read('src/modules/quarantine/receiving/infrastructure/postgres-repository.ts');

  it('declares the full counter contract on the read model, not in the page', () => {
    for (const field of [
      'numerator: string',
      'state: string',
      'actorScope: string',
      'timeRange: string',
      'href: string',
    ]) {
      expect(overview, field).toContain(field);
    }
    // Every counter is projected from the register the links open.
    expect(overview).toContain('ReceivingOverviewSource');
    expect(overview).toContain('receivedOn');
  });

  it('never labels an actor-scoped count as authorized scope or the reverse', () => {
    // The projection counts exactly what the register returns for the same
    // actor, so it must not carry a second, narrower counting predicate.
    expect(overview).not.toContain('created_by = ');
    expect(overview).not.toContain('count(*) FILTER');
    expect(overview).not.toContain('sql`');
    // Scope is evaluated where the register evaluates it.
    expect(repository).toContain('actorHasScope');
  });

  it('renders the counters through the shared decision-surface card', () => {
    expect(page).toContain("import KpiCard from '../../ui/charts/KpiCard.astro'");
    for (const prop of [
      'numerator={metric.numerator}',
      'state={metric.state}',
      'href={metric.href}',
    ]) {
      expect(page, prop).toContain(prop);
    }
    expect(page).not.toContain('metric--');
  });

  it('separates a denied account from a provider outage and never renders an empty KPI row', () => {
    expect(page).toContain('accessDenied');
    expect(page).toContain("error.category === 'AUTHORIZATION'");
    expect(page).toContain('providerUnavailable');
    // The counters only exist for a confirmed authorized read.
    expect(page).toContain('!accessDenied && !providerUnavailable && <section class="metrics"');
    expect(page).toContain('Your account cannot read the quarantine overview');
    expect(page).toContain('is withheld');
  });

  it('links only to drill-down parameters the register actually implements', () => {
    const supported = ['state', 'inspectionResult', 'releaseState', 'receivedOn'];
    const hrefs = [...overview.matchAll(/'\/quarantine\/receiving\?([^']+)'/g)].map(
      (match) => match[1],
    );
    expect(hrefs.length).toBeGreaterThanOrEqual(8);
    for (const href of hrefs) {
      const params = new URLSearchParams(href);
      expect(params.toString().length, href).toBeGreaterThan(0);
      for (const [key, value] of params) {
        expect(supported, `${href} → ${key}`).toContain(key);
        expect(value.length).toBeGreaterThan(0);
      }
    }
    // Every one of those parameters is parsed and applied by the register.
    for (const key of supported) {
      expect(register, key).toContain(key);
    }
    expect(repository).toContain("query.where('receiving_date', '=', i.receivingDate)");
    expect(repository).toContain("query.where('inspection_result', '=', i.inspectionResult)");
    expect(repository).toContain(
      "query.where('release_system', '=', i.releaseState === 'RELEASED')",
    );
  });

  it('keeps a time-window filter comparable between the counter and the register', () => {
    const listUseCase = read('src/modules/quarantine/receiving/application/list-receiving.ts');
    // `today` is resolved once, in one place, from the UTC server date.
    expect(listUseCase).toContain("i.receivedOn === 'today' ? utcDateOnly(this.now())");
    expect(listUseCase).toContain('receivingDate');
    expect(register).toContain('parseReceivingFilters(Astro.url.searchParams)');
    expect(register).toContain('const receivedOn = filters.receivedOn');
    expect(register).toContain('...filters');
  });
});
