import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const read = (file: string) => readFileSync(join(root, file), 'utf8');

describe('journey handoff presentation contract', () => {
  it('keeps the shared context panel read-only and explicit about handoff facts', () => {
    const panel = read('src/ui/components/workflow/JourneyContextPanel.astro');
    for (const label of [
      'Current state',
      'Record owner',
      'Evidence recorded',
      'Evidence required',
      'Not supplied by record source',
      'Next action',
      'Next owner',
      'Why unavailable',
      'Waiting / dependency',
      'Evidence and trace',
      'View audit history for this record',
    ])
      expect(panel).toContain(label);
    expect(panel).not.toContain('<form');
    expect(panel).not.toContain('astro:actions');
  });

  it('keeps the timeline facts separate and does not imply notification authorization', () => {
    const timeline = read('src/ui/components/workflow/HandoffTimeline.astro');
    expect(timeline).toContain('Operational timeline');
    expect(timeline).toContain('Facts stay separate');
    expect(timeline).toContain('Notification delivery');
    expect(timeline).not.toContain('business transition');
  });

  it('distinguishes informational navigation from authorized mutation (QC-100-FINAL-021)', () => {
    const panel = read('src/ui/components/workflow/JourneyContextPanel.astro');
    expect(panel).toContain('Links on this panel only open workspaces');
    expect(panel).toContain('mutation commits solely when the server accepts it');
    expect(panel).toContain('Approval stage');
    expect(panel).toContain('Prerequisites');
    expect(panel).toContain("data-met={item.met ? 'yes' : 'no'}");
  });

  it('keeps prerequisite state derived per record, not hardcoded promises', () => {
    const panel = read('src/ui/components/workflow/JourneyContextPanel.astro');
    // Prerequisite entries must come through props (read-model derived), and
    // met/not-met is data-driven so the same panel serves denied/stale states.
    expect(panel).toMatch(/prerequisites\?\s*\.length/);
    expect(panel).toMatch(/item\.met \? 'Met/);
  });

  it('separates the owning domain from the assigned record owner and names missing source fields', () => {
    const panel = read('src/ui/components/workflow/JourneyContextPanel.astro');
    expect(panel).toContain('Owning domain: {ownerDomain}');
    expect(panel).toContain("recordOwner ?? 'Not supplied by record source'");
    expect(panel).toContain(
      "requiredEvidence ?? 'Required-evidence list not supplied by record source'",
    );
    expect(panel).not.toContain('Owner: {ownerDomain}');
  });

  it('wires the handoff panel to every requested remaining workspace', () => {
    const pages = [
      'src/pages/documents/[documentId]/versions/[versionId]/index.astro',
      'src/pages/approvals/[approvalId].astro',
      'src/pages/change-requests/[changeRequestId]/index.astro',
    ];
    for (const page of pages) {
      const source = read(page);
      expect(source, page).toContain('JourneyContextPanel');
      expect(source, page).toContain('audit?subjectType=');
    }
    expect(read('src/pages/approvals/[approvalId].astro')).toContain('HandoffTimeline');
    expect(read('src/pages/change-requests/[changeRequestId]/index.astro')).toContain(
      'HandoffTimeline',
    );
  });

  it('links the dashboard to valid HOLD, review, and PASS-not-released filters', () => {
    const dashboard = read('src/pages/dashboard/index.astro');
    const receivingFilter = read(
      'src/modules/quarantine/receiving/application/receiving-filters.ts',
    );
    const receivingStates = read('src/modules/quarantine/receiving/domain/receiving-state.ts');
    const receivingStatus = read('src/modules/quarantine/receiving/domain/receiving-status.ts');
    const inspectionPage = read('src/pages/quarantine/inspections/index.astro');
    const labPage = read('src/pages/laboratory/tests/index.astro');

    expect(receivingStates).toContain("'HOLD'");
    expect(receivingStatus).toContain("'PASS'");
    expect(receivingStatus).toContain("'NOT_RELEASED'");
    expect(receivingFilter).toContain("params.get('inspectionResult')");
    expect(receivingFilter).toContain("params.get('releaseState')");
    expect(inspectionPage).toContain("'SUBMITTED'");
    expect(labPage).toContain("'SUBMITTED'");
    expect(dashboard).toContain('/quarantine/receiving?state=HOLD');
    expect(dashboard).toContain('/quarantine/inspections?state=SUBMITTED');
    expect(dashboard).toContain('/laboratory/tests?state=SUBMITTED');
    expect(dashboard).toContain(
      '/quarantine/receiving?inspectionResult=PASS&amp;releaseState=NOT_RELEASED',
    );
    expect(dashboard).toContain('PASS and Released are separate');
  });

  it('retains receiving and lab inputs after rejected or unavailable actions', () => {
    const receiving = read('src/pages/quarantine/receiving/[receivingId].astro');
    const labExecution = read('src/pages/laboratory/tests/[labTestId]/execute.astro');
    const labReview = read('src/pages/laboratory/tests/[labTestId]/review.astro');

    expect(receiving).toContain('retainedValues[name] = value');
    expect(receiving).toContain("retained('qty', String(item.qty))");
    expect(receiving).toContain("retained('reason', '', 'correct')");
    expect(labExecution).toContain('Your entries are kept on this page');
    expect(labExecution).toContain('Observations were not saved');
    expect(labReview).not.toContain('form.reset()');
    expect(labExecution).toContain('the official result is returned by the server');
  });
});
