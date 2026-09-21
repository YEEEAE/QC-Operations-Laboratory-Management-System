import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * QC-100-FINAL-037-A — server-derived interaction state contract.
 *
 * Verified here (static contract level):
 *  - every enhanced create form routes its failure display through the
 *    canonical classifier, so the displayed state derives from the actual
 *    server result (permission denial ≠ validation ≠ stale ≠ outage);
 *  - the vocabulary copy per failure class is the single source of displayed
 *    wording (no per-page invented strings);
 *  - the shared enhancement stays presentation-only: no timers, no retry,
 *    exactly one invoke site, and duplicate-submit guards preserved.
 */
const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');

const SHARED = 'src/ui/forms/enhance-with-classification.ts';

const ENHANCED_PAGES: ReadonlyArray<{ page: string; action: string; detailBase: string }> = [
  {
    page: 'src/pages/assets/equipment/new.astro',
    action: 'actions.assets.createEquipment',
    detailBase: '/assets/equipment',
  },
  {
    page: 'src/pages/assets/maintenance/new.astro',
    action: 'actions.assets.createMaintenance',
    detailBase: '/assets/maintenance',
  },
  {
    page: 'src/pages/assets/calibrations/new.astro',
    action: 'actions.assets.createCalibration',
    detailBase: '/assets/calibrations',
  },
  {
    page: 'src/pages/documents/new.astro',
    action: 'actions.documents.create',
    detailBase: '/documents',
  },
  {
    page: 'src/pages/laboratory/tests/new.astro',
    action: 'actions.laboratory.create',
    detailBase: '/laboratory/tests',
  },
  {
    page: 'src/pages/change-requests/new.astro',
    action: 'actions.changeRequests.createForDocumentVersion',
    detailBase: '/change-requests',
  },
];

describe('shared classified enhancement contract (037-A item 1)', () => {
  it('classifies the server result with the canonical contract', () => {
    const source = read(SHARED);
    expect(source).toContain("from './mutation-interaction'");
    expect(source).toContain('classifyActionResult');
  });

  it('renders only the approved per-class vocabulary, never page-invented strings', () => {
    const source = read(SHARED);
    expect(source).toContain('copy.errorClasses');
    expect(source).not.toMatch(/textContent\s*=\s*'[^']/); // no hardcoded failure strings
  });

  it('keeps the enhancement presentation-only and single-invocation', () => {
    const source = read(SHARED);
    expect(source).not.toMatch(/setTimeout|setInterval/);
    expect(source).not.toMatch(/retry\s*\(/);
    expect((source.match(/invoke\(/g) ?? []).length).toBe(1);
  });

  it('guards duplicate submissions while one is in flight', () => {
    const source = read(SHARED);
    expect(source).toContain("form.dataset.enhance === 'classified'");
    expect(source).toContain("form.getAttribute('aria-busy') === 'true'");
    expect(source).toContain('submit.disabled = true');
  });

  it('keeps the no-JS POST baseline intact on every enhanced page', () => {
    for (const { page } of ENHANCED_PAGES) {
      expect(read(page), page).toContain('method="post"');
    }
  });

  it('routes every enhanced page through the shared module with its real action', () => {
    for (const { page, action } of ENHANCED_PAGES) {
      const source = read(page);
      expect(source, page).toContain('enhanceClassifiedForm');
      expect(source, page).toContain(action);
    }
  });

  it('navigates successful creates to the record detail route', () => {
    const shared = read(SHARED);
    expect(shared).toContain('detailBaseHref');
    for (const { page, detailBase } of ENHANCED_PAGES) {
      expect(read(page), page).toContain(detailBase);
    }
  });

  it('does not remove the safety contract of 005 from the shared module set', () => {
    // The original contract file must stay untouched in its guarantees.
    const contract = read('src/ui/forms/mutation-interaction.ts');
    expect(contract).toContain('DUPLICATE_COMMAND');
    expect(contract).not.toMatch(/setTimeout|setInterval/);
  });
});
