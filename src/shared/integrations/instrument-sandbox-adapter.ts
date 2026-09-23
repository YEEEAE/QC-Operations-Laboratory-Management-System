import { createHmac, timingSafeEqual } from 'node:crypto';

export interface InstrumentEnvelope {
  schema: 'qc.instrument-result';
  schemaVersion: '1.0.0';
  sourceId: string;
  siteId: string;
  eventId: string;
  sequence: number;
  occurredAt: string;
  actorId: string;
  idempotencyKey: string;
  payload: { sampleId: string; resultReference: string; contentDigest: string };
  signature: string;
}

export type DeliveryStatus =
  'ACCEPTED' | 'DUPLICATE' | 'REJECTED' | 'RETRYABLE_FAILURE' | 'QUARANTINED';
export interface InstrumentDeliveryAudit {
  sourceId: string;
  eventId: string;
  idempotencyKeyDigest: string;
  payloadDigest: string;
  signatureStatus: 'VALID' | 'INVALID' | 'NOT_CHECKED';
  actorMapping: 'PROVENANCE_ONLY';
  deliveryStatus: DeliveryStatus;
  businessDecision: 'UNDECIDED';
  failureCode?:
    | 'INVALID_ENVELOPE'
    | 'INVALID_SIGNATURE'
    | 'IDEMPOTENCY_CONFLICT'
    | 'OUT_OF_ORDER'
    | 'SANDBOX_UNAVAILABLE';
}

export interface InstrumentSandboxOptions {
  sourceId: string;
  siteId: string;
  signingKey: Uint8Array;
  isAvailable?: () => boolean;
  appendAudit: (record: InstrumentDeliveryAudit) => void;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function canonical(envelope: InstrumentEnvelope): string {
  return stableJson(
    Object.fromEntries(Object.entries(envelope).filter(([key]) => key !== 'signature')),
  );
}

export function signInstrumentEnvelope(
  envelope: Omit<InstrumentEnvelope, 'signature'>,
  key: Uint8Array,
): string {
  return createHmac('sha256', key).update(stableJson(envelope)).digest('hex');
}

export function createInstrumentSandboxAdapter(options: InstrumentSandboxOptions) {
  const accepted = new Map<string, { digest: string; sequence: number }>();
  const lastSequence = new Map<string, number>();

  function receive(envelope: InstrumentEnvelope): InstrumentDeliveryAudit {
    const envelopeIsValid =
      envelope.schema === 'qc.instrument-result' &&
      envelope.schemaVersion === '1.0.0' &&
      envelope.sourceId === options.sourceId &&
      envelope.siteId === options.siteId &&
      envelope.eventId.length > 0 &&
      envelope.actorId.length > 0 &&
      envelope.idempotencyKey.length > 0 &&
      Number.isSafeInteger(envelope.sequence) &&
      envelope.sequence > 0 &&
      /^[a-f0-9]{64}$/.test(envelope.payload.contentDigest) &&
      !Number.isNaN(Date.parse(envelope.occurredAt));
    const payloadDigest = createHmac('sha256', options.signingKey)
      .update(canonical(envelope))
      .digest('hex');
    const keyDigest = createHmac('sha256', options.signingKey)
      .update(envelope.idempotencyKey)
      .digest('hex');
    const { signature, ...unsigned } = envelope;
    const expected = Buffer.from(signInstrumentEnvelope(unsigned, options.signingKey), 'hex');
    const received = Buffer.from(signature, 'hex');
    const signatureValid =
      received.length === expected.length && timingSafeEqual(received, expected);

    let record: InstrumentDeliveryAudit;
    if (!envelopeIsValid) {
      record = {
        sourceId: envelope.sourceId,
        eventId: envelope.eventId,
        idempotencyKeyDigest: keyDigest,
        payloadDigest,
        signatureStatus: 'NOT_CHECKED',
        actorMapping: 'PROVENANCE_ONLY',
        deliveryStatus: 'REJECTED',
        businessDecision: 'UNDECIDED',
        failureCode: 'INVALID_ENVELOPE',
      };
    } else if (!signatureValid) {
      record = {
        sourceId: envelope.sourceId,
        eventId: envelope.eventId,
        idempotencyKeyDigest: keyDigest,
        payloadDigest,
        signatureStatus: 'INVALID',
        actorMapping: 'PROVENANCE_ONLY',
        deliveryStatus: 'REJECTED',
        businessDecision: 'UNDECIDED',
        failureCode: 'INVALID_SIGNATURE',
      };
    } else if (options.isAvailable?.() === false) {
      record = {
        sourceId: envelope.sourceId,
        eventId: envelope.eventId,
        idempotencyKeyDigest: keyDigest,
        payloadDigest,
        signatureStatus: 'VALID',
        actorMapping: 'PROVENANCE_ONLY',
        deliveryStatus: 'RETRYABLE_FAILURE',
        businessDecision: 'UNDECIDED',
        failureCode: 'SANDBOX_UNAVAILABLE',
      };
    } else {
      const previous = accepted.get(envelope.idempotencyKey);
      const sourceSequence = lastSequence.get(envelope.sourceId) ?? 0;
      if (previous) {
        record = {
          sourceId: envelope.sourceId,
          eventId: envelope.eventId,
          idempotencyKeyDigest: keyDigest,
          payloadDigest,
          signatureStatus: 'VALID',
          actorMapping: 'PROVENANCE_ONLY',
          deliveryStatus: previous.digest === payloadDigest ? 'DUPLICATE' : 'REJECTED',
          businessDecision: 'UNDECIDED',
          ...(previous.digest === payloadDigest
            ? {}
            : { failureCode: 'IDEMPOTENCY_CONFLICT' as const }),
        };
      } else if (envelope.sequence !== sourceSequence + 1) {
        record = {
          sourceId: envelope.sourceId,
          eventId: envelope.eventId,
          idempotencyKeyDigest: keyDigest,
          payloadDigest,
          signatureStatus: 'VALID',
          actorMapping: 'PROVENANCE_ONLY',
          deliveryStatus: 'QUARANTINED',
          businessDecision: 'UNDECIDED',
          failureCode: 'OUT_OF_ORDER',
        };
      } else {
        accepted.set(envelope.idempotencyKey, {
          digest: payloadDigest,
          sequence: envelope.sequence,
        });
        lastSequence.set(envelope.sourceId, envelope.sequence);
        record = {
          sourceId: envelope.sourceId,
          eventId: envelope.eventId,
          idempotencyKeyDigest: keyDigest,
          payloadDigest,
          signatureStatus: 'VALID',
          actorMapping: 'PROVENANCE_ONLY',
          deliveryStatus: 'ACCEPTED',
          businessDecision: 'UNDECIDED',
        };
      }
    }
    options.appendAudit(record);
    return record;
  }

  return { receive };
}
