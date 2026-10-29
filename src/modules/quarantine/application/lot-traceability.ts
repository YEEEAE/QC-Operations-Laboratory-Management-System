import type { ActorContext } from '../../../shared/authorization/types.js';

export type TraceabilityEventType = 'RECEIVING' | 'INSPECTION' | 'LABORATORY' | 'DOCUMENT';

export interface TraceabilityEvent {
  id: string;
  type: TraceabilityEventType;
  sourceId: string;
  occurredAt: Date;
  actorId?: string;
  state?: string;
  action: string;
  sourceRevision: string;
  href: string;
}

export interface TraceabilityRecord {
  id: string;
  receivingNo: string;
  itemCode: string;
  lot: string;
  workflowState: string;
  inspectionResult: string;
  releaseState: 'RELEASED' | 'NOT_RELEASED';
}

export interface LotTraceabilityReader {
  read(input: { actor: ActorContext; receivingId: string }): Promise<{
    record: TraceabilityRecord;
    events: readonly TraceabilityEvent[];
    auditEventsAvailable: boolean;
    documentRevisionsAvailable: boolean;
  }>;
}

export class GetLotTraceabilityUseCase {
  constructor(private readonly reader: LotTraceabilityReader) {}

  async execute(input: {
    actor: ActorContext;
    receivingId: string;
    type?: TraceabilityEventType;
    from?: string;
    to?: string;
  }) {
    const from = parseDate(input.from);
    const toDate = parseDate(input.to);
    const to = toDate ? new Date(toDate.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const result = await this.reader.read(input);
    const events = result.events
      .filter((event) => !input.type || event.type === input.type)
      .filter((event) => !from || event.occurredAt >= from)
      .filter((event) => !to || event.occurredAt < to)
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime() || a.id.localeCompare(b.id));
    return {
      ...result,
      events,
      unresolvedSources: [
        { label: 'Site / work order', reason: 'The receiving record has no governed site or work-order field for cross-record disambiguation.' },
        { label: 'In-Process', reason: 'No controlled link to Receiving is recorded.' },
        { label: 'NCR / CAPA', reason: 'No controlled lot-to-quality-record crosswalk is recorded.' },
        { label: 'Reject Reports', reason: 'Item and lot text is not a controlled link to Receiving.' },
      ],
    };
  }
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
    ? undefined
    : parsed;
}
