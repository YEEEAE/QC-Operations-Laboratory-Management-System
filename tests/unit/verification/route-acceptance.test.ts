import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildScenarios,
  digestInputs,
  evaluateEvidence,
  readAuditCards,
} from '../../../scripts/verification/route-acceptance.mjs';

const candidate = {
  gitSha: 'a'.repeat(40),
  sourceFingerprint: 'b'.repeat(64),
  migrationHead: '0042',
  schemaDigest: 'c'.repeat(64),
  buildId: 'build-1',
};
const scenario = {
  id: 'RT-TASK-003:direct-denial',
  routeId: 'RT-TASK-003',
  kind: 'direct-denial',
  expectedOutcome: 'AUTHZ_PERMISSION_MISSING',
  personas: ['qc-01'],
};
const evidence = () => ({
  candidate: { ...candidate },
  scenarioId: scenario.id,
  routeId: scenario.routeId,
  appliedSchema: { head: candidate.migrationHead, digest: candidate.schemaDigest },
  personaId: 'qc-01',
  fixture: { reference: 'UAT-TASK-1', state: 'OPEN', permissions: [], scopes: ['OWN'] },
  expectedOutcome: 'AUTHZ_PERMISSION_MISSING',
  actualOutcome: 'AUTHZ_PERMISSION_MISSING',
  command: 'direct HTTP POST',
  evidenceReference: 'audit/test.json',
  executedAt: '2026-09-30T00:00:00Z',
  positiveReadControl: true,
  validExistingRecord: true,
  authorizationDenialCode: 'AUTHZ_PERMISSION_MISSING',
  beforeDigest: 'd'.repeat(64),
  afterDigest: 'd'.repeat(64),
  auditUnchanged: true,
  outboxUnchanged: true,
  status: 'PASS',
  executionKind: 'AUTOMATED',
});

describe('route acceptance evidence boundary', () => {
  it('inventories every F-001 page and keeps domain acceptance NV', () => {
    const cards = readAuditCards(
      readFileSync('audit/2026-09-30-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.html', 'utf8'),
    );
    expect(cards).toHaveLength(88);
    for (const card of cards) {
      const rows = buildScenarios(card, ['qc-01']);
      expect(rows).toHaveLength(7);
      expect(rows.every((row: { status: string }) => row.status === 'NOT VERIFIED')).toBe(true);
      expect(card.fields['Transaction/audit/outbox']).toBeTruthy();
    }
  });
  it('rejects a missing card instead of silently reducing the denominator', () => {
    const html = readFileSync(
      'audit/2026-09-30-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.html',
      'utf8',
    );
    expect(() =>
      readAuditCards(
        html.replace('<summary>RT-ROOT-001 — /</summary>', '<summary>OTHER</summary>'),
      ),
    ).toThrow();
  });
  it('accepts complete bound direct denial evidence', () => {
    expect(evaluateEvidence(scenario, evidence(), candidate).status).toBe('PASS');
  });
  it('invalidates every changed candidate identity independently', () => {
    for (const key of Object.keys(candidate)) {
      const result = evidence();
      Object.assign(result.candidate, { [key]: 'another-candidate' });
      expect(evaluateEvidence(scenario, result, candidate).status).toBe('NOT VERIFIED');
    }
    expect(
      evaluateEvidence(scenario, { ...evidence(), appliedSchema: null }, candidate).status,
    ).toBe('NOT VERIFIED');
  });
  it('does not count BAD_REQUEST or nonexistent-record probes as denial', () => {
    for (const field of [
      'positiveReadControl',
      'validExistingRecord',
      'auditUnchanged',
      'outboxUnchanged',
    ]) {
      expect(evaluateEvidence(scenario, { ...evidence(), [field]: false }, candidate).status).toBe(
        'NOT VERIFIED',
      );
    }
    expect(
      evaluateEvidence(scenario, { ...evidence(), authorizationDenialCode: '' }, candidate).status,
    ).toBe('NOT VERIFIED');
    expect(
      evaluateEvidence(
        scenario,
        { ...evidence(), authorizationDenialCode: 'BAD_REQUEST' },
        candidate,
      ).status,
    ).toBe('NOT VERIFIED');
    expect(
      evaluateEvidence(scenario, { ...evidence(), afterDigest: 'changed' }, candidate).status,
    ).toBe('NOT VERIFIED');
  });
  it('binds the route, persona, fixture and observed outcome', () => {
    for (const patch of [
      { routeId: 'OTHER' },
      { personaId: 'qcm' },
      { fixture: null },
      { command: '' },
    ])
      expect(evaluateEvidence(scenario, { ...evidence(), ...patch }, candidate).status).toBe(
        'NOT VERIFIED',
      );
    expect(
      evaluateEvidence(scenario, { ...evidence(), actualOutcome: 'WRITE_SUCCEEDED' }, candidate)
        .status,
    ).toBe('FAIL');
  });
  it('cannot promote automated runs to human acceptance', () => {
    const human = { ...scenario, kind: 'human-uat' };
    expect(evaluateEvidence(human, evidence(), candidate).status).toBe('NOT VERIFIED');
    expect(
      evaluateEvidence(
        human,
        {
          ...evidence(),
          executionKind: 'HUMAN',
          participantReference: 'signed-participant',
          signatureReference: 'signed-cycle',
        },
        candidate,
      ).status,
    ).toBe('NOT VERIFIED');
  });
  it('requires contractual justification for N/A', () => {
    expect(evaluateEvidence(scenario, { status: 'NOT APPLICABLE' }, candidate).status).toBe(
      'NOT VERIFIED',
    );
    expect(
      evaluateEvidence(
        {
          ...scenario,
          applicability: 'NOT APPLICABLE',
          applicabilityReference: 'approved read-only contract',
        },
        {
          status: 'NOT APPLICABLE',
          contractReference: 'approved read-only contract',
          applicabilityDecisionOwner: 'QMS',
        },
        candidate,
      ).status,
    ).toBe('NOT APPLICABLE');
  });
  it('keeps unresolved applicability NV even with otherwise complete evidence', () => {
    expect(
      evaluateEvidence({ ...scenario, applicability: 'NOT VERIFIED' }, evidence(), candidate)
        .status,
    ).toBe('NOT VERIFIED');
  });
  it('does not borrow one persona result for another persona', () => {
    const card = {
      id: 'RT-TASK-003',
      fields: { 'States/workflow': 'DRAFT/OPEN', 'Transaction/audit/outbox': 'task/audit/outbox' },
    };
    const rows = buildScenarios(card, ['qc-01', 'qc-02', 'qc-03']);
    expect(rows).toHaveLength(21);
    expect(new Set(rows.map((row: { id: string }) => row.id)).size).toBe(21);
    expect(rows.every((row: { personas: string[] }) => row.personas.length === 1)).toBe(true);
  });
  it('does not accept an expectation invented by the execution evidence', () => {
    expect(
      evaluateEvidence(
        scenario,
        { ...evidence(), expectedOutcome: 'INVENTED', actualOutcome: 'INVENTED' },
        candidate,
      ).status,
    ).toBe('NOT VERIFIED');
  });
  it('hashes schema content and filenames in a stable order', () => {
    expect(
      digestInputs([
        ['b.sql', 'B'],
        ['a.sql', 'A'],
      ]),
    ).toBe(
      digestInputs([
        ['a.sql', 'A'],
        ['b.sql', 'B'],
      ]),
    );
    expect(digestInputs([['a.sql', 'A']])).not.toBe(digestInputs([['a.sql', 'B']]));
  });
});
