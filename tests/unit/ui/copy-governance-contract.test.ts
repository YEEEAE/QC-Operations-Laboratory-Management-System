import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  stateLabel,
  targetTypeLabel,
  workflowTypeLabel,
  uxVocabulary,
} from '../../../src/shared/copy/ux-vocabulary.js';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

/**
 * QC-100-FINAL-023 content-design / terminology-governance contract.
 *
 * Presentation only. Server authorization, state machines, SoD, E-Signature,
 * and audit rules always outrank wording, and regulated terms (PASS, FAIL,
 * HOLD, RELEASED, VOID, NCR, CAPA) keep their exact spelling.
 */
describe('governed lifecycle vocabulary', () => {
  it('keeps saved, submitted, reviewed, approved and released distinct', () => {
    const { saved, submitted, reviewed, approved, released } = uxVocabulary.lifecycle;
    const all = [saved, submitted, reviewed, approved, released];
    expect(new Set(all).size).toBe(all.length);
    // Each word states its own boundary instead of implying the next one.
    expect(saved).toContain('draft');
    expect(saved).toContain('Nothing was submitted');
    expect(submitted).toContain('No review, approval, or release');
    expect(reviewed).toContain('does not approve or release');
    expect(approved).toContain('does not release');
    expect(released).toContain('separate policy-controlled release action');
  });

  it('maps controlled codes to human labels without inventing values', () => {
    expect(stateLabel('IN_REVIEW')).toBe('In review');
    expect(stateLabel('EFFECTIVE')).toBe('Effective');
    expect(stateLabel('SUPERSEDED')).toBe('Superseded');
    expect(stateLabel('APPLICATION_FAILED')).toBe('Application failed');
    expect(stateLabel('PENDING_QCM_APPROVAL')).toBe('Pending QCM approval');
    expect(stateLabel('ISSUED')).toBe('Issued');
    expect(stateLabel('APPROVAL_TRACKING')).toBe('Awaiting approvals');
    expect(stateLabel('FINALIZED')).toBe('Finalized');
    // Regulated terms are never renamed by the glossary.
    expect(stateLabel('PASS')).toBe('PASS');
    expect(stateLabel('FAIL')).toBe('FAIL');
    expect(stateLabel('HOLD')).toBe('HOLD');
    expect(stateLabel('RELEASED')).toBe('RELEASED');
    expect(stateLabel('VOID')).toBe('VOID');
  });

  it('maps change-request target types and approval workflow types', () => {
    expect(targetTypeLabel('DOCUMENT_VERSION')).toBe('Controlled document version');
    expect(targetTypeLabel('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE');
    expect(targetTypeLabel(null)).toBe('Not supplied');
    expect(workflowTypeLabel(null)).toBe('Not supplied');
    // A code with no approved mapping is passed through, never guessed.
    expect(workflowTypeLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });
});

describe('facts render human labels, never raw enums', () => {
  it('document and laboratory facts humanize their controlled state', () => {
    const labTest = read('src/pages/laboratory/tests/[labTestId]/index.astro');
    expect(labTest).toContain('stateLabel(test.state)');
    expect(labTest).not.toMatch(/State: <strong>\{test\.state\}/);

    const version = read('src/pages/documents/[documentId]/versions/[versionId]/index.astro');
    expect(version).toContain('Lifecycle state</span><strong>{stateLabel(version.state)}');
    expect(version).toContain('currentState={stateLabel(version.state)}');
    expect(version).not.toMatch(/label=\{version\.state\}/);
  });

  it('inspection review and change-request surfaces humanize their state', () => {
    const review = read('src/pages/quarantine/inspections/[inspectionId]/review.astro');
    expect(review).toContain('Workflow state</dt><dd>{stateLabel(inspection.state)}');

    for (const page of [
      'src/pages/change-requests/index.astro',
      'src/pages/change-requests/[changeRequestId]/index.astro',
    ]) {
      const source = read(page);
      expect(source, page).toMatch(/stateLabel\(changeRequest\.state\)/);
      expect(source, page).toContain('targetTypeLabel(');
      expect(source, page).not.toMatch(/label=\{changeRequest\.state\}/);
    }
  });

  it('audit transitions never render "not set to not set"', () => {
    const receiving = read('src/pages/quarantine/receiving/[receivingId].astro');
    expect(receiving).toContain('transitionLabel(event.oldState, event.newState)');
    expect(receiving).not.toMatch(/\{event\.oldState \?\? 'not set'\} to \{event\.newState/);
  });

  it('reject-report registers use the same labels as their detail pages', () => {
    const register = read('src/pages/reject-reports/index.astro');
    expect(register).toContain('stateLabel(slip.status)');
    expect(register).toContain('stateLabel(record.status)');
    expect(register).toContain('stateLabel(report.status)');
    expect(register).not.toMatch(/>\{record\.status\}</);
    expect(register).not.toMatch(/>\{slip\.status\}</);
  });
});

describe('registers speak in human numbers, not technical IDs', () => {
  it('no register keeps an "ID" column heading over a human number', () => {
    const registers = [
      'src/pages/quarantine/receiving/index.astro',
      'src/pages/quarantine/inspections/index.astro',
      'src/pages/laboratory/tests/index.astro',
      'src/pages/quality/findings/index.astro',
      'src/pages/documents/[documentId]/versions/[versionId]/index.astro',
    ];
    for (const page of registers) {
      expect(read(page), page).not.toMatch(/scope="col">[A-Za-z ]* ID<\/th>/);
    }
  });

  it('create forms name the human number they expect', () => {
    const receiving = read('src/pages/quarantine/receiving/new.astro');
    const findings = read('src/pages/quality/findings/new.astro');
    expect(receiving).toContain('>Receiving number');
    expect(receiving).not.toContain('>Receiving ID');
    expect(findings).toContain('>Finding number');
    expect(findings).not.toContain('>Finding ID');
  });

  it('register person columns resolve a display name, never a raw account id', () => {
    const cases: Array<[string, RegExp]> = [
      ['src/pages/laboratory/tests/index.astro', /\{test\.authorId\}/],
      ['src/pages/quarantine/inspections/index.astro', /\{inspection\.authorId\}/],
      ['src/pages/quality/findings/index.astro', /\{finding\.ownerId \?\?/],
      ['src/pages/documents/index.astro', /\{document\.ownerId \?\?/],
    ];
    for (const [page, rawPattern] of cases) {
      const source = read(page);
      expect(source, page).not.toMatch(rawPattern);
      expect(source, page).toContain('Named account');
    }
    const approvals = read('src/pages/approvals/index.astro');
    expect(approvals).not.toMatch(/<td>\{item\.approvalCase\.requestedBy\}<\/td>/);
    expect(approvals).toContain('workflowTypeLabel(');
  });
});

describe('empty, filtered-empty and unavailable stay distinct', () => {
  it('the shared outage state never reads as an empty result', () => {
    expect(uxVocabulary.states.providerUnavailableDetail).toMatch(/not empty/i);
    const shared = read('src/ui/components/feedback/ProviderUnavailableState.astro');
    expect(shared).toContain('copy.states.providerUnavailableDetail');
    expect(shared.toLowerCase()).not.toMatch(/no records|no results|0 results/);
  });

  it('registers separate an outage from a filtered-empty and a truly-empty view', () => {
    const registers = [
      'src/pages/quarantine/receiving/index.astro',
      'src/pages/quarantine/inspections/index.astro',
      'src/pages/laboratory/tests/index.astro',
      'src/pages/quality/findings/index.astro',
      'src/pages/change-requests/index.astro',
      'src/pages/tasks/index.astro',
    ];
    for (const page of registers) {
      const source = read(page);
      // The outage branch is a distinct, explicit state...
      expect(source, page).toMatch(/ProviderUnavailableState/);
      expect(source, page).toMatch(/providerUnavailable/);
      // ...and the filtered-empty branch is named separately (never merged).
      expect(source, page).toMatch(/hasFilters|\bstate \?/);
    }
  });

  it('never claims data is retained unless the surface preserved the entry', () => {
    // Guaranteed-retention wording is only used where the form keeps the
    // submitted values; every message still names its class.
    const classes = uxVocabulary.errorClasses;
    expect(classes.VALIDATION_ERROR).toContain('preserved');
    expect(classes.AUTHORIZATION_CHANGED).toContain('preserved');
    expect(classes.CONFLICT_STALE).toContain('Nothing was resubmitted');
    expect(classes.DUPLICATE_COMMAND).toContain('nothing was duplicated');
    for (const message of Object.values(classes)) {
      expect(message.toLowerCase()).not.toMatch(
        /something went wrong|unexpected error|an error occurred|try again later\.$/,
      );
    }
  });
});
