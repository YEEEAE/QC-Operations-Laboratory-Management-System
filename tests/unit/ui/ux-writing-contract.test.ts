import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  stateLabel,
  severityLabel,
  transitionLabel,
  releaseStateLabel,
  uxVocabulary,
} from '../../../src/shared/copy/ux-vocabulary.js';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

/**
 * QC-100-FINAL-018 UX-writing regression contract.
 *
 * Presentation only. Server authorization, state machines, SoD, E-Signature,
 * and audit rules always outrank wording. Regulated terms (PASS, FAIL, HOLD,
 * RELEASED, VOID, NCR, CAPA) keep their exact spelling everywhere.
 */
describe('ux vocabulary module', () => {
  it('keeps regulated state codes exact', () => {
    expect(stateLabel('PASS')).toBe('PASS');
    expect(stateLabel('FAIL')).toBe('FAIL');
    expect(stateLabel('HOLD')).toBe('HOLD');
    expect(stateLabel('RELEASED')).toBe('RELEASED');
    expect(stateLabel('VOID')).toBe('VOID');
    expect(stateLabel(null)).toBe('—');
  });

  it('humanizes non-regulated state codes to sentence case', () => {
    expect(stateLabel('UNDER_REVIEW')).toBe('Under review');
    expect(stateLabel('OUT_OF_SERVICE')).toBe('Out of service');
    expect(stateLabel('READY_FOR_INSPECTION')).toBe('Ready for inspection');
  });

  it('renders severity in human words and never invents a value', () => {
    expect(severityLabel('CRITICAL')).toBe('Critical');
    expect(severityLabel('major')).toBe('Major');
    expect(severityLabel(null)).toBe('Not classified');
  });

  it('never renders an empty audit transition', () => {
    expect(transitionLabel(undefined, undefined)).toBe('Created');
    expect(transitionLabel('DRAFT', 'SUBMITTED')).toBe('Draft → Submitted');
    expect(transitionLabel(null, 'APPROVED')).toBe('→ Approved');
  });

  it('keeps the release boundary wording pinned', () => {
    expect(releaseStateLabel(true)).toBe('RELEASED');
    expect(releaseStateLabel(false)).toBe('Not released');
    expect(uxVocabulary.boundaries.passNotRelease).toContain('does not release');
    expect(uxVocabulary.boundaries.aiNotAuthority).toContain('advisory only');
  });

  it('distinguishes every error class from a generic failure', () => {
    const classes = Object.values(uxVocabulary.errorClasses);
    expect(new Set(classes).size).toBe(classes.length);
    for (const message of classes) {
      expect(message.toLowerCase()).not.toMatch(
        /something went wrong|unexpected error|an error occurred/,
      );
    }
  });
});

describe('pages render humanized states instead of raw enums', () => {
  it('finding detail and register use stateLabel/severityLabel', () => {
    expect(read('src/pages/quality/findings/[findingId].astro')).toContain(
      'stateLabel(finding.state)',
    );
    expect(read('src/pages/quality/findings/index.astro')).toContain(
      'severityLabel(finding.severity)',
    );
    expect(read('src/pages/quality/findings/index.astro')).not.toMatch(
      /<td>\{finding\.state\}<\/td>/,
    );
  });

  it('asset registers and details humanize state cells and filter options', () => {
    for (const page of [
      'src/pages/assets/equipment/index.astro',
      'src/pages/assets/calibrations/index.astro',
      'src/pages/assets/maintenance/index.astro',
      'src/pages/assets/equipment/[equipmentId].astro',
      'src/pages/assets/calibrations/[calibrationId].astro',
      'src/pages/assets/maintenance/[maintenanceId].astro',
    ]) {
      const source = read(page);
      expect(source, page).toContain('stateLabel(');
      expect(source, page).not.toMatch(/class="state">\{[a-z]+\.state\}<\/span>/);
      expect(source, page).not.toMatch(/<td>\{item\.state\}<\/td>/);
      expect(source, page).not.toMatch(/<td>\{record\.state\}<\/td>/);
    }
  });

  it('uses human number columns instead of ID headings in asset tables', () => {
    for (const page of [
      'src/pages/assets/equipment/index.astro',
      'src/pages/assets/calibrations/index.astro',
      'src/pages/assets/maintenance/index.astro',
    ]) {
      expect(read(page), page).not.toMatch(/scope="col">[A-Za-z]+ ID<\/th>/);
    }
  });

  it('keeps the receiving detail facts block regulated and distinct (E2E pin)', () => {
    const detail = read('src/pages/quarantine/receiving/[receivingId].astro');
    expect(detail).toContain('Receiving state');
    expect(detail).toContain('Inspection result');
    expect(detail).toContain('Release System State');
    expect(detail).toMatch(/NOT_RELEASED/);
  });

  it('backup pages label job state as a human value, not restore evidence', () => {
    const detail = read('src/pages/system/backups/[backupId]/index.astro');
    expect(detail).toContain('stateLabel(backup.state)');
    expect(detail).not.toContain('{backup.state} (execution result only)');
  });
});

describe('error and empty-state copy hygiene', () => {
  it('error pages each keep one clear action', () => {
    const notFound = read('src/pages/404.astro');
    const server = read('src/pages/500.astro');
    expect(notFound.match(/<a href=/g)?.length ?? 0).toBe(1);
    expect(server.match(/<a href=/g)?.length ?? 0).toBe(1);
    for (const page of [notFound, server]) {
      expect(page.toLowerCase()).not.toMatch(/something went wrong|unexpected error/);
    }
  });

  it('mutation forms never show a generic system failure', () => {
    for (const page of [
      'src/pages/admin/users/new.astro',
      'src/pages/system/backups/[backupId]/restore.astro',
    ]) {
      const source = read(page);
      expect(source.toLowerCase()).not.toMatch(
        /something went wrong|unexpected error|an error occurred/,
      );
    }
  });

  it('admin user creation labels scope kinds in human words', () => {
    const source = read('src/pages/admin/users/new.astro');
    expect(source).toContain('scopeKindLabels');
    expect(source).not.toMatch(/>\{kind\}<\/label>/);
  });
});
