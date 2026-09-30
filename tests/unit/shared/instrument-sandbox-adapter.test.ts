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
    actorId: 'instrument-service-sandbox',
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
      sequenceOutcome: 'IN_ORDER',
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(audit[0]?.recordedAt).toBeTruthy();
    expect(JSON.stringify(audit[0])).not.toContain('sample-1');
  });

  it('makes an identical duplicate idempotent without creating a QC decision', () => {
    const { adapter, audit } = setup();
    const event = envelope(1);
    expect(adapter.receive(event).deliveryStatus).toBe('ACCEPTED');
    const duplicate = adapter.receive(event);
    expect(duplicate.deliveryStatus).toBe('DUPLICATE');
    expect(audit).toHaveLength(2);
    expect(audit.filter((record) => record.deliveryStatus === 'ACCEPTED')).toHaveLength(1);
    expect(audit.every((record) => record.businessDecision === 'UNDECIDED')).toBe(true);
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
      sequenceOutcome: 'OUT_OF_ORDER',
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
      actorMapping: 'UNMAPPED',
      businessDecision: 'UNDECIDED',
    });
  });

  it('keeps valid delivery retryable when the sandbox transport is unavailable', () => {
    const { adapter } = setup(() => false);
    expect(adapter.receive(envelope(1))).toMatchObject({
      deliveryStatus: 'RETRYABLE_FAILURE',
      failureCode: 'SANDBOX_UNAVAILABLE',
      signatureStatus: 'VALID',
      sequenceOutcome: 'NOT_CHECKED',
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

  it('rejects a signed event whose actor is not registered for the source', () => {
    const { adapter } = setup();
    const event = envelope(1, { actorId: 'unregistered-actor' });
    expect(adapter.receive(event)).toMatchObject({
      deliveryStatus: 'REJECTED',
      failureCode: 'INVALID_ENVELOPE',
      actorMapping: 'UNMAPPED',
      businessDecision: 'UNDECIDED',
    });
  });

  it('rejects a second idempotency key for an already accepted source event', () => {
    const { adapter } = setup();
    adapter.receive(envelope(1));
    expect(adapter.receive(envelope(1, { idempotencyKey: 'alternate-key' }))).toMatchObject({
      deliveryStatus: 'REJECTED',
      failureCode: 'IDEMPOTENCY_CONFLICT',
      businessDecision: 'UNDECIDED',
    });
  });
});
