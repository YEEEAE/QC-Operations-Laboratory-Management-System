/**
 * QC-100-FINAL-004 Task 7 — unit tests for the automated UAT scenario suite
 * decision logic. These guard the two properties that decide whether a
 * negative scenario may be reported as PASS:
 *   1. a refusal is only an authority proof when it happened *for auth reasons*;
 *   2. Astro action payloads (devalue) are read correctly, otherwise a created
 *      record looks like a failure.
 */
import { describe, expect, it } from 'vitest';

import {
  bodyExcerpt,
  capabilitySetsEqual,
  classifyProbe,
  createReceivingPayload,
  devalueField,
  recordId,
  summarizeProbes,
  type ActionOutcome,
  type ProbeResult,
} from '../../../scripts/uat/scenario-support.js';

function outcome(partial: Partial<ActionOutcome>): ActionOutcome {
  return { status: 200, ok: true, body: {}, ...partial };
}

describe('classifyProbe', () => {
  it('treats an executed call as a defect, never as a denial', () => {
    expect(classifyProbe(outcome({ status: 200, ok: true }))).toBe('EXECUTED');
  });

  it('treats auth status codes and auth error codes as proven denials', () => {
    expect(classifyProbe(outcome({ status: 403, ok: false, errorCode: 'FORBIDDEN' }))).toBe('DENIED');
    expect(classifyProbe(outcome({ status: 401, ok: false, errorCode: 'UNAUTHORIZED' }))).toBe(
      'DENIED',
    );
    expect(classifyProbe(outcome({ status: 200, ok: false, errorCode: 'FORBIDDEN' }))).toBe('DENIED');
  });

  it('treats a refusal that happened before authorization as inconclusive', () => {
    expect(classifyProbe(outcome({ status: 400, ok: false, errorCode: 'BAD_REQUEST' }))).toBe(
      'INCONCLUSIVE',
    );
  });
});

describe('summarizeProbes', () => {
  const denied = (surface: string): ProbeResult => ({
    surface,
    verdict: 'DENIED',
    errorCode: 'FORBIDDEN',
    httpStatus: 403,
  });
  const inconclusive = (surface: string): ProbeResult => ({
    surface,
    verdict: 'INCONCLUSIVE',
    errorCode: 'BAD_REQUEST',
    httpStatus: 400,
  });
  const executed = (surface: string): ProbeResult => ({
    surface,
    verdict: 'EXECUTED',
    errorCode: null,
    httpStatus: 200,
  });

  it('passes only when every probed surface was auth-denied', () => {
    const summary = summarizeProbes([denied('a'), denied('b')]);
    expect(summary.status).toBe('PASS');
    expect(summary.detail).toContain('a=DENIED(FORBIDDEN)');
  });

  it('fails when any surface executed without authority', () => {
    const summary = summarizeProbes([denied('a'), executed('b')]);
    expect(summary.status).toBe('FAIL');
    expect(summary.detail).toContain('executed without authority: b');
  });

  it('reports NOT RUN when a refusal proves nothing about authority', () => {
    const summary = summarizeProbes([denied('a'), inconclusive('b')]);
    expect(summary.status).toBe('NOT RUN');
    expect(summary.detail).toContain('1 auth-denied');
    expect(summary.detail).toContain('refused before authorization (no proof)');
  });
});

describe('devalue payload reading', () => {
  it('reads a serialized Astro action result', () => {
    const payload = [
      { id: 1, receivingNo: 2, version: 3 },
      '01a0b965-5a45-79db-8ae3-c73d005b967b',
      'UAT-SCN-RCV-1',
      ['BigInt', '1'],
    ];
    expect(devalueField(payload, 'receivingNo')).toBe('UAT-SCN-RCV-1');
    expect(recordId({ status: 200, ok: true, body: payload })).toBe(
      '01a0b965-5a45-79db-8ae3-c73d005b967b',
    );
  });

  it('reads a plain JSON body and ignores undefined slots', () => {
    expect(recordId({ status: 200, ok: true, body: { id: 'abc' } })).toBe('abc');
    expect(devalueField([{ expiryDate: -1 }, 'x'], 'expiryDate')).toBeUndefined();
    expect(recordId({ status: 400, ok: false, body: { type: 'AstroActionError' } })).toBeUndefined();
  });

  it('truncates response excerpts for evidence', () => {
    const excerpt = bodyExcerpt(outcome({ status: 500, ok: false, body: 'x'.repeat(500) }));
    expect(excerpt.length).toBeLessThanOrEqual(161);
    expect(excerpt.endsWith('…')).toBe(true);
  });
});

describe('capabilitySetsEqual', () => {
  it('requires identical, ordered status vectors across personas', () => {
    expect(
      capabilitySetsEqual([
        { persona: 'uat-qc-01', statuses: [200, 200, 403] },
        { persona: 'uat-qc-02', statuses: [200, 200, 403] },
        { persona: 'uat-qc-03', statuses: [200, 200, 403] },
      ]),
    ).toBe(true);
    expect(
      capabilitySetsEqual([
        { persona: 'uat-qc-01', statuses: [200, 200] },
        { persona: 'uat-qc-02', statuses: [200, 403] },
      ]),
    ).toBe(false);
    expect(capabilitySetsEqual([{ persona: 'uat-qc-01', statuses: [200] }])).toBe(false);
  });
});

describe('createReceivingPayload', () => {
  it('produces unique, UAT-prefixed controlled data', () => {
    const first = createReceivingPayload('qc-01');
    const second = createReceivingPayload('qc-02');
    expect(first.receivingNo).toMatch(/^UAT-SCN-RCV-/);
    expect(first.receivingNo).not.toBe(second.receivingNo);
    expect(first.qty).toBe('7');
  });
});
