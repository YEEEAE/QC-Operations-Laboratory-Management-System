import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

/**
 * QC-100-FINAL-026 — requirements reconciliation contract.
 *
 * Verifies the reconciliation register and gap/risk priority matrix structure
 * plus the executable guard. This is a documentation/traceability contract
 * only: it does not claim runtime, UAT, or release evidence, and it never
 * converts a missing external dependency into a completion.
 */
describe('QC-100-FINAL-026 requirements reconciliation contract', () => {
  it('executable reconciliation guard passes on current documents', () => {
    const out = execFileSync('node', ['scripts/requirements/check-reconciliation.mjs'], {
      encoding: 'utf8',
    });
    expect(out).toContain('requirements=100');
    expect(out).toContain('risks=34');
    expect(out).toContain('gaps=20');
    expect(out).toContain('domains=80');
  });

  it('register keeps capability classes honest (no required feature downgraded)', () => {
    const recon = read('Documents/REQUIREMENTS-RECONCILIATION.md');
    const optional = [
      ...recon.matchAll(
        /\| (REQ-[A-Z]+-\d{3}) \| (RC-\d{2}-\d{3}) \| [^|]*\| [^|]*\| [^|]*\| [^|]*\| OPTIONAL \|/g,
      ),
    ];
    const optionalIds = optional.map((m) => m[1]).sort();
    // Only genuinely optional capabilities may be OPTIONAL.
    expect(optionalIds).toEqual(['REQ-AIGV-008', 'REQ-OPS-012', 'REQ-SCOPE-005', 'REQ-SCOPE-006']);
  });

  it('priority matrix never fabricates likelihood or severity', () => {
    const prio = read('Documents/GAP-RISK-PRIORITY-MATRIX.md');
    for (const line of prio.split('\n')) {
      if (!/^\| (G-026-|RISK-)/.test(line.trimStart())) continue;
      expect(line).toContain('ASSESSMENT REQUIRED');
      if (line.trimStart().startsWith('| G-026-')) expect(line).toContain('NOT YET RATED');
    }
  });

  it('legacy requirement IDs remain stable (folded verbatim, never renumbered)', () => {
    const trace = read('Documents/REQUIREMENTS-TRACEABILITY.md');
    const recon = read('Documents/REQUIREMENTS-RECONCILIATION.md');
    const legacyIds = new Set<string>();
    for (const line of trace.split('\n')) {
      if (!line.trimStart().startsWith('|')) continue;
      for (const m of line.matchAll(/REQ-[A-Z]+-\d{3}/g)) legacyIds.add(m[0]);
    }
    for (const id of legacyIds) {
      expect(recon.includes(id), `legacy ID ${id} missing from reconciliation register`).toBe(true);
    }
  });

  it('register states the unchanged 80-domain denominator and PASS != RELEASED', () => {
    const recon = read('Documents/REQUIREMENTS-RECONCILIATION.md');
    expect(recon).toContain('80-domain scoring denominator is unchanged');
    expect(recon).toContain('PASS ≠ RELEASED');
    expect(read('Documents/GAP-RISK-PRIORITY-MATRIX.md')).toContain(
      'no required feature was or may be reclassified as OPTIONAL',
    );
  });

  it('phase B carries every open/partial policy decision with owner and evidence fields', () => {
    const out = execFileSync('node', ['scripts/requirements/check-reconciliation.mjs'], {
      encoding: 'utf8',
    });
    expect(out).toContain('decisions=33');
    expect(out).toContain('assumptions=5');
    expect(out).toContain('mappedDomains=7');
    const register = read('Documents/DECISION-ASSUMPTION-REGISTER-026.md');
    expect(register).toContain('PD-01');
    expect(register).toContain('PD-38');
    expect(register).toContain('Evidence required to resolve');
  });

  it('extended disciplines map only to the seven supplied existing domains', () => {
    const register = read('Documents/DECISION-ASSUMPTION-REGISTER-026.md');
    const crosswalk = register.split('## 4. Extended discipline crosswalk')[1]?.split('## 5.')[0];
    expect(crosswalk).toBeDefined();
    const domains = [...(crosswalk ?? '').matchAll(/#(\d{1,2})\b/g)].map((m) => Number(m[1]));
    expect([...new Set(domains)].sort((a, b) => a - b)).toEqual([1, 21, 42, 53, 60, 61, 80]);
    expect(register).toContain('does not create or score these disciplines as additional domains');
  });
});
