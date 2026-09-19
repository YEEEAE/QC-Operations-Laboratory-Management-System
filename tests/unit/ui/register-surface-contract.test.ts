import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Register-surface inventory contract (QC-100-FINAL-005 items 1 and 3).
 *
 * This suite is the executable inventory of every route against the shared
 * shell / navigation / forms / tables / dialogs contract. It does not sample
 * the dashboard: it walks all page files and asserts the invariants that every
 * operational surface must satisfy, and it records the *exact* remaining gaps
 * as ratchets so neither the gap list nor the violation count can grow.
 *
 * A ratchet list may only shrink. Removing an entry is progress; adding one is
 * a regression and must be justified by an approved decision.
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
const uiSurfaces = walk('src/ui')
  .filter((path) => /\.(astro|ts)$/.test(path))
  .sort();

/** Pages that are deliberately outside the authenticated operational shell. */
const SHELL_EXEMPT: Readonly<Record<string, string>> = {
  'src/pages/index.astro': 'server redirect to the dashboard; renders no shell',
  'src/pages/laboratory/index.astro': 'server redirect to the laboratory register',
  'src/pages/404.astro': 'public error surface outside the operational shell',
  'src/pages/500.astro': 'public error surface outside the operational shell',
};

/** Register / work-queue surfaces: a server read rendered as a bounded list. */
const REGISTERS = [
  'src/pages/tasks/index.astro',
  'src/pages/audit.astro',
  'src/pages/reject-reports/index.astro',
  'src/pages/quarantine/receiving/index.astro',
  'src/pages/quarantine/inspections/index.astro',
  'src/pages/quarantine/admin/index.astro',
  'src/pages/assets/equipment/index.astro',
  'src/pages/assets/calibrations/index.astro',
  'src/pages/assets/maintenance/index.astro',
  'src/pages/documents/index.astro',
  'src/pages/change-requests/index.astro',
  'src/pages/quality/findings/index.astro',
  'src/pages/laboratory/tests/index.astro',
  'src/pages/approvals/index.astro',
  'src/pages/admin/users/index.astro',
  'src/pages/admin/roles/index.astro',
  'src/pages/admin/permissions/index.astro',
  'src/pages/system/backups/index.astro',
];

/** Registers with a server-side page/offset bound (verified in source). */
const BOUNDED_REGISTERS = [
  'src/pages/tasks/index.astro',
  'src/pages/audit.astro',
  'src/pages/reject-reports/index.astro',
  // QC-100-FINAL-017: the laboratory register reads a bounded newest-first page
  // plus the readable total, so it no longer loads the whole table to count it.
  'src/pages/laboratory/tests/index.astro',
];

/**
 * Registers whose unbounded read is still open. Bounding these is not a UI
 * change: every one of them authorizes per row (or per relation) and needs the
 * scope predicate pushed into SQL first, with equivalence evidence. Owner: the
 * next 005 phase with 010/006 verification.
 */
const UNBOUNDED_REGISTERS = REGISTERS.filter((page) => !BOUNDED_REGISTERS.includes(page));

/**
 * Registers that still collapse a dependency outage into an empty list. Each
 * entry needs a verified UNAVAILABLE branch; owner recorded per row.
 */
const UNAVAILABLE_BRANCH_OPEN: Readonly<Record<string, string>> = {
  'src/pages/quarantine/admin/index.astro': 'owner: 005-B (template admin register read)',
  'src/pages/admin/users/index.astro': 'owner: 005-B with 010 (account register read)',
  'src/pages/admin/roles/index.astro': 'owner: 005-B with 010 (role register read)',
  'src/pages/admin/permissions/index.astro': 'owner: 005-B with 010 (permission register read)',
  'src/pages/reject-reports/index.astro': 'owner: 005-B (reject-report register read)',
};

/** Pages with a table but no navigable row identity, with the reason. */
const ROW_IDENTITY_EXEMPT: Readonly<Record<string, string>> = {
  'src/pages/audit.astro': 'immutable audit log rows carry no navigable record id',
  'src/pages/reports/[reportCode].astro': 'report projection grid, not a record register',
  'src/pages/reject-reports/daily/[reportId].astro':
    'line-item table whose identity is the parent report',
};

/** Surfaces that apply the shared filter-chip component. May only grow. */
const FILTER_CHIP_SURFACES = [
  'src/pages/assets/calibrations/index.astro',
  'src/pages/assets/equipment/index.astro',
  'src/pages/assets/maintenance/index.astro',
  'src/pages/laboratory/tests/index.astro',
  'src/pages/quarantine/inspections/index.astro',
  'src/pages/quarantine/receiving/index.astro',
  'src/pages/tasks/index.astro',
];

const tablePages = pages.filter((page) => read(page).includes('<table'));
/**
 * A register is bounded when its read carries a server-side bound, either a
 * page/offset parsed from the query string or an explicit fixed page size the
 * owning read model enforces.
 */
const isBounded = (page: string): boolean => {
  const source = read(page);
  return (
    source.includes('parsePageInput') ||
    source.includes('result.offset') ||
    source.includes('limit: DEFAULT_PAGE_SIZE')
  );
};

describe('route inventory — shared shell, navigation, dialogs', () => {
  it('renders every operational page through the shared shell layout', () => {
    const outsideShell = pages.filter(
      (page) => !SHELL_EXEMPT[page] && !/layouts\/(AppLayout|AuthLayout)\.astro/.test(read(page)),
    );
    expect(outsideShell).toEqual([]);
  });

  it('never ships a native confirm/alert/prompt on any surface', () => {
    const offenders: string[] = [];
    for (const file of [...pages, ...uiSurfaces]) {
      if (/\b(window\.)?(confirm|alert|prompt)\s*\(/.test(read(file))) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('exposes an auth layout for the unauthenticated surfaces', () => {
    const login = read('src/pages/login.astro');
    expect(login).toContain('AuthLayout');
  });
});

describe('register surfaces — tables, identity, bounded reads', () => {
  it('gives every table a programmatic caption', () => {
    const missing = tablePages.filter((page) => !read(page).includes('<caption'));
    expect(missing).toEqual([]);
  });

  it('keeps a stable row identity on every record register', () => {
    const missing = tablePages.filter(
      (page) => !ROW_IDENTITY_EXEMPT[page] && !read(page).includes('scope="row"'),
    );
    expect(missing).toEqual([]);
  });

  it('bounds every register that can be bounded today and lists the rest', () => {
    expect(REGISTERS.filter(isBounded)).toEqual(BOUNDED_REGISTERS);
    expect(REGISTERS.filter((page) => !isBounded(page))).toEqual(UNBOUNDED_REGISTERS);
  });

  it('separates UNAVAILABLE from EMPTY on every register', () => {
    const missing = REGISTERS.filter(
      (page) => !UNAVAILABLE_BRANCH_OPEN[page] && !read(page).includes('ProviderUnavailableState'),
    );
    expect(missing).toEqual([]);
  });

  it('applies the shared filter chips on every filtered register it ships', () => {
    const withChips = pages.filter((page) => read(page).includes('AppliedFilters'));
    expect(withChips).toEqual(FILTER_CHIP_SURFACES);
  });

  it('keeps the shared register primitives the only filter/empty/pagination contract', () => {
    const filterBar = read('src/ui/components/data/FilterBar.astro');
    // GET baseline: filters work without JavaScript and never post business data.
    expect(filterBar).toContain('method="get"');
    expect(filterBar).toContain('role="search"');
    expect(filterBar).not.toContain('fetch(');
    // 12px readable floor and target size, not the old 11px label.
    expect(filterBar).toContain('var(--font-size-xs)');
    expect(filterBar).toContain('var(--control-height)');
    expect(filterBar).not.toMatch(/font-size:\s*11px/);

    const empty = read('src/ui/components/data/EmptyTableState.astro');
    expect(empty).toContain('role="status"');
    expect(empty).toContain('var(--control-height)');
    expect(empty).not.toMatch(/font-size:\s*11px/);

    const pagination = read('src/ui/components/data/Pagination.astro');
    expect(pagination).toContain('aria-live="polite"');
    expect(pagination).toContain('var(--control-height)');
  });
});
