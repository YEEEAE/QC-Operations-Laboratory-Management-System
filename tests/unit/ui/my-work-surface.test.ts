import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * QC-100-FINAL-022 items 1 and 2 — the workspace's static contract.
 *
 * The queue cannot regress into a second dashboard: the definitions live in the
 * read model, the page renders them instead of hard-coding claims, each group
 * declares whose work it is and which clock it resolves in, and every
 * drill-down link names a register that parses the parameters it carries.
 */
const root = fileURLToPath(new URL('../../..', import.meta.url));
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const DEFINITIONS = 'src/modules/dashboard/application/my-work-definitions.ts';
const PORT = 'src/modules/dashboard/ports/my-work.ts';
const PAGE = 'src/pages/work/index.astro';

describe('My work today workspace', () => {
  it('declares the four approved groups with ownership, scope, clock and source timestamp', () => {
    const definitions = read(DEFINITIONS);
    for (const category of ['ASSIGNED', 'DUE_TODAY', 'OVERDUE', 'BLOCKED']) {
      expect(definitions, category).toContain(`${category}: {`);
    }
    for (const field of [
      'membership:',
      'ownership:',
      'actorScope:',
      "timezone: 'UTC'",
      'sourceTimestamp:',
      'predicate:',
    ]) {
      const occurrences = (
        definitions.match(new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []
      ).length;
      expect(occurrences, field).toBe(4);
    }
    // The port is the single vocabulary: no fifth category exists.
    const port = read(PORT);
    expect(port).toContain(
      "export type MyWorkCategory = 'ASSIGNED' | 'DUE_TODAY' | 'OVERDUE' | 'BLOCKED';",
    );
    expect(port).toContain('export const MY_WORK_CATEGORIES');
  });

  it('invents no threshold, target or service level', () => {
    // The queue states set membership and time windows only. Inside the
    // definitions themselves nothing may introduce a duration, an urgency
    // score or a goal — the only boundary named is the UTC day itself.
    const definitions = read(DEFINITIONS);
    const start = definitions.indexOf('export const MY_WORK_GROUP_DEFINITIONS');
    const end = definitions.indexOf('export const MY_WORK_UNRESOLVED_SOURCES');
    const objectLiterals = definitions.slice(start, end);
    expect(objectLiterals.length).toBeGreaterThan(0);
    for (const invented of [
      'sla',
      'service level',
      'threshold',
      'urgency',
      'hours',
      'minutes',
      'escalat',
    ]) {
      expect(objectLiterals.toLowerCase(), invented).not.toContain(invented);
    }
    // Only whole UTC days appear, and they are stated as day boundaries.
    expect(objectLiterals).toContain('UTC midnight of the current day');
  });

  it('records the unresolved sources with a reason and an owner instead of a zero', () => {
    const definitions = read(DEFINITIONS);
    for (const key of [
      'blocked-reason-text',
      'equipment-eligibility-blocks',
      'unassigned-work-in-my-scope',
      'reject-report-analytics',
    ]) {
      expect(definitions, key).toContain(`key: '${key}'`);
    }
    expect(definitions).not.toContain("key: 'document-review-queue'");
    expect(read('src/modules/dashboard/application/dashboard-sources.ts')).toContain(
      "key: 'documents-pending-my-review'",
    );
    expect(read(PAGE)).toContain('unresolvedSources');
    expect(read(PAGE)).toContain('What this queue cannot answer yet');
  });

  it('renders the queue from the read model rather than page-local claims or SQL', () => {
    const page = read(PAGE);
    expect(page).toContain('layouts/AppLayout.astro');
    expect(page).toContain('myWorkDependencies().get.execute(actor)');
    expect(page).toContain('groups.map');
    expect(page).toContain('group.definition.membership');
    expect(page).toContain('group.definition.predicate');
    expect(page).toContain('item.nextAction');
    expect(page).toContain('item.responsibleRole');
    expect(page).toContain('ProviderUnavailableState');
    // A group with no total says so; it never falls back to a zero.
    expect(page).toContain('<span class="no-count">No total for your account</span>');
    // No business SQL and no direct database access on the page.
    expect(page).not.toContain('selectFrom');
    expect(page).not.toContain('FROM qc.');
    expect(page).not.toContain('getDatabase');
    // Readable type floor and logical properties only.
    expect(page).not.toMatch(/font-size:\s*1[01]px/);
    expect(page).not.toMatch(/(padding|margin)-(left|right):/);
  });

  it('is a registered route reachable from the primary navigation', () => {
    const routes = read('src/shared/routing/routes.ts');
    expect(routes).toContain(
      "'RT-WORK-001', '/work', 'src/pages/work/index.astro', 'authenticated', 'required'",
    );
    expect(routes).toContain("work: 'dashboard',");
    const navigation = read('src/ui/navigation/navigation.ts');
    expect(navigation).toContain("{ id: 'my-work', label: 'My work today', href: '/work'");
  });

  it('declares only drill-down links whose parameters the target register parses', () => {
    const sources = read('src/modules/dashboard/application/dashboard-sources.ts');
    const pages: Readonly<Record<string, string>> = {
      '/approvals': 'src/pages/approvals/index.astro',
      '/notifications': 'src/pages/notifications.astro',
      '/quarantine/receiving': 'src/pages/quarantine/receiving/index.astro',
      '/quarantine/inspections': 'src/pages/quarantine/inspections/index.astro',
      '/tasks': 'src/pages/tasks/index.astro',
      '/assets/calibrations': 'src/pages/assets/calibrations/index.astro',
      '/laboratory/tests': 'src/pages/laboratory/tests/index.astro',
      '/documents': 'src/pages/documents/index.astro',
    };
    // `href` is the register path; `drilldown` states the same filter in query
    // form, so the parameters checked here are the ones the link really opens.
    const queueHrefs = [...sources.matchAll(/href: '([^']+)'/g)].map((match) => match[1]!);
    expect(queueHrefs.length).toBeGreaterThan(0);
    expect([...sources.matchAll(/drilldown:/g)].length).toBe(queueHrefs.length);
    for (const href of queueHrefs) {
      const url = new URL(href, 'http://localhost');
      const page = pages[url.pathname];
      expect(page, `no register mapped for ${href}`).toBeTruthy();
      const source = read(page!);
      for (const param of url.searchParams.keys()) {
        expect(source, `${href} → ${page} must parse ${param}`).toContain(`'${param}'`);
      }
    }
    // The two new count sources resolve to the tasks register, whose new
    // still-open and single-state filters are implemented server-side.
    expect(queueHrefs).toContain('/tasks?assignee=mine&open=1');
    expect(queueHrefs).toContain('/tasks?assignee=mine&state=ON_HOLD');
    const tasksRegister = read('src/modules/tasks/infrastructure/postgres-repository.ts');
    expect(tasksRegister).toContain('filter?.open');
    expect(tasksRegister).toContain('CLOSED_TASK_STATES');
  });

  it('gives every queue source the membership metadata the workspace renders', () => {
    const sources = read('src/modules/dashboard/application/dashboard-sources.ts');
    const denominators = (sources.match(/denominator:/g) ?? []).length;
    for (const field of ['category:', 'nextAction:', 'responsibleRole:']) {
      const occurrences = (sources.match(new RegExp(field, 'g')) ?? []).length;
      // One membership per queue source; not every dashboard counter is personal work.
      expect(occurrences, field).toBeGreaterThan(0);
      expect(occurrences, field).toBeLessThan(denominators);
    }
    // The dashboard-only counters are explicitly outside the personal queue.
    for (const key of ["key: 'unread-notifications'", "key: 'calibrations-overdue'"]) {
      expect(sources, key).toContain(key);
    }
  });
});
