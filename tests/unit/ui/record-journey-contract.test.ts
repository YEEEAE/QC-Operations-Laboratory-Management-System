import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const read = (file: string) => readFileSync(join(root, file), 'utf8');

describe('record journey linkage contract (QC-100-FINAL-024)', () => {
  it('exposes the audit reason without payload leakage on /audit', () => {
    const page = read('src/pages/audit.astro');
    // The immutable-history surface shows the recorded reason (correction
    // semantics) but never selects or renders the raw payload column.
    expect(page).toContain('Reason');
    expect(page).toContain('event.reason');
    expect(page).toContain('Not recorded');
    expect(page).not.toContain('event.payload');
    expect(page).not.toContain('payload');
  });

  it('resolves finding -> NCR linkage through the NCR domain scoped read', () => {
    const helper = read('src/modules/quality/findings/application/list-related-ncrs.ts');
    expect(helper).toContain('PostgresNcrRepository');
    expect(helper).toContain('repository.list({ actor })');
    // Provenance stays with the owning domain; no direct table access here.
    expect(helper).not.toContain("selectFrom('ncrs')");
    expect(helper).toContain('presentation only');
  });

  it('renders the NCR detail page with real reads and related finding/CAPA linkages', () => {
    const page = read('src/pages/quality/ncr/[ncrId].astro');
    expect(page).toContain('JourneyContextPanel');
    expect(page).toContain('PostgresNcrRepository');
    expect(page).toContain('PostgresCapaRepository');
    expect(page).toContain('listFindingsForActor');
    expect(page).toContain('audit?subjectType=NCR');
    expect(page).toContain('read-only linkage');
    // Scope protection: a missing/forbidden source finding is stated, never
    // silently hidden and never guessed.
    expect(page).toContain('not visible in your authorized scope');
  });

  it('keeps the CAPA page read-only toward NCR state and links the source NCR', () => {
    const page = read('src/pages/quality/capa/[capaId].astro');
    expect(page).toContain('PostgresNcrRepository');
    expect(page).toContain('Source NCR');
    expect(page).toContain('mutation\n// authority over NCR state');
    expect(page).toContain('audit?subjectType=CAPA');
  });

  it('links the lab test to its source receiving record with scope preserved', () => {
    const helper = read('src/modules/laboratory/application/get-source-receiving.ts');
    expect(helper).toContain('source_receiving_item_id');
    expect(helper).toContain('PERM-LAB-VIEW');
    expect(helper).toContain('testRow.author_id !== actor.id');
    expect(helper).not.toContain('UPDATE');
    const page = read('src/pages/laboratory/tests/[labTestId]/index.astro');
    expect(page).toContain('getSourceReceivingForLabTest');
    expect(page).toContain('Source receiving');
    // Provenance framing: the receiving link never carries receiving mutation
    // authority into the laboratory page.
    expect(page).toContain('does\n// not transfer any receiving mutation authority');
  });

  it('states the retest path as policy-derived instead of declaring it unavailable', () => {
    const page = read('src/pages/laboratory/tests/[labTestId]/index.astro');
    expect(page).toContain('P-05 policy');
    expect(page).not.toContain('currently unavailable until the approved laboratory retest policy');
  });

  it('keeps handoff queue contracts authoritative — no invented escalation policy', () => {
    // The workspace queue (QC-100-FINAL-022) remains the only queue surface;
    // its definitions carry no SLA/target/escalation promise that no approved
    // policy defines.
    const definitions = read('src/modules/dashboard/application/my-work-definitions.ts');
    expect(definitions).not.toMatch(/\bsla\b|\bescalat(e|ion|ing)\b/i);
  });
});
