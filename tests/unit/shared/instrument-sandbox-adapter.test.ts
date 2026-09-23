import { describe, expect, it } from 'vitest';
import {
  createInstrumentSandboxAdapter,
  signInstrumentEnvelope,
  type InstrumentEnvelope,
  type InstrumentDeliveryAudit,
} from '../../../src/shared/integrations/instrument-sandbox-adapter.js';

const key = Buffer.from('sandbox-only-deterministic-key');
function envelope(sequence: number, changes: Partial<InstrumentEnvelope> = {}): InstrumentEnvelope {
  const unsigned = {
    schema: 'qc.instrument-result' as const,
    schemaVersion: '1.0.0' as const,
    sourceId: 'sandbox-instrument-01',
    siteId: 'sandbox-site',
    eventId: `event-${sequence}`,
    sequence,
    occurredAt: '2026-09-23T10:00:00.000Z',
    actorId: 'instrument-service-sandbox',
    idempotencyKey: `sandbox-instrument-01:event-${sequence}`,
    payload: {
      sampleId: `sample-${sequence}`,
      resultReference: `result-${sequence}`,
      contentDigest: 'a'.repeat(64),
    },
    ...changes,
  };
  return { ...unsigned, signature: signInstrumentEnvelope(unsigned, key) };
}
function setup(isAvailable: () => boolean = () => true) {
  const audit: InstrumentDeliveryAudit[] = [];
  const adapter = createInstrumentSandboxAdapter({
    sourceId: 'sandbox-instrument-01',
    siteId: 'sandbox-site',
    signingKey: key,
    isAvailable,
    appendAudit: (record) => audit.push(record),
  });
  return { adapter, audit };
}

describe('instrument sandbox contract', () => {
  it('accepts a signed event as delivery only and writes a separated audit record', () => {
    const { adapter, audit } = setup();
    expect(adapter.receive(envelope(1))).toMatchObject({
      deliveryStatus: 'ACCEPTED',
      businessDecision: 'UNDECIDED',
      signatureStatus: 'VALID',
      actorMapping: 'PROVENANCE_ONLY',
    });
    expect(audit).toHaveLength(1);
    expect(JSON.stringify(audit[0])).not.toContain('sample-1');
  });

  it('makes an identical duplicate idempotent', () => {
    const { adapter } = setup();
    const event = envelope(1);
    expect(adapter.receive(event).deliveryStatus).toBe('ACCEPTED');
    expect(adapter.receive(event).deliveryStatus).toBe('DUPLICATE');
  });

  it('quarantines an out-of-order sequence without turning it into a business result', () => {
    const { adapter } = setup();
    adapter.receive(envelope(1));
    adapter.receive(envelope(2));
    expect(
      adapter.receive(envelope(1, { eventId: 'late-event', idempotencyKey: 'late-key' })),
    ).toMatchObject({
      deliveryStatus: 'QUARANTINED',
      failureCode: 'OUT_OF_ORDER',
      businessDecision: 'UNDECIDED',
    });
  });

  it('rejects a tampered envelope signature', () => {
    const { adapter } = setup();
    const event = envelope(1);
    expect(
      adapter.receive({ ...event, payload: { ...event.payload, sampleId: 'tampered' } }),
    ).toMatchObject({
      deliveryStatus: 'REJECTED',
      failureCode: 'INVALID_SIGNATURE',
      signatureStatus: 'INVALID',
      businessDecision: 'UNDECIDED',
    });
  });

  it('keeps valid delivery retryable when the sandbox transport is unavailable', () => {
    const { adapter } = setup(() => false);
    expect(adapter.receive(envelope(1))).toMatchObject({
      deliveryStatus: 'RETRYABLE_FAILURE',
      failureCode: 'SANDBOX_UNAVAILABLE',
      signatureStatus: 'VALID',
      businessDecision: 'UNDECIDED',
    });
    expect(adapter.receive(envelope(1)).deliveryStatus).toBe('RETRYABLE_FAILURE');
  });

  it('rejects reuse of an idempotency key for different content', () => {
    const { adapter } = setup();
    adapter.receive(envelope(1));
    const altered = envelope(2, { idempotencyKey: 'sandbox-instrument-01:event-1', sequence: 2 });
    expect(adapter.receive(altered)).toMatchObject({
      deliveryStatus: 'REJECTED',
      failureCode: 'IDEMPOTENCY_CONFLICT',
      businessDecision: 'UNDECIDED',
    });
  });
});
