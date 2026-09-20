import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getRouteById, getRouteByPathname } from '../../../src/shared/routing/routes.js';
import {
  PERMISSION_CODES,
  isPermissionCode,
} from '../../../src/shared/authorization/permissions.js';
import {
  HELP_GUIDANCE_MATRIX,
  HELP_PERMISSION_CITATIONS,
  HELP_ROLE_GUIDES,
  HELP_ROUTE_LINKS,
} from '../../../src/shared/copy/help-content.js';
import { navigationRouteIds } from '../../../src/ui/navigation/navigation.js';
import { iconNames } from '../../../src/ui/components/icon.js';

/**
 * Role operating & support guide contract (QC-100-FINAL-020).
 *
 * The guide is only trustworthy if its links resolve against the live route
 * registry and its permission references exist in the canonical permission
 * list. This suite resolves every reference, scans the printable guide and the
 * two documents for dead links, and fails on secret-like content.
 *
 * It proves link/registry integrity (a static check). Authenticated browser and
 * assistive-technology verification remain external dependencies and are NOT
 * claimed by this suite.
 */

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(`${projectRoot}${relative}`, 'utf8');

const HELP_PAGE = 'src/pages/help/index.astro';
const GUIDE_DOC = 'Documents/ROLE-OPERATING-GUIDES.md';
const SUPPORT_DOC = 'Documents/SUPPORT-OWNERSHIP-REGISTER.md';

/** Backtick-wrapped route paths used as links in the guide documents. */
function extractBacktickRoutes(markdown: string): string[] {
  const matches = markdown.matchAll(/`(\/[a-z0-9/[\]-]+)`/g);
  return [...matches].map((match) => match[1]!);
}

describe('help route registry integrity', () => {
  it('registers the help route and exposes it in primary navigation', () => {
    const route = getRouteById('RT-HELP-001');
    expect(route).toMatchObject({ path: '/help', file: HELP_PAGE });
    expect(navigationRouteIds).toContain('RT-HELP-001');
    expect(iconNames).toContain('help');
  });

  it('resolves every quick link against the canonical registry', () => {
    const unresolved = HELP_ROUTE_LINKS.filter((link) => !getRouteById(link.routeId)).map(
      (link) => link.routeId,
    );
    expect(unresolved).toEqual([]);
  });

  it('resolves every role start-of-day route', () => {
    const unresolved = HELP_ROLE_GUIDES.flatMap((guide) =>
      guide.startOfDay.filter((routeId) => !getRouteById(routeId)),
    );
    expect(unresolved).toEqual([]);
  });

  it('resolves every guidance matrix route and names only known states', () => {
    const unresolved = HELP_GUIDANCE_MATRIX.filter(
      (block) => !getRouteById(block.routeId) || block.entries.length === 0,
    ).map((block) => block.routeId);
    expect(unresolved).toEqual([]);
    // Guidance is derived from approved state machines, not invented promises:
    // every two-stage row must keep the release distinction explicit.
    const inspection = HELP_GUIDANCE_MATRIX.find((block) => block.routeId === 'RT-INSP-004');
    expect(inspection).toBeDefined();
    for (const state of ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_QCM_APPROVAL', 'APPROVED']) {
      expect(inspection!.entries.some((entry) => entry.state === state)).toBe(true);
    }
    expect(
      inspection!.entries.some((entry) => entry.nextAction.includes('PASS ≠ RELEASED')),
    ).toBe(true);
  });

  it('cites only canonical permission codes', () => {
    const unknown = HELP_PERMISSION_CITATIONS.filter((code) => !isPermissionCode(code));
    expect(unknown).toEqual([]);
    expect(HELP_PERMISSION_CITATIONS.length).toBeGreaterThan(0);
    expect(new Set(HELP_PERMISSION_CITATIONS).size).toBe(HELP_PERMISSION_CITATIONS.length);
    expect(PERMISSION_CODES.length).toBeGreaterThanOrEqual(HELP_PERMISSION_CITATIONS.length);
  });
});

describe('guide document links match the current route registry', () => {
  it.each([GUIDE_DOC, SUPPORT_DOC])('has no dead route reference in %s', (doc) => {
    const routes = extractBacktickRoutes(read(doc)).filter(
      // /api/* are HTTP endpoints, not canonical browser routes.
      (path) => !path.startsWith('/api/'),
    );
    const dead = routes.filter((path) => !getRouteByPathname(path.split('?')[0]!));
    expect(dead).toEqual([]);
  });
});

describe('printable help surface contract', () => {
  const page = read(HELP_PAGE);

  it('renders through the shared shell and never resolves a route silently', () => {
    expect(page).toContain("from '../../ui/layouts/AppLayout.astro'");
    expect(page).toContain('getRouteById');
    expect(page).toContain('unregistered route');
  });

  it('offers a print affordance and a print stylesheet', () => {
    expect(page).toContain('data-print-guide');
    expect(page).toContain('window.print()');
    expect(page).toContain('@media print');
  });

  it('keeps a programmatic caption and row identity on its troubleshooting table', () => {
    expect(page).toContain('<table');
    expect(page).toContain('<caption>');
    expect(page).toContain('scope="row"');
  });

  it('ships no native confirm/alert/prompt control', () => {
    expect(page).not.toMatch(/\b(window\.)?(confirm|alert|prompt)\s*\(/);
  });

  it('states the read-only and separation-of-duty facts without inventing authority', () => {
    expect(page).toContain('PASS ≠ RELEASED');
    expect(page).toContain('Admin is never the approver');
  });

  it('renders the screen/state guidance matrix with an informational-vs-mutation boundary (QC-100-FINAL-021)', () => {
    expect(page).toContain('id="guidance-matrix"');
    expect(page).toContain('HELP_GUIDANCE_MATRIX');
    expect(page).toContain('Informational steps');
    expect(page).toContain('authorized mutations (approve, release, sign) commit only when the server accepts');
    expect(page).toContain('scope="row"');
  });

  it('keeps the mutation-authority disclaimer in the shared content module', () => {
    expect(read('src/shared/copy/help-content.ts')).toContain(
      'Page visibility does not grant mutation authority',
    );
  });
});

describe('guide surfaces expose no secrets or raw diagnostics', () => {
  const secretPatterns = [
    /postgres(ql)?:\/\//i,
    /DATABASE_URL\s*=/i,
    /password\s*[:=]\s*\S+/i,
    /secret\s*[:=]\s*\S+/i,
    /-----BEGIN [A-Z ]+-----/,
    /\bsk-[A-Za-z0-9]{12,}/,
    /\bghp_[A-Za-z0-9]{12,}/,
  ];

  it.each([HELP_PAGE, 'src/shared/copy/help-content.ts', GUIDE_DOC, SUPPORT_DOC])(
    'contains no secret-like value in %s',
    (file) => {
      const source = read(file);
      const hits = secretPatterns.filter((pattern) => pattern.test(source));
      expect(hits.map(String)).toEqual([]);
    },
  );
});
