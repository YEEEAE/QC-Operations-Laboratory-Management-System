import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classifyActionResult } from '../../../src/ui/forms/mutation-interaction.js';

/**
 * Mutation / recovery safety contract (QC-100-FINAL-005 item 2, domain 20/65).
 *
 * Verified here:
 *  - a stale mutation is never retried automatically and always names an
 *    explicit refresh;
 *  - a duplicate submission cannot be issued twice while one is in flight;
 *  - the six failure classes stay distinguishable (authorization, stale,
 *    duplicate, dependency outage, validation, safe-unknown);
 *  - every control surface's no-JS POST baseline is tracked: the pages that
 *    still depend on JavaScript are listed explicitly and the list can only
 *    shrink.
 */

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(projectRoot, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(projectRoot, rel)).isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

const pages = walk('src/pages')
  .filter((path) => path.endsWith('.astro'))
  .sort();
const uiFiles = walk('src/ui').filter((path) => /\.(astro|ts)$/.test(path));

/**
 * Control surfaces whose mutation controls rely on JavaScript: no form POST
 * baseline (`method="post"`) and no Astro action form (`action={actions.x}`).
 * Every entry needs a real POST baseline plus retained values and a read-only
 * safe summary for the no-JS path. Owner: 005-B with 003/006 verification.
 *
 * QC-100-FINAL-037-A register update: `quarantine/receiving/[receivingId]`
 * gained full POST baselines for inspection creation, HOLD, VOID, and
 * correction forms (verified against commit 5470a2e — 4 `method="post"`
 * forms), so it leaves this register. The register can only shrink.
 */
const NO_JS_BASELINE_OPEN = [
  'src/pages/admin/roles/[roleId].astro',
  'src/pages/change-requests/[changeRequestId]/review.astro',
  'src/pages/documents/[documentId]/versions/[versionId]/index.astro',
  'src/pages/documents/[documentId]/versions/new.astro',
  'src/pages/laboratory/tests/[labTestId]/execute.astro',
  'src/pages/laboratory/tests/[labTestId]/review.astro',
  'src/pages/quality/capa/[capaId].astro',
  'src/pages/reject-reports/daily/[reportId].astro',
];

/** Surfaces with a submit control but no in-flight/duplicate guard of their own. */
const PENDING_GUARD_OPEN = ['src/pages/reject-reports/daily/[reportId].astro'];

const hasPostBaseline = (source: string): boolean =>
  source.includes('method="post"') || source.includes('action={actions.');

describe('mutation failure classes stay distinguishable', () => {
  it('never collapses authorization, staleness, dependency, validation or unknown', () => {
    const auth = classifyActionResult({ error: { message: 'AUTHZ_DENIED' } }).state;
    const scope = classifyActionResult({ error: { message: 'AUTHZ_SCOPE_DENIED' } }).state;
    const sod = classifyActionResult({ error: { message: 'AUTHZ_SOD_VIOLATION' } }).state;
    const stale = classifyActionResult({ error: { message: 'CONFLICT_STALE_VERSION' } }).state;
    const duplicate = classifyActionResult({
      error: { message: 'CONFLICT_DUPLICATE_COMMAND' },
    }).state;
    const dependency = classifyActionResult({
      error: { message: 'SYSTEM_DATABASE_UNAVAILABLE' },
    }).state;
    const notFound = classifyActionResult({ error: { message: 'RESOURCE_NOT_FOUND' } }).state;
    const validation = classifyActionResult({ error: { message: 'VALIDATION_FAILED' } }).state;
    const unknown = classifyActionResult({ error: { message: 'not-a-known-code' } }).state;

    expect(auth).toBe('AUTHORIZATION_CHANGED');
    expect(scope).toBe('AUTHORIZATION_CHANGED');
    expect(sod).toBe('AUTHORIZATION_CHANGED');
    expect(stale).toBe('CONFLICT_STALE');
    expect(duplicate).toBe('DUPLICATE_COMMAND');
    expect(dependency).toBe('DEPENDENCY_UNAVAILABLE');
    expect(notFound).toBe('DEPENDENCY_UNAVAILABLE');
    expect(validation).toBe('VALIDATION_ERROR');
    expect(unknown).toBe('UNKNOWN_SAFE_ERROR');

    // The classes must not merge into one another.
    expect(new Set([auth, stale, dependency, validation, unknown]).size).toBe(5);
    expect(duplicate).not.toBe(stale);
  });

  it('uses identical user copy for authorization denial and missing records', () => {
    const authState = classifyActionResult({ error: { message: 'AUTHZ_DENIED' } }).state;
    const missingState = classifyActionResult({ error: { message: 'RESOURCE_NOT_FOUND' } }).state;
    expect(authState).not.toBe(missingState);

    const vocabulary = read('src/shared/copy/ux-vocabulary.ts');
    const authCopy = /AUTHORIZATION_CHANGED:\s*'([^']+)'/.exec(vocabulary)?.[1];
    const missingCopy = /DEPENDENCY_UNAVAILABLE:\s*'([^']+)'/.exec(vocabulary)?.[1];
    expect(authCopy).toBeTruthy();
    expect(missingCopy).toBe(authCopy);
    expect(authCopy).not.toMatch(/permission you|record is unavailable|could not be found/i);
  });

  it('keeps the stale message explicit about no resubmission and a refresh', () => {
    const vocabulary = read('src/shared/copy/ux-vocabulary.ts');
    expect(vocabulary).toMatch(/CONFLICT_STALE:[\s\S]*?Reload the latest data/);
    expect(vocabulary).toMatch(/CONFLICT_STALE:[\s\S]*?Nothing was resubmitted/);
    expect(vocabulary).toMatch(/AUTHORIZATION_CHANGED:[\s\S]*?preserved/);
    expect(vocabulary).toMatch(/DEPENDENCY_UNAVAILABLE:[\s\S]*?Refresh the page/);
  });
});

describe('no automatic retry of a stale or failed mutation', () => {
  it('keeps timers out of the shared mutation contract', () => {
    const contract = read('src/ui/forms/mutation-interaction.ts');
    expect(contract).not.toMatch(/setTimeout|setInterval/);
    expect(contract).not.toMatch(/retry\s*\(/);
    // Exactly one invocation site: a failed/stale outcome can never schedule a
    // second attempt by itself.
    expect((contract.match(/invoke\(/g) ?? []).length).toBe(1);
  });

  it('never schedules a mutation from a page timer', () => {
    const offenders = pages.filter((page) => /setInterval\s*\(/.test(read(page)));
    expect(offenders).toEqual([]);
  });

  it('refreshes a stale dialog through navigation, not a silent replay', () => {
    const dialog = read('src/ui/client/dialog.ts');
    expect(dialog).toContain('[data-refresh-record]');
    expect(dialog).toContain('window.location.reload()');
    expect(dialog).not.toMatch(/setTimeout|setInterval/);
  });

  it('blocks a duplicate submission while one is in flight', () => {
    const contract = read('src/ui/forms/mutation-interaction.ts');
    expect(contract).toContain("form.dataset.mutationEnhanced === 'true'");
    expect(contract).toContain("form.getAttribute('aria-busy') === 'true'");
    expect(contract).toContain('submit.disabled = true');
    expect(contract).toContain('DUPLICATE_COMMAND');
  });
});

describe('control surfaces and the JavaScript-only gap register', () => {
  it('lists exactly the surfaces without a no-JS POST baseline', () => {
    const withoutBaseline = pages.filter(
      (page) => read(page).includes('data-submit') && !hasPostBaseline(read(page)),
    );
    expect(withoutBaseline).toEqual(NO_JS_BASELINE_OPEN);
  });

  it('lists exactly the surfaces without an in-flight duplicate guard', () => {
    const withoutGuard = pages.filter((page) => {
      const source = read(page);
      if (!source.includes('data-submit')) return false;
      // Both shared enhancement contracts count as an in-flight guard.
      return (
        !source.includes('aria-busy') &&
        !source.includes('enhanceMutationForm') &&
        !source.includes('enhanceClassifiedForm')
      );
    });
    expect(withoutGuard).toEqual(PENDING_GUARD_OPEN);
  });

  it('gives every scripted mutation surface a pending status region', () => {
    // A status region is either static markup, set through setAttribute at
    // runtime, or an aria-live region the enhancement writes into.
    const hasStatusRegion = (source: string): boolean =>
      source.includes('role="status"') ||
      /setAttribute\(\s*'role'\s*,\s*'status'/.test(source) ||
      source.includes('aria-live');
    const offenders = pages.filter((page) => {
      const source = read(page);
      return source.includes('data-submit') && !hasStatusRegion(source);
    });
    expect(offenders).toEqual([]);
  });

  it('keeps the shared enhancements idempotent and form-scoped', () => {
    for (const file of uiFiles.filter((path) => path.endsWith('.ts'))) {
      const source = read(file);
      // Only the shared contracts may disable a submit control.
      if (
        file === 'src/ui/forms/mutation-interaction.ts' ||
        file === 'src/ui/forms/enhance-with-classification.ts'
      )
        continue;
      expect(source, file).not.toContain('submit.disabled = true');
    }
  });
});
