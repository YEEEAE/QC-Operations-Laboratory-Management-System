import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

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
  correlationId: string;
  recordedAt: string;
  signatureStatus: 'VALID' | 'INVALID' | 'NOT_CHECKED';
  actorMapping: 'PROVENANCE_ONLY' | 'UNMAPPED';
  sequenceOutcome: 'IN_ORDER' | 'DUPLICATE' | 'OUT_OF_ORDER' | 'NOT_CHECKED';
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
  actorId: string;
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
  const acceptedEvents = new Map<string, { digest: string; idempotencyKey: string }>();
  const acceptedKeys = new Map<string, { eventKey: string; digest: string }>();
  const lastSequence = new Map<string, number>();

  function receive(envelope: InstrumentEnvelope): InstrumentDeliveryAudit {
    const envelopeIsValid =
      envelope.schema === 'qc.instrument-result' &&
      envelope.schemaVersion === '1.0.0' &&
      envelope.sourceId === options.sourceId &&
      envelope.siteId === options.siteId &&
      envelope.actorId === options.actorId &&
      envelope.eventId.length > 0 &&
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

    const eventKey = stableJson([envelope.sourceId, envelope.siteId, envelope.eventId]);
    const sourceKey = stableJson([envelope.sourceId, envelope.siteId]);
    const previousEvent = acceptedEvents.get(eventKey);
    const previousKey = acceptedKeys.get(envelope.idempotencyKey);
    const correlationId = randomUUID();
    const recordedAt = new Date().toISOString();
    let record: InstrumentDeliveryAudit;
    if (!envelopeIsValid) {
      record = {
        sourceId: envelope.sourceId,
        eventId: envelope.eventId,
        idempotencyKeyDigest: keyDigest,
        payloadDigest,
        correlationId,
        recordedAt,
        signatureStatus: 'NOT_CHECKED',
        actorMapping: envelope.actorId === options.actorId ? 'PROVENANCE_ONLY' : 'UNMAPPED',
        sequenceOutcome: 'NOT_CHECKED',
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
        correlationId,
        recordedAt,
        signatureStatus: 'INVALID',
        actorMapping: 'UNMAPPED',
        sequenceOutcome: 'NOT_CHECKED',
        deliveryStatus: 'REJECTED',
        businessDecision: 'UNDECIDED',
        failureCode: 'INVALID_SIGNATURE',
      };
    } else if (previousEvent) {
      const exactReplay =
        previousEvent.digest === payloadDigest &&
        previousEvent.idempotencyKey === envelope.idempotencyKey;
      record = {
        sourceId: envelope.sourceId,
        eventId: envelope.eventId,
        idempotencyKeyDigest: keyDigest,
        payloadDigest,
        correlationId,
        recordedAt,
        signatureStatus: 'VALID',
        actorMapping: 'PROVENANCE_ONLY',
        sequenceOutcome: exactReplay ? 'DUPLICATE' : 'NOT_CHECKED',
        deliveryStatus: exactReplay ? 'DUPLICATE' : 'REJECTED',
        businessDecision: 'UNDECIDED',
        ...(exactReplay ? {} : { failureCode: 'IDEMPOTENCY_CONFLICT' as const }),
      };
    } else if (previousKey) {
      record = {
        sourceId: envelope.sourceId,
        eventId: envelope.eventId,
        idempotencyKeyDigest: keyDigest,
        payloadDigest,
        correlationId,
        recordedAt,
        signatureStatus: 'VALID',
        actorMapping: 'PROVENANCE_ONLY',
        sequenceOutcome: 'NOT_CHECKED',
        deliveryStatus: 'REJECTED',
        businessDecision: 'UNDECIDED',
        failureCode: 'IDEMPOTENCY_CONFLICT',
      };
    } else if (options.isAvailable?.() === false) {
      record = {
        sourceId: envelope.sourceId,
        eventId: envelope.eventId,
        idempotencyKeyDigest: keyDigest,
        payloadDigest,
        correlationId,
        recordedAt,
        signatureStatus: 'VALID',
        actorMapping: 'PROVENANCE_ONLY',
        sequenceOutcome: 'NOT_CHECKED',
        deliveryStatus: 'RETRYABLE_FAILURE',
        businessDecision: 'UNDECIDED',
        failureCode: 'SANDBOX_UNAVAILABLE',
      };
    } else {
      const sourceSequence = lastSequence.get(sourceKey) ?? 0;
      if (envelope.sequence !== sourceSequence + 1) {
        record = {
          sourceId: envelope.sourceId,
          eventId: envelope.eventId,
          idempotencyKeyDigest: keyDigest,
          payloadDigest,
          correlationId,
          recordedAt,
          signatureStatus: 'VALID',
          actorMapping: 'PROVENANCE_ONLY',
          sequenceOutcome: 'OUT_OF_ORDER',
          deliveryStatus: 'QUARANTINED',
          businessDecision: 'UNDECIDED',
          failureCode: 'OUT_OF_ORDER',
        };
      } else {
        acceptedEvents.set(eventKey, {
          digest: payloadDigest,
          idempotencyKey: envelope.idempotencyKey,
        });
        acceptedKeys.set(envelope.idempotencyKey, { eventKey, digest: payloadDigest });
        lastSequence.set(sourceKey, envelope.sequence);
        record = {
          sourceId: envelope.sourceId,
          eventId: envelope.eventId,
          idempotencyKeyDigest: keyDigest,
          payloadDigest,
          correlationId,
          recordedAt,
          signatureStatus: 'VALID',
          actorMapping: 'PROVENANCE_ONLY',
          sequenceOutcome: 'IN_ORDER',
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
